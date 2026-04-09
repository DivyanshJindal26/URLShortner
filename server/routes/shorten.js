const express = require('express');
const { customAlphabet } = require('nanoid');
const fetch = require('node-fetch');
const Link = require('../models/Link');
const logger = require('../logger');

const router = express.Router();
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 7);

const RESERVED = new Set(['api', 'i', 'admin', 'health', 'favicon.ico']);

async function fetchOGData(url) {
  logger.debug('Fetching OG data', { url });
  try {
    const res = await fetch(url, {
      timeout: 5000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SKBot/1.0)' },
    });
    const html = await res.text();

    const getMeta = (property) => {
      const m =
        html.match(new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'));
      return m ? m[1].trim() : null;
    };
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

    return {
      title: getMeta('og:title') || (titleMatch ? titleMatch[1].trim() : null),
      description: getMeta('og:description'),
      image: getMeta('og:image'),
    };
  } catch (e) {
    logger.warn('Failed to fetch OG data', { url, error: e.message });
    return { title: null, description: null, image: null };
  }
}

router.post('/', async (req, res, next) => {
  try {
    const { url, customCode } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'url is required' });
    }

    try { new URL(url); } catch {
      return res.status(400).json({ error: 'Invalid URL' });
    }

    const code = (customCode || '').trim() || nanoid();

    if (RESERVED.has(code)) {
      return res.status(400).json({ error: 'That code is reserved' });
    }

    const exists = await Link.exists({ code });
    if (exists) return res.status(409).json({ error: 'Code already taken' });

    const og = await fetchOGData(url);

    const link = await Link.create({
      code,
      originalUrl: url,
      title: og.title,
      ogDescription: og.description,
      ogImage: og.image,
    });

    logger.info('Short link created', { code: link.code, originalUrl: url, title: og.title });
    res.status(201).json({
      code: link.code,
      shortUrl: `${process.env.BASE_URL}/${link.code}`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
