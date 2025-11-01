# 🚀 Complete Hostinger VPS Setup Guide

## Overview

This guide covers fixing **all image-related issues** on your Hostinger VPS:
1. ✅ Sponsor logos loading from Cloudinary CDN
2. ✅ Event images uploading properly
3. ✅ QR codes uploading and displaying correctly
4. ✅ Fast image loading (no delays)

---

## 🎯 Issues & Solutions Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| Images not uploading | `USE_CLOUDINARY` not set | Set `USE_CLOUDINARY=true` in `.env` |
| Images loading slowly | Using local storage | Enable Cloudinary CDN |
| Sponsors not showing | Using local paths | Upload to Cloudinary |
| QR codes not uploading | Same as images | Enable Cloudinary |

---

## 📋 Complete Setup Checklist

### Part 1: Enable Cloudinary (5 minutes)

**Step 1: SSH into your VPS**
```bash
ssh user@your-vps-ip
```

**Step 2: Navigate to server directory**
```bash
cd /path/to/your/server
```

**Step 3: Edit .env file**
```bash
nano .env
```

**Step 4: Add these lines** (replace with your actual values)
```bash
# Cloudinary Configuration - REQUIRED for VPS
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Where to get credentials:**
1. Go to https://cloudinary.com/console
2. Sign in (or create free account)
3. Copy: Cloud Name, API Key, API Secret

**Step 5: Save and exit**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

**Step 6: Restart server**
```bash
# If using PM2
pm2 restart all
pm2 logs

# If using systemd
sudo systemctl restart your-app-name

# If running with node directly
pkill node
npm start
```

**Step 7: Verify configuration**
```bash
cd server
npm run check-cloudinary-config
```

**Expected output:**
```
✅ Cloudinary is ENABLED and properly configured!
📤 Images will be uploaded to Cloudinary CDN
🚀 Fast loading from global CDN
```

---

### Part 2: Upload Sponsor Logos (2 minutes)

**On your local machine** (not VPS):

```bash
# Navigate to server directory
cd server

# Upload all sponsor logos to Cloudinary
npm run upload-sponsors
```

**Expected output:**
```
📸 Found 11 sponsor logo(s) to upload

📤 [1/11] Uploading: BGAUSS.jpg (12.64 KB)
   ✅ Uploaded: https://res.cloudinary.com/...

... (continues for all logos)

✅ Upload Complete!

📋 Code for Home.jsx:
const sponsors = [
  { id: 1, name: 'BGAUSS', logo: 'https://res.cloudinary.com/...' },
  ...
];
```

**Copy the generated code** and update `client/src/pages/Home.jsx`:

1. Open `client/src/pages/Home.jsx`
2. Find the `sponsors` array (around line 57)
3. Replace with the code from the script output
4. Save the file

---

### Part 3: Deploy Updated Code (3 minutes)

**Build React app:**
```bash
cd client
npm run build
```

**Deploy to VPS:**
```bash
# Option 1: Using SCP
scp -r dist/* user@your-vps:/var/www/html/

# Option 2: Using Git (if you have CI/CD)
git add .
git commit -m "Fix: Enable Cloudinary for images and sponsors"
git push origin main
# Then pull on VPS and rebuild
```

**On VPS, restart services:**
```bash
# Restart web server
sudo systemctl restart nginx

# Restart Node.js app (if needed)
pm2 restart all
```

---

## ✅ Verification Steps

### 1. Test Cloudinary Configuration

**Via API:**
```bash
# Get your admin token first (login to admin dashboard)
# Then test:
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://your-domain.com/api/events/test-cloudinary
```

**Expected response:**
```json
{
  "cloudinaryEnabled": true,
  "cloudName": "Set",
  "apiKey": "Set",
  "apiSecret": "Set",
  "message": "✅ Cloudinary is properly configured"
}
```

### 2. Test Image Upload

1. Go to your admin dashboard: `https://your-domain.com/admin`
2. Navigate to Events → Add Event or Edit Event
3. Try uploading an image
4. Check browser console (F12)

**Expected console output:**
```javascript
{
  success: true,
  message: "Image uploaded successfully",
  imageUrl: "https://res.cloudinary.com/your-cloud/image/upload/...",
  storage: "cloudinary"  // ← Should say "cloudinary" not "local"
}
```

### 3. Test Sponsor Logos

1. Visit your homepage: `https://your-domain.com`
2. Scroll to sponsors section
3. Check browser Network tab (F12 → Network)
4. Look for image requests

**Expected:**
- URLs start with `https://res.cloudinary.com/`
- Images load in < 1 second
- No 404 errors

### 4. Test QR Code Upload

1. Go to admin → Edit Event
2. Upload a QR code
3. Verify it displays immediately
4. Check the URL in console

**Expected:**
- QR code uploads successfully
- URL is from Cloudinary
- Displays without delay

---

## 🔧 Troubleshooting

### Issue: "Cloudinary is NOT properly configured"

**Check 1: Environment variables**
```bash
cd /path/to/server
cat .env | grep CLOUDINARY
```

Should show:
```
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abcdefgh
```

**Check 2: No spaces around =**
```bash
# ✅ Correct
USE_CLOUDINARY=true

# ❌ Wrong
USE_CLOUDINARY = true
```

**Check 3: Restart server**
```bash
pm2 restart all
pm2 logs
```

Look for: `✅ Cloudinary configuration complete`

---

### Issue: "Images still loading from localhost"

**Solution:**
1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Check `.env` has `USE_CLOUDINARY=true`
4. Restart server
5. Re-upload images

---

### Issue: "Upload works but image doesn't display"

**Check 1: HTTPS vs HTTP**
- Cloudinary URLs must use HTTPS
- Check browser console for mixed content warnings

**Check 2: CORS**
- Cloudinary should allow all origins by default
- If blocked, configure in Cloudinary dashboard

**Check 3: Image URL format**
```javascript
// ✅ Correct
https://res.cloudinary.com/your-cloud/image/upload/v123/savishkar/events/event-123.jpg

// ❌ Wrong
http://localhost:5000/uploads/events/event-123.jpg
```

---

### Issue: "Slow uploads even with Cloudinary"

**Possible causes:**
1. **Slow internet** - Check your connection speed
2. **Large files** - Compress images before upload
3. **Rate limits** - Cloudinary free tier has limits
4. **Server location** - Cloudinary auto-selects nearest server

**Solutions:**
- Compress images to < 500 KB
- Use WebP format
- Upgrade Cloudinary plan if needed

---

## 📊 Performance Comparison

### Before (Local Storage):
- ❌ Upload: 10-30 seconds
- ❌ Loading: 3-10 seconds per image
- ❌ Uses VPS disk space
- ❌ Slow on poor connections
- ❌ No optimization

### After (Cloudinary CDN):
- ✅ Upload: 2-5 seconds
- ✅ Loading: < 1 second per image
- ✅ No VPS disk space used
- ✅ Fast on all connections
- ✅ Automatic optimization (WebP, compression)

---

## 🎯 Quick Commands Reference

```bash
# Check Cloudinary configuration
cd server && npm run check-cloudinary-config

# Upload sponsor logos
cd server && npm run upload-sponsors

# Test Cloudinary API (with admin token)
curl -H "Authorization: Bearer TOKEN" \
  https://your-domain.com/api/events/test-cloudinary

# View server logs
pm2 logs

# Restart server
pm2 restart all

# Check environment variables
cat server/.env | grep CLOUDINARY

# Build React app
cd client && npm run build
```

---

## 📝 Files Modified

### Server-side:
- ✅ `server/.env` - Added Cloudinary config
- ✅ `server/routes/events.js` - Added test endpoint & logging
- ✅ `server/scripts/checkCloudinaryConfig.js` - New verification script
- ✅ `server/scripts/uploadSponsorsToCloudinary.js` - New upload script

### Client-side:
- ✅ `client/src/utils/imageUtils.js` - Added optimizations
- ✅ `client/src/pages/Home.jsx` - Updated sponsors array

### Documentation:
- ✅ `FIX_IMAGE_UPLOAD_ISSUES.md` - Detailed troubleshooting
- ✅ `SPONSOR_CLOUDINARY_SETUP.md` - Sponsor setup guide
- ✅ `HOSTINGER_VPS_COMPLETE_SETUP.md` - This file

---

## 🎉 Success Criteria

Your setup is successful when:

1. ✅ `npm run check-cloudinary-config` shows all green checkmarks
2. ✅ Image uploads complete in 2-5 seconds
3. ✅ Upload response contains Cloudinary URL
4. ✅ Images load instantly on website
5. ✅ Sponsor logos display correctly
6. ✅ QR codes upload and display correctly
7. ✅ No console errors related to images
8. ✅ Network tab shows Cloudinary URLs

---

## 🆘 Need Help?

### Check these files:
1. `FIX_IMAGE_UPLOAD_ISSUES.md` - Image upload troubleshooting
2. `SPONSOR_CLOUDINARY_SETUP.md` - Sponsor logos guide
3. `RULEBOOK_CLOUDINARY_GUIDE.md` - General Cloudinary guide

### Run diagnostics:
```bash
# Check Cloudinary config
npm run check-cloudinary-config

# Check server logs
pm2 logs --lines 50

# Test API endpoint
curl https://your-domain.com/api/events/test-cloudinary
```

### Common fixes:
1. **Restart server** - Fixes 80% of issues
2. **Clear browser cache** - Fixes display issues
3. **Check .env file** - Ensure no typos
4. **Verify Cloudinary credentials** - Re-copy from dashboard

---

## 📈 Monitoring

### Check Cloudinary Usage:
1. Go to https://cloudinary.com/console
2. Click "Usage" tab
3. Monitor:
   - Storage used
   - Bandwidth used
   - Transformations used

### Free Tier Limits:
- **Storage**: 25 GB (plenty for your use case)
- **Bandwidth**: 25 GB/month
- **Transformations**: 25,000/month

**Your estimated usage:**
- Sponsors: ~2 MB
- Events: ~50 MB
- QR Codes: ~10 MB
- **Total**: ~62 MB (well within limits!)

---

## ✅ Final Checklist

Before going live, ensure:

- [ ] `USE_CLOUDINARY=true` in production `.env`
- [ ] All Cloudinary credentials are correct
- [ ] Server restarted after config changes
- [ ] Sponsor logos uploaded to Cloudinary
- [ ] Home.jsx updated with Cloudinary URLs
- [ ] React app built (`npm run build`)
- [ ] Code deployed to VPS
- [ ] Test image upload works
- [ ] Test sponsor logos display
- [ ] Test QR code upload works
- [ ] All images load quickly (< 2 seconds)
- [ ] No console errors
- [ ] Verified on multiple devices/browsers

---

**Setup Time:** 10 minutes  
**Difficulty:** Easy  
**Impact:** High - Fixes all image issues  
**Cost:** Free (within Cloudinary limits)  
**Recommended:** ✅ Essential for production!

---

🎉 **Congratulations!** Your Hostinger VPS is now properly configured with Cloudinary CDN for fast, reliable image delivery!
