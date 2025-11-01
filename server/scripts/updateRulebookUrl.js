import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Settings from '../models/Settings.js';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const updateRulebookUrl = async () => {
  try {
    console.log('\n📚 UPDATE RULEBOOK URL');
    console.log('═'.repeat(80));
    console.log('');

    // Get URL from command line argument
    const newUrl = process.argv[2];

    if (!newUrl) {
      console.error('❌ No URL provided!');
      console.log('');
      console.log('Usage:');
      console.log('   node updateRulebookUrl.js "https://res.cloudinary.com/.../rulebook.pdf"');
      console.log('');
      console.log('Example:');
      console.log('   node updateRulebookUrl.js "https://res.cloudinary.com/dpcypbj7a/raw/upload/savishkar/documents/rulebook.pdf"');
      console.log('');
      process.exit(1);
    }

    // Validate URL format
    if (!newUrl.startsWith('http://') && !newUrl.startsWith('https://')) {
      console.error('❌ Invalid URL format!');
      console.log('   URL must start with http:// or https://');
      process.exit(1);
    }

    console.log('🔗 New URL:', newUrl);
    console.log('');

    // Test URL accessibility
    console.log('🌐 Testing URL Accessibility...');
    try {
      await new Promise((resolve, reject) => {
        const request = https.get(newUrl, (res) => {
          if (res.statusCode === 200) {
            console.log('✅ URL is accessible');
            console.log(`   Status: ${res.statusCode}`);
            console.log(`   Content-Type: ${res.headers['content-type']}`);
            if (res.headers['content-length']) {
              console.log(`   Size: ${(parseInt(res.headers['content-length']) / 1024 / 1024).toFixed(2)} MB`);
            }
            resolve();
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
          res.resume(); // Consume response data
        });

        request.on('error', reject);
        request.setTimeout(10000, () => {
          request.destroy();
          reject(new Error('Request timeout'));
        });
      });
    } catch (error) {
      console.log('⚠️  Warning: Could not verify URL accessibility');
      console.log(`   Error: ${error.message}`);
      console.log('   Continuing anyway...');
    }
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

    // Check current URL
    console.log('🔍 Checking Current URL...');
    const currentUrl = await Settings.get('rulebook_url');
    if (currentUrl) {
      console.log('   Current URL:', currentUrl);
    } else {
      console.log('   No URL currently set');
    }
    console.log('');

    // Update URL
    console.log('💾 Updating URL in database...');
    await Settings.set('rulebook_url', newUrl);
    console.log('✅ URL updated successfully');
    console.log('');

    // Verify update
    console.log('🔍 Verifying Update...');
    const verifyUrl = await Settings.get('rulebook_url');
    if (verifyUrl === newUrl) {
      console.log('✅ Update verified');
    } else {
      console.log('⚠️  Warning: Verification failed');
    }
    console.log('');

    console.log('═'.repeat(80));
    console.log('🎉 RULEBOOK URL UPDATED!');
    console.log('═'.repeat(80));
    console.log('');
    console.log('🔗 Access URLs:');
    console.log(`   Direct: ${newUrl}`);
    console.log(`   Download: ${process.env.CLIENT_URL || 'http://localhost:5000'}/api/rulebook/download`);
    console.log(`   View: ${process.env.CLIENT_URL || 'http://localhost:5000'}/api/rulebook/view`);
    console.log(`   Info: ${process.env.CLIENT_URL || 'http://localhost:5000'}/api/rulebook/info`);
    console.log('');
    console.log('💡 Next Steps:');
    console.log('   1. Test the download URL in your browser');
    console.log('   2. Test the view URL in your browser');
    console.log('   3. Check the rulebook button on your website');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    process.exit(1);
  }
};

updateRulebookUrl();
