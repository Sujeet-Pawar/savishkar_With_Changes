import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, 'server', '.env') });

console.log('Starting script...');
console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

const folder = 'D:\\code3\\Event Posters webp';
console.log('Checking folder:', folder);
console.log('Folder exists:', fs.existsSync(folder));

if (fs.existsSync(folder)) {
  const files = fs.readdirSync(folder).filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f));
  console.log('Found', files.length, 'image files');
  console.log('First 5 files:', files.slice(0, 5));
}

console.log('\nAttempting MongoDB connection...');
try {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB Connected');
  
  const Event = mongoose.model('Event', new mongoose.Schema({}, { strict: false }));
  const events = await Event.find({}).select('name').limit(5);
  console.log('Found', events.length, 'events in database');
  console.log('Sample events:', events.map(e => e.name));
  
  await mongoose.connection.close();
  console.log('Connection closed');
} catch (error) {
  console.error('❌ Error:', error.message);
}
