# Manual Event Poster Linking Guide

## Issue
The automated scripts are having trouble running, likely due to MongoDB connection or environment configuration issues.

## Available Posters
Based on the folder `D:\code3\Event Posters webp`, you have 36 poster files:

1. 3d modeling.webp
2. BPL.webp
3. Bigg Boss.webp
4. Boardroom battles.webp
5. Checkmate.webp
6. Code Break.webp
7. Corporate Carnivals.webp
8. Design Dynamics.webp
9. Dhwani.webp
10. Electo Quest.webp
11. Gaana Groove.webp
12. Hack Sphere.webp
13. Impersona.webp
14. Modulux.webp
15. NrityaNova.webp
16. Paper presentation CSE.webp
17. Paper presentation ECE.webp
18. Poster Presentation.webp
19. Seconds ka Tashan.webp
20. Spin to Win.webp
21. Taal Rhythm.webp
22. Tressure Hunt.webp
23. Virtual Gaming.webp
24. mock CID.webp
25. photography.webp
26. rapid rush.webp
27. repuation radar.webp
28. robo race.webp
29. robo soccer.webp
30. robo sumo war.webp
31. squid games.webp
32. tandav-troupe.webp
33. tech tussle.webp
34. technical paper mech.webp
35. videography.webp
36. zenith.webp

## Manual Approach Options

### Option 1: Use Admin Dashboard (Recommended)
1. Start your server: `cd server && npm run dev`
2. Login to admin dashboard at `http://localhost:5000/admin`
3. Go to Events section
4. For each event, click Edit and upload the corresponding poster image
5. The admin dashboard has image upload functionality built-in

### Option 2: Copy Files Manually
1. Copy all poster files to: `d:\code3\server\uploads\events\`
2. Rename them to match a pattern like: `event-[eventname].webp`
3. Update the database manually or via a script

### Option 3: Fix Environment and Re-run Script
1. Ensure `server/.env` has `MONGODB_URI` set correctly
2. Test connection: `cd server && node scripts/checkEvents.js`
3. Once connection works, run: `node link-event-posters-final.js` from root

### Option 4: Direct Database Update Script
I can create a script that:
1. Reads all event names from your database
2. Creates a mapping file
3. You review the mapping
4. Script applies the changes

## Next Steps
Please let me know:
1. Can you access the admin dashboard?
2. Is your MongoDB connection working? (Try: `cd server && npm run dev`)
3. Would you prefer to manually upload via admin dashboard or fix the automated script?

## Script Location
The automated script is ready at: `d:\code3\link-event-posters-final.js`

It will:
- Copy posters from `D:\code3\Event Posters webp` to `server/uploads/events/`
- Match poster filenames to event names
- Update the database with image URLs
- Create a detailed log file

Once your MongoDB connection is working, simply run:
```bash
node link-event-posters-final.js
```
