const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const videosPath = path.join(__dirname, '../data/videos.json');
const loadVideos = () => {
  const data = fs.readFileSync(videosPath, 'utf8');
  return JSON.parse(data);
};

/**
 * GET /api/user/history
 * Get user watch history from backend (can be extended to database)
 */
router.get('/history', (req, res) => {
  try {
    // This would typically come from a database
    // For now, return empty array - frontend stores in localStorage
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/user/history
 * Add video to watch history
 */
router.post('/history', (req, res) => {
  try {
    const { videoId } = req.body;
    // Backend processing (would save to database)
    res.json({
      success: true,
      message: 'Video added to history'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/user/watch-later
 * Get watch later list
 */
router.get('/watch-later', (req, res) => {
  try {
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/user/watch-later
 * Add video to watch later
 */
router.post('/watch-later', (req, res) => {
  try {
    const { videoId } = req.body;
    res.json({
      success: true,
      message: 'Video added to watch later'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/user/subscriptions
 * Get user subscriptions list
 */
router.get('/subscriptions', (req, res) => {
  try {
    const subscriptions = [
      { id: 1, name: 'Traversy Media', icon: 'https://i.ytimg.com/vi/W6NZfCO5tVw/maxresdefault.jpg' },
      { id: 2, name: 'Programming with Mosh', icon: 'https://i.ytimg.com/vi/SqcY0GlETPk/maxresdefault.jpg' },
      { id: 3, name: 'Tech With Tim', icon: 'https://i.ytimg.com/vi/9OeZapQwpIY/maxresdefault.jpg' },
      { id: 4, name: 'Web Dev Simplified', icon: 'https://i.ytimg.com/vi/98BzS5Oz5E4/maxresdefault.jpg' }
    ];
    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/user/playlists
 * Get user playlists
 */
router.get('/playlists', (req, res) => {
  try {
    const playlists = [
      { id: 1, name: 'Favorites', videoCount: 24 },
      { id: 2, name: 'Learn JavaScript', videoCount: 15 },
      { id: 3, name: 'Gaming Highlights', videoCount: 42 }
    ];
    res.json({
      success: true,
      data: playlists
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
