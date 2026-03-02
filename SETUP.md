# YouTube Clone — Full Stack Setup Guide

Complete instructions for running both frontend and backend of the YouTube Clone application.

## 📁 Project Structure

```
Full Stack Project/
├── index.html                 # Frontend (main page)
├── style.css                  # Frontend styles
├── script.js                  # Frontend logic (calls backend API)
├── SETUP.md                   # This file
│
└── backend/                   # Node.js Express Backend
    ├── server.js              # Express server entry point
    ├── package.json           # Dependencies
    ├── .env.example           # Environment template
    ├── .gitignore             # Git ignore rules
    ├── routes/
    │   └── videos.js          # Video API endpoints
    ├── data/
    │   └── videos.json        # Sample video data
    └── README.md              # Backend documentation
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start backend server
npm start
```

Expected output:
```
╔════════════════════════════════════════╗
║   YouTube Clone Backend Server         ║
║   Running on http://localhost:5000     ║
╚════════════════════════════════════════╝
```

### Step 2: Start Frontend (Keep backend running)

Open new terminal/command prompt:

```bash
# Navigate to project root (Full Stack Project folder)
cd "Full Stack Project"

# Start frontend server
python -m http.server 8000
```

Or if using PowerShell on Windows:
```powershell
python -m http.server 8000
```

### Step 3: Open in Browser

Go to: **http://localhost:8000**

---

## 🔌 How Frontend & Backend Connect

### Data Flow Diagram

```
┌─────────────────────┐
│   Frontend (Port 8000)
│  index.html, CSS, JS
└──────────┬──────────┘
           │
       HTTP GET
       API Calls
    (CORS enabled)
           │
           ▼
┌─────────────────────┐
│  Backend (Port 5000)
│  Express.js Server
│  - Load videos.json
│  - Apply filters
│  - Return JSON
└─────────────────────┘
```

### API Endpoints Used by Frontend

| Endpoint | Purpose | When Called |
|----------|---------|------------|
| `GET /api/videos` | Fetch paginated videos | Page load, infinite scroll |
| `GET /api/videos?search=...` | Search videos | Search input submitted |
| `GET /api/videos?category=...` | Filter by category | Category clicked |
| `GET /api/videos/:id` | Get single video | (Future) View details |

### Example Request in Frontend (script.js)

```javascript
// This runs when page loads
async function fetchVideosFromAPI(){
  const params = new URLSearchParams({
    limit: 8,
    offset: 0,
    category: 'Music'  // if category selected
  });

  const response = await fetch(`http://localhost:5000/api/videos?${params}`);
  const { data, pagination } = await response.json();
  
  // Render videos to page
  data.forEach(video => renderCard(video));
}
```

---

## 📡 Backend API Reference

### Base URL: `http://localhost:5000`

### GET /api/videos

Fetch videos with filtering and pagination.

**Query Parameters:**
```
limit=8          # Videos per page (default: 12)
offset=0         # Start position (default: 0)
category=Music   # Filter by category
search=javascript # Search query
```

**Example:**
```bash
curl "http://localhost:5000/api/videos?category=Music&limit=8"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "title": "Top Hits 2026 — Mega Mix",
      "channel": "Music Beats",
      "views": "3.4M views",
      "duration": "1:20:10",
      "thumbnail": "https://...",
      "youtubeId": "3JZ_D3ELwOQ",
      "verified": false,
      "live": false,
      "category": "Music",
      "progress": 0.88
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 8,
    "offset": 0,
    "hasMore": false
  }
}
```

See [backend/README.md](backend/README.md) for complete API documentation.

---

## 🐛 Troubleshooting

### Backend won't start

**Error:** `Port 5000 already in use`

**Solution:**
```bash
# Change port in .env
nano .env
# Change: PORT=3001

# Or kill process using port 5000
# Windows: netstat -ano | findstr :5000
# Mac/Linux: lsof -i :5000
```

**Error:** `Cannot find module 'express'`

**Solution:**
```bash
cd backend
npm install
```

### Frontend shows "Failed to load videos"

**Error:** `Failed to load videos. Make sure backend is running on http://localhost:5000`

**Solution:**
1. Check backend terminal — should show "Running on http://localhost:5000"
2. Verify `http://localhost:5000/health` returns status in browser
3. Make sure CORS is enabled in `server.js` ✓ (already configured)

### CORS Error in Browser Console

**Error:** `Access to XMLHttpRequest... blocked by CORS policy`

**Solution:**
The backend has CORS enabled for localhost. This error shouldn't occur. If it does:
1. Verify backend is running
2. Check that frontend origin (localhost:8000) is in CORS whitelist in `server.js`

---

## 📝 How the Code Execution Works

### On Page Load

1. **Browser** opens `http://localhost:8000/index.html`
2. **HTML** loads with navbar, sidebar, category buttons, empty grid
3. **CSS** applies dark theme styles
4. **JavaScript** runs `DOMContentLoaded` event:
   ```javascript
   initialLoad() 
   → Shows skeleton loaders (gray placeholders)
   → After 700ms, calls fetchVideosFromAPI()
   ```
5. **Frontend** sends GET request to `http://localhost:5000/api/videos?limit=8&offset=0`
6. **Backend** receives request:
   - Reads `data/videos.json`
   - Returns first 8 videos as JSON
7. **Frontend** receives JSON and renders video cards
8. **User** sees 12 video thumbnails with titles, channels, views

### When User Searches

1. User types "javascript" in search box
2. User clicks search button or presses Enter
3. `doSearch()` called in JavaScript:
   ```javascript
   renderedCount = 0;  // Reset pagination
   videoGrid.innerHTML = '';  // Clear videos
   renderNext();  // Fetch new videos
   ```
4. Frontend sends: `GET /api/videos?search=javascript`
5. Backend filters videos by search query
6. Results displayed

### When User Clicks Category

1. User clicks "Music" button
2. `categoryBar.click` event fired:
   ```javascript
   activeCategory = 'Music';
   rerenderAll();  // Reset and fetch
   ```
3. Frontend sends: `GET /api/videos?category=Music&limit=8`
4. Backend filters by category
5. Only music videos shown

### When User Scrolls Down

1. User scrolls to bottom (800px from bottom)
2. `window.scroll` event fires
3. `fetchVideosFromAPI()` called with `offset=8`
4. Frontend sends: `GET /api/videos?limit=8&offset=8`
5. Backend returns next 8 videos
6. New videos appended to page (infinite scroll)

### When User Clicks Video Thumbnail

1. User clicks thumbnail image
2. `openModal(video)` called
3. Modal displays with YouTube iframe:
   ```javascript
   playerFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`
   ```
4. YouTube video starts playing
5. User closes modal
6. `playerFrame.src = ''` stops video

---

## ⚙️ Configuration

### Backend Configuration (.env)

```env
PORT=5000                 # Server port
NODE_ENV=development      # Environment mode
```

### Frontend Configuration (script.js)

```javascript
const API_BASE = 'http://localhost:5000/api';  # Backend URL
const PAGE_SIZE = 8;                           # Videos per page
```

To change frontend port:
```bash
# Instead of 8000, use 3000
python -m http.server 3000
```

---

## 🔄 Updated Frontend (script.js)

The `script.js` has been updated to:

✅ Remove hardcoded video data
✅ Fetch from backend API
✅ Use async/await for API calls
✅ Handle errors gracefully
✅ Support search and category filtering
✅ Implement infinite scroll
✅ Maintain skeleton loading UI

**Key changes:**
- Removed `VIDEOS_SEED` array (now fetched from backend)
- New `fetchVideosFromAPI()` function
- `renderNext()` now calls API instead of local array
- Search and categories dynamically filter via API
- Error handling shows message if backend is down

---

## 🚀 Deploying to Production

When ready to deploy:

### Backend Deployment (Example: Heroku)

```bash
cd backend
# Create Procfile
echo "web: node server.js" > Procfile

# Deploy
git push heroku main
```

Update frontend API URL:
```javascript
const API_BASE = 'https://your-heroku-app.herokuapp.com/api';
```

### Frontend Deployment (Example: GitHub Pages, Netlify)

```bash
# Build/upload index.html, style.css, script.js
# Update API_BASE to production backend URL
```

---

## 📚 Next Steps

1. ✅ Backend created with Express.js
2. ✅ Frontend updated to use API
3. 🔜 Add database (MongoDB) instead of JSON
4. 🔜 Add user authentication (JWT)
5. 🔜 Add comments/likes system
6. 🔜 Deploy to production

---

## 🎯 Summary

| Component | Location | Port | Purpose |
|-----------|----------|------|---------|
| **Frontend** | `http://localhost:8000` | 8000 | HTML, CSS, UI |
| **Backend API** | `http://localhost:5000/api` | 5000 | Data, videos |
| **Video Data** | `backend/data/videos.json` | - | JSON storage |

**Run both servers simultaneously** in separate terminals/CMD windows.

---

**Happy coding!** 🚀

For more details, see:
- [backend/README.md](backend/README.md) — Backend API details
- [script.js](script.js) — Frontend implementation
- [server.js](backend/server.js) — Backend code
