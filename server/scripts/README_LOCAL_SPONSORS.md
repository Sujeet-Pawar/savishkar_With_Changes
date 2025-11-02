# 📁 Local Sponsor Setup - Quick Reference

## One Command Setup

```bash
cd server
npm run seed-sponsors
```

## What This Does

1. ✅ Copies logos from `Sponsors/` to `server/public/sponsors/`
2. ✅ Seeds database with sponsor data
3. ✅ Uses local file paths (no Cloudinary)

## Expected Output

```
📤 Local Sponsor Database Seeding
════════════════════════════════════════════════════════════

🔌 Connecting to MongoDB...
✅ MongoDB Connected!

📸 Found 8 sponsor logo(s) to process

📋 [1/8] Processing: skyworld.jpg (15.12 KB)
   Name: SkyWorld | Tier: GOLD
   ✅ Copied to: /path/to/server/public/sponsors/skyworld.jpg
   📍 Local URL: /sponsors/skyworld.jpg

...

════════════════════════════════════════════════════════════

✅ File Processing Complete!

📊 Processing Summary:
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
     Local Path: /sponsors/skyworld.jpg

   • Jay Bharat
     Local Path: /sponsors/IMG-20251031-WA0005.jpg

🥈 SILVER SPONSORS:
   • Bagus
     Local Path: /sponsors/Belcakes.jpg

   • AquaValues
     Local Path: /sponsors/paraiba_logo_white_bg.png

🤝 PARTNERS:
   • AT Associates
     Local Path: /sponsors/AT ASSOCIATES.PNG

   • Dlithe
     Local Path: /sponsors/Dlithe .jpg

   • Gayatri Travels
     Local Path: /sponsors/Gayatri Travels.jpg

   • Vidyadeep
     Local Path: /sponsors/Vidyadeep logo.png

✅ Sponsor logos copied to server/public/sponsors!
✅ Database seeded with sponsor information!
📁 Files served from local storage
⚡ No Cloudinary required

════════════════════════════════════════════════════════════

🎉 All done! Sponsors copied and database seeded successfully!
```

## File Mapping

```javascript
{
  // Gold Sponsors
  'skyworld.jpg': { 
    name: 'SkyWorld', 
    tier: 'gold', 
    displayOrder: 1 
  },
  'IMG-20251031-WA0005.jpg': { 
    name: 'Jay Bharat', 
    tier: 'gold', 
    displayOrder: 2 
  },
  
  // Silver Sponsors
  'Belcakes.jpg': { 
    name: 'Bagus', 
    tier: 'silver', 
    displayOrder: 1 
  },
  'paraiba_logo_white_bg.png': { 
    name: 'AquaValues', 
    tier: 'silver', 
    displayOrder: 2 
  },
  
  // Partners
  'AT ASSOCIATES.PNG': { 
    name: 'AT Associates', 
    tier: 'partner', 
    displayOrder: 1 
  },
  'Dlithe .jpg': { 
    name: 'Dlithe', 
    tier: 'partner', 
    displayOrder: 2 
  },
  'Gayatri Travels.jpg': { 
    name: 'Gayatri Travels', 
    tier: 'partner', 
    displayOrder: 3 
  },
  'Vidyadeep logo.png': { 
    name: 'Vidyadeep', 
    tier: 'partner', 
    displayOrder: 4 
  }
}
```

## Folder Structure

```
Sponsors/                    # Your source files
  ├── skyworld.jpg
  └── ...
       ↓ [Copy]
server/public/sponsors/      # Destination (auto-created)
  ├── skyworld.jpg
  └── ...
       ↓ [Serve]
http://localhost:5000/sponsors/skyworld.jpg
```

## Verify Setup

### 1. Check Files Copied
```bash
ls server/public/sponsors/
```

### 2. Test API
```bash
curl http://localhost:5000/api/sponsors
```

### 3. Test Image Access
```bash
curl http://localhost:5000/sponsors/skyworld.jpg
```

### 4. Check Homepage
Open browser → Homepage → Scroll to "Our Sponsors"

## Adding New Sponsors

1. Add logo to `Sponsors/` folder
2. Edit `server/scripts/seedSponsorsLocal.js`:
```javascript
const sponsorMapping = {
  // ... existing
  'new-logo.png': { 
    name: 'New Company', 
    tier: 'silver', 
    displayOrder: 3 
  }
};
```
3. Run: `npm run seed-sponsors`

## Troubleshooting

### ❌ Sponsors directory not found
- Check `Sponsors/` folder exists in project root
- Verify path in script

### ❌ MongoDB Connection Failed
- Check `MONGODB_URI` in `.env`
- Ensure MongoDB is running

### ❌ Images not showing on frontend
- Check server is running
- Check API: `curl http://localhost:5000/api/sponsors`
- Check browser console for errors

## Environment Required

```env
# server/.env
MONGODB_URI=your_mongodb_connection_string
```

**No Cloudinary variables needed!**

## NPM Scripts

```bash
# Local storage (default)
npm run seed-sponsors

# Cloudinary upload (optional)
npm run seed-sponsors-cloudinary
```

## Advantages

✅ No Cloudinary account needed  
✅ No API keys required  
✅ Faster setup  
✅ Works offline  
✅ Free  

## Notes

- Files are cached for 7 days
- CORS enabled for cross-origin access
- Database stores local paths like `/sponsors/logo.jpg`
- Frontend automatically fetches from API
