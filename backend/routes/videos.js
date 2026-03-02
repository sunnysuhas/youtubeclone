const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Load videos from JSON file
const videosPath = path.join(__dirname, '../data/videos.json');
const loadVideos = () => {
  const data = fs.readFileSync(videosPath, 'utf8');
  return JSON.parse(data);
};

/**
 * GET /api/videos
 * Fetch all videos with optional filtering
 * Query params:
 *   - category: filter by category name
 *   - search: search by title or channel name
 *   - limit: number of videos to return (default: 12)
 *   - offset: pagination offset (default: 0)
 */
router.get('/', (req, res) => {
  try {
    let videos = loadVideos();
    const { category, search, limit = 12, offset = 0 } = req.query;

    // Filter by category if provided
    if (category && category !== 'All') {
      if (category === 'Live') {
        videos = videos.filter(v => v.live);
      } else {
        videos = videos.filter(v => v.category === category);
      }
    }

    // Filter by search query if provided
    if (search) {
      const q = search.toLowerCase();
      videos = videos.filter(v =>
        v.title.toLowerCase().includes(q) ||
        v.channel.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
      );
    }

    // Get total count before pagination
    const total = videos.length;

    // Apply pagination
    const paginatedVideos = videos.slice(
      parseInt(offset) || 0,
      parseInt(offset) + parseInt(limit) || 12
    );

    res.json({
      success: true,
      data: paginatedVideos,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching videos',
      error: error.message
    });
  }
});

/**
 * GET /api/videos/:id
 * Fetch a single video by ID
 */
router.get('/:id', (req, res) => {
  try {
    const videos = loadVideos();
    const video = videos.find(v => v.id === parseInt(req.params.id));

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching video',
      error: error.message
    });
  }
});

/**
 * GET /api/videos/category/list
 * Get list of all unique categories
 */
router.get('/category/list', (req, res) => {
  try {
    const videos = loadVideos();
    const categories = ['All', ...new Set(videos.map(v => v.category))];
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

/**
 * GET /api/search
 * Search videos with advanced filters
 */
router.get('/search/query', (req, res) => {
  try {
    const { q, category, sort } = req.query;
    let videos = loadVideos();

    // Filter by search query
    if (q) {
      const query = q.toLowerCase();
      videos = videos.filter(v =>
        v.title.toLowerCase().includes(query) ||
        v.channel.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (category && category !== 'All') {
      videos = videos.filter(v => v.category === category);
    }

    // Sort options
    if (sort === 'views') {
      videos.sort((a, b) => {
        const aViews = parseInt(a.views) || 0;
        const bViews = parseInt(b.views) || 0;
        return bViews - aViews;
      });
    } else if (sort === 'recent') {
      // Reverse to get recent first (simplified)
      videos.reverse();
    }

    res.json({
      success: true,
      data: videos,
      count: videos.length
    });
  } catch (error) {
    console.error('Error searching videos:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching videos',
      error: error.message
    });
  }
});

module.exports = router;
