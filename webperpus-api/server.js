const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

const fs = require('fs');

const memberUploadDir = path.join(__dirname, 'uploads', 'members');

fs.mkdirSync(memberUploadDir, { recursive: true });

const memberStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, memberUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  }
});

const uploadMember = multer({ storage: memberStorage });


// 🔹 Konfigurasi koneksi ke SQL Server
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: 'localhost',
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true,
        instanceName: 'SQLEXPRESS'
    }
};

// 🔹 Route LOGIN (VERSI BERSIH)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

   const loginResult = await pool.request()
  .input('email', sql.VarChar, email)
  .query(`
    SELECT u.id AS userId, u.username, u.email, u.password, u.role,
           a.id AS anggotaId, a.nim, a.jenis, a.custom_id, a.photo_url
    FROM Users u
    LEFT JOIN Anggota a ON u.email = a.email
    WHERE u.email = @email
  `);

    if (loginResult.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Email tidak terdaftar!' });
    }

    const user = loginResult.recordset[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Password salah!' });
    }

    res.json({
      success: true,
      user: {
        id: user.userId,
        anggotaId: user.anggotaId,
        customId: user.custom_id,
        name: user.username,
        email: user.email,
        role: user.role,
        nim: user.nim,
        type: user.jenis,
        photo_url: user.photo_url,
        avatar: user.username.charAt(0).toUpperCase()
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// 🔹 Route REGISTER
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;

  const allowedDomains = [
    '@mhs.unesa.ac.id',
    '@unesa.ac.id',
    '@fmipa.ac.id'
  ];

  const isValidEmail = allowedDomains.some(domain => email.endsWith(domain));

  if (!isValidEmail) {
    return res.json({
      success: false,
      message: 'Gunakan email resmi UNESA/FMIPA'
    });
  }

  try {
    const pool = await sql.connect(dbConfig);

    const checkUser = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Users WHERE email = @email');

    if (checkUser.recordset.length > 0) {
      return res.json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    const checkAnggota = await pool.request()
      .input('email', sql.VarChar, email)
      .query('SELECT * FROM Anggota WHERE email = @email');

    let role = 'mahasiswa';

    if (checkAnggota.recordset.length > 0) {
      const jenis = checkAnggota.recordset[0].jenis;
      role = jenis === 'staff' ? 'petugas' : jenis;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const resultUser = await pool.request()
      .input('username', sql.VarChar, name)
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, hashedPassword)
      .input('role', sql.VarChar, role)
      .query(`
        INSERT INTO Users (username, email, password, role)
        OUTPUT INSERTED.id
        VALUES (@username, @email, @password, @role)
      `);

    const userId = resultUser.recordset[0].id;

    if (checkAnggota.recordset.length === 0) {
      await pool.request()
        .input('name', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .input('jenis', sql.VarChar, 'mahasiswa')
        .input('nim', sql.VarChar, 'AUTO' + userId)
        .input('jurusan', sql.VarChar, null)
        .query(`
          INSERT INTO Anggota (name, email, jenis, nim, jurusan)
          VALUES (@name, @email, @jenis, @nim, @jurusan)
        `);
    }
    // Jika checkAnggota.length > 0, anggota sudah ada, tidak perlu update apapun

    res.json({ success: true });

  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

app.post('/api/books', upload.single('image'), async (req, res) => {
  const {
    no_induk,
    no_klasifikasi,
    title,
    author,
    publisher,
    year,
    isbn,
    category,
    stock,
    description
  } = req.body;

  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const pool = await sql.connect(dbConfig);

   await pool.request()
  .input('no_induk', sql.VarChar, no_induk)
  .input('no_klasifikasi', sql.VarChar, no_klasifikasi)
  .input('title', sql.VarChar, title)
  .input('author', sql.VarChar, author)
  .input('publisher', sql.VarChar, publisher || null)
  .input('year', sql.Int, year || null)
  .input('isbn', sql.VarChar, isbn || null)
  .input('category', sql.VarChar, category)
  .input('stock', sql.Int, Number(stock))
  .input('available', sql.Int, Number(stock))
  .input('description', sql.VarChar, description || null)
  .input('image_url', sql.VarChar, image_url)
  .query(`
    INSERT INTO Buku
    (no_induk, no_klasifikasi, title, author, publisher, year, isbn, category, stock, available, description, image_url)
    VALUES
    (@no_induk, @no_klasifikasi, @title, @author, @publisher, @year, @isbn, @category, @stock, @available, @description, @image_url)
  `);

    res.json({
      success: true,
      message: 'Buku berhasil ditambahkan'
    });

  } catch (err) {
    console.error('Add Book Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan buku'
    });
  }
});

app.put('/api/books/:id', upload.single('image'), async (req, res) => {
  const { id } = req.params;

  const {
    no_induk,
    no_klasifikasi,
    title,
    author,
    publisher,
    year,
    isbn,
    category,
    stock,
    description
  } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    const oldBook = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT image_url FROM Buku WHERE id = @id`);

    const image_url = req.file
      ? `/uploads/${req.file.filename}`
      : oldBook.recordset[0]?.image_url || null;

    await pool.request()
      .input('id', sql.Int, id)
      .input('no_induk', sql.VarChar, no_induk)
      .input('no_klasifikasi', sql.VarChar, no_klasifikasi)
      .input('title', sql.VarChar, title)
      .input('author', sql.VarChar, author)
      .input('publisher', sql.VarChar, publisher || null)
      .input('year', sql.Int, year || null)
      .input('isbn', sql.VarChar, isbn || null)
      .input('category', sql.VarChar, category)
      .input('stock', sql.Int, Number(stock))
      .input('description', sql.VarChar, description || null)
      .input('image_url', sql.VarChar, image_url)
      .query(`
        UPDATE Buku
        SET
          no_induk = @no_induk,
          no_klasifikasi = @no_klasifikasi,
          title = @title,
          author = @author,
          publisher = @publisher,
          year = @year,
          isbn = @isbn,
          category = @category,
          stock = @stock,
          description = @description,
          image_url = @image_url
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Buku berhasil diupdate'
    });

  } catch (err) {
    console.error('Update Book Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengupdate buku'
    });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);

    // ambil email anggota dulu
    const anggota = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT email
        FROM Anggota
        WHERE id = @id
      `);

    if (anggota.recordset.length === 0) {
      return res.json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const email = anggota.recordset[0].email;

    // hapus akun login kalau ada
    if (email) {
      await pool.request()
        .input('email', sql.VarChar, email)
        .query(`
          DELETE FROM Users
          WHERE email = @email
        `);
    }

    // hapus anggota
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM Anggota
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Anggota berhasil dihapus'
    });

  } catch (err) {
    console.error('Delete Member Error:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

 const result = await pool.request().query(`
  SELECT
    id,
    custom_id,
    name AS name,
    nim,
    jurusan AS departemen,
    jurusan AS prodi,
    jenis AS type,
    email,
    'aktif' AS status,
    phone,
    address,
    photo_url,
    CONVERT(varchar, created_at, 23) AS joinDate
  FROM Anggota
  ORDER BY id DESC
`);

    res.json({
      success: true,
      members: result.recordset
    });

  } catch (err) {
    console.error('Get Members Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data anggota'
    });
  }
});
// test contribution
app.post('/api/members', uploadMember.single('photo'), async (req, res) => {
  const { name, nim, departemen, prodi, type, email, phone, address, password } = req.body;

  const photo_url = req.file ? `/uploads/members/${req.file.filename}` : null;

  try {
    const pool = await sql.connect(dbConfig);

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan tipe anggota wajib diisi'
      });
    }

    if (type === 'staff') {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Password wajib diisi untuk staff/petugas'
        });
      }

      if (!email || !email.endsWith('@fmipa.ac.id')) {
        return res.status(400).json({
          success: false,
          message: 'Email staff/petugas harus @fmipa.ac.id'
        });
      }

      const checkUser = await pool.request()
        .input('email', sql.VarChar, email)
        .query(`SELECT id FROM Users WHERE email = @email`);

      if (checkUser.recordset.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Email sudah digunakan sebagai akun login'
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const resultUser = await pool.request()
        .input('username', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .input('password', sql.VarChar, hashedPassword)
        .input('role', sql.VarChar, 'petugas')
        .query(`
          INSERT INTO Users (username, email, password, role)
          OUTPUT INSERTED.id
          VALUES (@username, @email, @password, @role)
        `);

      const userId = resultUser.recordset[0].id;
      const staffNim = nim || `STF${String(userId).padStart(3, '0')}`;

      const inserted = await pool.request()
  .input('name', sql.VarChar, name)
  .input('nim', sql.VarChar, staffNim)
  .input('jurusan', sql.VarChar, departemen || prodi || 'Perpustakaan FMIPA')
  .input('jenis', sql.VarChar, 'staff')
  .input('email', sql.VarChar, email)
  .input('phone', sql.VarChar, phone || null)
  .input('address', sql.VarChar, address || null)
  .input('photo_url', sql.VarChar, photo_url)
  .query(`
    INSERT INTO Anggota (name, nim, jurusan, jenis, email, phone, address, photo_url)
    VALUES (@name, @nim, @jurusan, @jenis, @email, @phone, @address, @photo_url);

    SELECT CAST(SCOPE_IDENTITY() AS int) AS id;
  `);

      return res.json({
        success: true,
        message: 'Staff/petugas berhasil ditambahkan',
        id: inserted.recordset[0].id,
        photo_url
      });
    }

    const inserted = await pool.request()
  .input('name', sql.VarChar, name)
  .input('nim', sql.VarChar, nim)
  .input('jurusan', sql.VarChar, departemen || prodi || null)
  .input('jenis', sql.VarChar, type)
  .input('email', sql.VarChar, email || null)
  .input('phone', sql.VarChar, phone || null)
  .input('address', sql.VarChar, address || null)
  .input('photo_url', sql.VarChar, photo_url)
  .query(`
    INSERT INTO Anggota (name, nim, jurusan, jenis, email, phone, address, photo_url)
    VALUES (@name, @nim, @jurusan, @jenis, @email, @phone, @address, @photo_url);

    SELECT CAST(SCOPE_IDENTITY() AS int) AS id;
  `);

    res.json({
      success: true,
      message: 'Anggota berhasil ditambahkan',
      id: inserted.recordset[0].id,
      photo_url
    });

  } catch (err) {
    console.error('Add Member Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Gagal menambahkan anggota'
    });
  }
});

app.put('/api/members/:id', uploadMember.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { name, nim, departemen, prodi, type, email, phone, address } = req.body;
const photo_url = req.file ? `/uploads/members/${req.file.filename}` : null;

  try {
    const pool = await sql.connect(dbConfig);

    // SESUDAH — cukup cek keberadaan anggota, update Users pakai email:
const anggotaCheck = await pool.request()
  .input('id', sql.Int, id)
  .query(`SELECT id, email FROM Anggota WHERE id = @id`);

if (anggotaCheck.recordset.length === 0) {
  return res.json({ success: false, message: 'Anggota tidak ditemukan' });
}

const anggotaEmail = anggotaCheck.recordset[0].email;

await pool.request()
  .input('id', sql.Int, id)
  .input('name', sql.VarChar, name)
  .input('nim', sql.VarChar, nim)
  .input('jurusan', sql.VarChar, departemen || prodi || null)
  .input('jenis', sql.VarChar, type)
  .input('email', sql.VarChar, email || null)
  .input('phone', sql.VarChar, phone || null)
  .input('address', sql.VarChar, address || null)
  .input('photo_url', sql.VarChar, photo_url)
  .query(`
    UPDATE Anggota
    SET
      name = @name,
      nim = @nim,
      jurusan = @jurusan,
      jenis = @jenis,
      email = @email,
      phone = @phone,
      address = @address,
      photo_url = COALESCE(@photo_url, photo_url)
    WHERE id = @id
  `);

// Update Users berdasarkan email lama
if (anggotaEmail) {
  await pool.request()
    .input('oldEmail', sql.VarChar, anggotaEmail)
    .input('username', sql.VarChar, name)
    .input('email', sql.VarChar, email || null)
    .input('role', sql.VarChar, type === 'staff' ? 'petugas' : type)
    .query(`
      UPDATE Users
      SET username=@username, email=@email, role=@role
      WHERE email = @oldEmail
    `);
}

    const updated = await pool.request()
  .input('id', sql.Int, id)
  .query(`
    SELECT id, custom_id,
      name AS name, nim,
      jurusan AS departemen, jurusan AS prodi,
      jenis AS type, email, phone, address,
      photo_url,
      'aktif' AS status,
      CONVERT(varchar, created_at, 23) AS joinDate
    FROM Anggota WHERE id = @id
  `);

    res.json({ success: true, message: 'Anggota berhasil diupdate', member: updated.recordset[0] });

  } catch (err) {
    console.error('Update Member Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Gagal mengupdate anggota' });
  }
});

const DENDA_PER_HARI = 500;

const LOAN_RULES = {
  mahasiswa: { maxBuku: 3, hariPinjam: 7, maxPerpanjangan: 2 },
  dosen: { maxBuku: 10, hariPinjam: 30, maxPerpanjangan: 2 },
};

app.get('/api/loans', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT
        P.id,
        B.no_induk AS bookCode,
        B.title AS bookTitle,
        B.image_url,
        A.id AS memberId,
        A.name AS memberName,
        A.jenis AS memberType,
        CONVERT(varchar, P.tgl_pinjam, 23) AS loanDate,
        CONVERT(varchar, P.tgl_jatuh_tempo, 23) AS dueDate,
        CONVERT(varchar, P.tgl_kembali, 23) AS returnDate,
        P.denda,
        P.denda_bayar AS dendaBayar,
        P.jumlah_perpanjangan AS jumlahPerpanjangan,
        P.status
      FROM Peminjaman P
      JOIN Buku B ON P.buku_id = B.id
      JOIN Anggota A ON P.anggota_id = A.id
      ORDER BY P.id DESC
    `);

    res.json({
      success: true,
      loans: result.recordset
    });

  } catch (err) {
    console.error('Get Loans Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data peminjaman'
    });
  }
});

// --- GET RIWAYAT KHUSUS PER USER (NIM) ---
app.get('/api/loans/user/:nim', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().input('nim', sql.VarChar, req.params.nim).query(`
      SELECT P.id, B.no_induk AS bookCode, B.title AS bookTitle, B.image_url, P.status, P.denda,
             CONVERT(varchar, P.tgl_pinjam, 23) AS loanDate, 
             CONVERT(varchar, P.tgl_jatuh_tempo, 23) AS dueDate
      FROM Peminjaman P 
      JOIN Buku B ON P.buku_id = B.id 
      JOIN Anggota A ON P.anggota_id = A.id
      WHERE A.nim = @nim 
      ORDER BY P.id DESC
    `);
    res.json({ success: true, loans: result.recordset });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat' });
  }
});

app.get('/api/books', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT 
        id,
        no_induk,
        no_klasifikasi,
        title,
        author,
        publisher,
        year,
        isbn,
        category,
        stock,
        available,
        description,
        image_url
      FROM Buku
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      books: result.recordset
    });

  } catch (err) {
    console.error('Get Books Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data buku'
    });
  }
});



app.post('/api/loans', async (req, res) => {
  const { bookCode, memberId } = req.body;

  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const bookResult = await new sql.Request(transaction)
      .input('bookCode', sql.VarChar, bookCode)
      .query(`
        SELECT id, title, available
        FROM Buku
        WHERE no_induk = @bookCode
      `);

    if (bookResult.recordset.length === 0) {
      await transaction.rollback();
      return res.json({ success: false, message: 'Buku tidak ditemukan' });
    }

    const book = bookResult.recordset[0];

    if (book.available <= 0) {
      await transaction.rollback();
      return res.json({ success: false, message: 'Buku tidak tersedia' });
    }

    const memberResult = await new sql.Request(transaction)
      .input('memberId', sql.Int, memberId)
      .query(`
        SELECT id, name, jenis
        FROM Anggota
        WHERE id = @memberId
      `);

    if (memberResult.recordset.length === 0) {
      await transaction.rollback();
      return res.json({ success: false, message: 'Anggota tidak ditemukan' });
    }

    const member = memberResult.recordset[0];
    const memberType = String(member.jenis || '').toLowerCase();
    const rule = LOAN_RULES[memberType];

    if (!rule) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: `${member.name} (${member.jenis}) tidak memiliki hak peminjaman`
      });
    }

    const blockedResult = await new sql.Request(transaction)
  .input('memberId', sql.Int, memberId)
  .query(`
    SELECT TOP 1 id, status, denda, denda_bayar
    FROM Peminjaman
    WHERE anggota_id = @memberId
      AND (
        (
          status IN ('dipinjam', 'diperpanjang', 'terlambat')
          AND tgl_jatuh_tempo < CAST(GETDATE() AS DATE)
        )
        OR (
          status = 'dikembalikan'
          AND ISNULL(denda, 0) > 0
          AND ISNULL(denda_bayar, 0) = 0
        )
      )
  `);

    if (blockedResult.recordset.length > 0) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: 'Anggota masih memiliki keterlambatan atau denda yang belum dibayar'
      });
    }

    const activeCountResult = await new sql.Request(transaction)
      .input('memberId', sql.Int, memberId)
      .query(`
        SELECT COUNT(*) AS total
        FROM Peminjaman
        WHERE anggota_id = @memberId
          AND status IN ('dipinjam', 'terlambat', 'diperpanjang')
      `);

    const activeCount = activeCountResult.recordset[0].total;

    if (activeCount >= rule.maxBuku) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: `${member.name} sudah meminjam ${activeCount} buku. Maksimal untuk ${memberType} adalah ${rule.maxBuku} buku`
      });
    }

    const sameBookResult = await new sql.Request(transaction)
      .input('memberId', sql.Int, memberId)
      .input('bookId', sql.Int, book.id)
      .query(`
        SELECT TOP 1 id
        FROM Peminjaman
        WHERE anggota_id = @memberId
          AND buku_id = @bookId
          AND status IN ('dipinjam', 'terlambat', 'diperpanjang')
      `);

    if (sameBookResult.recordset.length > 0) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: `${member.name} sudah meminjam buku ini dan belum mengembalikannya`
      });
    }

    await new sql.Request(transaction)
      .input('buku_id', sql.Int, book.id)
      .input('anggota_id', sql.Int, memberId)
      .input('hariPinjam', sql.Int, rule.hariPinjam)
      .query(`
        INSERT INTO Peminjaman
        (
          buku_id,
          anggota_id,
          tgl_pinjam,
          tgl_jatuh_tempo,
          tgl_kembali,
          denda,
          denda_bayar,
          jumlah_perpanjangan,
          status
        )
        VALUES
        (
          @buku_id,
          @anggota_id,
          CAST(GETDATE() AS DATE),
          DATEADD(DAY, @hariPinjam, CAST(GETDATE() AS DATE)),
          NULL,
          0,
          0,
          0,
          'dipinjam'
        )
      `);

    await new sql.Request(transaction)
      .input('buku_id', sql.Int, book.id)
      .query(`
        UPDATE Buku
        SET available = available - 1
        WHERE id = @buku_id
      `);

    await transaction.commit();

    res.json({
      success: true,
      message: 'Peminjaman berhasil'
    });

  } catch (err) {
    console.error('Add Loan Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan peminjaman'
    });
  }
});


app.put('/api/loans/:id/extend', async (req, res) => {
  const { id } = req.params;
  const tambahHari = Number(req.body.tambahHari || req.body.days || req.body.hari || 0);

  if (!tambahHari || tambahHari <= 0) {
    return res.status(400).json({
      success: false,
      message: 'tambahHari wajib diisi dan harus lebih dari 0'
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const loanResult = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query(`
        SELECT
          P.id,
          P.anggota_id,
          P.tgl_jatuh_tempo,
          P.status,
          P.jumlah_perpanjangan,
          A.jenis AS memberType,
          A.name AS memberName,
          B.title AS bookTitle
        FROM Peminjaman P
        JOIN Anggota A ON P.anggota_id = A.id
        JOIN Buku B ON P.buku_id = B.id
        WHERE P.id = @id
      `);

    if (loanResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Data peminjaman tidak ditemukan'
      });
    }

    const loan = loanResult.recordset[0];
    const memberType = String(loan.memberType || '').toLowerCase();
    const rule = LOAN_RULES[memberType] || LOAN_RULES.mahasiswa;

    if (!['dipinjam', 'diperpanjang'].includes(loan.status)) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: 'Peminjaman ini tidak bisa diperpanjang karena statusnya bukan pinjaman aktif'
      });
    }

    const overdueResult = await new sql.Request(transaction)
      .input('dueDate', sql.Date, loan.tgl_jatuh_tempo)
      .query(`
        SELECT
          CASE
            WHEN @dueDate < CAST(GETDATE() AS DATE) THEN 1
            ELSE 0
          END AS isOverdue
      `);

    if (overdueResult.recordset[0].isOverdue === 1) {
      await new sql.Request(transaction)
        .input('id', sql.Int, id)
        .query(`
          UPDATE Peminjaman
          SET status = 'terlambat'
          WHERE id = @id
        `);

      await transaction.commit();

      return res.json({
        success: false,
        message: 'Tidak bisa diperpanjang karena buku sudah terlambat'
      });
    }

    const currentExt = Number(loan.jumlah_perpanjangan || 0);

    if (currentExt >= rule.maxPerpanjangan) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: `Sudah mencapai batas maksimal perpanjangan (${rule.maxPerpanjangan}x)`
      });
    }

    await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .input('tambahHari', sql.Int, tambahHari)
      .query(`
        UPDATE Peminjaman
        SET
          tgl_jatuh_tempo = DATEADD(DAY, @tambahHari, tgl_jatuh_tempo),
          jumlah_perpanjangan = jumlah_perpanjangan + 1,
          status = 'diperpanjang'
        WHERE id = @id
      `);

    const updatedResult = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query(`
        SELECT
          id,
          CONVERT(varchar, tgl_jatuh_tempo, 23) AS dueDate,
          jumlah_perpanjangan AS jumlahPerpanjangan,
          status
        FROM Peminjaman
        WHERE id = @id
      `);

    await transaction.commit();

    res.json({
      success: true,
      message: 'Peminjaman berhasil diperpanjang',
      loan: updatedResult.recordset[0]
    });

  } catch (err) {
    console.error('Extend Loan Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memperpanjang peminjaman'
    });
  }
});

app.put('/api/loans/:id/return', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const loanResult = await new sql.Request(transaction)
      .input('id', sql.Int, id)
      .query(`
        SELECT
          P.id,
          P.buku_id,
          P.tgl_jatuh_tempo,
          P.status,
          B.title AS bookTitle,
          A.name AS memberName
        FROM Peminjaman P
        JOIN Buku B ON P.buku_id = B.id
        JOIN Anggota A ON P.anggota_id = A.id
        WHERE P.id = @id
          AND P.status IN ('dipinjam', 'terlambat', 'diperpanjang')
      `);

    if (loanResult.recordset.length === 0) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: 'Peminjaman aktif tidak ditemukan'
      });
    }

    const loan = loanResult.recordset[0];

    const dendaResult = await new sql.Request(transaction)
      .input('dueDate', sql.Date, loan.tgl_jatuh_tempo)
      .input('dendaPerHari', sql.Int, DENDA_PER_HARI)
      .query(`
        SELECT
          CASE
            WHEN DATEDIFF(DAY, @dueDate, CAST(GETDATE() AS DATE)) > 0
            THEN DATEDIFF(DAY, @dueDate, CAST(GETDATE() AS DATE)) * @dendaPerHari
            ELSE 0
          END AS denda,
          CASE
            WHEN DATEDIFF(DAY, @dueDate, CAST(GETDATE() AS DATE)) > 0
            THEN DATEDIFF(DAY, @dueDate, CAST(GETDATE() AS DATE))
            ELSE 0
          END AS lateDays
      `);

    const denda = dendaResult.recordset[0].denda;
    const lateDays = dendaResult.recordset[0].lateDays;

    await new sql.Request(transaction)
  .input('id', sql.Int, loan.id)
  .input('denda', sql.Int, denda)
  .input('dendaBayar', sql.Bit, 1)
  .query(`
    UPDATE Peminjaman
    SET
      tgl_kembali = CAST(GETDATE() AS DATE),
      denda = @denda,
      denda_bayar = @dendaBayar,
      tgl_bayar_denda = CASE
        WHEN @denda > 0 THEN CAST(GETDATE() AS DATE)
        ELSE NULL
      END,
      status = 'dikembalikan'
    WHERE id = @id
  `);

    await new sql.Request(transaction)
      .input('buku_id', sql.Int, loan.buku_id)
      .query(`
        UPDATE Buku
        SET available = available + 1
        WHERE id = @buku_id
      `);

    await transaction.commit();

    res.json({
      success: true,
      message: denda > 0
        ? 'Pengembalian berhasil. Anggota memiliki denda yang harus dibayar'
        : 'Pengembalian berhasil',
      denda,
      lateDays,
      dendaBayar: denda === 0
    });

  } catch (err) {
    console.error('Return Loan By ID Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses pengembalian'
    });
  }
});

app.put('/api/loans/:id/pay-fine', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Peminjaman
        SET
          denda_bayar = 1,
          tgl_bayar_denda = CAST(GETDATE() AS DATE)
        WHERE id = @id
          AND status = 'dikembalikan'
          AND ISNULL(denda, 0) > 0
          AND ISNULL(denda_bayar, 0) = 0
      `);

    if (result.rowsAffected[0] === 0) {
      return res.json({
        success: false,
        message: 'Data denda tidak ditemukan atau denda sudah lunas'
      });
    }

    res.json({
      success: true,
      message: 'Denda berhasil ditandai lunas'
    });

  } catch (err) {
    console.error('Pay Fine Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses pembayaran denda'
    });
  }
});


app.post('/api/members/:id/photo', uploadMember.single('photo'), async (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.json({
      success: false,
      message: 'Tidak ada file yang diupload'
    });
  }

  const photo_url = `/uploads/members/${req.file.filename}`;

  try {
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input('id', sql.Int, id)
      .input('photo_url', sql.VarChar, photo_url)
      .query(`
        UPDATE Anggota
        SET photo_url = @photo_url
        WHERE id = @id
      `);

    res.json({
      success: true,
      photo_url
    });
  } catch (err) {
    console.error('Upload Photo Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal upload foto'
    });
  }
});


// --- LOGIKA UPDATE OTOMATIS STATUS TERLAMBAT ---
const updateOverdueStatus = async () => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      UPDATE Peminjaman 
      SET status = 'terlambat'
      WHERE status IN ('dipinjam', 'diperpanjang')
  AND tgl_jatuh_tempo < CAST(GETDATE() AS DATE)
    `);
    if (result.rowsAffected[0] > 0) {
      console.log(`[System] ${result.rowsAffected[0]} buku terdeteksi terlambat.`);
    }
  } catch (err) {
    console.error('[System Error] Gagal update status terlambat:', err);
  }
};


// 🔹 Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => { // Tambahkan 'async' di sini
  console.log(`Server Backend WebPerpusFMIPA jalan di http://localhost:${PORT}`);
  await updateOverdueStatus(); 
});