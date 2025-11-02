import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Event from '../models/Event.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';

const isImage = (file) => /\.(png|jpg|jpeg|gif|webp)$/i.test(file);

const normalizeName = (raw) => {
  let name = raw
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove parentheses content
    .replace(/\s*-\s*[^-]+$/g, '') // Remove trailing dash content
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
  return name;
};

const toSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const main = async () => {
  const args = process.argv.slice(2);
  const dirFlagIndex = args.indexOf('--dir');
  const dryRun = args.includes('--dry-run');
  const folder = dirFlagIndex !== -1 ? args[dirFlagIndex + 1] : null;

  if (!folder) {
    console.log('\nUsage: node server/scripts/linkEventPosters.js --dir "<absolute_path_to_posters_folder>" [--dry-run]\n');
    process.exit(1);
  }

  if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    console.error(`❌ Folder not found or not a directory: ${folder}`);
    process.exit(1);
  }

  console.log('\n🔌 Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }

  const files = fs.readdirSync(folder).filter(isImage);
  console.log(`📁 Found ${files.length} image files in: ${folder}\n`);

  let updated = 0;
  const unmatched = [];
  const matched = [];

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'events');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📂 Created uploads directory: ${uploadsDir}\n`);
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fullPath = path.join(folder, file);
    const baseName = normalizeName(file);
    const slug = toSlug(baseName);

    console.log(`\n[${i + 1}/${files.length}] Processing: ${file}`);
    console.log(`   Normalized name: "${baseName}"`);

    // Try matching by name or slug
    let event = await Event.findOne({ 
      $or: [ 
        { name: new RegExp(`^${baseName}$`, 'i') }, 
        { slug } 
      ] 
    });

    // If not found, try partial match
    if (!event) {
      const firstWord = baseName.split(' ')[0];
      if (firstWord.length > 3) {
        event = await Event.findOne({ 
          name: new RegExp(firstWord, 'i') 
        });
        if (event) {
          console.log(`   ⚠️  Partial match found: "${event.name}"`);
        }
      }
    }

    if (!event) {
      console.log(`   ❌ No matching event found`);
      unmatched.push({ file, baseName });
      continue;
    }

    console.log(`   ✅ Matched to event: "${event.name}"`);

    // Copy file to uploads directory with unique name
    const ext = path.extname(file);
    const unique = `event-${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
    const dest = path.join(uploadsDir, unique);
    
    try {
      fs.copyFileSync(fullPath, dest);
      const imageUrl = `/uploads/events/${unique}`;
      console.log(`   📋 Copied to: ${dest}`);
      console.log(`   🔗 Image URL: ${imageUrl}`);

      if (dryRun) {
        console.log('   🟡 Dry-run: skipping database update');
        matched.push({ file, event: event.name, url: imageUrl });
        continue;
      }

      event.image = imageUrl;
      await event.save();
      updated++;
      matched.push({ file, event: event.name, url: imageUrl });
      console.log(`   💾 Database updated`);
    } catch (error) {
      console.error(`   ❌ Failed to copy file: ${error.message}`);
      unmatched.push({ file, baseName, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successfully updated: ${updated} events`);
  console.log(`⚠️  Unmatched files: ${unmatched.length}`);
  console.log(`📁 Total files processed: ${files.length}`);

  if (matched.length > 0) {
    console.log('\n✅ Successfully matched:');
    matched.forEach(m => {
      console.log(`   - ${m.file} → ${m.event}`);
    });
  }

  if (unmatched.length > 0) {
    console.log('\n⚠️  Unmatched files:');
    unmatched.forEach(u => {
      console.log(`   - ${u.file} (normalized: "${u.baseName}")`);
      if (u.error) console.log(`     Error: ${u.error}`);
    });
    console.log('\n💡 Tip: Check if these event names exist in your database');
  }

  await mongoose.connection.close();
  console.log('\n🔌 MongoDB connection closed.\n');
};

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
