# Sponsor Upload & Management Scripts

## Quick Start

### Upload Sponsors to Cloudinary & Seed Database

```bash
# From the server directory
cd server
node scripts/uploadAndSeedSponsors.js
```

## Current Sponsor Configuration

### Gold Sponsors (Premium Tier)
1. **SkyWorld** - `skyworld.jpg`
2. **Jay Bharat** - `IMG-20251031-WA0005.jpg`

### Silver Sponsors (Second Tier)
1. **Bagus** - `Belcakes.jpg`
2. **AquaValues** - `paraiba_logo_white_bg.png`

### Partners
1. **AT Associates** - `AT ASSOCIATES.PNG`
2. **Dlithe** - `Dlithe .jpg`
3. **Gayatri Travels** - `Gayatri Travels.jpg`
4. **Vidyadeep** - `Vidyadeep logo.png`

## File Mapping

The script uses the following mapping from the `Sponsors` folder:

```javascript
{
  // Gold Sponsors
  'skyworld.jpg': { name: 'SkyWorld', tier: 'gold', displayOrder: 1 },
  'IMG-20251031-WA0005.jpg': { name: 'Jay Bharat', tier: 'gold', displayOrder: 2 },
  
  // Silver Sponsors
  'Belcakes.jpg': { name: 'Bagus', tier: 'silver', displayOrder: 1 },
  'paraiba_logo_white_bg.png': { name: 'AquaValues', tier: 'silver', displayOrder: 2 },
  
  // Partners
  'AT ASSOCIATES.PNG': { name: 'AT Associates', tier: 'partner', displayOrder: 1 },
  'Dlithe .jpg': { name: 'Dlithe', tier: 'partner', displayOrder: 2 },
  'Gayatri Travels.jpg': { name: 'Gayatri Travels', tier: 'partner', displayOrder: 3 },
  'Vidyadeep logo.png': { name: 'Vidyadeep', tier: 'partner', displayOrder: 4 }
}
```

## What the Script Does

1. ✅ Checks Cloudinary configuration
2. ✅ Connects to MongoDB
3. ✅ Reads sponsor logos from the `Sponsors` folder
4. ✅ Uploads each logo to Cloudinary (`savishkar/sponsors` folder)
5. ✅ Clears existing sponsors from database
6. ✅ Seeds database with new sponsor data
7. ✅ Displays categorized sponsor list

## Prerequisites

### Environment Variables Required

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
```

### Folder Structure

```
project-root/
├── Sponsors/              # Sponsor logos here
│   ├── skyworld.jpg
│   ├── IMG-20251031-WA0005.jpg
│   ├── Belcakes.jpg
│   └── ...
└── server/
    └── scripts/
        └── uploadAndSeedSponsors.js
```

## Expected Output

```
📤 Cloudinary Sponsor Upload & Database Seeding
════════════════════════════════════════════════════════════

🔍 Checking Cloudinary Configuration...

✅ CLOUDINARY_CLOUD_NAME: Set
✅ CLOUDINARY_API_KEY: Set
✅ CLOUDINARY_API_SECRET: Set

✅ Cloudinary configuration complete!

🔌 Connecting to MongoDB...
✅ MongoDB Connected!

📸 Found 8 sponsor logo(s) to upload

📤 [1/8] Uploading: skyworld.jpg (15.12 KB)
   Name: SkyWorld | Tier: GOLD
   ✅ Uploaded: https://res.cloudinary.com/.../skyworld.jpg

📤 [2/8] Uploading: IMG-20251031-WA0005.jpg (22.70 KB)
   Name: Jay Bharat | Tier: GOLD
   ✅ Uploaded: https://res.cloudinary.com/.../img-20251031-wa0005.jpg

...

════════════════════════════════════════════════════════════

✅ Upload Complete!

📊 Upload Summary:
────────────────────────────────────────────────────────────
   Total Files: 8
   Successful: 8
   Failed: 0
────────────────────────────────────────────────────────────

🗑️  Clearing existing sponsors from database...
✅ Existing sponsors cleared

💾 Seeding database with sponsors...
✅ 8 sponsors added to database!

📋 Sponsors by Category:

🏆 GOLD SPONSORS:
   • SkyWorld
     URL: https://res.cloudinary.com/.../skyworld.jpg

   • Jay Bharat
     URL: https://res.cloudinary.com/.../img-20251031-wa0005.jpg

🥈 SILVER SPONSORS:
   • Bagus
     URL: https://res.cloudinary.com/.../belcakes.jpg

   • AquaValues
     URL: https://res.cloudinary.com/.../paraiba_logo_white_bg.png

🤝 PARTNERS:
   • AT Associates
     URL: https://res.cloudinary.com/.../at-associates.png

   • Dlithe
     URL: https://res.cloudinary.com/.../dlithe.jpg

   • Gayatri Travels
     URL: https://res.cloudinary.com/.../gayatri-travels.jpg

   • Vidyadeep
     URL: https://res.cloudinary.com/.../vidyadeep-logo.png

✅ Sponsor logos are now stored on Cloudinary!
✅ Database seeded with sponsor information!
🌐 Accessible from anywhere
⚡ Fast CDN delivery
💾 Works on any hosting (Hostinger VPS, Render, etc.)

════════════════════════════════════════════════════════════

🎉 All done! Sponsors uploaded and database seeded successfully!
```

## Troubleshooting

### Error: Sponsors directory not found
- Ensure the `Sponsors` folder exists in the project root
- Check the path in the script matches your folder structure

### Error: Cloudinary configuration incomplete
- Verify all Cloudinary environment variables are set in `.env`
- Check for typos in variable names

### Error: MongoDB Connection Failed
- Verify `MONGODB_URI` is correct
- Ensure MongoDB is running (if local)
- Check network connectivity (if remote)

### Error: Failed to upload specific file
- Check file format (should be jpg, png, gif, webp)
- Verify file is not corrupted
- Check file permissions

## Adding New Sponsors

1. Add the logo file to the `Sponsors` folder
2. Update the `sponsorMapping` object in `uploadAndSeedSponsors.js`
3. Run the script again

Example:
```javascript
const sponsorMapping = {
  // ... existing sponsors
  'new-company-logo.png': { 
    name: 'New Company', 
    tier: 'silver',  // gold, silver, or partner
    displayOrder: 3 
  }
};
```

## Changing Sponsor Tiers

To change a sponsor's tier:

1. Update the tier in `sponsorMapping`
2. Re-run the script

OR

Use the API endpoint:
```bash
curl -X PUT http://localhost:5000/api/sponsors/SPONSOR_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier": "gold"}'
```

## Verifying Results

### Check Database
```bash
# Using MongoDB shell
mongosh "your_mongodb_uri"
use savishkar
db.sponsors.find().pretty()
```

### Check API
```bash
curl http://localhost:5000/api/sponsors
```

### Check Frontend
1. Start the client: `npm run dev` (in client directory)
2. Navigate to the homepage
3. Scroll to the "Our Sponsors" section
4. Verify all sponsors are displayed correctly

## Notes

- The script performs a **full replacement** of sponsors (clears and re-seeds)
- Cloudinary URLs are permanent and cached
- Images are automatically optimized by Cloudinary
- The database stores references to Cloudinary URLs
- Frontend fetches sponsors from the database via API
