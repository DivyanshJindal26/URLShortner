const express = require('express');
const Link = require('../models/Link');
const logger = require('../logger');

const router = express.Router();
const RESERVED = new Set(['api', 'i', 'admin', 'favicon.ico']);

router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    if (RESERVED.has(code)) return res.status(404).send('Not found');

    const link = await Link.findOneAndUpdate(
      { code },
      { $inc: { visits: 1 } },
      { new: false }
    );
    if (!link) {
      logger.warn('Short link not found', { code });
      return res.status(404).send('Short link not found');
    }
    logger.info('Redirect', { code, originalUrl: link.originalUrl, visits: link.visits + 1 });

    const base = process.env.BASE_URL;

    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${esc(link.title || link.originalUrl)}</title>
  <meta property="og:type" content="website"/>
  <meta property="og:url" content="${esc(`${base}/${code}`)}"/>
  ${link.title        ? `<meta property="og:title" content="${esc(link.title)}"/>` : ''}
  ${link.ogDescription ? `<meta property="og:description" content="${esc(link.ogDescription)}"/>` : ''}
  ${link.ogImage      ? `<meta property="og:image" content="${esc(link.ogImage)}"/>` : ''}
  <meta name="twitter:card" content="summary_large_image"/>
  <meta http-equiv="refresh" content="0; url=${esc(link.originalUrl)}"/>
</head>
<body>
  <script>window.location.replace(${JSON.stringify(link.originalUrl)});</script>
  <p>Redirecting… <a href="${esc(link.originalUrl)}">click here</a></p>
</body>
</html>`);
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
