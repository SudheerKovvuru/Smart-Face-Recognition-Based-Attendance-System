const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI,)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Path to your videos folder
const VIDEOS_PATH = 'D:\\Downloads';

// Import routes
const authRoutes = require('./routes/auth');
const { auth, isAdminOrFaculty } = require('./middleware/auth');

// Routes
app.use('/api/auth', authRoutes);

// Video streaming endpoint (protected - only admin and faculty)
app.get('/api/video/:filename', auth, isAdminOrFaculty, (req, res) => {
  const filename = req.params.filename;
  const videoPath = path.join(VIDEOS_PATH, filename);

  // Check if file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Parse range header
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // No range header - send entire file
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    videosPath: VIDEOS_PATH,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// List available videos (protected)
app.get('/api/videos', auth, isAdminOrFaculty, (req, res) => {
  const videos = ['cam1_trim.mp4', 'cam2.mp4', 'cam3.mp4', 'cam4.mp4'];
  const availableVideos = videos.filter(video => 
    fs.existsSync(path.join(VIDEOS_PATH, video))
  );
  res.json({ videos: availableVideos });
});

app.listen(PORT, () => {
  console.log(`✅ Video & Auth server running on http://localhost:${PORT}`);
  console.log(`📁 Serving videos from: ${VIDEOS_PATH}`);
  console.log(`🎥 Available endpoints:`);
  console.log(`   - POST /api/auth/signup`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET /api/auth/me`);
  console.log(`   - GET /api/video/:filename`);
  console.log(`   - GET /api/videos`);
  console.log(`   - GET /api/health`);
});