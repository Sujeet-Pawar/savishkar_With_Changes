# Sponsor Management System

## Overview
This guide explains how to manage sponsors for the Savishkar event. Sponsors are categorized into three tiers: **Gold**, **Silver**, and **Partners**.

## Sponsor Categories

### Gold Sponsors
Premium tier sponsors with larger display on the homepage.
- **SkyWorld**
- **Jay Bharat**

### Silver Sponsors
Second-tier sponsors with medium-sized display.
- **Bagus**
- **AquaValues**

### Partners
Supporting partners displayed in a scrolling marquee.
- **AT Associates**
- **Dlithe**
- **Gayatri Travels**
- **Vidyadeep**

## File Structure

```
├── Sponsors/                           # Root folder with sponsor logos
│   ├── skyworld.jpg                   # Gold sponsor
│   ├── IMG-20251031-WA0005.jpg        # Gold sponsor (Jay Bharat)
│   ├── Belcakes.jpg                   # Silver sponsor (Bagus)
│   ├── paraiba_logo_white_bg.png      # Silver sponsor (AquaValues)
│   ├── AT ASSOCIATES.PNG              # Partner
│   ├── Dlithe .jpg                    # Partner
│   ├── Gayatri Travels.jpg            # Partner
│   └── Vidyadeep logo.png             # Partner
│
├── server/
│   ├── models/
│   │   └── Sponsor.js                 # Sponsor database model
│   ├── routes/
│   │   └── sponsors.js                # Sponsor API routes
│   └── scripts/
│       └── uploadAndSeedSponsors.js   # Upload & seed script
│
└── client/
    └── src/
        └── pages/
            └── Home.jsx               # Homepage with sponsor display
```

## Database Schema

```javascript
{
  name: String,              // Sponsor name
  tier: String,              // 'gold', 'silver', or 'partner'
  logo: String,              // Cloudinary URL
  cloudinaryPublicId: String, // Cloudinary public ID
  website: String,           // Optional website URL
  description: String,       // Optional description
  displayOrder: Number,      // Display order within tier
  isActive: Boolean          // Active status
}
```

## Setup Instructions

### 1. Upload Sponsors to Cloudinary and Seed Database

Run the upload and seed script:

```bash
cd server
node scripts/uploadAndSeedSponsors.js
```

This script will:
- ✅ Upload all sponsor logos from the `Sponsors` folder to Cloudinary
- ✅ Categorize sponsors according to their tier (Gold, Silver, Partner)
- ✅ Clear existing sponsors from the database
- ✅ Seed the database with new sponsor data
- ✅ Display a summary of uploaded sponsors

### 2. Verify Upload

Check the console output for:
- Upload status for each logo
- Cloudinary URLs
- Database seeding confirmation
- Categorized sponsor list

### 3. Test the API

Test the sponsor API endpoint:

```bash
# Get all sponsors
curl http://localhost:5000/api/sponsors

# Response format:
{
  "success": true,
  "data": {
    "gold": [...],
    "silver": [...],
    "partner": [...]
  },
  "all": [...]
}
```

## API Endpoints

### Public Endpoints

#### Get All Sponsors
```
GET /api/sponsors
```
Returns all active sponsors grouped by tier.

#### Get Single Sponsor
```
GET /api/sponsors/:id
```
Returns a single sponsor by ID.

### Admin Endpoints (Require Authentication)

#### Create Sponsor
```
POST /api/sponsors
Authorization: Bearer <token>

Body:
{
  "name": "Company Name",
  "tier": "gold|silver|partner",
  "logo": "https://cloudinary-url",
  "cloudinaryPublicId": "public-id",
  "website": "https://company.com",
  "description": "Company description",
  "displayOrder": 1
}
```

#### Update Sponsor
```
PUT /api/sponsors/:id
Authorization: Bearer <token>

Body: (any fields to update)
{
  "name": "Updated Name",
  "tier": "silver",
  "isActive": true
}
```

#### Delete Sponsor (Soft Delete)
```
DELETE /api/sponsors/:id
Authorization: Bearer <token>
```

#### Bulk Create Sponsors
```
POST /api/sponsors/bulk
Authorization: Bearer <token>

Body:
{
  "sponsors": [
    { "name": "...", "tier": "...", "logo": "..." },
    { "name": "...", "tier": "...", "logo": "..." }
  ]
}
```

## Adding New Sponsors

### Method 1: Using the Upload Script (Recommended)

1. Add the sponsor logo to the `Sponsors` folder
2. Update the `sponsorMapping` in `server/scripts/uploadAndSeedSponsors.js`:

```javascript
const sponsorMapping = {
  'new-sponsor-logo.png': { 
    name: 'New Sponsor Name', 
    tier: 'gold|silver|partner', 
    displayOrder: 1 
  },
  // ... existing sponsors
};
```

3. Run the upload script:
```bash
node scripts/uploadAndSeedSponsors.js
```

### Method 2: Using the API

1. Upload the logo to Cloudinary manually
2. Use the POST endpoint to create a new sponsor:

```bash
curl -X POST http://localhost:5000/api/sponsors \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Sponsor",
    "tier": "gold",
    "logo": "https://res.cloudinary.com/...",
    "cloudinaryPublicId": "savishkar/sponsors/new-sponsor"
  }'
```

## Updating Sponsor Tiers

To change a sponsor's tier (e.g., from Silver to Gold):

```bash
curl -X PUT http://localhost:5000/api/sponsors/SPONSOR_ID \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tier": "gold",
    "displayOrder": 1
  }'
```

## Frontend Display

The homepage (`Home.jsx`) automatically fetches and displays sponsors:

- **Gold Sponsors**: Large cards with borders and hover effects
- **Silver Sponsors**: Medium-sized logos in a grid
- **Partners**: Scrolling marquee animation

The sponsors are cached for 1 hour on the server for optimal performance.

## Troubleshooting

### Sponsors Not Showing on Homepage

1. Check if the API is running:
```bash
curl http://localhost:5000/api/sponsors
```

2. Check browser console for errors
3. Verify `VITE_API_URL` is set correctly in `.env`

### Upload Script Fails

1. Verify Cloudinary credentials in `.env`:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

2. Check MongoDB connection:
   - Verify `MONGODB_URI` in `.env`

3. Ensure sponsor images exist in the `Sponsors` folder

### Images Not Loading

1. Check Cloudinary URLs are accessible
2. Verify CORS settings in `server.js`
3. Check browser network tab for failed requests

## Best Practices

1. **Image Format**: Use PNG or JPG for logos
2. **Image Size**: Keep logos under 500KB for faster loading
3. **Aspect Ratio**: Square or landscape logos work best
4. **Background**: Use transparent backgrounds for PNG logos
5. **Naming**: Use descriptive filenames (e.g., `company-name.png`)

## Maintenance

### Regular Tasks

- Update sponsor tiers as contracts change
- Remove inactive sponsors (set `isActive: false`)
- Optimize logo file sizes
- Verify all Cloudinary URLs are working

### Backup

The sponsor data is stored in MongoDB. Regular database backups will include sponsor information.

## Support

For issues or questions:
1. Check server logs: `npm run dev` (in server directory)
2. Check browser console for client-side errors
3. Verify API responses using curl or Postman
4. Review this guide for common solutions
