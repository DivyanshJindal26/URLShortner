const express = require('express');
const path = require('path');
const fs = require('fs');
const Link = require('../models/Link');
const Image = require('../models/Image');
const logger = require('../logger');

const router = express.Router();

const UPLOADS = path.join(__dirname, '../uploads');

// --- Links ---

router.get('/links', async (req, res, next) => {
  try {
    const links = await Link.find().sort({ createdAt: -1 }).lean();
    res.json(links);
  } catch (err) { next(err); }
});

router.delete('/links/:code', async (req, res, next) => {
  try {
    const result = await Link.findOneAndDelete({ code: req.params.code });
    if (!result) return res.status(404).json({ error: 'Not found' });
    logger.info('Link deleted', { code: req.params.code });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// --- Images ---

router.get('/images', async (req, res, next) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 }).lean();
    res.json(images);
  } catch (err) { next(err); }
});

router.delete('/images/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    if (filename.includes('/') || filename.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }

    const image = await Image.findOneAndDelete({ filename });
    if (!image) return res.status(404).json({ error: 'Not found' });

    const filePath = path.join(UPLOADS, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    logger.info('Image deleted', { filename });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// --- Stats ---

router.get('/stats', async (req, res, next) => {
  try {
    const [linkCount, imageCount, linkVisits, imageVisits] = await Promise.all([
      Link.countDocuments(),
      Image.countDocuments(),
      Link.aggregate([{ $group: { _id: null, total: { $sum: '$visits' } } }]),
      Image.aggregate([{ $group: { _id: null, total: { $sum: '$visits' } } }]),
    ]);
    res.json({
      linkCount,
      imageCount,
      totalVisits:      linkVisits[0]?.total  || 0,
      totalImageVisits: imageVisits[0]?.total || 0,
    });
  } catch (err) { next(err); }
});

module.exports = router;
