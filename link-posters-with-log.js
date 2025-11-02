import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const logFile = path.join(__dirname, 'poster-link-log.txt');
const log = (msg) => {
  const timestamp = new Date().toISOString();
  const logMsg = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(logFile, logMsg);
  console.log(msg);
};

// Clear log file
fs.writeFileSync(logFile, '=== Event Poster Linking Log ===\n\n');

const isImage = (file) => /\.(png|jpg|jpeg|gif|webp)$/i.test(file);

const normalizeName = (raw) => {
  let name = raw
    .replace(/\.[^/.]+$/, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s*-\s*[^-]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return name;
};

const toSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const main = async () => {
  try {
    log('Starting Event Poster Linking Script...\n');
    
    const folder = 'D:\\code3\\Event Posters webp';
    log(`Checking folder: ${folder}`);
    
    if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
      log(`ERROR: Folder not found or not a directory: ${folder}`);
      process.exit(1);
    }
    
    const files = fs.readdirSync(folder).filter(isImage);
    log(`Found ${files.length} image files\n`);
    
    log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    log('MongoDB Connected!\n');
    
    // Import Event model
    const EventSchema = new mongoose.Schema({
      name: String,
      slug: String,
      image: String,
      category: String,
      department: String
    }, { strict: false });
    
    const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
    
    const allEvents = await Event.find({}).select('name slug image');
    log(`Total events in database: ${allEvents.length}\n`);
    
    // Create uploads directory
    const uploadsDir = path.join(__dirname, 'server', 'uploads', 'events');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      log(`Created uploads directory: ${uploadsDir}\n`);
    }
    
    let updated = 0;
    const matched = [];
    const unmatched = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fullPath = path.join(folder, file);
      const baseName = normalizeName(file);
      const slug = toSlug(baseName);
      
      log(`\n[${i + 1}/${files.length}] Processing: ${file}`);
      log(`  Normalized: "${baseName}"`);
      log(`  Slug: "${slug}"`);
      
      // Try exact match
      let event = await Event.findOne({ 
        $or: [ 
          { name: new RegExp(`^${baseName}$`, 'i') }, 
          { slug: slug }
        ] 
      });
      
      // Try partial match
      if (!event) {
        const firstWord = baseName.split(' ')[0];
        if (firstWord.length > 3) {
          event = await Event.findOne({ 
            name: new RegExp(firstWord, 'i') 
          });
          if (event) {
            log(`  Partial match: "${event.name}"`);
          }
        }
      }
      
      if (!event) {
        log(`  NO MATCH FOUND`);
        unmatched.push({ file, baseName });
        continue;
      }
      
      log(`  MATCHED: "${event.name}"`);
      
      // Copy file
      const ext = path.extname(file);
      const unique = `event-${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`;
      const dest = path.join(uploadsDir, unique);
      
      fs.copyFileSync(fullPath, dest);
      const imageUrl = `/uploads/events/${unique}`;
      
      log(`  Copied to: ${unique}`);
      log(`  URL: ${imageUrl}`);
      
      // Update database
      event.image = imageUrl;
      await event.save();
      updated++;
      matched.push({ file, event: event.name, url: imageUrl });
      log(`  DATABASE UPDATED`);
    }
    
    log('\n' + '='.repeat(70));
    log('SUMMARY');
    log('='.repeat(70));
    log(`Successfully updated: ${updated} events`);
    log(`Unmatched files: ${unmatched.length}`);
    log(`Total processed: ${files.length}`);
    
    if (matched.length > 0) {
      log('\nSuccessfully matched:');
      matched.forEach(m => {
        log(`  - ${m.file} → ${m.event}`);
      });
    }
    
    if (unmatched.length > 0) {
      log('\nUnmatched files:');
      unmatched.forEach(u => {
        log(`  - ${u.file} (normalized: "${u.baseName}")`);
      });
    }
    
    await mongoose.connection.close();
    log('\nMongoDB connection closed.');
    log('\nScript completed successfully!');
    
  } catch (error) {
    log(`\nERROR: ${error.message}`);
    log(`Stack: ${error.stack}`);
    process.exit(1);
  }
};

main();
