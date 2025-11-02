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

const isImage = (file) => /\.(png|jpg|jpeg|gif|webp)$/i.test(file);

const normalizeName = (raw) => {
  return raw
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/-ezgif\.com-png-to-webp-converter$/i, '') // Remove conversion suffix
    .replace(/-elementor-io-optimized$/i, '') // Remove optimization suffix
    .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove parentheses
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
};

const main = async () => {
  console.log('\n🚀 Starting Event Poster Linking Script\n');
  
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'events');
  
  if (!fs.existsSync(uploadsDir)) {
    console.error(`❌ Uploads folder not found: ${uploadsDir}`);
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }

  const files = fs.readdirSync(uploadsDir).filter(isImage);
  console.log(`📁 Found ${files.length} image files in uploads/events\n`);

  const allEvents = await Event.find({});
  console.log(`📊 Total events in database: ${allEvents.length}`);
  console.log(`📋 Event names:`);
  allEvents.forEach(e => console.log(`   - ${e.name}`));
  console.log('');

  let updated = 0;
  const unmatched = [];
  const matched = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const baseName = normalizeName(file);

    console.log(`\n[${i + 1}/${files.length}] Processing: ${file}`);
    console.log(`   Normalized name: "${baseName}"`);

    // Try exact match (case-insensitive)
    let event = allEvents.find(e => 
      e.name.toLowerCase() === baseName.toLowerCase()
    );

    // Try partial match if exact match fails
    if (!event) {
      const firstWord = baseName.split(' ')[0];
      if (firstWord.length > 2) {
        event = allEvents.find(e => 
          e.name.toLowerCase().includes(firstWord.toLowerCase())
        );
        if (event) {
          console.log(`   ⚠️  Partial match: "${event.name}"`);
        }
      }
    }

    // Try matching without spaces
    if (!event) {
      const noSpaces = baseName.replace(/\s+/g, '').toLowerCase();
      event = allEvents.find(e => 
        e.name.replace(/\s+/g, '').toLowerCase() === noSpaces
      );
      if (event) {
        console.log(`   ⚠️  No-space match: "${event.name}"`);
      }
    }

    if (!event) {
      console.log(`   ❌ NO MATCH`);
      unmatched.push({ file, baseName });
      continue;
    }

    console.log(`   ✅ Matched to event: "${event.name}"`);

    // Use the existing file path
    const imageUrl = `/uploads/events/${file}`;
    console.log(`   🔗 Image URL: ${imageUrl}`);

    try {
      event.image = imageUrl;
      await event.save();
      updated++;
      matched.push({ file, event: event.name, url: imageUrl });
      console.log(`   💾 Database updated`);
    } catch (error) {
      console.error(`   ❌ Failed to update database: ${error.message}`);
      unmatched.push({ file, baseName, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Successfully linked: ${updated} posters`);
  console.log(`❌ Unmatched: ${files.length - updated} files`);
  console.log(`📁 Total processed: ${files.length}`);

  if (matched.length > 0) {
    console.log('\n✅ Successfully Linked:');
    matched.forEach(m => console.log(`   ${m.file} → ${m.event}`));
  }

  if (unmatched.length > 0) {
    console.log('\n❌ Unmatched Files:');
    unmatched.forEach(u => {
      console.log(`   ${u.file} (normalized: "${u.baseName}")`);
      if (u.error) console.log(`     Error: ${u.error}`);
    });
    console.log('\n💡 Tip: Check if these event names exist in your database or rename the files');
  }

  await mongoose.connection.close();
  console.log('\n✅ Script completed!\n');
};

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
