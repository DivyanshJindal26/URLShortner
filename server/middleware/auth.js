function auth(req, res, next) {
  const apiKey = process.env.API_KEY;
  const provided =
    (req.headers.authorization || '').replace('Bearer ', '') ||
    req.query.key;

  if (!provided || provided !== apiKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = auth;
