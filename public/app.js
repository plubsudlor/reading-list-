const API = '/api/books';
const STATUS_LABEL = { want: 'อยากอ่าน', reading: 'กำลังอ่าน', done: 'อ่านจบแล้ว' };

const $ = (id) => document.getElementById(id);
const form = $('book-form');
let currentFilter = '';

async function request(url, options) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด');
  return data;
}

function render(books) {
  const list = $('list');
  list.innerHTML = '';
  $('empty').hidden = books.length > 0;

  for (const b of books) {
    const li = document.createElement('li');
    li.className = 'book';
    li.dataset.status = b.status;

    const title = document.createElement('h3');
    title.className = 'book-title';
    title.textContent = b.title;

    const meta = document.createElement('p');
    meta.className = 'meta';
    const stars = b.rating ? ` • คะแนน ${b.rating}/5` : '';
    meta.textContent = `${b.author} • ${STATUS_LABEL[b.status]}${stars}`;

    li.append(title, meta);

    if (b.note) {
      const note = document.createElement('p');
      note.className = 'note';
      note.textContent = b.note;
      li.append(note);
    }

    const actions = document.createElement('div');
    actions.className = 'book-actions';
    const edit = document.createElement('button');
    edit.textContent = 'แก้ไข';
    edit.onclick = () => startEdit(b);
    const del = document.createElement('button');
    del.textContent = 'ลบ';
    del.className = 'del';
    del.onclick = () => removeBook(b);
    actions.append(edit, del);
    li.append(actions);

    list.append(li);
  }
}

async function load() {
  const url = currentFilter ? `${API}?status=${currentFilter}` : API;
  const books = await request(url);
  render(books);
  const all = currentFilter ? await request(API) : books;
  $('count').textContent = `ทั้งหมด ${all.length} เล่ม`;
}

function resetForm() {
  form.reset();
  $('book-id').value = '';
  $('form-title').textContent = 'เพิ่มหนังสือ';
  $('save-btn').textContent = 'เพิ่มหนังสือ';
  $('cancel-btn').hidden = true;
  $('error').textContent = '';
}

function startEdit(b) {
  $('book-id').value = b.id;
  $('title').value = b.title;
  $('author').value = b.author;
  $('status').value = b.status;
  $('rating').value = b.rating ?? '';
  $('note').value = b.note ?? '';
  $('form-title').textContent = 'แก้ไขหนังสือ';
  $('save-btn').textContent = 'บันทึกการแก้ไข';
  $('cancel-btn').hidden = false;
  $('title').focus();
}

async function removeBook(b) {
  if (!confirm(`ลบ "${b.title}" ใช่ไหม?`)) return;
  await request(`${API}/${b.id}`, { method: 'DELETE' });
  load();
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  $('error').textContent = '';
  const id = $('book-id').value;
  const payload = {
    title: $('title').value,
    author: $('author').value,
    status: $('status').value,
    rating: $('rating').value ? Number($('rating').value) : null,
    note: $('note').value,
  };
  try {
    await request(id ? `${API}/${id}` : API, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    });
    resetForm();
    load();
  } catch (err) {
    $('error').textContent = err.message;
  }
});

$('cancel-btn').addEventListener('click', resetForm);

document.querySelector('.filters').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  currentFilter = btn.dataset.status;
  document.querySelectorAll('.filters button').forEach((b) => b.classList.toggle('active', b === btn));
  load();
});

load();
