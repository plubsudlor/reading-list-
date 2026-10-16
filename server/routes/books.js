const express = require('express');
const db = require('../db');

const router = express.Router();
const STATUSES = ['want', 'reading', 'done'];

// ตรวจสอบข้อมูลที่ส่งมา คืนค่า error เป็นข้อความ หรือ null ถ้าถูกต้อง
function validate(body, { partial = false } = {}) {
  const { title, author, status, rating } = body;
  if (!partial || title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) return 'ต้องระบุ title';
  }
  if (!partial || author !== undefined) {
    if (typeof author !== 'string' || !author.trim()) return 'ต้องระบุ author';
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    return `status ต้องเป็นหนึ่งใน: ${STATUSES.join(', ')}`;
  }
  if (rating !== undefined && rating !== null) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return 'rating ต้องเป็นจำนวนเต็ม 1-5';
    }
  }
  return null;
}

// GET /api/books?status=reading  -> ดึงรายการทั้งหมด (กรองตามสถานะได้)
router.get('/', (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare('SELECT * FROM books WHERE status = ? ORDER BY id DESC').all(status)
    : db.prepare('SELECT * FROM books ORDER BY id DESC').all();
  res.json(rows);
});

// GET /api/books/:id -> ดึงเล่มเดียว
router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'ไม่พบหนังสือเล่มนี้' });
  res.json(row);
});

// POST /api/books -> เพิ่มหนังสือ
router.post('/', (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });

  const { title, author, status = 'want', rating = null, note = '' } = req.body;
  const info = db
    .prepare('INSERT INTO books (title, author, status, rating, note) VALUES (?, ?, ?, ?, ?)')
    .run(title.trim(), author.trim(), status, rating, note);
  const created = db.prepare('SELECT * FROM books WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

// PUT /api/books/:id -> แก้ไขข้อมูล (ส่งเฉพาะฟิลด์ที่ต้องการแก้ได้)
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'ไม่พบหนังสือเล่มนี้' });

  const err = validate(req.body, { partial: true });
  if (err) return res.status(400).json({ error: err });

  const merged = { ...existing, ...req.body };
  db.prepare(
    'UPDATE books SET title = ?, author = ?, status = ?, rating = ?, note = ? WHERE id = ?'
  ).run(merged.title.trim(), merged.author.trim(), merged.status, merged.rating, merged.note, existing.id);

  res.json(db.prepare('SELECT * FROM books WHERE id = ?').get(existing.id));
});

// DELETE /api/books/:id -> ลบหนังสือ
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'ไม่พบหนังสือเล่มนี้' });
  res.status(204).end();
});

module.exports = router;
