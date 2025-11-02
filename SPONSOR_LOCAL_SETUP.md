# 📁 Sponsor Management - Local Storage Setup

## Overview

Sponsors are now managed using **local file storage** instead of Cloudinary. Sponsor logos are served directly from the server's `public/sponsors` folder.

## Quick Start

### 1. Seed Sponsors from Local Folder

```bash
cd server
npm run seed-sponsors
```

This will:
- ✅ Copy sponsor logos from `Sponsors` folder to `server/public/sponsors`
- ✅ Seed the database with sponsor information
- ✅ Use local file paths (e.g., `/sponsors/skyworld.jpg`)

### 2. Start the Server

```bash
npm run dev
```

### 3. Start the Client

```bash
cd ../client
npm run dev
```

### 4. Verify

Visit the homepage and scroll to the "Our Sponsors" section.

## How It Works

### File Flow

```
Sponsors/                          # Source folder (root)
  ├── skyworld.jpg
  ├── IMG-20251031-WA0005.jpg
  └── ...
        ↓
  [Copy Files]
        ↓
server/public/sponsors/            # Destination folder
  ├── skyworld.jpg
  ├── IMG-20251031-WA0005.jpg
  └── ...
        ↓
  [Serve via Express]
        ↓
http://localhost:5000/sponsors/skyworld.jpg
```

### Database Storage

```javascript
{
  name: "SkyWorld",
  tier: "gold",
  logo: "/sponsors/skyworld.jpg",  // Local path
  displayOrder: 1,
  isActive: true
}
```

### Frontend Access

The frontend fetches sponsors from the API, which returns local URLs:

```javascript
// API Response
{
  "success": true,
  "data": {
    "gold": [
      {
        "name": "SkyWorld",
        "logo": "/sponsors/skyworld.jpg"  // Served from server
      }
    ]
  }
}
```

## Sponsor Categories

### 🏆 Gold Sponsors
- **SkyWorld** - `skyworld.jpg`
- **Jay Bharat** - `IMG-20251031-WA0005.jpg`

### 🥈 Silver Sponsors
- **Bagus** - `Belcakes.jpg`
- **AquaValues** - `paraiba_logo_white_bg.png`

### 🤝 Partners
- **AT Associates** - `AT ASSOCIATES.PNG`
- **Dlithe** - `Dlithe .jpg`
- **Gayatri Travels** - `Gayatri Travels.jpg`
- **Vidyadeep** - `Vidyadeep logo.png`

## File Structure

```
project-root/
├── Sponsors/                      # Source folder (your sponsor logos)
│   ├── skyworld.jpg
│   ├── IMG-20251031-WA0005.jpg
│   ├── Belcakes.jpg
│   ├── paraiba_logo_white_bg.png
│   ├── AT ASSOCIATES.PNG
│   ├── Dlithe .jpg
│   ├── Gayatri Travels.jpg
│   └── Vidyadeep logo.png
│
└── server/
    ├── public/
    │   └── sponsors/              # Destination (auto-created)
    │       ├── skyworld.jpg       # Copied files
    │       └── ...
    ├── models/
    │   └── Sponsor.js
    ├── routes/
    │   └── sponsors.js
    └── scripts/
        └── seedSponsorsLocal.js   # Main script
```

## Adding New Sponsors

### Step 1: Add Logo to Sponsors Folder

```bash
# Add your new sponsor logo
Sponsors/new-sponsor-logo.png
```

### Step 2: Update Sponsor Mapping

Edit `server/scripts/seedSponsorsLocal.js`:

```javascript
const sponsorMapping = {
  // ... existing sponsors
  'new-sponsor-logo.png': { 
    name: 'New Sponsor Name', 
    tier: 'gold',  // or 'silver' or 'partner'
    displayOrder: 3 
  }
};
```

### Step 3: Re-run Seed Script

```bash
cd server
npm run seed-sponsors
```

## Changing Sponsor Tiers

### Option 1: Update Mapping and Re-seed

1. Edit `sponsorMapping` in `seedSponsorsLocal.js`
2. Change the `tier` value
3. Run `npm run seed-sponsors`

### Option 2: Use API

```bash
curl -X PUT http://localhost:5000/api/sponsors/SPONSOR_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tier": "gold", "displayOrder": 1}'
```

## API Endpoints

### Get All Sponsors
```bash
curl http://localhost:5000/api/sponsors
```

Response:
```json
{
  "success": true,
  "data": {
    "gold": [
      {
        "_id": "...",
        "name": "SkyWorld",
        "tier": "gold",
        "logo": "/sponsors/skyworld.jpg",
        "displayOrder": 1,
        "isActive": true
      }
    ],
    "silver": [...],
    "partner": [...]
  }
}
```

### Access Sponsor Image
```
http://localhost:5000/sponsors/skyworld.jpg
```

## Advantages of Local Storage

✅ **No Cloudinary Required** - No external dependencies  
✅ **Faster Setup** - No API keys or configuration needed  
✅ **Simple Deployment** - Files included in your codebase  
✅ **Full Control** - Complete ownership of assets  
✅ **No Costs** - No third-party service fees  
✅ **Offline Development** - Works without internet  

## Disadvantages

⚠️ **Server Storage** - Files stored on your server  
⚠️ **No CDN** - Slower for global users  
⚠️ **Backup Required** - Need to backup files manually  
⚠️ **Scaling** - May need CDN for high traffic  

## Production Considerations

### For Small to Medium Traffic
Local storage works fine. The server caches images for 7 days.

### For High Traffic
Consider using Cloudinary:
```bash
npm run seed-sponsors-cloudinary
```

This uses the Cloudinary upload script instead.

## Troubleshooting

### Sponsors Not Showing

1. **Check if files were copied:**
```bash
ls server/public/sponsors/
```

2. **Check API response:**
```bash
curl http://localhost:5000/api/sponsors
```

3. **Check if images are accessible:**
```bash
curl http://localhost:5000/sponsors/skyworld.jpg
```

4. **Check browser console** for errors

### Script Fails

1. **Verify Sponsors folder exists:**
```bash
ls Sponsors/
```

2. **Check MongoDB connection:**
   - Verify `MONGODB_URI` in `.env`

3. **Check file permissions:**
   - Ensure script can read from `Sponsors/`
   - Ensure script can write to `server/public/sponsors/`

### Images Not Loading in Browser

1. **Check server is running:**
```bash
curl http://localhost:5000/api/health
```

2. **Check CORS settings** in `server.js`

3. **Verify file paths** in database:
```javascript
// Should be: /sponsors/filename.jpg
// NOT: server/public/sponsors/filename.jpg
```

4. **Check browser network tab** for 404 errors

## Environment Variables

Only MongoDB is required:

```env
# .env in server directory
MONGODB_URI=mongodb://localhost:27017/savishkar
# or
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/savishkar
```

No Cloudinary variables needed!

## Backup Strategy

### Manual Backup
```bash
# Backup sponsor files
cp -r server/public/sponsors/ backup/sponsors-$(date +%Y%m%d)/

# Backup database (MongoDB)
mongodump --uri="your_mongodb_uri" --db=savishkar --collection=sponsors
```

### Automated Backup
Add to your deployment script or cron job.

## Migration to Cloudinary (Optional)

If you later want to use Cloudinary:

1. Set up Cloudinary credentials in `.env`
2. Run the Cloudinary seed script:
```bash
npm run seed-sponsors-cloudinary
```

This will upload all files to Cloudinary and update the database.

## NPM Scripts

```bash
# Seed sponsors from local folder (recommended)
npm run seed-sponsors

# Seed sponsors with Cloudinary upload (optional)
npm run seed-sponsors-cloudinary
```

## File Serving Details

### Server Configuration

```javascript
// server.js
app.use('/sponsors', express.static('public/sponsors', {
  maxAge: '7d',      // Cache for 7 days
  etag: true,        // Enable ETag
  lastModified: true // Enable Last-Modified header
}));
```

### Caching Headers

- **Cache-Control**: `public, max-age=604800` (7 days)
- **ETag**: Enabled for cache validation
- **Last-Modified**: Enabled for conditional requests

### CORS Headers

- **Access-Control-Allow-Origin**: `*`
- **Cross-Origin-Resource-Policy**: `cross-origin`

## Best Practices

1. ✅ **Optimize Images** - Compress before adding to `Sponsors/`
2. ✅ **Use Consistent Naming** - lowercase, no spaces
3. ✅ **Supported Formats** - JPG, PNG, WebP, GIF
4. ✅ **File Size** - Keep under 500KB per image
5. ✅ **Aspect Ratio** - Square or landscape works best
6. ✅ **Background** - Transparent PNG for logos

## Summary

- ✅ Sponsors stored locally in `server/public/sponsors/`
- ✅ Database stores local paths (e.g., `/sponsors/logo.jpg`)
- ✅ Server serves files via Express static middleware
- ✅ Frontend fetches from API, displays local URLs
- ✅ No Cloudinary required
- ✅ Simple, fast, and cost-effective

---

**Status**: ✅ Ready to Use  
**Storage**: Local File System  
**CDN**: Not Required  
**Cost**: Free
