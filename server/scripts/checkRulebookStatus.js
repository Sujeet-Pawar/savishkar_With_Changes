import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Settings from '../models/Settings.js';
import fs from 'fs';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from server directory
dotenv.config({ path: join(__dirname, '..', '.env') });

const checkRulebookStatus = async () => {
  try {
    console.log('\n📚 RULEBOOK STATUS CHECK');
    console.log('═'.repeat(80));
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

    // Check database for rulebook URL
    console.log('🔍 Checking Database...');
    const rulebookUrl = await Settings.get('rulebook_url');
    
    if (rulebookUrl) {
      console.log('✅ Rulebook URL found in database');
      console.log(`   URL: ${rulebookUrl}`);
      console.log('');

      // Test URL accessibility
      console.log('🌐 Testing URL Accessibility...');
      try {
        await new Promise((resolve, reject) => {
          const request = https.get(rulebookUrl, (res) => {
            if (res.statusCode === 200) {
              console.log('✅ URL is accessible');
              console.log(`   Status: ${res.statusCode}`);
              console.log(`   Content-Type: ${res.headers['content-type']}`);
              console.log(`   Content-Length: ${res.headers['content-length'] ? (parseInt(res.headers['content-length']) / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}`);
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
        console.log('❌ URL is NOT accessible');
        console.log(`   Error: ${error.message}`);
      }
    } else {
      console.log('❌ No rulebook URL found in database');
    }
    console.log('');

    // Check local file
    console.log('📁 Checking Local Storage...');
    const possiblePaths = [
      join(__dirname, '../uploads/rulebook.pdf'),
      join(__dirname, '../uploads/Rulebook.pdf'),
      join(__dirname, '../uploads/RuleBook.pdf'),
      join(__dirname, '../uploads/RULEBOOK.pdf')
    ];

    let localFileFound = false;
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        const stats = fs.statSync(testPath);
        console.log('✅ Local rulebook found');
        console.log(`   Path: ${testPath}`);
        console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   Modified: ${stats.mtime.toLocaleString()}`);
        localFileFound = true;
        break;
      }
    }

    if (!localFileFound) {
      console.log('❌ No local rulebook found');
      console.log('   Searched in:');
      possiblePaths.forEach(p => console.log(`   - ${p}`));
    }
    console.log('');

    // Summary
    console.log('═'.repeat(80));
    console.log('📊 SUMMARY');
    console.log('═'.repeat(80));
    console.log('');

    if (rulebookUrl) {
      console.log('✅ Rulebook Status: CONFIGURED (Cloudinary)');
      console.log('');
      console.log('🔗 Access URLs:');
      console.log(`   Direct: ${rulebookUrl}`);
      console.log(`   Download: ${process.env.CLIENT_URL || 'http://localhost:5000'}/api/rulebook/download`);
      console.log(`   View: ${process.env.CLIENT_URL || 'http://localhost:5000'}/api/rulebook/view`);
      console.log(`   Info: ${process.env.CLIENT_URL || 'http://localhost:5000'}/api/rulebook/info`);
    } else if (localFileFound) {
      console.log('⚠️  Rulebook Status: LOCAL ONLY');
      console.log('');
      console.log('💡 Recommendation: Upload to Cloudinary for better performance');
      console.log('   Run: node server/scripts/uploadRulebook.js');
    } else {
      console.log('❌ Rulebook Status: NOT FOUND');
      console.log('');
      console.log('💡 Action Required:');
      console.log('   1. Place rulebook PDF in: server/uploads/rulebook.pdf');
      console.log('   2. Run: node server/scripts/uploadRulebook.js');
    }
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Status check failed:', error.message);
    process.exit(1);
  }
};

checkRulebookStatus();
