import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkPhotographyEvent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected\n');

    const event = await Event.findOne({ name: 'Photography' });
    
    if (!event) {
      console.log('❌ Photography event not found');
      process.exit(1);
    }
    
    console.log('📸 Photography Event Details:\n');
    console.log(`Name: ${event.name}`);
    console.log(`Image URL: ${event.image || 'NO IMAGE'}`);
    console.log(`Registration Fee: ₹${event.registrationFee}`);
    console.log(`\nRegistration Categories:`);
    if (event.registrationCategories && event.registrationCategories.length > 0) {
      event.registrationCategories.forEach((cat, idx) => {
        console.log(`  ${idx + 1}. ${cat.categoryName}`);
        console.log(`     Fee: ₹${cat.fee}`);
        console.log(`     Prize: ${cat.prize || 'N/A'}`);
        console.log(`     Description: ${cat.description || 'N/A'}`);
      });
    } else {
      console.log('  No categories defined');
    }
    
    console.log(`\nImage URL Analysis:`);
    if (event.image) {
      if (event.image.includes('cloudinary.com')) {
        console.log('  ✅ Using Cloudinary');
        console.log(`  Full URL: ${event.image}`);
      } else if (event.image.startsWith('http')) {
        console.log('  🌐 External URL');
      } else {
        console.log('  💾 Local storage path');
      }
    } else {
      console.log('  ❌ No image set');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkPhotographyEvent();
