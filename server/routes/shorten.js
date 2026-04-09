const express = require('express');
const { customAlphabet } = require('nanoid');
const fetch = require('node-fetch');
const db = require('../db');

const router = express.Router();
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 7);

async function fetchOGData(url) {
  try {
    const res = await fetch(url, { timeout: 5000 });
    const html = await res.text();
    const get = (property) => {
      const match = html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'));
      return match ? match[1] : null;
    };
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return {
      title: get('og:title') || (titleMatch ? titleMatch[1].trim() : null),
      description: get('og:description'),
      image: get('og:image'),
    };
  } catch {
    return { title: null, description: null, image: null };
  }
}

router.post('/', async (req, res) => {
  const { url, customCode } = req.body;

  if (!url) return res.status(400).json({ error: 'url is required' });

  try { new URL(url); } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const code = customCode || nanoid();

  const existing = db.prepare('SELECT code FROM links WHERE code = ?').get(code);
  if (existing) return res.status(409).json({ error: 'Code already taken' });

  const og = await fetchOGData(url);

  db.prepare(`
    INSERT INTO links (code, original_url, title, og_description, og_image)
    VALUES (?, ?, ?, ?, ?)
  `).run(code, url, og.title, og.description, og.image);

  const shortUrl = `${process.env.BASE_URL}/${code}`;
  res.json({ code, shortUrl });
});

module.exports = router;
