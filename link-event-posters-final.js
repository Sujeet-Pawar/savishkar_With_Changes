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
const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
const POSTERS_FOLDER = 'D:\\code3\\Event Posters webp';

// Logging setup
const logFile = path.join(__dirname, 'poster-linking-result.txt');
fs.writeFileSync(logFile, `Event Poster Linking - ${new Date().toISOString()}\n${'='.repeat(70)}\n\n`);

const log = (msg) => {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n');
};

const isImage = (file) => /\.(png|jpg|jpeg|gif|webp)$/i.test(file);

const normalizeName = (raw) => {
  return raw
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove parentheses
    .trim();
};

async function linkPosters() {
  try {
    log('🚀 Starting Event Poster Linking Script\n');
    
    // Check folder
    log(`📁 Checking posters folder: ${POSTERS_FOLDER}`);
    if (!fs.existsSync(POSTERS_FOLDER)) {
      log(`❌ ERROR: Folder not found!`);
      return;
    }
    
    const files = fs.readdirSync(POSTERS_FOLDER).filter(isImage);
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
    
    // Create uploads directory
    const uploadsDir = path.join(__dirname, 'server', 'uploads', 'events');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true});
      log(`📂 Created directory: ${uploadsDir}\n`);
    }
    
    let updated = 0;
    const results = [];
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fullPath = path.join(POSTERS_FOLDER, file);
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
      
      if (!event) {
        log(`   ❌ NO MATCH`);
        results.push({ file, baseName, matched: false });
        continue;
      }
      
      log(`   ✅ Matched: "${event.name}"`);
      
      // Copy file to uploads
      const ext = path.extname(file);
      const uniqueName = `event-${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
      const destPath = path.join(uploadsDir, uniqueName);
      
      fs.copyFileSync(fullPath, destPath);
      const imageUrl = `/uploads/events/${uniqueName}`;
      
      log(`   📋 Saved as: ${uniqueName}`);
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
    log(`\n✅ Script completed! Check: poster-linking-result.txt`);
    
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
  }
}

linkPosters();
