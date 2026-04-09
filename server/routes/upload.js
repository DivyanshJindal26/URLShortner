const express = require('express');
const multer = require('multer');
const path = require('path');
const { customAlphabet } = require('nanoid');
const db = require('../db');

const router = express.Router();
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, nanoid() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter(req, file, cb) {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' });

  const { filename, originalname, size, mimetype } = req.file;

  db.prepare(`
    INSERT INTO images (filename, original_name, size, mime_type)
    VALUES (?, ?, ?, ?)
  `).run(filename, originalname, size, mimetype);

  const base = process.env.BASE_URL;
  res.json({
    filename,
    embedUrl: `${base}/i/${filename}`,
    rawUrl: `${base}/i/${filename}/raw`,
  });
});

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
