const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();



const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const bookUploadDir = path.join(__dirname, 'uploads', 'books');

fs.mkdirSync(bookUploadDir, { recursive: true });

const bookStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bookUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: bookStorage });


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

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); 

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

app.post('/api/login-google', async (req, res) => {
  const { credential } = req.body;

if (!credential) {
  return res.status(400).json({
    success: false,
    message: 'Credential Google wajib dikirim'
  });
}

let payload;

try {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  payload = ticket.getPayload();
} catch (err) {
  console.error('Google Token Verify Error:', err);

  return res.status(401).json({
    success: false,
    message: 'Token Google tidak valid'
  });
}

if (!payload.email_verified) {
  return res.status(403).json({
    success: false,
    message: 'Email Google belum terverifikasi'
  });
}

const email = normalizeEmail(payload.email);
const name = payload.name?.trim() || email.split('@')[0];

  if (!isAllowedUnesaEmail(email)) {
    return res.status(403).json({
      success: false,
      message: 'Hanya email resmi UNESA yang diperbolehkan'
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const defaultRole = getDefaultRole(email);
    const jenis = getIdentityType(email);

    const userCheck = await new sql.Request(transaction)
      .input('email', sql.VarChar, email)
      .query(`
        SELECT id, role
        FROM Users
        WHERE email = @email
      `);

    let userId;
    let finalRole = defaultRole;

    if (userCheck.recordset.length > 0) {
      userId = userCheck.recordset[0].id;

      // Penting: role dari DB dipertahankan supaya petugas tidak turun jadi dosen.
      finalRole =
        email === ADMIN_EMAIL
          ? 'admin'
          : userCheck.recordset[0].role || defaultRole;

      await new sql.Request(transaction)
        .input('id', sql.Int, userId)
        .input('username', sql.VarChar, name)
        .input('role', sql.VarChar, finalRole)
        .query(`
          UPDATE Users
          SET username = @username, role = @role
          WHERE id = @id
        `);
    } else {
      const insertedUser = await new sql.Request(transaction)
        .input('username', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .input('password', sql.VarChar, null)
        .input('role', sql.VarChar, defaultRole)
        .query(`
          INSERT INTO Users (username, email, password, role)
          VALUES (@username, @email, @password, @role);

          SELECT CAST(SCOPE_IDENTITY() AS int) AS id;
        `);

      userId = insertedUser.recordset[0].id;
      finalRole = defaultRole;
    }

    const anggotaCheck = await new sql.Request(transaction)
      .input('email', sql.VarChar, email)
      .query(`
        SELECT id
        FROM Anggota
        WHERE email = @email
      `);

    let anggotaId;

    if (anggotaCheck.recordset.length > 0) {
      anggotaId = anggotaCheck.recordset[0].id;

      await new sql.Request(transaction)
        .input('id', sql.Int, anggotaId)
        .input('name', sql.VarChar, name)
        .input('jenis', sql.VarChar, jenis)
        .query(`
          UPDATE Anggota
          SET
            name = @name,
           jenis = CASE
  WHEN jenis IS NULL THEN @jenis
  ELSE jenis
END
          WHERE id = @id
        `);
    } else {
      const customId = await generateCustomId(pool, jenis, finalRole);

      const localPart = email.split('@')[0];
      const autoNim = jenis === 'mahasiswa' ? localPart : null;

      const insertedAnggota = await new sql.Request(transaction)
        .input('custom_id', sql.VarChar, customId)
        .input('name', sql.VarChar, name)
        .input('email', sql.VarChar, email)
        .input('jenis', sql.VarChar, jenis)
        .input('nim', sql.VarChar, autoNim)
        .input('jurusan', sql.VarChar, null)
        .input('departemen', sql.VarChar, null)
        .input('prodi', sql.VarChar, null)
        .query(`
          INSERT INTO Anggota
            (custom_id, name, email, jenis, nim, jurusan, departemen, prodi)
          VALUES
            (@custom_id, @name, @email, @jenis, @nim, @jurusan, @departemen, @prodi);

          SELECT CAST(SCOPE_IDENTITY() AS int) AS id;
        `);

      anggotaId = insertedAnggota.recordset[0].id;
    }

    const userResult = await new sql.Request(transaction)
      .input('email', sql.VarChar, email)
      .query(`
        SELECT
          U.id AS userId,
          U.username,
          U.email,
          U.role,
          A.id AS anggotaId,
          A.custom_id,
          A.nim,
          A.jenis AS type,
          A.departemen,
          A.prodi,
          A.phone,
          A.address,
          A.photo_url,
          A.profile_completed
        FROM Users U
        LEFT JOIN Anggota A ON U.email = A.email
        WHERE U.email = @email
      `);

    await transaction.commit();

    const user = userResult.recordset[0];

    return res.json({
      success: true,
      user: {
        id: user.userId,
        anggotaId: user.anggotaId,
        memberId: user.anggotaId,
        customId: user.custom_id,
        name: user.username,
        email: user.email,
        role: user.role,
        type: user.type,
        nim: user.nim,
        departemen: user.departemen,
        prodi: user.prodi,
        phone: user.phone,
        address: user.address,
        photo_url: user.photo_url,
        profileCompleted: Boolean(user.profile_completed),
        avatar: user.username?.charAt(0)?.toUpperCase() || 'U'
      }
    });

  } catch (err) {
    console.error('Google Login Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal login Google'
    });
  }
});

app.post('/api/dev-login', async (req, res) => {
  const { role } = req.body;

  const allowedRoles = ['admin', 'petugas', 'dosen'];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Role dev tidak valid'
    });
  }

  const devUsers = {
    admin: {
      email: 'dev.admin@unesa.ac.id',
      name: 'Dev Admin Perpustakaan',
      role: 'admin',
      type: 'dosen',
      nim: 'ADMDEV001',
      customId: 'ADMDEV001'
    },
    petugas: {
      email: 'dev.petugas@unesa.ac.id',
      name: 'Dev Petugas Perpustakaan',
      role: 'petugas',
      type: 'dosen',
      nim: 'PTGDEV001',
      customId: 'PSDEV001'
    },
    dosen: {
      email: 'dev.dosen@unesa.ac.id',
      name: 'Dev Dosen',
      role: 'dosen',
      type: 'dosen',
      nim: 'DSDEV001',
      customId: 'DSDEV001'
    }
  };

  const selected = devUsers[role];

  try {
    const pool = await sql.connect(dbConfig);

    const userCheck = await pool.request()
      .input('email', sql.VarChar, selected.email)
      .query(`
        SELECT id
        FROM Users
        WHERE email = @email
      `);

    if (userCheck.recordset.length === 0) {
      await pool.request()
        .input('username', sql.VarChar, selected.name)
        .input('email', sql.VarChar, selected.email)
        .input('password', sql.VarChar, null)
        .input('role', sql.VarChar, selected.role)
        .query(`
          INSERT INTO Users (username, email, password, role)
          VALUES (@username, @email, @password, @role)
        `);
    } else {
      await pool.request()
        .input('email', sql.VarChar, selected.email)
        .input('username', sql.VarChar, selected.name)
        .input('role', sql.VarChar, selected.role)
        .query(`
          UPDATE Users
          SET username = @username, role = @role
          WHERE email = @email
        `);
    }

    const anggotaCheck = await pool.request()
      .input('email', sql.VarChar, selected.email)
      .query(`
        SELECT id
        FROM Anggota
        WHERE email = @email
      `);

    if (anggotaCheck.recordset.length === 0) {
      await pool.request()
        .input('custom_id', sql.VarChar, selected.customId)
        .input('name', sql.VarChar, selected.name)
        .input('email', sql.VarChar, selected.email)
        .input('jenis', sql.VarChar, selected.type)
        .input('nim', sql.VarChar, selected.nim)
        .input('jurusan', sql.VarChar, 'Perpustakaan FMIPA')
        .input('departemen', sql.VarChar, 'Perpustakaan FMIPA')
        .input('prodi', sql.VarChar, null)
        .query(`
          INSERT INTO Anggota
            (custom_id, name, email, jenis, nim, jurusan, departemen, prodi)
          VALUES
            (@custom_id, @name, @email, @jenis, @nim, @jurusan, @departemen, @prodi)
        `);
    }

    const result = await pool.request()
      .input('email', sql.VarChar, selected.email)
      .query(`
        SELECT
          U.id AS userId,
          U.username,
          U.email,
          U.role,
          A.id AS anggotaId,
          A.custom_id,
          A.nim,
          A.jenis AS type,
          A.departemen,
          A.prodi,
          A.phone,
          A.address,
          A.photo_url,
          A.profile_completed
        FROM Users U
        LEFT JOIN Anggota A ON U.email = A.email
        WHERE U.email = @email
      `);

    const user = result.recordset[0];

    res.json({
      success: true,
      user: {
        id: user.userId,
        anggotaId: user.anggotaId,
        memberId: user.anggotaId,
        customId: user.custom_id,
        name: user.username,
        email: user.email,
        role: user.role,
        type: user.type,
        nim: user.nim,
        departemen: user.departemen,
        prodi: user.prodi,
        phone: user.phone,
        address: user.address,
        photo_url: user.photo_url,
        profileCompleted: Boolean(user.profile_completed),
        avatar: user.username?.charAt(0)?.toUpperCase() || 'U'
      }
    });

  } catch (err) {
    console.error('Dev Login Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal dev login'
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
  description,
  copies
} = req.body;

  const image_url = req.file ? `/uploads/books/${req.file.filename}` : null;

  try {
    const pool = await sql.connect(dbConfig);

   const insertedBook = await pool.request()
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
    (@no_induk, @no_klasifikasi, @title, @author, @publisher, @year, @isbn, @category, @stock, @available, @description, @image_url);

    SELECT CAST(SCOPE_IDENTITY() AS int) AS id;
  `);

const bookId = insertedBook.recordset[0].id;

let parsedCopies = [];

try {
  if (Array.isArray(copies)) {
    parsedCopies = copies;
  } else if (typeof copies === 'string') {
    parsedCopies = copies ? JSON.parse(copies) : [];
  } else {
    parsedCopies = [];
  }
} catch (err) {
  console.error('Parse copies error:', err);
  parsedCopies = [];
}

if (parsedCopies.length === 0) {
  parsedCopies = Array.from({ length: Number(stock) || 1 }, (_, i) => ({
    copy_code: `${no_induk}-${String(i + 1).padStart(3, '0')}`,
    status: 'available'
  }));
}

for (const copy of parsedCopies) {
  await pool.request()
    .input('buku_id', sql.Int, bookId)
    .input('copy_code', sql.VarChar, copy.copy_code)
    .input('status', sql.VarChar, copy.status || 'available')
    .query(`
      INSERT INTO BukuCopy (buku_id, copy_code, status)
      VALUES (@buku_id, @copy_code, @status)
    `);
}

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
  description,
  copies
} = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    const oldBook = await pool.request()
      .input('id', sql.Int, id)
      .query(`SELECT image_url, stock, available FROM Buku WHERE id = @id`);

   const image_url = req.file
  ? `/uploads/books/${req.file.filename}`
  : oldBook.recordset[0]?.image_url || null;

    const oldStock = Number(oldBook.recordset[0]?.stock ?? 0);
    const oldAvailable = Number(oldBook.recordset[0]?.available ?? 0);
    const borrowed = oldStock - oldAvailable;
    const newStock = Number(stock);
    const available = Math.max(0, Math.min(newStock, newStock - borrowed));

    console.log({ oldStock, oldAvailable, borrowed, newStock, available });

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
      .input('available', sql.Int, available)
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
          available = @available,
          description = @description,
          image_url = @image_url
        WHERE id = @id
      `);

let parsedCopies = [];

try {
  if (Array.isArray(copies)) {
    parsedCopies = copies;
  } else if (typeof copies === 'string') {
    parsedCopies = copies ? JSON.parse(copies) : [];
  } else {
    parsedCopies = [];
  }
} catch (err) {
  console.error('Parse copies error:', err);
  parsedCopies = [];
}

if (parsedCopies.length > 0) {
  for (const copy of parsedCopies) {
  const copyId = Number(copy.id);

  await pool.request()
    .input('copy_id', sql.Int, Number.isInteger(copyId) ? copyId : null)
      .input('buku_id', sql.Int, id)
      .input('copy_code', sql.VarChar, copy.copy_code)
      .input('status', sql.VarChar, copy.status || 'available')
      .query(`
  IF EXISTS (
    SELECT 1 FROM BukuCopy
    WHERE id = @copy_id
      AND buku_id = @buku_id
  )
  BEGIN
    UPDATE BukuCopy
    SET copy_code = @copy_code,
        status = @status
    WHERE id = @copy_id
      AND buku_id = @buku_id
  END
  ELSE IF EXISTS (
    SELECT 1 FROM BukuCopy
    WHERE copy_code = @copy_code
  )
  BEGIN
    UPDATE BukuCopy
    SET buku_id = @buku_id,
        status = @status
    WHERE copy_code = @copy_code
  END
  ELSE
  BEGIN
    INSERT INTO BukuCopy (buku_id, copy_code, status)
    VALUES (@buku_id, @copy_code, @status)
  END
`);
  }
}

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

app.delete('/api/books/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);

    // Cek buku ada atau tidak
    const bookResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT image_url
        FROM Buku
        WHERE id = @id
      `);

    if (bookResult.recordset.length === 0) {
      return res.json({
        success: false,
        message: 'Buku tidak ditemukan'
      });
    }

    // Cek apakah buku sedang dipinjam
    const activeLoan = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT TOP 1 id
        FROM Peminjaman
        WHERE buku_id = @id
          AND status IN ('dipinjam', 'terlambat', 'diperpanjang')
      `);

    if (activeLoan.recordset.length > 0) {
      return res.json({
        success: false,
        message: 'Buku tidak bisa dihapus karena masih sedang dipinjam'
      });
    }

    // Cek apakah buku punya riwayat peminjaman
    const loanHistory = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT TOP 1 id
        FROM Peminjaman
        WHERE buku_id = @id
      `);

    if (loanHistory.recordset.length > 0) {
      return res.json({
        success: false,
        message: 'Buku tidak bisa dihapus karena sudah memiliki riwayat peminjaman'
      });
    }

    const imageUrl = bookResult.recordset[0].image_url;

    await pool.request()
  .input('id', sql.Int, id)
  .query(`
    DELETE FROM BukuCopy
    WHERE buku_id = @id
  `);

    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM Buku
        WHERE id = @id
      `);

    if (imageUrl) {
      const imagePath = path.join(__dirname, imageUrl.replace('/uploads/', 'uploads/'));

      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({
      success: true,
      message: 'Buku berhasil dihapus'
    });

  } catch (err) {
    console.error('Delete Book Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Gagal menghapus buku'
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
        A.id,
        A.custom_id,
        A.name,
        A.nim,
        COALESCE(A.departemen, A.jurusan) AS departemen,
        A.prodi,
        A.jenis AS type,
        A.email,
        COALESCE(U.role, A.jenis) AS role,
        'aktif' AS status,
        A.phone,
        A.address,
        A.photo_url,
        A.profile_completed,
        CONVERT(varchar, A.created_at, 23) AS joinDate
      FROM Anggota A
      LEFT JOIN Users U ON A.email = U.email
      ORDER BY A.id DESC
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

  const {
    name,
    nim,
    departemen,
    prodi,
    type,
    email,
    phone,
    address
  } = req.body;

  const photo_url = req.file
    ? `/uploads/members/${req.file.filename}`
    : null;

const incomingRole = type || req.body.role || null;

const jenis =
  incomingRole === 'petugas'
    ? 'staff'
    : incomingRole;

const userRole =
  jenis === 'staff'
    ? 'petugas'
    : jenis;

  const profileCompleted =
  name && nim && email && phone && address
    ? (
        jenis === 'staff' ||
        jenis === 'petugas' ||
        (
          departemen &&
          prodi
        )
      )
    : null;
    

  try {
    const pool = await sql.connect(dbConfig);

    const anggotaCheck = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id, email
        FROM Anggota
        WHERE id = @id
      `);

    if (anggotaCheck.recordset.length === 0) {
      return res.json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const oldEmail = anggotaCheck.recordset[0].email;

    await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.VarChar, name)
      .input('nim', sql.VarChar, nim)
      .input('jurusan', sql.VarChar, departemen || prodi || null)
      .input('departemen', sql.VarChar, departemen || null)
      .input('prodi', sql.VarChar, prodi || null)
      .input('jenis', sql.VarChar, jenis)
      .input('email', sql.VarChar, email || null)
      .input('phone', sql.VarChar, phone || null)
      .input('address', sql.VarChar, address || null)
      .input('photo_url', sql.VarChar, photo_url)
      .input('profile_completed', sql.Bit, profileCompleted === null ? null : profileCompleted ? 1 : 0)
      .query(`
        UPDATE Anggota
        SET
          name = COALESCE(@name, name),
nim = COALESCE(@nim, nim),
jurusan = COALESCE(@jurusan, jurusan),
departemen = COALESCE(@departemen, departemen),
prodi = COALESCE(@prodi, prodi),
jenis = COALESCE(@jenis, jenis),
email = COALESCE(@email, email),
phone = COALESCE(@phone, phone),
address = COALESCE(@address, address),
photo_url = COALESCE(@photo_url, photo_url),
profile_completed = COALESCE(@profile_completed, profile_completed)
        WHERE id = @id
      `);

    if (oldEmail) {
  await pool.request()
    .input('oldEmail', sql.VarChar, oldEmail)
    .input('username', sql.VarChar, name || null)
    .input('email', sql.VarChar, email || null)
    .input('role', sql.VarChar, userRole)
    .query(`
      UPDATE Users
      SET username = COALESCE(@username, username),
          email = COALESCE(@email, email),
          role = COALESCE(@role, role)
      WHERE email = COALESCE(@oldEmail, @email)
    `);
}

    const updated = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          A.id,
          A.custom_id,
          A.name,
          A.nim,
          COALESCE(A.departemen, A.jurusan) AS departemen,
          A.prodi,
          A.jenis AS type,
          A.email,
          COALESCE(U.role, A.jenis) AS role,
          'aktif' AS status,
          A.phone,
          A.address,
          A.photo_url,
          A.profile_completed,
          CONVERT(varchar, A.created_at, 23) AS joinDate
        FROM Anggota A
        LEFT JOIN Users U ON A.email = U.email
        WHERE A.id = @id
      `);

    res.json({
      success: true,
      message: 'Anggota berhasil diupdate',
      member: updated.recordset[0]
    });

  } catch (err) {
    console.error('Update Member Error:', err);

    res.status(500).json({
      success: false,
      message: err.message || 'Gagal mengupdate anggota'
    });
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
    P.buku_id AS bookId,
    P.copy_id AS copyId,
    P.copy_code AS copyCode,
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
      SELECT 
  P.id,
  P.buku_id AS bookId,
  P.copy_id AS copyId,
  P.copy_code AS copyCode,
  B.no_induk AS bookCode,
  B.title AS bookTitle,
  B.image_url,
  P.status,
  P.denda,
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

    const booksResult = await pool.request().query(`
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

    const copiesResult = await pool.request().query(`
      SELECT
        id,
        buku_id AS bookId,
        copy_code,
        status
      FROM BukuCopy
      ORDER BY buku_id, id
    `);

    const copiesByBook = {};

    copiesResult.recordset.forEach(copy => {
      if (!copiesByBook[copy.bookId]) copiesByBook[copy.bookId] = [];
      copiesByBook[copy.bookId].push(copy);
    });

    const books = booksResult.recordset.map(book => ({
      ...book,
      copies: copiesByBook[book.id] || []
    }));

    res.json({
      success: true,
      books
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
  const { memberId, bookId, copyId, copyCode } = req.body;

  if (!memberId || !bookId || !copyId) {
    return res.status(400).json({
      success: false,
      message: 'memberId, bookId, dan copyId wajib dikirim'
    });
  }

  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const copyResult = await new sql.Request(transaction)
      .input('bookId', sql.Int, bookId)
      .input('copyId', sql.Int, copyId)
      .query(`
        SELECT
          C.id AS copyId,
          C.copy_code,
          C.status AS copyStatus,
          B.id AS bookId,
          B.title,
          B.available
        FROM BukuCopy C
        JOIN Buku B ON C.buku_id = B.id
        WHERE C.id = @copyId
          AND C.buku_id = @bookId
      `);

    if (copyResult.recordset.length === 0) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: 'Copy buku tidak ditemukan'
      });
    }

    const copy = copyResult.recordset[0];

    if (copy.copyStatus !== 'available') {
      await transaction.rollback();
      return res.json({
        success: false,
        message: 'Copy buku sedang tidak tersedia'
      });
    }

    const memberResult = await new sql.Request(transaction)
  .input('memberId', sql.Int, memberId)
  .query(`
    SELECT
      id,
      name,
      jenis,
      nim,
      departemen,
      prodi,
      phone,
      address,
      profile_completed
    FROM Anggota
    WHERE id = @memberId
  `);

    if (memberResult.recordset.length === 0) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const member = memberResult.recordset[0];
    const memberType = String(member.jenis || '').toLowerCase();
    const rule = LOAN_RULES[memberType];

    const isProfileCompleted =
  member.profile_completed === true ||
  member.profile_completed === 1;

if (!isProfileCompleted) {
  await transaction.rollback();

  return res.json({
    success: false,
    message: `${member.name} harus melengkapi profil terlebih dahulu sebelum meminjam buku`
  });
}

    if (!rule) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: `${member.name} tidak memiliki hak peminjaman`
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
        message: `${member.name} sudah mencapai batas maksimal peminjaman`
      });
    }

    const sameBookResult = await new sql.Request(transaction)
      .input('memberId', sql.Int, memberId)
      .input('bookId', sql.Int, bookId)
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
        message: 'Anggota sudah meminjam buku ini dan belum mengembalikannya'
      });
    }

    const insertedLoan = await new sql.Request(transaction)
      .input('buku_id', sql.Int, bookId)
      .input('anggota_id', sql.Int, memberId)
      .input('copy_id', sql.Int, copy.copyId)
      .input('copy_code', sql.VarChar, copy.copy_code)
      .input('hariPinjam', sql.Int, rule.hariPinjam)
      .query(`
        INSERT INTO Peminjaman
        (
          buku_id,
          anggota_id,
          copy_id,
          copy_code,
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
          @copy_id,
          @copy_code,
          CAST(GETDATE() AS DATE),
          DATEADD(DAY, @hariPinjam, CAST(GETDATE() AS DATE)),
          NULL,
          0,
          0,
          0,
          'dipinjam'
        );

        SELECT CAST(SCOPE_IDENTITY() AS int) AS id;
      `);

    const loanId = insertedLoan.recordset[0].id;

    await new sql.Request(transaction)
      .input('copyId', sql.Int, copy.copyId)
      .query(`
        UPDATE BukuCopy
        SET status = 'borrowed'
        WHERE id = @copyId
      `);

    await new sql.Request(transaction)
      .input('bookId', sql.Int, bookId)
      .query(`
        UPDATE Buku
        SET available = CASE
          WHEN available > 0 THEN available - 1
          ELSE 0
        END
        WHERE id = @bookId
      `);

    const loanResult = await new sql.Request(transaction)
      .input('loanId', sql.Int, loanId)
      .query(`
        SELECT
          P.id,
          P.buku_id AS bookId,
          P.copy_id AS copyId,
          P.copy_code AS copyCode,
          CONVERT(varchar, P.tgl_pinjam, 23) AS loanDate,
          CONVERT(varchar, P.tgl_jatuh_tempo, 23) AS dueDate,
          P.status
        FROM Peminjaman P
        WHERE P.id = @loanId
      `);

    await transaction.commit();

    res.json({
      success: true,
      message: 'Peminjaman berhasil',
      loan: loanResult.recordset[0]
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
          P.copy_id,
          P.copy_code,
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

  if (loan.copy_id) {
  await new sql.Request(transaction)
    .input('copyId', sql.Int, loan.copy_id)
    .query(`
      UPDATE BukuCopy
      SET status = 'available'
      WHERE id = @copyId
    `);
}

    await new sql.Request(transaction)
      .input('buku_id', sql.Int, loan.buku_id)
      .query(`
        UPDATE Buku
SET available =
  CASE
    WHEN available + 1 > stock THEN stock
    ELSE available + 1
  END
WHERE id = @buku_id
      `);

    await transaction.commit();

  res.json({
  success: true,
  message: denda > 0
    ? 'Pengembalian berhasil. Denda telah dibayar di tempat'
    : 'Pengembalian berhasil',
  denda,
  lateDays,
  dendaBayar: true,
  bookId: loan.buku_id,
  copyId: loan.copy_id,
  copyCode: loan.copy_code
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

const ADMIN_EMAIL = 'admin.perpus@unesa.ac.id';

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const isMahasiswaEmail = (email) =>
  normalizeEmail(email).endsWith('@mhs.unesa.ac.id');

const isDosenOrStaffEmail = (email) =>
  normalizeEmail(email).endsWith('@unesa.ac.id') &&
  !normalizeEmail(email).endsWith('@mhs.unesa.ac.id');

const isAllowedUnesaEmail = (email) =>
  isMahasiswaEmail(email) || isDosenOrStaffEmail(email);

const getIdentityType = (email) =>
  isMahasiswaEmail(email) ? 'mahasiswa' : 'dosen';

const getDefaultRole = (email) => {
  const clean = normalizeEmail(email);

  if (clean === ADMIN_EMAIL) return 'admin';
  if (isMahasiswaEmail(clean)) return 'mahasiswa';

  return 'dosen';
};

async function generateCustomId(pool, jenis, role = '') {
  const prefix =
    role === 'petugas'
      ? 'PS'
      : jenis === 'mahasiswa'
        ? 'MH'
        : 'DS';

  const result = await pool.request()
    .input('prefixLike', sql.VarChar, `${prefix}%`)
    .query(`
      SELECT
        ISNULL(MAX(TRY_CAST(SUBSTRING(custom_id, 3, 10) AS INT)), 0) + 1 AS nextNo
      FROM Anggota
      WHERE custom_id LIKE @prefixLike
    `);

  return `${prefix}${String(result.recordset[0].nextNo).padStart(3, '0')}`;
}

app.put('/api/members/:id/promote-petugas', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);

    const anggotaResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id, name, email, jenis
        FROM Anggota
        WHERE id = @id
      `);

    if (anggotaResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const anggota = anggotaResult.recordset[0];
    const email = normalizeEmail(anggota.email);

    if (!isDosenOrStaffEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Hanya email @unesa.ac.id yang bisa dijadikan petugas'
      });
    }

    const userCheck = await pool.request()
      .input('email', sql.VarChar, email)
      .query(`
        SELECT id
        FROM Users
        WHERE email = @email
      `);

    if (userCheck.recordset.length > 0) {
      await pool.request()
        .input('email', sql.VarChar, email)
        .query(`
          UPDATE Users
          SET role = 'petugas'
          WHERE email = @email
        `);
    } else {
      await pool.request()
        .input('username', sql.VarChar, anggota.name)
        .input('email', sql.VarChar, email)
        .input('password', sql.VarChar, null)
        .input('role', sql.VarChar, 'petugas')
        .query(`
          INSERT INTO Users (username, email, password, role)
          VALUES (@username, @email, @password, @role)
        `);
    }

    // type tetap dosen, karena petugas adalah role, bukan type
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        UPDATE Anggota
        SET jenis = 'dosen'
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Anggota berhasil dijadikan petugas'
    });

  } catch (err) {
    console.error('Promote Petugas Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menjadikan petugas'
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