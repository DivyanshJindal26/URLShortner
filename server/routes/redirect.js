const express = require('express');
const db = require('../db');

const router = express.Router();

// Reserved paths that should not be treated as short codes
const RESERVED = new Set(['api', 'i', 'admin', 'favicon.ico']);

router.get('/:code', (req, res) => {
  const { code } = req.params;

  if (RESERVED.has(code)) return res.status(404).send('Not found');

  const link = db.prepare('SELECT * FROM links WHERE code = ?').get(code);
  if (!link) return res.status(404).send('Short link not found');

  db.prepare('UPDATE links SET visits = visits + 1 WHERE code = ?').run(code);

  const baseUrl = process.env.BASE_URL;

  // Serve OG embed page — crawlers (WhatsApp, Telegram, Discord, etc.)
  // read the meta tags. Human visitors get JS-redirected immediately.
  res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escHtml(link.title || link.original_url)}</title>
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escHtml(`${baseUrl}/${code}`)}" />
  ${link.title ? `<meta property="og:title" content="${escHtml(link.title)}" />` : ''}
  ${link.og_description ? `<meta property="og:description" content="${escHtml(link.og_description)}" />` : ''}
  ${link.og_image ? `<meta property="og:image" content="${escHtml(link.og_image)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta http-equiv="refresh" content="0; url=${escHtml(link.original_url)}" />
</head>
<body>
  <script>window.location.replace(${JSON.stringify(link.original_url)});</script>
  <p>Redirecting… <a href="${escHtml(link.original_url)}">click here</a></p>
</body>
</html>`);
});

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = router;
