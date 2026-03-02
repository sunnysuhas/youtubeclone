# YouTube Clone Backend API

A RESTful API built with Node.js and Express for the YouTube Clone project. This backend serves video data, categories, search functionality, and handles pagination.

## 📁 Project Structure

```
backend/
├── server.js              # Main Express server setup
├── package.json           # Dependencies and scripts
├── .env.example           # Environment variables template
├── .gitignore             # Git ignore rules
├── routes/
│   └── videos.js          # Video API endpoints
└── data/
    └── videos.json        # Sample video data
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Navigate to backend folder
cd backend

# Install npm packages
npm install
```

This installs:
- `express` - Web framework
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variables

### 2. Setup Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env if needed (default: PORT=5000)
```

The `.env` file contains:
```env
PORT=5000
NODE_ENV=development
```

### 3. Start the Backend Server

```bash
npm start
```

You'll see:
```
╔════════════════════════════════════════╗
║   YouTube Clone Backend Server         ║
║   Running on http://localhost:5000     ║
║   Environment: development             ║
║   Press CTRL+C to stop                 ║
╚════════════════════════════════════════╝
API endpoints available at http://localhost:5000/api/videos
```

## 📡 API Endpoints

### Base URL: `http://localhost:5000`

### 1. **GET /api/videos** — Get All Videos

Fetch all videos with optional filtering and pagination.

**Query Parameters:**
- `category` (optional) - Filter by category (e.g., "Music", "Data Structures")
- `search` (optional) - Search by title or channel name
- `limit` (optional) - Videos per page (default: 12)
- `offset` (optional) - Pagination offset (default: 0)

**Example Requests:**

```bash
# Get all videos
curl http://localhost:5000/api/videos

# Filter by category
curl http://localhost:5000/api/videos?category=Music

# Search videos
curl http://localhost:5000/api/videos?search=javascript

# Get Live videos
curl http://localhost:5000/api/videos?category=Live

# Pagination (get 5 videos starting at offset 10)
curl http://localhost:5000/api/videos?limit=5&offset=10

# Combined filters
curl http://localhost:5000/api/videos?category=Data%20Structures&limit=8
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "title": "JavaScript Data Structures: Stacks & Queues",
      "channel": "Code Academy",
      "views": "230K views",
      "time": "1 week ago",
      "duration": "18:22",
      "thumbnail": "https://...",
      "category": "Data Structures",
      "progress": 0.2,
      "verified": true,
      "live": false,
      "youtubeId": "sBws8MSXN7A",
      "description": "Learn how to implement and use stacks and queues in JavaScript"
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 12,
    "offset": 0,
    "hasMore": false
  }
}
```

### 2. **GET /api/videos/:id** — Get Single Video

Fetch a specific video by its ID.

**Example:**
```bash
curl http://localhost:5000/api/videos/5
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "title": "Live Stream — Gaming Arena",
    "channel": "Pro Gamer",
    "views": "5.6K watching",
    "duration": "LIVE",
    "youtubeId": "5qap5aO4i9A",
    "live": true,
    ...
  }
}
```

### 3. **GET /api/videos/category/list** — Get All Categories

Get a list of all available categories.

**Example:**
```bash
curl http://localhost:5000/api/videos/category/list
```

**Response:**
```json
{
  "success": true,
  "data": [
    "All",
    "Telugu cinema",
    "Data Structures",
    "Music",
    "Computer programming",
    "Gaming",
    "Tamil Cinema",
    "Free Fire MAX",
    "Web series",
    "Mixes",
    "Asian movies"
  ]
}
```

### 4. **GET /api/search/query** — Advanced Search

Search videos with filters and sorting.

**Query Parameters:**
- `q` (optional) - Search query
- `category` (optional) - Filter by category
- `sort` (optional) - Sort by "views" or "recent"

**Example:**
```bash
# Search with category filter
curl "http://localhost:5000/api/search/query?q=javascript&category=Computer%20programming"

# Sort by views
curl "http://localhost:5000/api/search/query?q=music&sort=views"
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 3
}
```

### 5. **GET /health** — Health Check

Check if server is running.

**Example:**
```bash
curl http://localhost:5000/health
```

**Response:**
```json
{
  "status": "Backend is running!",
  "timestamp": "2026-02-12T10:30:45.123Z"
}
```

## 🔧 How the Backend Works

### 1. **Server Initialization**
   - Express app created with middleware (CORS, JSON parser)
   - CORS enabled for multiple origins (localhost:3000, localhost:8000, etc.)
   - Environment variables loaded from `.env`

### 2. **Data Storage**
   - Videos stored in JSON file `data/videos.json`
   - No database (can be upgraded to MongoDB/PostgreSQL later)
   - Each video has ID, title, channel, category, YouTube ID, etc.

### 3. **Request Flow**
   ```
   Client Request
        ↓
   Express Router
        ↓
   Route Handler (GET /api/videos)
        ↓
   Load Data from videos.json
        ↓
   Apply Filters (category, search)
        ↓
   Apply Pagination
        ↓
   JSON Response
   ```

### 4. **Error Handling**
   - 404 errors for invalid routes
   - 500 errors for server issues
   - Graceful error messages in JSON format

## 📝 Example JavaScript Usage

Connect your frontend to the API:

```javascript
// Fetch videos from backend
async function getVideos() {
  try {
    const response = await fetch('http://localhost:5000/api/videos?category=Music');
    const { data, pagination } = await response.json();
    console.log('Videos:', data);
    console.log('Has more:', pagination.hasMore);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Fetch single video
async function getVideo(id) {
  const response = await fetch(`http://localhost:5000/api/videos/${id}`);
  const { data } = await response.json();
  return data;
}

// Search with filters
async function searchVideos(query, category) {
  const params = new URLSearchParams({ q: query, category });
  const response = await fetch(`http://localhost:5000/api/search/query?${params}`);
  const result = await response.json();
  return result.data;
}
```

## 🔄 Running Frontend & Backend Together

### Terminal 1: Start Backend
```bash
cd backend
npm start
```

### Terminal 2: Start Frontend
```bash
# From the project root (Full Stack Project folder)
python -m http.server 8000
```

Then open `http://localhost:8000` in your browser. The frontend will fetch videos from `http://localhost:5000/api/videos`.

## 📦 Upgrading the Backend

### Add a Database (MongoDB)

1. Install MongoDB driver:
```bash
npm install mongodb
```

2. Connect in `server.js`:
```javascript
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://localhost:27017');
```

### Add Authentication (JWT)

1. Install JWT package:
```bash
npm install jsonwebtoken
```

2. Create auth routes for login/signup.

### Add More Features

- User accounts & subscriptions
- Comments and likes
- Playlists
- Recommendations
- Analytics

## 🛑 Troubleshooting

| Issue | Solution |
|-------|----------|
| `Port 5000 already in use` | Change `PORT=3001` in `.env` or kill the process using 5000 |
| CORS errors | Make sure backend is running and frontend origin is in CORS whitelist |
| `Cannot find module 'express'` | Run `npm install` in backend folder |
| Blank API response | Check `data/videos.json` exists and is valid JSON |

## 📄 License

MIT

---

**Backend created for YouTube Clone project** — Happy coding! 🚀
