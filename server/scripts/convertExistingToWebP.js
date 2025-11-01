import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Payment from '../models/Payment.js';

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

const convertExistingToWebP = async () => {
  try {
    console.log('\n🔄 CONVERT EXISTING IMAGES TO WEBP');
    console.log('═'.repeat(80));
    console.log('');

    // Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary credentials not found in .env file');
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

    let totalConverted = 0;
    let totalErrors = 0;
    let totalSkipped = 0;

    // ============================================
    // 1. Convert User Avatars
    // ============================================
    console.log('👤 Converting User Avatars...');
    console.log('─'.repeat(80));
    
    const users = await User.find({ avatar: { $exists: true, $ne: null } });
    console.log(`Found ${users.length} users with avatars`);
    console.log('');

    for (const user of users) {
      try {
        // Check if already WebP
        if (user.avatar.includes('.webp')) {
          console.log(`⏭️  Skipped: ${user.name} (already WebP)`);
          totalSkipped++;
          continue;
        }

        // Extract public_id from URL
        const urlParts = user.avatar.split('/');
        const publicIdWithExt = urlParts.slice(urlParts.indexOf('savishkar')).join('/');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension

        console.log(`🔄 Converting: ${user.name}`);
        console.log(`   Old URL: ${user.avatar}`);

        // Generate new WebP URL with transformations
        const newUrl = cloudinary.url(publicId, {
          format: 'webp',
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        });

        // Update user avatar
        user.avatar = newUrl;
        await user.save();

        console.log(`   New URL: ${newUrl}`);
        console.log(`   ✅ Converted successfully`);
        console.log('');
        totalConverted++;
      } catch (error) {
        console.error(`   ❌ Error converting ${user.name}: ${error.message}`);
        console.log('');
        totalErrors++;
      }
    }

    // ============================================
    // 2. Convert Event Images
    // ============================================
    console.log('🎯 Converting Event Images...');
    console.log('─'.repeat(80));
    
    const events = await Event.find({ image: { $exists: true, $ne: null } });
    console.log(`Found ${events.length} events with images`);
    console.log('');

    for (const event of events) {
      try {
        // Check if already WebP
        if (event.image.includes('.webp')) {
          console.log(`⏭️  Skipped: ${event.name} (already WebP)`);
          totalSkipped++;
          continue;
        }

        // Extract public_id from URL
        const urlParts = event.image.split('/');
        const publicIdWithExt = urlParts.slice(urlParts.indexOf('savishkar')).join('/');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension

        console.log(`🔄 Converting: ${event.name}`);
        console.log(`   Old URL: ${event.image}`);

        // Generate new WebP URL with transformations
        const newUrl = cloudinary.url(publicId, {
          format: 'webp',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ]
        });

        // Update event image
        event.image = newUrl;
        await event.save();

        console.log(`   New URL: ${newUrl}`);
        console.log(`   ✅ Converted successfully`);
        console.log('');
        totalConverted++;
      } catch (error) {
        console.error(`   ❌ Error converting ${event.name}: ${error.message}`);
        console.log('');
        totalErrors++;
      }
    }

    // ============================================
    // 3. Convert Payment Screenshots
    // ============================================
    console.log('💳 Converting Payment Screenshots...');
    console.log('─'.repeat(80));
    
    const payments = await Payment.find({ screenshotUrl: { $exists: true, $ne: null } });
    console.log(`Found ${payments.length} payments with screenshots`);
    console.log('');

    for (const payment of payments) {
      try {
        // Check if already WebP
        if (payment.screenshotUrl.includes('.webp')) {
          console.log(`⏭️  Skipped: Payment ${payment._id} (already WebP)`);
          totalSkipped++;
          continue;
        }

        // Extract public_id from URL
        const urlParts = payment.screenshotUrl.split('/');
        const publicIdWithExt = urlParts.slice(urlParts.indexOf('savishkar')).join('/');
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, ''); // Remove extension

        console.log(`🔄 Converting: Payment ${payment._id}`);
        console.log(`   Old URL: ${payment.screenshotUrl}`);

        // Generate new WebP URL with transformations
        const newUrl = cloudinary.url(publicId, {
          format: 'webp',
          transformation: [
            { width: 1000, height: 1000, crop: 'limit' },
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
          ]
        });

        // Update payment screenshot
        payment.screenshotUrl = newUrl;
        await payment.save();

        console.log(`   New URL: ${newUrl}`);
        console.log(`   ✅ Converted successfully`);
        console.log('');
        totalConverted++;
      } catch (error) {
        console.error(`   ❌ Error converting payment ${payment._id}: ${error.message}`);
        console.log('');
        totalErrors++;
      }
    }

    // ============================================
    // Summary
    // ============================================
    console.log('═'.repeat(80));
    console.log('📊 CONVERSION SUMMARY');
    console.log('═'.repeat(80));
    console.log('');
    console.log(`✅ Successfully Converted: ${totalConverted}`);
    console.log(`⏭️  Skipped (already WebP): ${totalSkipped}`);
    console.log(`❌ Errors: ${totalErrors}`);
    console.log(`📝 Total Processed: ${totalConverted + totalSkipped + totalErrors}`);
    console.log('');

    if (totalConverted > 0) {
      console.log('🎉 Conversion Complete!');
      console.log('');
      console.log('💡 Benefits:');
      console.log('   - Smaller file sizes (~70% reduction)');
      console.log('   - Faster page loads');
      console.log('   - Lower bandwidth costs');
      console.log('   - Better mobile experience');
      console.log('');
    }

    if (totalErrors > 0) {
      console.log('⚠️  Some conversions failed. Check the errors above.');
      console.log('');
    }

    if (totalSkipped > 0) {
      console.log('ℹ️  Some images were already in WebP format.');
      console.log('');
    }

    console.log('💡 Next Steps:');
    console.log('   1. Test image loading on your website');
    console.log('   2. Check Cloudinary dashboard for WebP images');
    console.log('   3. Monitor page load performance');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Conversion failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

convertExistingToWebP();
