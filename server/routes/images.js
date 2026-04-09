const express = require('express');
const path = require('path');
const fs = require('fs');
const Image = require('../models/Image');
const logger = require('../logger');

const router = express.Router();
const UPLOADS = path.join(__dirname, '../uploads');

function safe(filename) {
  return filename && !filename.includes('/') && !filename.includes('..');
}

// Embed page — OG meta tags for social previews
router.get('/:filename', async (req, res, next) => {
  try {
    const { filename } = req.params;
    if (!safe(filename)) return res.status(400).send('Invalid filename');

    const image = await Image.findOneAndUpdate(
      { filename },
      { $inc: { visits: 1 } },
      { new: false }
    );
    if (!image) {
      logger.warn('Image embed not found', { filename });
      return res.status(404).send('Image not found');
    }
    logger.info('Image embed served', { filename, visits: image.visits + 1 });

    const base = process.env.BASE_URL;
    const rawUrl   = `${base}/i/${filename}/raw`;
    const embedUrl = `${base}/i/${filename}`;

    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${esc(image.originalName || filename)}</title>
  <meta property="og:type" content="website"/>
  <meta property="og:url" content="${esc(embedUrl)}"/>
  <meta property="og:title" content="${esc(image.originalName || filename)}"/>
  <meta property="og:image" content="${esc(rawUrl)}"/>
  <meta property="og:image:type" content="${esc(image.mimeType)}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:image" content="${esc(rawUrl)}"/>
  <meta http-equiv="refresh" content="0; url=${esc(rawUrl)}"/>
</head>
<body>
  <script>window.location.replace(${JSON.stringify(rawUrl)});</script>
  <p>Loading image… <a href="${esc(rawUrl)}">click here</a></p>
</body>
</html>`);
  } catch (err) {
    next(err);
  }
});

// Raw image binary
router.get('/:filename/raw', async (req, res, next) => {
  try {
    const { filename } = req.params;
    if (!safe(filename)) return res.status(400).send('Invalid filename');

    const image = await Image.findOne({ filename });
    if (!image) {
      logger.warn('Raw image not found in DB', { filename });
      return res.status(404).send('Image not found');
    }

    const filePath = path.join(UPLOADS, filename);
    if (!fs.existsSync(filePath)) {
      logger.error('Image missing on disk', { filename, filePath });
      return res.status(404).send('File missing on disk');
    }
    logger.debug('Raw image served', { filename });

    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

module.exports = router;
