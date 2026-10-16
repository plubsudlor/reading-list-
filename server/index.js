const path = require('path');
const express = require('express');
const booksRouter = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public'))); // ฝั่ง client

app.use('/api/books', booksRouter);

// JSON ที่ผิดรูปแบบ
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON ไม่ถูกต้อง' });
  }
  console.error(err);
  res.status(500).json({ error: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
