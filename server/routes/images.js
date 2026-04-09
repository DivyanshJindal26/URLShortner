const express = require('express');
const path = require('path');
const fs = require('fs');
const db = require('../db');

const router = express.Router();
const UPLOADS = path.join(__dirname, '../uploads');

// Embed page — serves OG meta tags so WhatsApp/Discord/Telegram show a preview
router.get('/:filename', (req, res) => {
  const { filename } = req.params;

  // Basic safety: no path traversal
  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).send('Invalid filename');
  }

  const image = db.prepare('SELECT * FROM images WHERE filename = ?').get(filename);
  if (!image) return res.status(404).send('Image not found');

  db.prepare('UPDATE images SET visits = visits + 1 WHERE filename = ?').run(filename);

  const base = process.env.BASE_URL;
  const rawUrl = `${base}/i/${filename}/raw`;
  const embedUrl = `${base}/i/${filename}`;

  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escHtml(image.original_name || filename)}</title>
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escHtml(embedUrl)}" />
  <meta property="og:title" content="${escHtml(image.original_name || filename)}" />
  <meta property="og:image" content="${escHtml(rawUrl)}" />
  <meta property="og:image:type" content="${escHtml(image.mime_type || 'image/jpeg')}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${escHtml(rawUrl)}" />
  <meta http-equiv="refresh" content="0; url=${escHtml(rawUrl)}" />
</head>
<body>
  <script>window.location.replace(${JSON.stringify(rawUrl)});</script>
  <p>Loading image… <a href="${escHtml(rawUrl)}">click here</a></p>
</body>
</html>`);
});

// Raw image — serves the actual binary
router.get('/:filename/raw', (req, res) => {
  const { filename } = req.params;

  if (filename.includes('/') || filename.includes('..')) {
    return res.status(400).send('Invalid filename');
  }

  const image = db.prepare('SELECT * FROM images WHERE filename = ?').get(filename);
  if (!image) return res.status(404).send('Image not found');

  const filePath = path.join(UPLOADS, filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('File missing on disk');

  res.setHeader('Content-Type', image.mime_type || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.sendFile(filePath);
});

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = router;
