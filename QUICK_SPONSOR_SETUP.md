# 🚀 Quick Sponsor Setup for Hostinger VPS

## One-Time Setup (2 minutes)

### Step 1: Upload to Cloudinary
```bash
cd server
npm run upload-sponsors
```

### Step 2: Copy the Output
The script will print something like:
```javascript
const sponsors = [
  { id: 1, name: 'BGAUSS', logo: 'https://res.cloudinary.com/...' },
  { id: 2, name: 'Creative', logo: 'https://res.cloudinary.com/...' },
  // ... more sponsors
];
```

### Step 3: Update Home.jsx
1. Open `client/src/pages/Home.jsx`
2. Find the `sponsors` array (around line 57)
3. Replace it with the code from Step 2

### Step 4: Deploy
```bash
cd client
npm run build
# Deploy to your Hostinger VPS
```

---

## ✅ Done!

Your sponsors now:
- ✅ Load from Cloudinary CDN (fast!)
- ✅ Work on Hostinger VPS
- ✅ Work on any hosting platform
- ✅ Are automatically optimized
- ✅ Don't use your server storage

---

## 📝 Quick Commands

```bash
# Upload sponsors to Cloudinary
cd server && npm run upload-sponsors

# Build for production
cd client && npm run build

# Test locally
cd client && npm run dev
```

---

## 🆘 Need Help?

See detailed guide: `SPONSOR_CLOUDINARY_SETUP.md`
