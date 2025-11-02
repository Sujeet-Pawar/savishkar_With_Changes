import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const UPLOADS_FOLDER = path.join(__dirname, 'server', 'uploads', 'events');

const log = (msg) => {
  console.log(msg);
};

const isImage = (file) => /\.(png|jpg|jpeg|gif|webp)$/i.test(file);

const normalizeName = (raw) => {
  return raw
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/-ezgif\.com-png-to-webp-converter$/i, '') // Remove conversion suffix
    .replace(/-elementor-io-optimized$/i, '') // Remove optimization suffix
    .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove parentheses
    .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
    .trim();
};

async function linkPosters() {
  try {
    log('🚀 Starting Event Poster Linking Script\n');
    
    // Check folder
    log(`📁 Checking uploads folder: ${UPLOADS_FOLDER}`);
    if (!fs.existsSync(UPLOADS_FOLDER)) {
      log(`❌ ERROR: Folder not found!`);
      return;
    }
    
    const files = fs.readdirSync(UPLOADS_FOLDER).filter(isImage);
    log(`✅ Found ${files.length} image files\n`);
    
    // Connect to MongoDB
    log(`🔌 Connecting to MongoDB...`);
    if (!MONGODB_URI) {
      log(`❌ ERROR: MONGODB_URI not found in environment variables!`);
      return;
    }
    
    await mongoose.connect(MONGODB_URI);
    log(`✅ MongoDB Connected!\n`);
    
    // Get Event model
    const EventSchema = new mongoose.Schema({}, { strict: false });
    const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
    
    const allEvents = await Event.find({});
    log(`📊 Total events in database: ${allEvents.length}`);
    log(`📋 Event names:`);
    allEvents.forEach(e => log(`   - ${e.name}`));
    log('');
    
    let updated = 0;
    const results = [];
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const baseName = normalizeName(file);
      
      log(`\n[${i + 1}/${files.length}] ${file}`);
      log(`   Normalized: "${baseName}"`);
      
      // Find matching event (case-insensitive)
      let event = allEvents.find(e => 
        e.name.toLowerCase() === baseName.toLowerCase()
      );
      
      // Try partial match if exact match fails
      if (!event) {
        const firstWord = baseName.split(' ')[0];
        event = allEvents.find(e => 
          e.name.toLowerCase().includes(firstWord.toLowerCase())
        );
        if (event) {
          log(`   ⚠️  Partial match: "${event.name}"`);
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
        results.push({ file, baseName, matched: false });
        continue;
      }
      
      log(`   ✅ Matched: "${event.name}"`);
      
      // Use the existing file path
      const imageUrl = `/uploads/events/${file}`;
      log(`   🔗 URL: ${imageUrl}`);
      
      // Update event in database
      await Event.updateOne(
        { _id: event._id },
        { $set: { image: imageUrl } }
      );
      
      updated++;
      results.push({ file, event: event.name, url: imageUrl, matched: true });
      log(`   💾 Database updated`);
    }
    
    // Summary
    log(`\n${'='.repeat(70)}`);
    log(`📊 SUMMARY`);
    log(`${'='.repeat(70)}`);
    log(`✅ Successfully linked: ${updated} posters`);
    log(`❌ Unmatched: ${files.length - updated} files`);
    log(`📁 Total processed: ${files.length}`);
    
    const matched = results.filter(r => r.matched);
    const unmatched = results.filter(r => !r.matched);
    
    if (matched.length > 0) {
      log(`\n✅ Successfully Linked:`);
      matched.forEach(m => log(`   ${m.file} → ${m.event}`));
    }
    
    if (unmatched.length > 0) {
      log(`\n❌ Unmatched Files:`);
      unmatched.forEach(u => log(`   ${u.file} (normalized: "${u.baseName}")`));
    }
    
    await mongoose.connection.close();
    log(`\n✅ Script completed!`);
    
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
  }
}

linkPosters();
