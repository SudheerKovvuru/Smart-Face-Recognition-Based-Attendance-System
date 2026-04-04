const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const VIDEOS_PATH = 'D:\\Downloads';
const DEMO_VIDEOS_PATH = "C:\\Users\\sudhe\\OneDrive\\Desktop\\MP\\ProjectUpdated";

const authRoutes = require('./routes/auth');
const timetableRoutes = require('./routes/timetable');
const attendanceRoutes = require('./routes/attendance');
const { auth, isAdminOrFaculty } = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);

// ✅ SINGLE video streaming route
app.get('/api/video/:filename', auth, isAdminOrFaculty, (req, res) => {
  const filename = req.params.filename;

  // Try DEMO path first, fall back to VIDEOS_PATH
  let videoPath = path.join(DEMO_VIDEOS_PATH, filename);
  if (!fs.existsSync(videoPath)) {
    videoPath = path.join(VIDEOS_PATH, filename);
  }

  console.log('🎬 Requested:', filename);
  console.log('📂 Resolved path:', videoPath);
  console.log('✅ Exists:', fs.existsSync(videoPath));

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Video not found', path: videoPath });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    });
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    videosPath: VIDEOS_PATH,
    demoVideosPath: DEMO_VIDEOS_PATH,
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// List available videos - checks BOTH folders
app.get('/api/videos', auth, isAdminOrFaculty, (req, res) => {
  const videos = ['cam1_trim.mp4', 'cam2.mp4', 'cam3.mp4', 'cam4.mp4'];
  const availableVideos = videos.filter(video =>
    fs.existsSync(path.join(DEMO_VIDEOS_PATH, video)) ||
    fs.existsSync(path.join(VIDEOS_PATH, video))
  );
  res.json({ videos: availableVideos });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});