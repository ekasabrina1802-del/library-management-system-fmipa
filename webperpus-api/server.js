const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
app.use(express.json());

// Static files
app.use('/uploads/books',   express.static(path.join(__dirname, 'uploads/books')));
app.use('/uploads/members', express.static(path.join(__dirname, 'uploads/members')));
app.use('/uploads',         express.static(path.join(__dirname, 'uploads')));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

// ── Multer: Buku ──────────────────────────────────────────
const storageBooks = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/books/'),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const uploadBook = multer({ storage: storageBooks });

// ── Multer: Foto Anggota ──────────────────────────────────
const storageMembers = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/members/'),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'))
});
const uploadMember = multer({ storage: storageMembers });

// ── DB Config ─────────────────────────────────────────────
const dbConfig = {
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server:   'localhost',
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true,
    instanceName: 'SQLEXPRESS'
  }
};

// ── Helper: Generate ID Anggota Otomatis ─────────────────
async function generateMemberId(pool, jenis) {
  const prefix = jenis === 'mahasiswa' ? 'MH' : jenis === 'dosen' ? 'DS' : 'PS';
  const result = await pool.request()
    .input('prefix', sql.VarChar, prefix + '%')
    .query(`
      SELECT TOP 1 generated_id FROM Anggota
      WHERE generated_id LIKE @prefix
      ORDER BY generated_id DESC
    `);
  if (result.recordset.length === 0) return `${prefix}001`;
  const num = parseInt(result.recordset[0].generated_id.slice(2)) + 1;
  return `${prefix}${String(num).padStart(3, '0')}`;
}

// ════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT u.id AS userId, u.username, u.email, u.password, u.role,
               a.id AS anggotaId, a.generated_id, a.nim, a.jenis, a.photo
        FROM Users u
        LEFT JOIN Anggota a ON u.id = a.user_id
        WHERE u.email = @email
      `);

    if (result.recordset.length === 0)
      return res.status(401).json({ success: false, message: 'Email tidak terdaftar!' });

    const user = result.recordset[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Password salah!' });

    res.json({
      success: true,
      user: {
        id:           user.userId,
        memberId:     user.anggotaId,
        generated_id: user.generated_id,
        name:         user.username,
        email:        user.email,
        role:         user.role,
        nim:          user.nim,
        type:         user.jenis,
        photo:        user.photo,
        avatar:       user.username.charAt(0).toUpperCase()
      }
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  const allowedDomains = ['@mhs.unesa.ac.id', '@unesa.ac.id', '@fmipa.ac.id'];

  if (!allowedDomains.some(d => email.endsWith(d)))
    return res.json({ success: false, message: 'Gunakan email resmi UNESA/FMIPA' });

  try {
    const pool = await sql.connect(dbConfig);

    const checkUser = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT id FROM Users WHERE email = @email');
    if (checkUser.recordset.length > 0)
      return res.json({ success: false, message: 'Email sudah terdaftar' });

    const checkAnggota = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT id, jenis FROM Anggota WHERE email = @email');

    let role = 'mahasiswa';
    if (checkAnggota.recordset.length > 0) {
      const jenis = checkAnggota.recordset[0].jenis;
      role = jenis === 'staff' ? 'petugas' : jenis;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const resultUser = await pool.request()
      .input('username', sql.VarChar, name)
      .input('email',    sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('role',     sql.VarChar, role)
      .query(`
        INSERT INTO Users (username, email, password, role)
        OUTPUT INSERTED.id
        VALUES (@username, @email, @password, @role)
      `);
    const userId = resultUser.recordset[0].id;

    if (checkAnggota.recordset.length > 0) {
      await pool.request()
        .input('user_id', sql.Int,    userId)
        .input('email',   sql.VarChar, email)
        .query('UPDATE Anggota SET user_id = @user_id WHERE email = @email');
    } else {
      const generatedId = await generateMemberId(pool, 'mahasiswa');
      await pool.request()
        .input('user_id',      sql.Int,    userId)
        .input('generated_id', sql.VarChar, generatedId)
        .input('nama',         sql.VarChar, name)
        .input('email',        sql.VarChar, email)
        .input('jenis',        sql.VarChar, 'mahasiswa')
        .query(`
          INSERT INTO Anggota (user_id, generated_id, nama, email, jenis)
          VALUES (@user_id, @generated_id, @nama, @email, @jenis)
        `);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
  }
});

// ════════════════════════════════════════════════════════
// ANGGOTA
// ════════════════════════════════════════════════════════

app.get('/api/members', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT
        a.id, a.user_id, a.generated_id,
        a.nama    AS name,
        a.nim,
        a.jurusan AS departemen,
        a.prodi,
        a.jenis   AS type,
        a.email,
        a.phone,
        a.address,
        a.photo,
        a.status,
        CONVERT(varchar, a.created_at, 23) AS joinDate
      FROM Anggota a
      ORDER BY a.created_at DESC
    `);
    res.json({ success: true, members: result.recordset });
  } catch (err) {
    console.error('Get Members Error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil data anggota' });
  }
});

app.post('/api/members', uploadMember.single('photo'), async (req, res) => {
  const { name, nim, departemen, prodi, type, email, phone, address, password } = req.body;
  const photoPath = req.file ? `/uploads/members/${req.file.filename}` : null;

  try {
    const pool   = await sql.connect(dbConfig);
    const genId  = await generateMemberId(pool, type);

    if (type === 'staff') {
      if (!password)
        return res.json({ success: false, message: 'Password wajib diisi untuk staff/petugas' });

      const dup = await pool.request()
        .input('email', sql.VarChar, email)
        .query('SELECT id FROM Users WHERE email = @email');
      if (dup.recordset.length > 0)
        return res.json({ success: false, message: 'Email sudah digunakan' });

      const hashed = await bcrypt.hash(password, 10);
      const uRes   = await pool.request()
        .input('username', sql.VarChar, name)
        .input('email',    sql.VarChar, email)
        .input('password', sql.VarChar, hashed)
        .input('role',     sql.VarChar, 'petugas')
        .query(`INSERT INTO Users (username,email,password,role) OUTPUT INSERTED.id VALUES (@username,@email,@password,@role)`);
      const userId = uRes.recordset[0].id;

      await pool.request()
        .input('user_id',      sql.Int,    userId)
        .input('generated_id', sql.VarChar, genId)
        .input('nama',         sql.VarChar, name)
        .input('nim',          sql.VarChar, nim)
        .input('jurusan',      sql.VarChar, departemen || null)
        .input('prodi',        sql.VarChar, prodi     || null)
        .input('jenis',        sql.VarChar, 'staff')
        .input('email',        sql.VarChar, email)
        .input('phone',        sql.VarChar, phone   || null)
        .input('address',      sql.VarChar, address || null)
        .input('photo',        sql.VarChar, photoPath)
        .query(`
          INSERT INTO Anggota (user_id,generated_id,nama,nim,jurusan,prodi,jenis,email,phone,address,photo)
          VALUES (@user_id,@generated_id,@nama,@nim,@jurusan,@prodi,@jenis,@email,@phone,@address,@photo)
        `);

      return res.json({ success: true, generated_id: genId, message: 'Petugas berhasil ditambahkan' });
    }

    // Mahasiswa / Dosen
    await pool.request()
      .input('generated_id', sql.VarChar, genId)
      .input('nama',         sql.VarChar, name)
      .input('nim',          sql.VarChar, nim)
      .input('jurusan',      sql.VarChar, departemen || null)
      .input('prodi',        sql.VarChar, prodi     || null)
      .input('jenis',        sql.VarChar, type)
      .input('email',        sql.VarChar, email   || null)
      .input('phone',        sql.VarChar, phone   || null)
      .input('address',      sql.VarChar, address || null)
      .input('photo',        sql.VarChar, photoPath)
      .query(`
        INSERT INTO Anggota (generated_id,nama,nim,jurusan,prodi,jenis,email,phone,address,photo)
        VALUES (@generated_id,@nama,@nim,@jurusan,@prodi,@jenis,@email,@phone,@address,@photo)
      `);

    res.json({ success: true, generated_id: genId, message: 'Anggota berhasil ditambahkan' });

  } catch (err) {
    console.error('Add Member Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan anggota' });
  }
});

app.put('/api/members/:id', uploadMember.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { name, nim, departemen, prodi, type, email, phone, address } = req.body;

  try {
    const pool  = await sql.connect(dbConfig);
    const check = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT user_id, photo FROM Anggota WHERE id = @id');

    if (check.recordset.length === 0)
      return res.json({ success: false, message: 'Anggota tidak ditemukan' });

    const { user_id: userId, photo: oldPhoto } = check.recordset[0];
    const photoPath = req.file ? `/uploads/members/${req.file.filename}` : oldPhoto;

    await pool.request()
      .input('id',      sql.Int,    id)
      .input('nama',    sql.VarChar, name)
      .input('nim',     sql.VarChar, nim)
      .input('jurusan', sql.VarChar, departemen || null)
      .input('prodi',   sql.VarChar, prodi     || null)
      .input('jenis',   sql.VarChar, type)
      .input('email',   sql.VarChar, email   || null)
      .input('phone',   sql.VarChar, phone   || null)
      .input('address', sql.VarChar, address || null)
      .input('photo',   sql.VarChar, photoPath)
      .query(`
        UPDATE Anggota
        SET nama=@nama, nim=@nim, jurusan=@jurusan, prodi=@prodi,
            jenis=@jenis, email=@email, phone=@phone, address=@address, photo=@photo
        WHERE id=@id
      `);

    if (userId) {
      await pool.request()
        .input('userId',   sql.Int,    userId)
        .input('username', sql.VarChar, name)
        .input('email',    sql.VarChar, email || null)
        .input('role',     sql.VarChar, type === 'staff' ? 'petugas' : type)
        .query('UPDATE Users SET username=@username, email=@email, role=@role WHERE id=@userId');
    }

    const updated = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id, user_id, generated_id,
               nama AS name, nim,
               jurusan AS departemen, prodi,
               jenis AS type, email, phone, address, photo, status,
               CONVERT(varchar, created_at, 23) AS joinDate
        FROM Anggota WHERE id=@id
      `);

    res.json({ success: true, message: 'Anggota berhasil diupdate', member: updated.recordset[0] });
  } catch (err) {
    console.error('Update Member Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ════════════════════════════════════════════════════════
// BUKU
// ════════════════════════════════════════════════════════

app.get('/api/books', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT id, no_induk, no_klasifikasi, title, author, publisher,
             year, isbn, category, stock, available, description, image_url
      FROM Buku ORDER BY id DESC
    `);
    res.json({ success: true, books: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data buku' });
  }
});

app.post('/api/books', uploadBook.single('image'), async (req, res) => {
  const { no_induk, no_klasifikasi, title, author, publisher, year, isbn, category, stock, description } = req.body;
  const image_url = req.file ? `/uploads/books/${req.file.filename}` : null;

  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('no_induk',        sql.VarChar, no_induk)
      .input('no_klasifikasi',  sql.VarChar, no_klasifikasi)
      .input('title',           sql.VarChar, title)
      .input('author',          sql.VarChar, author)
      .input('publisher',       sql.VarChar, publisher   || null)
      .input('year',            sql.Int,     year        || null)
      .input('isbn',            sql.VarChar, isbn        || null)
      .input('category',        sql.VarChar, category)
      .input('stock',           sql.Int,     Number(stock))
      .input('available',       sql.Int,     Number(stock))
      .input('description',     sql.VarChar, description || null)
      .input('image_url',       sql.VarChar, image_url)
      .query(`
        INSERT INTO Buku (no_induk,no_klasifikasi,title,author,publisher,year,isbn,category,stock,available,description,image_url)
        VALUES (@no_induk,@no_klasifikasi,@title,@author,@publisher,@year,@isbn,@category,@stock,@available,@description,@image_url)
      `);
    res.json({ success: true, message: 'Buku berhasil ditambahkan' });
  } catch (err) {
    console.error('Add Book Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan buku' });
  }
});

app.put('/api/books/:id', uploadBook.single('image'), async (req, res) => {
  const { id } = req.params;
  const { no_induk, no_klasifikasi, title, author, publisher, year, isbn, category, stock, description } = req.body;

  try {
    const pool    = await sql.connect(dbConfig);
    const oldBook = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT image_url FROM Buku WHERE id=@id');

    const image_url = req.file
      ? `/uploads/books/${req.file.filename}`
      : oldBook.recordset[0]?.image_url || null;

    await pool.request()
      .input('id',             sql.Int,     id)
      .input('no_induk',       sql.VarChar, no_induk)
      .input('no_klasifikasi', sql.VarChar, no_klasifikasi)
      .input('title',          sql.VarChar, title)
      .input('author',         sql.VarChar, author)
      .input('publisher',      sql.VarChar, publisher   || null)
      .input('year',           sql.Int,     year        || null)
      .input('isbn',           sql.VarChar, isbn        || null)
      .input('category',       sql.VarChar, category)
      .input('stock',          sql.Int,     Number(stock))
      .input('description',    sql.VarChar, description || null)
      .input('image_url',      sql.VarChar, image_url)
      .query(`
        UPDATE Buku
        SET no_induk=@no_induk, no_klasifikasi=@no_klasifikasi, title=@title,
            author=@author, publisher=@publisher, year=@year, isbn=@isbn,
            category=@category, stock=@stock, description=@description, image_url=@image_url
        WHERE id=@id
      `);
    res.json({ success: true, message: 'Buku berhasil diupdate' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengupdate buku' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('DELETE FROM Buku WHERE id=@id');
    res.json({ success: true, message: 'Buku berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal menghapus buku' });
  }
});

// ════════════════════════════════════════════════════════
// PEMINJAMAN
// ════════════════════════════════════════════════════════

app.get('/api/loans', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT
        P.id, B.no_induk AS bookCode, B.title AS bookTitle, B.image_url,
        A.id AS memberId, A.generated_id, A.nama AS memberName, A.jenis AS memberType,
        CONVERT(varchar, P.tgl_pinjam,      23) AS loanDate,
        CONVERT(varchar, P.tgl_jatuh_tempo, 23) AS dueDate,
        CONVERT(varchar, P.tgl_kembali,     23) AS returnDate,
        P.denda, P.status
      FROM Peminjaman P
      JOIN Buku    B ON P.buku_id    = B.id
      JOIN Anggota A ON P.anggota_id = A.id
      ORDER BY P.id DESC
    `);
    res.json({ success: true, loans: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil data peminjaman' });
  }
});

app.get('/api/loans/user/:nim', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request()
      .input('nim', sql.VarChar, req.params.nim)
      .query(`
        SELECT P.id, B.no_induk AS bookCode, B.title AS bookTitle, B.image_url,
               P.status, P.denda,
               CONVERT(varchar, P.tgl_pinjam,      23) AS loanDate,
               CONVERT(varchar, P.tgl_jatuh_tempo, 23) AS dueDate
        FROM Peminjaman P
        JOIN Buku    B ON P.buku_id    = B.id
        JOIN Anggota A ON P.anggota_id = A.id
        WHERE A.nim = @nim
        ORDER BY P.id DESC
      `);
    res.json({ success: true, loans: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat' });
  }
});

app.post('/api/loans', async (req, res) => {
  const { bookCode, memberId } = req.body;
  try {
    const pool = await sql.connect(dbConfig);
    const tx   = new sql.Transaction(pool);
    await tx.begin();

    const bookRes = await new sql.Request(tx)
      .input('bookCode', sql.VarChar, bookCode)
      .query('SELECT id, title, available FROM Buku WHERE no_induk = @bookCode');

    if (bookRes.recordset.length === 0) { await tx.rollback(); return res.json({ success: false, message: 'Buku tidak ditemukan' }); }

    const book = bookRes.recordset[0];
    if (book.available <= 0) { await tx.rollback(); return res.json({ success: false, message: 'Buku tidak tersedia' }); }

    const memRes = await new sql.Request(tx)
      .input('memberId', sql.Int, memberId)
      .query('SELECT id, nama, jenis FROM Anggota WHERE id = @memberId');

    if (memRes.recordset.length === 0) { await tx.rollback(); return res.json({ success: false, message: 'Anggota tidak ditemukan' }); }

    const member  = memRes.recordset[0];
    const durasi  = member.jenis === 'dosen' ? 30 : 7; // dosen 30 hari, mhs 7 hari

    await new sql.Request(tx)
      .input('buku_id',    sql.Int, book.id)
      .input('anggota_id', sql.Int, memberId)
      .input('durasi',     sql.Int, durasi)
      .query(`
        INSERT INTO Peminjaman (buku_id, anggota_id, tgl_pinjam, tgl_jatuh_tempo, tgl_kembali, denda, status)
        VALUES (@buku_id, @anggota_id,
                CAST(GETDATE() AS DATE),
                DATEADD(DAY, @durasi, CAST(GETDATE() AS DATE)),
                NULL, 0, 'dipinjam')
      `);

    await new sql.Request(tx)
      .input('buku_id', sql.Int, book.id)
      .query('UPDATE Buku SET available = available - 1 WHERE id = @buku_id');

    await tx.commit();
    res.json({ success: true, message: 'Peminjaman berhasil' });

  } catch (err) {
    console.error('Add Loan Error:', err);
    res.status(500).json({ success: false, message: 'Gagal menambahkan peminjaman' });
  }
});

app.put('/api/loans/return/:bookCode', async (req, res) => {
  const { bookCode } = req.params;
  try {
    const pool = await sql.connect(dbConfig);
    const tx   = new sql.Transaction(pool);
    await tx.begin();

    const loanRes = await new sql.Request(tx)
      .input('bookCode', sql.VarChar, bookCode)
      .query(`
        SELECT TOP 1 P.id, P.buku_id, P.tgl_jatuh_tempo
        FROM Peminjaman P
        JOIN Buku B ON P.buku_id = B.id
        WHERE B.no_induk = @bookCode AND P.status IN ('dipinjam','terlambat')
        ORDER BY P.id DESC
      `);

    if (loanRes.recordset.length === 0) {
      await tx.rollback();
      return res.json({ success: false, message: 'Tidak ada peminjaman aktif untuk kode buku ini' });
    }

    const loan = loanRes.recordset[0];

    const dendaRes = await new sql.Request(tx)
      .input('dueDate', sql.Date, loan.tgl_jatuh_tempo)
      .query(`
        SELECT CASE WHEN DATEDIFF(DAY, @dueDate, CAST(GETDATE() AS DATE)) > 0
               THEN DATEDIFF(DAY, @dueDate, CAST(GETDATE() AS DATE)) * 1000
               ELSE 0 END AS denda
      `);
    const denda = dendaRes.recordset[0].denda;

    await new sql.Request(tx)
      .input('id',    sql.Int, loan.id)
      .input('denda', sql.Int, denda)
      .query(`
        UPDATE Peminjaman
        SET tgl_kembali = CAST(GETDATE() AS DATE), denda=@denda, status='dikembalikan'
        WHERE id=@id
      `);

    await new sql.Request(tx)
      .input('buku_id', sql.Int, loan.buku_id)
      .query('UPDATE Buku SET available = available + 1 WHERE id=@buku_id');

    await tx.commit();
    res.json({ success: true, message: 'Pengembalian berhasil', denda });

  } catch (err) {
    console.error('Return Loan Error:', err);
    res.status(500).json({ success: false, message: 'Gagal memproses pengembalian' });
  }
});

// ════════════════════════════════════════════════════════
// AUTO UPDATE STATUS TERLAMBAT
// ════════════════════════════════════════════════════════
const updateOverdueStatus = async () => {
  try {
    const pool   = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      UPDATE Peminjaman SET status='terlambat'
      WHERE status='dipinjam' AND tgl_jatuh_tempo < CAST(GETDATE() AS DATE)
    `);
    if (result.rowsAffected[0] > 0)
      console.log(`[System] ${result.rowsAffected[0]} buku terdeteksi terlambat.`);
  } catch (err) {
    console.error('[System Error] Gagal update status terlambat:', err);
  }
};

// ════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
  await updateOverdueStatus();
});