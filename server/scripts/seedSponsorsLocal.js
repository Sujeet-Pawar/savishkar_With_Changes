#!/usr/bin/env node

/**
 * Seed Sponsors from Local Folder
 * This script reads sponsor logos from the Sponsors folder and seeds the database
 * with local file paths (no Cloudinary upload)
 * Usage: node scripts/seedSponsorsLocal.js
 */

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

console.log('\n📤 Local Sponsor Database Seeding');
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

// Copy sponsors to public folder and seed database
const seedSponsorsLocal = async () => {
  try {
    // Source: Sponsors folder in root
    const sponsorsSourceDir = path.join(__dirname, '../../Sponsors');
    
    // Destination: server/public/sponsors
    const sponsorsDestDir = path.join(__dirname, '../public/sponsors');
    
    // Check if source directory exists
    if (!fs.existsSync(sponsorsSourceDir)) {
      console.log('\n❌ Sponsors directory not found!');
      console.log(`📁 Expected location: ${sponsorsSourceDir}`);
      console.log('\n💡 Please ensure Sponsors directory exists in the root');
      return;
    }
    
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(sponsorsDestDir)) {
      fs.mkdirSync(sponsorsDestDir, { recursive: true });
      console.log(`📁 Created directory: ${sponsorsDestDir}\n`);
    }
    
    // Get all files in sponsors directory
    const files = fs.readdirSync(sponsorsSourceDir).filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
    });
    
    if (files.length === 0) {
      console.log('\n❌ No sponsor logo images found!');
      console.log(`📁 Directory: ${sponsorsSourceDir}`);
      return;
    }
    
    console.log(`\n📸 Found ${files.length} sponsor logo(s) to process\n`);
    
    const sponsorsData = [];
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sourcePath = path.join(sponsorsSourceDir, file);
      const destPath = path.join(sponsorsDestDir, file);
      const stats = fs.statSync(sourcePath);
      const fileSizeKB = (stats.size / 1024).toFixed(2);
      
      // Get sponsor info from mapping
      const sponsorInfo = sponsorMapping[file];
      
      if (!sponsorInfo) {
        console.log(`⚠️  [${i + 1}/${files.length}] Skipping unmapped file: ${file}`);
        continue;
      }
      
      console.log(`📋 [${i + 1}/${files.length}] Processing: ${file} (${fileSizeKB} KB)`);
      console.log(`   Name: ${sponsorInfo.name} | Tier: ${sponsorInfo.tier.toUpperCase()}`);
      
      try {
        // Copy file to public/sponsors
        fs.copyFileSync(sourcePath, destPath);
        console.log(`   ✅ Copied to: ${destPath}`);
        
        // Create local URL path
        const localUrl = `/sponsors/${file}`;
        
        sponsorsData.push({
          name: sponsorInfo.name,
          tier: sponsorInfo.tier,
          logo: localUrl,
          displayOrder: sponsorInfo.displayOrder,
          isActive: true
        });
        
        console.log(`   📍 Local URL: ${localUrl}\n`);
        
      } catch (error) {
        console.error(`   ❌ Failed to process ${file}: ${error.message}\n`);
      }
    }
    
    console.log('═'.repeat(60));
    console.log('\n✅ File Processing Complete!\n');
    console.log('📊 Processing Summary:');
    console.log('─'.repeat(60));
    console.log(`   Total Files: ${files.length}`);
    console.log(`   Successful: ${sponsorsData.length}`);
    console.log(`   Failed: ${files.length - sponsorsData.length}`);
    console.log('─'.repeat(60));
    
    if (sponsorsData.length > 0) {
      // Clear existing sponsors
      console.log('\n🗑️  Clearing existing sponsors from database...');
      await Sponsor.deleteMany({});
      console.log('✅ Existing sponsors cleared\n');
      
      // Insert new sponsors
      console.log('💾 Seeding database with sponsors...');
      const insertedSponsors = await Sponsor.insertMany(sponsorsData);
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
          console.log(`     Local Path: ${s.logo}\n`);
        });
      }
      
      if (silverSponsors.length > 0) {
        console.log('🥈 SILVER SPONSORS:');
        silverSponsors.forEach(s => {
          console.log(`   • ${s.name}`);
          console.log(`     Local Path: ${s.logo}\n`);
        });
      }
      
      if (partners.length > 0) {
        console.log('🤝 PARTNERS:');
        partners.forEach(s => {
          console.log(`   • ${s.name}`);
          console.log(`     Local Path: ${s.logo}\n`);
        });
      }
      
      console.log('✅ Sponsor logos copied to server/public/sponsors!');
      console.log('✅ Database seeded with sponsor information!');
      console.log('📁 Files served from local storage');
      console.log('⚡ No Cloudinary required\n');
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
    await connectDB();
    await seedSponsorsLocal();
    
    console.log('\n🎉 All done! Sponsors copied and database seeded successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  }
};

main();
