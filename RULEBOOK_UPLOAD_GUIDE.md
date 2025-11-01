# 📚 Rulebook Upload Guide

## Problem
The rulebook is not being fetched properly because the `documents` folder in Cloudinary is empty.

## Solution

### Option 1: Upload via Script (Recommended) ✅

#### Step 1: Place Your Rulebook PDF
Put your rulebook PDF file in one of these locations:

**Recommended:**
```
server/uploads/rulebook.pdf
```

**Alternative names (any will work):**
- `server/uploads/Rulebook.pdf`
- `server/uploads/RuleBook.pdf`
- `server/uploads/RULEBOOK.pdf`

#### Step 2: Run Upload Script
```bash
node server/scripts/uploadRulebook.js
```

**Or specify custom path:**
```bash
node server/scripts/uploadRulebook.js /path/to/your/rulebook.pdf
```

#### Step 3: Verify Upload
The script will:
- ✅ Upload PDF to Cloudinary (`savishkar/documents/rulebook`)
- ✅ Save URL to database
- ✅ Verify URL is accessible
- ✅ Display access URLs

---

### Option 2: Manual Upload via Cloudinary Dashboard

#### Step 1: Login to Cloudinary
Go to: https://console.cloudinary.com/

#### Step 2: Navigate to Media Library
1. Click "Media Library" in left sidebar
2. Navigate to `savishkar` → `documents` folder
3. If `documents` folder doesn't exist, create it

#### Step 3: Upload Rulebook
1. Click "Upload" button
2. Select your rulebook PDF
3. **Important:** Name it exactly as `rulebook` (without extension)
4. Wait for upload to complete

#### Step 4: Get the URL
After upload, the URL will be:
```
https://res.cloudinary.com/YOUR_CLOUD_NAME/raw/upload/savishkar/documents/rulebook.pdf
```

#### Step 5: Update Database
Run this script to save the URL:
```bash
node server/scripts/updateRulebookUrl.js "YOUR_CLOUDINARY_URL"
```

Or manually update in MongoDB:
```javascript
db.settings.updateOne(
  { key: 'rulebook_url' },
  { $set: { value: 'YOUR_CLOUDINARY_URL' } },
  { upsert: true }
)
```

---

## Verification

### Check if Rulebook is Accessible

#### 1. Check Database
```bash
node server/scripts/checkRulebookStatus.js
```

#### 2. Test API Endpoints
```bash
# Get rulebook info
curl http://localhost:5000/api/rulebook/info

# Download rulebook
curl http://localhost:5000/api/rulebook/download -o test.pdf

# View rulebook
curl http://localhost:5000/api/rulebook/view
```

#### 3. Test in Browser
- Download: `http://localhost:5000/api/rulebook/download`
- View: `http://localhost:5000/api/rulebook/view`
- Info: `http://localhost:5000/api/rulebook/info`

---

## Troubleshooting

### Issue: "Rulebook not found"
**Cause:** File not in expected location

**Solution:**
1. Check file exists in `server/uploads/`
2. Check filename (case-sensitive)
3. Try specifying full path: `node uploadRulebook.js /full/path/to/file.pdf`

### Issue: "Cloudinary credentials not found"
**Cause:** Missing environment variables

**Solution:**
Add to `.env` file:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Issue: "Upload failed"
**Cause:** Network or permission issue

**Solution:**
1. Check internet connection
2. Verify Cloudinary credentials
3. Check file size (max 100MB for free tier)
4. Try manual upload via dashboard

### Issue: "URL not accessible"
**Cause:** Wrong URL or permissions

**Solution:**
1. Verify URL format: `https://res.cloudinary.com/.../savishkar/documents/rulebook.pdf`
2. Check file is public (not private)
3. Try accessing URL directly in browser

---

## Expected Cloudinary Structure

After upload, your Cloudinary should look like:

```
savishkar/
├── avatars/          (user profile pictures)
├── events/           (event images)
├── payments/         (payment screenshots)
└── documents/        (rulebook and other PDFs)
    └── rulebook.pdf  ← YOUR RULEBOOK HERE
```

---

## File Requirements

### Rulebook PDF Specifications:
- **Format:** PDF
- **Max Size:** 100 MB (free tier), 1 GB (paid)
- **Naming:** `rulebook.pdf` (case-insensitive)
- **Location:** `savishkar/documents/` folder in Cloudinary

---

## Quick Commands

### Upload Rulebook:
```bash
node server/scripts/uploadRulebook.js
```

### Check Status:
```bash
node server/scripts/checkRulebookStatus.js
```

### Update URL Manually:
```bash
node server/scripts/updateRulebookUrl.js "https://res.cloudinary.com/..."
```

### Test Download:
```bash
curl http://localhost:5000/api/rulebook/download -o test.pdf
```

---

## API Endpoints

### GET /api/rulebook/info
Returns rulebook information
```json
{
  "success": true,
  "available": true,
  "filename": "Savishkar_2025_Rulebook.pdf",
  "storage": "cloudinary",
  "url": "https://res.cloudinary.com/.../rulebook.pdf",
  "downloadUrl": "/api/rulebook/download",
  "viewUrl": "/api/rulebook/view"
}
```

### GET /api/rulebook/download
Downloads the rulebook PDF (attachment)

### GET /api/rulebook/view
Views the rulebook PDF inline in browser

---

## Frontend Integration

The rulebook should be accessible from your website via a button or link that points to:
- Download: `/api/rulebook/download`
- View: `/api/rulebook/view`

Example button:
```jsx
<a href="/api/rulebook/download" download>
  Download Rulebook
</a>
```

---

## Notes

1. **File Naming:** The script looks for files named `rulebook`, `Rulebook`, `RuleBook`, or `RULEBOOK` (case-insensitive)

2. **Cloudinary Folder:** The rulebook will be uploaded to `savishkar/documents/` folder

3. **Database Storage:** The URL is stored in the `settings` collection with key `rulebook_url`

4. **Caching:** The rulebook is cached for 24 hours for better performance

5. **CORS:** The endpoints are configured to allow cross-origin requests

---

## Success Indicators

After successful upload, you should see:
- ✅ File in Cloudinary dashboard under `savishkar/documents/`
- ✅ URL in database (`settings` collection)
- ✅ Download endpoint returns PDF
- ✅ View endpoint displays PDF in browser
- ✅ Info endpoint returns correct details

---

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify Cloudinary credentials
3. Ensure file exists and is readable
4. Check MongoDB connection
5. Review server logs

---

**Ready to upload?** Run:
```bash
node server/scripts/uploadRulebook.js
```
