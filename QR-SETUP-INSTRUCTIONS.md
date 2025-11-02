# QR Code Setup Instructions

## Problem
QR codes are not loading for some events, showing 404 errors in the payment page.

## Solution Steps

### Step 1: Check Which Events Are Missing QR Codes

```bash
cd d:\code3\server
npm run check-qr
```

This will show you:
- ✅ Events with QR codes
- ❌ Events without QR codes
- 🔄 Events with multiple QR codes

### Step 2: Run the Complete QR Setup Script

```bash
cd d:\code3\server
npm run link-qr-complete
```

This script will:
1. Copy all QR codes from `D:\code3\All QR` to `server/uploads/qrcodes/`
2. Upload them to Cloudinary (if enabled)
3. Link them to the appropriate events in the database
4. Handle both event-specific and department-wide QR codes

### Step 3: Restart Your Server

After running the script, restart your server to ensure the new `uploads/qrcodes` directory is recognized:

```bash
cd d:\code3\server
npm run dev
```

## What Was Fixed

### 1. Server Configuration
- ✅ Added `uploads/qrcodes` directory to the server's upload directories list
- ✅ Server now automatically creates this directory on startup

### 2. QR Code Files
- ✅ All QR codes converted to WebP format
- ✅ Filenames cleaned (hash suffixes removed)
- ✅ Account names extracted from filenames

### 3. Database Updates
- ✅ QR codes added to `event.qrCodes[]` array
- ✅ Legacy `event.paymentQRCode` field also populated
- ✅ Account holder names stored with each QR code

## QR Code Matching Logic

The script matches QR codes to events using:

1. **Exact event name match** (case-insensitive)
   - `3d-modeling.webp` → "3D Modeling" event

2. **Partial event name match**
   - `hacksphere.webp` → "Hacksphere" event

3. **Department match** (applies to all events in that department)
   - `mba.webp` → All MBA department events

4. **No-space matching**
   - Handles variations in spacing

## QR Code Files in Your Folder

```
D:\code3\All QR\
├── 3d-modeling-*.webp
├── bid-premier-league-*.webp
├── bigg-boss-*.webp
├── checkmate-*.webp
├── codebreak-*.webp
├── corporate-carnival-*.webp
├── dhwani-*.webp
├── electro-quest-*.webp
├── fun-quest-*.webp
├── gaana-groove-*.webp
├── hacksphere-*.webp
├── impersona-*.webp
├── mba-*.webp (department-wide)
├── minute-to-win-it-*.webp
├── nrityanova-*.webp
├── paper-presentation-cse-*.webp
├── paper-presentation-ece-*.webp
├── photography-mallikarjun-*.webp
├── robo-soccer-praveen-patil-*.webp
├── robo-sumo-war-karthik-ramdurg-*.webp
├── roborace-*.webp (2 QR codes)
├── seconds-ka-tashan-*.webp
├── squid-game-ganesh-chitnis-*.webp
├── taal-rhythm-*.webp
├── tandav-troupe-*.webp
├── tech-tussle-*.webp
├── treasure-hunt-*.webp
├── virtual-gaming-*.webp
└── zenith-*.webp
```

## Verification

After running the scripts:

1. **Check the database:**
   ```bash
   npm run check-qr
   ```

2. **Check local files:**
   - Navigate to `d:\code3\server\uploads\qrcodes\`
   - Verify all QR codes are copied there

3. **Test in browser:**
   - Go to any event registration page
   - Proceed to payment
   - QR code should now load correctly

4. **Check Cloudinary (if enabled):**
   - Log in to your Cloudinary dashboard
   - Navigate to `savishkar/qrcodes/` folder
   - Verify all QR codes are uploaded

## Troubleshooting

### QR Code Still Not Loading

1. **Check the URL in browser DevTools:**
   - Look at the Network tab
   - Find the failed QR code request
   - Check if it's trying to load from `/uploads/qrcodes/` or Cloudinary

2. **Verify file exists:**
   ```bash
   # Check local file
   dir d:\code3\server\uploads\qrcodes\
   ```

3. **Check event in database:**
   ```bash
   npm run check-qr
   ```

4. **Re-run the setup script:**
   ```bash
   npm run link-qr-complete
   ```

### Cloudinary Upload Failed

If Cloudinary upload fails, the script automatically falls back to local storage:
- QR codes will be served from `/uploads/qrcodes/`
- Still works, but without CDN benefits

To fix Cloudinary issues:
1. Check `.env` file has correct credentials
2. Verify `USE_CLOUDINARY=true`
3. Test Cloudinary connection:
   ```bash
   npm run verify-cloudinary
   ```

## Available Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Check QR codes | `npm run check-qr` | See which events have/don't have QR codes |
| Link QR codes | `npm run link-qr-complete` | Complete setup (local + Cloudinary) |
| Link single QR | `npm run link-3d-qr` | Example: Link 3D Modeling QR only |
| Check Cloudinary | `npm run check-cloudinary` | Verify Cloudinary configuration |

## Summary

✅ **Server updated** to serve QR codes from `/uploads/qrcodes/`
✅ **Script created** to copy and upload all QR codes
✅ **Database updated** with QR code URLs
✅ **Account names** extracted and stored
✅ **Multiple QR codes** supported per event

**Next Step:** Run `npm run link-qr-complete` to set up all QR codes!
