# Rulebook Setup Guide

## 📚 Add Rulebook PDF to Website

This guide explains how to add the `RULE BOOK 2K25.pdf` to your website with view and download features.

## 🚀 Quick Setup

### **Step 1: Upload the Rulebook**

```bash
cd d:\code3\server
npm run upload-rulebook
```

This script will:
1. ✅ Copy `RULE BOOK 2K25.pdf` to `server/uploads/documents/`
2. ☁️ Upload to Cloudinary (if enabled)
3. 💾 Save the URL to database (Settings collection)
4. 🌐 Make it publicly accessible

### **Step 2: Restart Your Server**

```bash
cd d:\code3\server
npm run dev
```

The server will now serve the rulebook!

## 📋 API Endpoints

Your website already has these endpoints configured:

### **1. View Rulebook (In Browser)**
```
GET /api/rulebook/view
```
- Opens PDF in browser
- Supports inline viewing
- Works with PDF viewers

### **2. Download Rulebook**
```
GET /api/rulebook/download
```
- Downloads PDF file
- Filename: `Savishkar_2025_Rulebook.pdf`
- Forces download dialog

### **3. Get Rulebook Info**
```
GET /api/rulebook/info
```
- Returns rulebook metadata
- Shows storage location (Cloudinary or local)
- Provides file size and URLs

## 🎨 Frontend Integration

### **Example: React Component**

```jsx
import React from 'react';

const RulebookSection = () => {
  const handleView = () => {
    window.open('/api/rulebook/view', '_blank');
  };

  const handleDownload = () => {
    window.location.href = '/api/rulebook/download';
  };

  return (
    <div className="rulebook-section">
      <h2>📚 Event Rulebook</h2>
      <p>Download or view the complete rulebook for Savishkar 2025</p>
      
      <div className="buttons">
        <button onClick={handleView} className="btn-view">
          👁️ View Rulebook
        </button>
        <button onClick={handleDownload} className="btn-download">
          ⬇️ Download PDF
        </button>
      </div>
    </div>
  );
};

export default RulebookSection;
```

### **Example: Simple HTML**

```html
<div class="rulebook-section">
  <h2>📚 Event Rulebook</h2>
  
  <!-- View Button -->
  <a href="/api/rulebook/view" target="_blank" class="btn btn-primary">
    👁️ View Rulebook
  </a>
  
  <!-- Download Button -->
  <a href="/api/rulebook/download" class="btn btn-secondary">
    ⬇️ Download PDF
  </a>
</div>
```

## 🔧 How It Works

### **Storage Options**

1. **Cloudinary (Recommended for Production)**
   - PDF uploaded to Cloudinary CDN
   - Fast global delivery
   - No server storage needed
   - URL: `https://res.cloudinary.com/.../savishkar/documents/rulebook-2k25.pdf`

2. **Local Storage (Development)**
   - PDF stored in `server/uploads/documents/`
   - Served directly from server
   - URL: `/uploads/documents/RULE_BOOK_2K25.pdf`

### **Automatic Fallback**

The system automatically:
1. Tries to serve from Cloudinary (if available)
2. Falls back to local storage if Cloudinary fails
3. Returns 404 if neither is available

## 📊 What the Upload Script Does

```
======================================================================
📚 Upload Rulebook PDF
======================================================================

📁 Checking source file: D:\code3\RULE BOOK 2K25.pdf
✅ Source file found!

📋 Copying rulebook to local uploads folder...
✅ Rulebook copied successfully!

☁️  Cloudinary: ENABLED
📤 Uploading rulebook to Cloudinary...

✅ Uploaded to Cloudinary successfully!
🔗 Cloudinary URL: https://res.cloudinary.com/.../rulebook-2k25.pdf

🔌 Connecting to MongoDB...
✅ MongoDB Connected!

💾 Saving rulebook URL to database...
✅ Rulebook URL saved to database!

======================================================================
📊 SUMMARY
======================================================================
✅ Rulebook uploaded successfully!
📁 Source: D:\code3\RULE BOOK 2K25.pdf
📁 Local: d:\code3\server\uploads\documents\RULE_BOOK_2K25.pdf
🔗 URL: https://res.cloudinary.com/.../rulebook-2k25.pdf
💾 Database: Settings updated
🌐 Public Access: Enabled
```

## 🗄️ Database Structure

The rulebook URL is stored in the `Settings` collection:

```javascript
{
  key: 'rulebook_url',
  value: 'https://res.cloudinary.com/.../rulebook-2k25.pdf',
  description: 'Savishkar 2025 Rulebook PDF',
  category: 'documents',
  isPublic: true
}
```

## 🌐 Features

### **View Feature**
- ✅ Opens PDF in browser
- ✅ Supports browser PDF viewer
- ✅ No download required
- ✅ Can be embedded in iframe

### **Download Feature**
- ✅ Downloads PDF file
- ✅ Custom filename
- ✅ Works on all browsers
- ✅ Mobile-friendly

### **Security**
- ✅ CORS enabled for cross-origin access
- ✅ Proper content-type headers
- ✅ Cache control for performance
- ✅ Public access (no authentication required)

## 📱 Mobile Support

The rulebook works perfectly on mobile devices:
- ✅ View in mobile browser
- ✅ Download to device
- ✅ Share via mobile apps
- ✅ Responsive design

## 🔍 Verification

### **Check if Rulebook is Available**

```bash
curl http://localhost:5000/api/rulebook/info
```

Response:
```json
{
  "success": true,
  "available": true,
  "filename": "Savishkar_2025_Rulebook.pdf",
  "storage": "cloudinary",
  "url": "https://res.cloudinary.com/.../rulebook-2k25.pdf",
  "downloadUrl": "/api/rulebook/download",
  "viewUrl": "/api/rulebook/view"
}
```

### **Test View in Browser**

Open in browser:
```
http://localhost:5000/api/rulebook/view
```

### **Test Download**

Open in browser:
```
http://localhost:5000/api/rulebook/download
```

## 🎯 Integration Points

### **Where to Add Rulebook Links**

1. **Navigation Menu**
   - Add "Rulebook" link in main navigation
   - Direct link to `/api/rulebook/view`

2. **Events Page**
   - Add rulebook section above or below events
   - Provide both view and download options

3. **Registration Page**
   - Link to rulebook before registration
   - "Read the rules before registering"

4. **Footer**
   - Add to footer links
   - Always accessible

5. **Dashboard**
   - Show in user dashboard
   - Quick access for participants

## 🛠️ Troubleshooting

### **Rulebook Not Found**

1. Check if file exists:
   ```bash
   dir d:\code3\server\uploads\documents\
   ```

2. Re-run upload script:
   ```bash
   npm run upload-rulebook
   ```

3. Check database:
   ```bash
   # In MongoDB shell
   db.settings.find({ key: 'rulebook_url' })
   ```

### **Cloudinary Upload Failed**

If Cloudinary upload fails:
1. Check `.env` file has correct credentials
2. Verify `USE_CLOUDINARY=true`
3. Script will automatically use local storage as fallback

### **PDF Not Opening**

1. Check browser console for errors
2. Verify CORS headers are set
3. Try direct URL: `/api/rulebook/view`
4. Check server logs

## 📝 Summary

✅ **Script Created**: `upload-rulebook.js`
✅ **API Routes**: Already configured in `routes/rulebook.js`
✅ **Storage**: Both Cloudinary and local supported
✅ **Features**: View and Download
✅ **Access**: Public (no authentication)
✅ **Mobile**: Fully supported

## 🚀 Next Steps

1. **Run the upload script**: `npm run upload-rulebook`
2. **Restart server**: `npm run dev`
3. **Add frontend UI**: Create buttons/links in your React app
4. **Test**: Open `/api/rulebook/view` in browser
5. **Deploy**: Push changes to production

**Your rulebook is now ready to be viewed and downloaded by all users!** 📚
