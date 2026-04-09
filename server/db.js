const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    code         TEXT UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    title        TEXT,
    og_description TEXT,
    og_image     TEXT,
    visits       INTEGER DEFAULT 0,
    created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS images (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    filename      TEXT UNIQUE NOT NULL,
    original_name TEXT,
    size          INTEGER,
    mime_type     TEXT,
    visits        INTEGER DEFAULT 0,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

module.exports = db;
