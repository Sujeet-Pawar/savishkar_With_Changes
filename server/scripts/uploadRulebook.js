import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import Settings from '../models/Settings.js';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadRulebook = async () => {
  try {
    console.log('\n📚 RULEBOOK UPLOAD TO CLOUDINARY');
    console.log('═'.repeat(80));
    console.log('');

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary credentials not found in .env file');
      console.log('Please add:');
      console.log('   CLOUDINARY_CLOUD_NAME=your_cloud_name');
      console.log('   CLOUDINARY_API_KEY=your_api_key');
      console.log('   CLOUDINARY_API_SECRET=your_api_secret');
      process.exit(1);
    }

    console.log('✅ Cloudinary Configuration:');
    console.log(`   Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
    console.log('');

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Connected');
    console.log('');

    // Look for rulebook file in multiple locations with different names
    const possiblePaths = [
      join(__dirname, '../uploads/rulebook.pdf'),
      join(__dirname, '../uploads/Rulebook.pdf'),
      join(__dirname, '../uploads/RuleBook.pdf'),
      join(__dirname, '../uploads/RULEBOOK.pdf'),
      join(__dirname, '../../rulebook.pdf'),
      join(__dirname, '../../Rulebook.pdf'),
      join(__dirname, '../../RuleBook.pdf')
    ];

    let rulebookPath = null;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        rulebookPath = testPath;
        break;
      }
    }

    if (!rulebookPath) {
      console.error('❌ Rulebook PDF not found!');
      console.log('\nSearched in the following locations:');
      possiblePaths.forEach(p => console.log(`   - ${p}`));
      console.log('\n💡 Please place your rulebook PDF in one of these locations:');
      console.log('   1. server/uploads/rulebook.pdf (recommended)');
      console.log('   2. server/uploads/Rulebook.pdf');
      console.log('   3. server/uploads/RuleBook.pdf');
      console.log('\nOr provide the path as an argument:');
      console.log('   node uploadRulebook.js /path/to/your/rulebook.pdf');
      process.exit(1);
    }

    // Check if path was provided as argument
    if (process.argv[2]) {
      const customPath = path.resolve(process.argv[2]);
      if (fs.existsSync(customPath)) {
        rulebookPath = customPath;
      } else {
        console.error(`❌ File not found at: ${customPath}`);
        process.exit(1);
      }
    }

    const stats = fs.statSync(rulebookPath);
    console.log('📄 Found Rulebook:');
    console.log(`   Path: ${rulebookPath}`);
    console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log('');

    // Upload to Cloudinary
    console.log('☁️  Uploading to Cloudinary...');
    console.log('   This may take a moment depending on file size...');
    console.log('');

    const uploadResult = await cloudinary.uploader.upload(rulebookPath, {
      resource_type: 'raw',
      folder: 'savishkar/documents',
      public_id: 'rulebook',
      overwrite: true,
      invalidate: true,
      access_mode: 'public',
      type: 'upload'
    });

    console.log('✅ Upload Successful!');
    console.log('');
    console.log('📊 Upload Details:');
    console.log(`   Public ID: ${uploadResult.public_id}`);
    console.log(`   URL: ${uploadResult.secure_url}`);
    console.log(`   Format: ${uploadResult.format}`);
    console.log(`   Size: ${(uploadResult.bytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Created: ${uploadResult.created_at}`);
    console.log('');

    // Save URL to database
    console.log('💾 Saving URL to database...');
    await Settings.set('rulebook_url', uploadResult.secure_url);
    console.log('✅ URL saved to database');
    console.log('');

    // Verify the URL is accessible
    console.log('🔍 Verifying URL accessibility...');
    try {
      const https = await import('https');
      await new Promise((resolve, reject) => {
        https.get(uploadResult.secure_url, (res) => {
          if (res.statusCode === 200) {
            console.log('✅ URL is accessible');
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        }).on('error', reject);
      });
    } catch (error) {
      console.log('⚠️  Could not verify URL:', error.message);
    }
    console.log('');

    console.log('═'.repeat(80));
    console.log('🎉 RULEBOOK UPLOAD COMPLETE!');
    console.log('═'.repeat(80));
    console.log('');
    console.log('📋 Summary:');
    console.log(`   ✅ File uploaded to Cloudinary`);
    console.log(`   ✅ URL saved to database`);
    console.log(`   ✅ Rulebook is now accessible`);
    console.log('');
    console.log('🔗 Access URLs:');
    console.log(`   Direct URL: ${uploadResult.secure_url}`);
    console.log(`   Download: ${process.env.CLIENT_URL || 'http://localhost:5173'}/api/rulebook/download`);
    console.log(`   View: ${process.env.CLIENT_URL || 'http://localhost:5173'}/api/rulebook/view`);
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Test the download URL in your browser');
    console.log('   2. Test the view URL in your browser');
    console.log('   3. Check the rulebook button on your website');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Upload failed:', error.message);
    if (error.http_code) {
      console.error(`   HTTP Code: ${error.http_code}`);
    }
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('   1. Check Cloudinary credentials in .env');
    console.error('   2. Verify file exists and is readable');
    console.error('   3. Check file size (max 100MB for free tier)');
    console.error('   4. Ensure internet connection is stable');
    console.error('');
    process.exit(1);
  }
};

uploadRulebook();
