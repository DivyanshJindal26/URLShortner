require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const auth = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static admin dashboard
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// API routes (auth required)
app.use('/api/shorten', auth, require('./routes/shorten'));
app.use('/api/upload', auth, require('./routes/upload'));
app.use('/api', auth, require('./routes/admin'));

// Public image embed + raw serving
app.use('/i', require('./routes/images'));

// Short code redirects (must be last)
app.use('/', require('./routes/redirect'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`URLShortner running on port ${PORT}`);
  console.log(`Base URL: ${process.env.BASE_URL}`);
});
