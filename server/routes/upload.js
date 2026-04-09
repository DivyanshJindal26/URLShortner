const express = require('express');
const multer = require('multer');
const path = require('path');
const { customAlphabet } = require('nanoid');
const Image = require('../models/Image');

const router = express.Router();
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);

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
    ALLOWED_MIME.has(file.mimetype)
      ? cb(null, true)
      : cb(Object.assign(new Error('Only image files are allowed'), { status: 400 }));
  },
});

router.post('/', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const { filename, originalname, size, mimetype } = req.file;

    await Image.create({
      filename,
      originalName: originalname,
      size,
      mimeType: mimetype,
    });

    const base = process.env.BASE_URL;
    res.status(201).json({
      filename,
      embedUrl: `${base}/i/${filename}`,
      rawUrl:   `${base}/i/${filename}/raw`,
    });
  } catch (err) {
    next(err);
  }
});

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.status === 400) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

module.exports = router;
