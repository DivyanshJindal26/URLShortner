const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const router = express.Router();
const UPLOADS = path.join(__dirname, '../uploads');

// --- Links ---

router.get('/links', (req, res) => {
  const links = db.prepare('SELECT * FROM links ORDER BY created_at DESC').all();
  res.json(links);
});

router.delete('/links/:code', (req, res) => {
  const { code } = req.params;
  const result = db.prepare('DELETE FROM links WHERE code = ?').run(code);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// --- Images ---

router.get('/images', (req, res) => {
  const images = db.prepare('SELECT * FROM images ORDER BY created_at DESC').all();
  res.json(images);
});

router.delete('/images/:filename', (req, res) => {
  const { filename } = req.params;
  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const image = db.prepare('SELECT * FROM images WHERE filename = ?').get(filename);
  if (!image) return res.status(404).json({ error: 'Not found' });

  db.prepare('DELETE FROM images WHERE filename = ?').run(filename);

  const filePath = path.join(UPLOADS, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  res.json({ ok: true });
});

// --- Stats ---

router.get('/stats', (req, res) => {
  const linkCount = db.prepare('SELECT COUNT(*) as count FROM links').get().count;
  const imageCount = db.prepare('SELECT COUNT(*) as count FROM images').get().count;
  const totalVisits = db.prepare('SELECT COALESCE(SUM(visits), 0) as total FROM links').get().total;
  const totalImageVisits = db.prepare('SELECT COALESCE(SUM(visits), 0) as total FROM images').get().total;
  res.json({ linkCount, imageCount, totalVisits, totalImageVisits });
});

module.exports = router;
