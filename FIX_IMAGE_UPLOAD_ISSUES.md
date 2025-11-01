# 🔧 Fix Image Upload & Fetching Issues on Hostinger VPS

## 🐛 Issues Identified

### 1. **Images Not Uploading**
- **Cause**: `USE_CLOUDINARY` environment variable not set to `true`
- **Impact**: Server tries to use local storage instead of Cloudinary
- **On VPS**: Local storage paths don't work properly

### 2. **Images Loading Slowly/Late**
- **Cause**: Cloudinary URLs not being used; falling back to server URLs
- **Impact**: Images load from VPS instead of CDN
- **Result**: Slow loading, especially on poor connections

### 3. **Image Preview Not Showing**
- **Cause**: Mixed HTTP/HTTPS issues with Cloudinary URLs
- **Impact**: Browser blocks mixed content

---

## ✅ Solutions

### Solution 1: Enable Cloudinary in Environment Variables

**On Hostinger VPS**, add this to your `.env` file:

```bash
# Cloudinary Configuration (REQUIRED for VPS)
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**How to add on Hostinger:**

1. SSH into your VPS:
   ```bash
   ssh user@your-vps-ip
   ```

2. Navigate to your server directory:
   ```bash
   cd /path/to/your/server
   ```

3. Edit `.env` file:
   ```bash
   nano .env
   ```

4. Add the variables above

5. Save and restart your server:
   ```bash
   pm2 restart all
   # or
   systemctl restart your-app-service
   ```

---

### Solution 2: Update Image Upload Route (Already Fixed)

The upload route in `server/routes/events.js` is already configured correctly:

```javascript
router.post('/upload-image', protect, authorize('admin'), uploadEventImage.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    // Cloudinary returns full URL in req.file.path
    const imageUrl = req.file.path || `${process.env.SERVER_URL}/uploads/events/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

---

### Solution 3: Optimize Image Loading (Add Lazy Loading)

Update the admin components to show better loading states and use optimized Cloudinary URLs.

---

## 🚀 Step-by-Step Fix for Hostinger VPS

### Step 1: Check Current Configuration

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Check if Cloudinary is configured
cd /path/to/server
cat .env | grep CLOUDINARY
```

### Step 2: Add Missing Environment Variables

```bash
# Edit .env file
nano .env

# Add these lines (replace with your actual values):
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Where to get Cloudinary credentials:**
1. Go to https://cloudinary.com/console
2. Copy your Cloud Name, API Key, and API Secret
3. Paste them in the `.env` file

### Step 3: Restart Your Server

```bash
# If using PM2
pm2 restart all
pm2 logs

# If using systemd
sudo systemctl restart your-app-name
sudo systemctl status your-app-name

# If running directly with node
# Kill the process and restart
pkill node
npm start
```

### Step 4: Test Image Upload

1. Go to your admin dashboard
2. Try to add/edit an event
3. Upload an image
4. Check the console logs

**Expected behavior:**
- Upload should complete in 2-5 seconds
- You should see a Cloudinary URL like: `https://res.cloudinary.com/your-cloud/image/upload/...`
- Image should display immediately

---

## 🔍 Debugging

### Check if Cloudinary is Active

Add this test endpoint to `server/routes/events.js`:

```javascript
// Test endpoint - remove after debugging
router.get('/test-cloudinary', protect, authorize('admin'), (req, res) => {
  const useCloudStorage = process.env.USE_CLOUDINARY === 'true' && 
                          process.env.CLOUDINARY_CLOUD_NAME && 
                          process.env.CLOUDINARY_API_KEY && 
                          process.env.CLOUDINARY_API_SECRET;
  
  res.json({
    cloudinaryEnabled: useCloudStorage,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
    apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
    apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing',
    useCloudinaryFlag: process.env.USE_CLOUDINARY
  });
});
```

**Test it:**
```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://your-vps-domain.com/api/events/test-cloudinary
```

**Expected response:**
```json
{
  "cloudinaryEnabled": true,
  "cloudName": "Set",
  "apiKey": "Set",
  "apiSecret": "Set",
  "useCloudinaryFlag": "true"
}
```

### Check Server Logs

```bash
# If using PM2
pm2 logs --lines 100

# If using systemd
sudo journalctl -u your-app-name -n 100 -f

# Check for these messages:
# ✅ "Cloudinary configuration complete"
# ❌ "Cloudinary configuration incomplete"
```

### Check Upload Response

In the browser console when uploading:
```javascript
// You should see:
{
  success: true,
  message: "Image uploaded successfully",
  imageUrl: "https://res.cloudinary.com/your-cloud/image/upload/v123456/savishkar/events/event-123.jpg"
}

// NOT:
{
  imageUrl: "http://localhost:5000/uploads/events/event-123.jpg"
}
```

---

## 🎯 Performance Optimizations

### 1. Use Cloudinary Transformations

Update `imageUtils.js` to add automatic optimizations:

```javascript
export const getImageUrl = (imageUrl, options = {}) => {
  if (!imageUrl) return null;
  
  // If it's a Cloudinary URL, add optimizations
  if (imageUrl.includes('cloudinary.com')) {
    // Ensure HTTPS
    let url = imageUrl.replace('http://', 'https://');
    
    // Add transformations for better performance
    if (options.optimize !== false) {
      // Insert transformations before /upload/
      url = url.replace('/upload/', '/upload/f_auto,q_auto,w_800,c_limit/');
    }
    
    return url;
  }
  
  // For local storage paths
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverUrl = apiUrl.replace(/\/api$/, '');
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${serverUrl}${path}`;
};
```

### 2. Add Loading Skeleton

In `EditEvent.jsx` and `AddEvent.jsx`, add better loading states:

```javascript
{uploading ? (
  <div className="w-full h-48 flex flex-col items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 mb-3" 
         style={{ borderColor: '#FA812F' }}></div>
    <p style={{ color: '#5C4033' }}>Uploading to Cloudinary...</p>
    <p className="text-xs mt-2" style={{ color: 'rgba(92, 64, 51, 0.7)' }}>
      This may take a few seconds
    </p>
  </div>
) : (
  // Upload button
)}
```

### 3. Add Retry Logic

Add retry logic for failed uploads:

```javascript
const handleImageUpload = async (e, retryCount = 0) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validation...

  setUploading(true);
  const formDataUpload = new FormData();
  formDataUpload.append('image', file);

  try {
    const { data } = await API.post('/events/upload-image', formDataUpload, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000 // 30 second timeout
    });
    setFormData(prev => ({ ...prev, image: data.imageUrl }));
    toast.success('Image uploaded successfully!');
  } catch (error) {
    // Retry up to 2 times
    if (retryCount < 2) {
      toast.error(`Upload failed, retrying... (${retryCount + 1}/2)`);
      setTimeout(() => handleImageUpload(e, retryCount + 1), 2000);
    } else {
      toast.error(error.response?.data?.message || 'Failed to upload image');
      setImagePreview(null);
    }
  } finally {
    if (retryCount === 0 || retryCount >= 2) {
      setUploading(false);
    }
  }
};
```

---

## 📊 Verification Checklist

After applying fixes, verify:

- [ ] `USE_CLOUDINARY=true` is set in `.env`
- [ ] All Cloudinary credentials are correct
- [ ] Server has been restarted
- [ ] Test endpoint shows `cloudinaryEnabled: true`
- [ ] Image upload returns Cloudinary URL (starts with `https://res.cloudinary.com/`)
- [ ] Images load quickly (< 2 seconds)
- [ ] Images display correctly in admin dashboard
- [ ] Images display correctly on public event pages
- [ ] QR codes upload and display correctly

---

## 🆘 Common Issues & Solutions

### Issue: "USE_CLOUDINARY is not set"

**Solution:**
```bash
# Make sure there's no space around the =
USE_CLOUDINARY=true  # ✅ Correct
USE_CLOUDINARY = true  # ❌ Wrong
```

### Issue: "Invalid cloud_name"

**Solution:**
- Check your Cloud Name in Cloudinary dashboard
- It should be lowercase, no spaces
- Example: `mycloud123` not `My Cloud 123`

### Issue: "Images still loading from localhost"

**Solution:**
1. Clear browser cache
2. Check `.env` file has `USE_CLOUDINARY=true`
3. Restart server
4. Check server logs for Cloudinary initialization

### Issue: "Upload works but image doesn't display"

**Solution:**
- Check browser console for CORS errors
- Ensure Cloudinary URLs use HTTPS
- Check `imageUtils.js` is handling URLs correctly

### Issue: "Slow uploads even with Cloudinary"

**Solution:**
- Check your internet connection
- Cloudinary free tier has rate limits
- Consider upgrading Cloudinary plan
- Add upload progress indicator

---

## 🎉 Expected Results After Fix

### Before Fix:
- ❌ Images don't upload or fail silently
- ❌ Images load slowly (5-10 seconds)
- ❌ Images sometimes don't display
- ❌ Local storage paths on VPS

### After Fix:
- ✅ Images upload successfully (2-5 seconds)
- ✅ Images load instantly from CDN
- ✅ Images display correctly everywhere
- ✅ Cloudinary URLs used everywhere
- ✅ Automatic image optimization
- ✅ Works on any hosting (Hostinger, Render, etc.)

---

## 📝 Quick Fix Summary

```bash
# 1. SSH into VPS
ssh user@your-vps

# 2. Edit .env
cd /path/to/server
nano .env

# 3. Add these lines:
USE_CLOUDINARY=true
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# 4. Restart server
pm2 restart all

# 5. Test upload in admin dashboard
# Should see Cloudinary URL in response
```

---

**Time to Fix:** 5 minutes  
**Difficulty:** Easy  
**Impact:** High - Fixes all image upload/loading issues
