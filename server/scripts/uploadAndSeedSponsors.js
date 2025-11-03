#!/usr/bin/env node

/**
 * Upload Sponsor Logos to Cloudinary and Seed Database
 * This script uploads all sponsor logos from the Sponsors folder to Cloudinary
 * and seeds the database with sponsor information
 * Usage: node scripts/uploadAndSeedSponsors.js
 */

import cloudinary from '../config/cloudinary.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import mongoose from 'mongoose';
import Sponsor from '../models/Sponsor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('\n📤 Cloudinary Sponsor Upload & Database Seeding');
console.log('═'.repeat(60));

// Sponsor categorization based on requirements
const sponsorMapping = {
  // Gold Sponsors
  'skyworld.jpg': { name: 'SkyWorld', tier: 'gold', displayOrder: 1 },
  'IMG-20251031-WA0005.jpg': { name: 'Jay Bharat', tier: 'gold', displayOrder: 2 },
  
  // Silver Sponsors
  'Belcakes.jpg': { name: 'Bagus', tier: 'silver', displayOrder: 1 },
  'aqua.webp': { name: 'Aqua', tier: 'silver', displayOrder: 2 },
  
  // Partners
  'AT ASSOCIATES.PNG': { name: 'AT Associates', tier: 'partner', displayOrder: 1 },
  'Dlithe .jpg': { name: 'Dlithe', tier: 'partner', displayOrder: 2 },
  'Gayatri Travels.jpg': { name: 'Gayatri Travels', tier: 'partner', displayOrder: 3 },
  'Vidyadeep logo.png': { name: 'Vidyadeep', tier: 'partner', displayOrder: 4 }
};

// Check Cloudinary configuration
const checkCloudinaryConfig = () => {
  console.log('\n🔍 Checking Cloudinary Configuration...\n');
  
  const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = [];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.log('\n❌ Cloudinary configuration incomplete!');
    console.log('\n💡 Please set these environment variables in .env:');
    missing.forEach(varName => {
      console.log(`   ${varName}=your_value`);
    });
    return false;
  }
  
  console.log('\n✅ Cloudinary configuration complete!');
  return true;
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected!\n');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    process.exit(1);
  }
};

// Upload sponsors to Cloudinary and seed database
const uploadAndSeedSponsors = async () => {
  try {
    // Use the Sponsors folder in the root directory
    const sponsorsDir = path.join(__dirname, '../../Sponsors');
    
    // Check if directory exists
    if (!fs.existsSync(sponsorsDir)) {
      console.log('\n❌ Sponsors directory not found!');
      console.log(`📁 Expected location: ${sponsorsDir}`);
      console.log('\n💡 Please ensure Sponsors directory exists in the root');
      return;
    }
    
    // Get all files in sponsors directory
    const files = fs.readdirSync(sponsorsDir).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    });
    
    if (files.length === 0) {
      console.log('\n❌ No sponsor logo images found!');
      console.log(`📁 Directory: ${sponsorsDir}`);
      return;
    }
    
    console.log(`\n📸 Found ${files.length} sponsor logo(s) to upload\n`);
    
    const uploadedSponsors = [];
    
    // Upload each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(sponsorsDir, file);
      const stats = fs.statSync(filePath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      
      // Get sponsor info from mapping
      const sponsorInfo = sponsorMapping[file];
      
      if (!sponsorInfo) {
        console.log(`⚠️  [${i + 1}/${files.length}] Skipping unmapped file: ${file}`);
        continue;
      }
      
      console.log(`📤 [${i + 1}/${files.length}] Uploading: ${file} (${fileSizeKB} KB)`);
      console.log(`   Name: ${sponsorInfo.name} | Tier: ${sponsorInfo.tier.toUpperCase()}`);
      
      try {
        // Create a clean public_id from filename
        const publicId = path.parse(file).name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'savishkar/sponsors',
          resource_type: 'image',
          public_id: publicId,
          overwrite: true,
          type: 'upload',
          access_mode: 'public',
          transformation: [
            { width: 800, height: 800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }
          ]
        });
        
        uploadedSponsors.push({
          name: sponsorInfo.name,
          tier: sponsorInfo.tier,
          logo: result.secure_url,
          cloudinaryPublicId: result.public_id,
          displayOrder: sponsorInfo.displayOrder,
          isActive: true
        });
        
        console.log(`   ✅ Uploaded: ${result.secure_url}\n`);
        
      } catch (uploadError) {
        console.error(`   ❌ Failed to upload ${file}: ${uploadError.message}\n`);
      }
    }
    
    console.log('═'.repeat(60));
    console.log('\n✅ Upload Complete!\n');
    console.log('📊 Upload Summary:');
    console.log('─'.repeat(60));
    console.log(`   Total Files: ${files.length}`);
    console.log(`   Successful: ${uploadedSponsors.length}`);
    console.log(`   Failed: ${files.length - uploadedSponsors.length}`);
    console.log('─'.repeat(60));
    
    if (uploadedSponsors.length > 0) {
      // Clear existing sponsors
      console.log('\n🗑️  Clearing existing sponsors from database...');
      await Sponsor.deleteMany({});
      console.log('✅ Existing sponsors cleared\n');
      
      // Insert new sponsors
      console.log('💾 Seeding database with sponsors...');
      const insertedSponsors = await Sponsor.insertMany(uploadedSponsors);
      console.log(`✅ ${insertedSponsors.length} sponsors added to database!\n`);
      
      // Display categorized sponsors
      console.log('📋 Sponsors by Category:\n');
      
      const goldSponsors = insertedSponsors.filter(s => s.tier === 'gold');
      const silverSponsors = insertedSponsors.filter(s => s.tier === 'silver');
      const partners = insertedSponsors.filter(s => s.tier === 'partner');
      
      if (goldSponsors.length > 0) {
        console.log('🏆 GOLD SPONSORS:');
        goldSponsors.forEach(s => {
          console.log(`   • ${s.name}`);
          console.log(`     URL: ${s.logo}\n`);
        });
      }
      
      if (silverSponsors.length > 0) {
        console.log('🥈 SILVER SPONSORS:');
        silverSponsors.forEach(s => {
          console.log(`   • ${s.name}`);
          console.log(`     URL: ${s.logo}\n`);
        });
      }
      
      if (partners.length > 0) {
        console.log('🤝 PARTNERS:');
        partners.forEach(s => {
          console.log(`   • ${s.name}`);
          console.log(`     URL: ${s.logo}\n`);
        });
      }
      
      console.log('✅ Sponsor logos are now stored on Cloudinary!');
      console.log('✅ Database seeded with sponsor information!');
      console.log('🌐 Accessible from anywhere');
      console.log('⚡ Fast CDN delivery');
      console.log('💾 Works on any hosting (Hostinger VPS, Render, etc.)\n');
    }
    
    console.log('═'.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Process Failed!');
    console.error('─'.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error('═'.repeat(60));
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    if (!checkCloudinaryConfig()) {
      process.exit(1);
    }
    
    await connectDB();
    await uploadAndSeedSponsors();
    
    console.log('\n🎉 All done! Sponsors uploaded and database seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
};

main();
