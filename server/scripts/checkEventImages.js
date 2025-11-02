import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkEventImages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const events = await Event.find({}).select('name image registrationCategories registrationFee');
    
    console.log(`📊 Found ${events.length} events\n`);
    
    events.forEach((event, idx) => {
      console.log(`${idx + 1}. ${event.name}`);
      console.log(`   Image: ${event.image || 'NO IMAGE'}`);
      console.log(`   Registration Fee: ₹${event.registrationFee}`);
      if (event.registrationCategories && event.registrationCategories.length > 0) {
        console.log(`   Categories:`);
        event.registrationCategories.forEach(cat => {
          console.log(`      - ${cat.categoryName}: ₹${cat.fee}`);
        });
      }
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEventImages();
