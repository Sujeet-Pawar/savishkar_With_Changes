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

const logFile = path.join(__dirname, '..', 'poster-link-log.txt');

const log = (msg) => {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
};

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
  // Clear log file
  fs.writeFileSync(logFile, `Event Poster Linking - ${new Date().toISOString()}\n${'='.repeat(70)}\n\n`);
  
  log('🚀 Starting Event Poster Linking Script\n');
  
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'events');
  
  if (!fs.existsSync(uploadsDir)) {
    log(`❌ Uploads folder not found: ${uploadsDir}`);
    process.exit(1);
  }

  log('🔌 Connecting to MongoDB...');
  try {
    if (!process.env.MONGODB_URI) {
      log('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    log('✅ MongoDB Connected\n');
  } catch (error) {
    log(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }

  const files = fs.readdirSync(uploadsDir).filter(isImage);
  log(`📁 Found ${files.length} image files in uploads/events\n`);

  const allEvents = await Event.find({});
  log(`📊 Total events in database: ${allEvents.length}`);
  log(`📋 Event names:`);
  allEvents.forEach(e => log(`   - ${e.name}`));
  log('');

  let updated = 0;
  const unmatched = [];
  const matched = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const baseName = normalizeName(file);

    log(`\n[${i + 1}/${files.length}] Processing: ${file}`);
    log(`   Normalized name: "${baseName}"`);

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
          log(`   ⚠️  Partial match: "${event.name}"`);
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
        log(`   ⚠️  No-space match: "${event.name}"`);
      }
    }

    if (!event) {
      log(`   ❌ NO MATCH`);
      unmatched.push({ file, baseName });
      continue;
    }

    log(`   ✅ Matched to event: "${event.name}"`);

    // Use the existing file path
    const imageUrl = `/uploads/events/${file}`;
    log(`   🔗 Image URL: ${imageUrl}`);

    try {
      event.image = imageUrl;
      await event.save();
      updated++;
      matched.push({ file, event: event.name, url: imageUrl });
      log(`   💾 Database updated`);
    } catch (error) {
      log(`   ❌ Failed to update database: ${error.message}`);
      unmatched.push({ file, baseName, error: error.message });
    }
  }

  log('\n' + '='.repeat(70));
  log('📊 SUMMARY');
  log('='.repeat(70));
  log(`✅ Successfully linked: ${updated} posters`);
  log(`❌ Unmatched: ${files.length - updated} files`);
  log(`📁 Total processed: ${files.length}`);

  if (matched.length > 0) {
    log('\n✅ Successfully Linked:');
    matched.forEach(m => log(`   ${m.file} → ${m.event}`));
  }

  if (unmatched.length > 0) {
    log('\n❌ Unmatched Files:');
    unmatched.forEach(u => {
      log(`   ${u.file} (normalized: "${u.baseName}")`);
      if (u.error) log(`     Error: ${u.error}`);
    });
    log('\n💡 Tip: Check if these event names exist in your database or rename the files');
  }

  await mongoose.connection.close();
  log('\n✅ Script completed!');
  log(`📄 Full log saved to: ${logFile}\n`);
};

main().catch(err => {
  const msg = `❌ Fatal Error: ${err.message}\n${err.stack}`;
  console.error(msg);
  fs.appendFileSync(logFile, msg);
  process.exit(1);
});
