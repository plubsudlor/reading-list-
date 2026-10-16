const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// ไฟล์ฐานข้อมูลจะถูกสร้างอัตโนมัติที่ /server/books.db
const db = new DatabaseSync(path.join(__dirname, 'books.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    author     TEXT    NOT NULL,
    status     TEXT    NOT NULL DEFAULT 'want'
               CHECK (status IN ('want', 'reading', 'done')),
    rating     INTEGER CHECK (rating BETWEEN 1 AND 5),
    note       TEXT    DEFAULT '',
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  )
`);

module.exports = db;