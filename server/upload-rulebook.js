import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cloudinary from './config/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Settings Schema
const settingsSchema = new mongoose.Schema({
  key: String,
  value: String,
  description: String,
  category: String,
  isPublic: Boolean
}, { strict: false });

/**
 * Upload PDF to Cloudinary
 */
const uploadPDFToCloudinary = async (filePath, publicId) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'savishkar/documents',
      public_id: publicId,
      resource_type: 'raw', // Important for PDFs
      overwrite: true,
      invalidate: true
    });
    
    return result.secure_url;
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

const main = async () => {
  console.log('\n' + '='.repeat(70));
  console.log('📚 Upload Rulebook PDF');
  console.log('='.repeat(70) + '\n');
  
  const rulebookSource = 'D:\\code3\\RULE BOOK 2K25.pdf';
  const rulebookLocalDir = path.join(__dirname, 'uploads', 'documents');
  const rulebookLocalPath = path.join(rulebookLocalDir, 'RULE_BOOK_2K25.pdf');
  
  // Check if source file exists
  console.log(`📁 Checking source file: ${rulebookSource}`);
  if (!fs.existsSync(rulebookSource)) {
    console.error(`❌ ERROR: Rulebook PDF not found!`);
    console.error(`   Expected: ${rulebookSource}`);
    process.exit(1);
  }
  console.log('✅ Source file found!\n');

  // Create local documents directory if it doesn't exist
  if (!fs.existsSync(rulebookLocalDir)) {
    fs.mkdirSync(rulebookLocalDir, { recursive: true });
    console.log(`📂 Created directory: ${rulebookLocalDir}\n`);
  }

  // Copy to local folder
  console.log('📋 Copying rulebook to local uploads folder...');
  try {
    fs.copyFileSync(rulebookSource, rulebookLocalPath);
    console.log('✅ Rulebook copied successfully!\n');
  } catch (error) {
    console.error(`❌ Failed to copy: ${error.message}`);
    process.exit(1);
  }

  let rulebookUrl = `/uploads/documents/RULE_BOOK_2K25.pdf`;

  // Check if Cloudinary is enabled
  const useCloudinary = process.env.USE_CLOUDINARY === 'true';
  
  if (useCloudinary) {
    console.log('☁️  Cloudinary: ENABLED');
    console.log('📤 Uploading rulebook to Cloudinary...\n');
    
    try {
      rulebookUrl = await uploadPDFToCloudinary(rulebookSource, 'rulebook-2k25');
      console.log('✅ Uploaded to Cloudinary successfully!');
      console.log(`🔗 Cloudinary URL: ${rulebookUrl}\n`);
    } catch (error) {
      console.error(`⚠️  Cloudinary upload failed: ${error.message}`);
      console.log('💾 Falling back to local URL\n');
      rulebookUrl = `/uploads/documents/RULE_BOOK_2K25.pdf`;
    }
  } else {
    console.log('💾 Cloudinary: DISABLED (using local storage)');
    console.log(`🔗 Local URL: ${rulebookUrl}\n`);
  }

  // Connect to MongoDB
  console.log('🔌 Connecting to MongoDB...');
  const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI not found!');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected!\n');
  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }

  // Get Settings model
  const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);
  
  // Save rulebook URL to settings
  console.log('💾 Saving rulebook URL to database...');
  
  try {
    await Settings.findOneAndUpdate(
      { key: 'rulebook_url' },
      {
        key: 'rulebook_url',
        value: rulebookUrl,
        description: 'Savishkar 2025 Rulebook PDF',
        category: 'documents',
        isPublic: true
      },
      { upsert: true, new: true }
    );
    
    await Settings.findOneAndUpdate(
      { key: 'rulebook_name' },
      {
        key: 'rulebook_name',
        value: 'RULE BOOK 2K25.pdf',
        description: 'Rulebook filename',
        category: 'documents',
        isPublic: true
      },
      { upsert: true, new: true }
    );
    
    console.log('✅ Rulebook URL saved to database!\n');
  } catch (error) {
    console.error(`❌ Failed to save to database: ${error.message}`);
    await mongoose.connection.close();
    process.exit(1);
  }

  await mongoose.connection.close();

  // Summary
  console.log('='.repeat(70));
  console.log('📊 SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Rulebook uploaded successfully!`);
  console.log(`📁 Source: ${rulebookSource}`);
  console.log(`📁 Local: ${rulebookLocalPath}`);
  console.log(`🔗 URL: ${rulebookUrl}`);
  console.log(`💾 Database: Settings updated`);
  console.log(`🌐 Public Access: Enabled\n`);
  
  console.log('📋 Next Steps:');
  console.log('   1. Restart your server');
  console.log('   2. Access rulebook via: GET /api/settings/public');
  console.log('   3. Or use the admin panel to view/download\n');
  
  console.log('✅ Script completed successfully!\n');
  console.log('='.repeat(70) + '\n');
};

main().catch(err => {
  console.error('\n❌ Fatal Error:', err.message);
  console.error(err.stack);
  process.exit(1);
});
