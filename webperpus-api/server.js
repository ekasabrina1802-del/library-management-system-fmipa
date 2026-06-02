const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');
const { v2: cloudinary } = require('cloudinary');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({
  storage: multer.memoryStorage()
});

const uploadMember = multer({
  storage: multer.memoryStorage()
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const DENDA_PER_HARI = 500;

const LOAN_RULES = {
  mahasiswa: { maxBuku: 3, hariPinjam: 7, maxPerpanjangan: 2 },
  dosen: { maxBuku: 10, hariPinjam: 30, maxPerpanjangan: 2 },
};

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

async function generateCustomId(jenis, role = '') {
  const prefix =
    role === 'petugas'
      ? 'PS'
      : jenis === 'mahasiswa'
        ? 'MH'
        : 'DS';

  const result = await pool.query(`
    SELECT
      COALESCE(MAX(CAST(SUBSTRING(custom_id FROM 3) AS INTEGER)), 0) + 1 AS "nextNo"
    FROM anggota
    WHERE custom_id LIKE $1
  `, [`${prefix}%`]);

  return `${prefix}${String(result.rows[0].nextNo).padStart(3, '0')}`;
}

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const loginResult = await pool.query(`
      SELECT
        u.id AS "userId",
        u.username,
        u.email,
        u.password,
        u.role,
        a.id AS "anggotaId",
        a.nim,
        a.jenis,
        a.custom_id,
        a.photo_url
      FROM users u
      LEFT JOIN anggota a ON u.email = a.email
      WHERE u.email = $1
    `, [email]);

    if (loginResult.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email tidak terdaftar!' });
    }

    const user = loginResult.rows[0];

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Akun ini menggunakan login Google/SSO'
      });
    }

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
        avatar: user.username?.charAt(0)?.toUpperCase() || 'U'
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

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
    const checkUser = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (checkUser.rows.length > 0) {
      return res.json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    const checkAnggota = await pool.query(
      `SELECT * FROM anggota WHERE email = $1`,
      [email]
    );

    let role = 'mahasiswa';

    if (checkAnggota.rows.length > 0) {
      const jenis = checkAnggota.rows[0].jenis;
      role = jenis === 'staff' ? 'petugas' : jenis;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const resultUser = await pool.query(`
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `, [name, email, hashedPassword, role]);

    const userId = resultUser.rows[0].id;

    if (checkAnggota.rows.length === 0) {
      await pool.query(`
        INSERT INTO anggota (name, email, jenis, nim, jurusan)
        VALUES ($1, $2, $3, $4, $5)
      `, [name, email, 'mahasiswa', 'AUTO' + userId, null]);
    }

    res.json({ success: true });

  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
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
    await pool.query(`
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, NULL, $3)
      ON CONFLICT (email)
      DO UPDATE SET username = EXCLUDED.username, role = EXCLUDED.role
    `, [selected.name, selected.email, selected.role]);

    const anggotaCheck = await pool.query(`
      SELECT id FROM anggota WHERE email = $1
    `, [selected.email]);

    if (anggotaCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO anggota
          (custom_id, name, email, jenis, nim, jurusan, departemen, prodi)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, NULL)
      `, [
        selected.customId,
        selected.name,
        selected.email,
        selected.type,
        selected.nim,
        'Perpustakaan FMIPA',
        'Perpustakaan FMIPA'
      ]);
    }

    const result = await pool.query(`
      SELECT
        u.id AS "userId",
        u.username,
        u.email,
        u.role,
        a.id AS "anggotaId",
        a.custom_id,
        a.nim,
        a.jenis AS type,
        a.departemen,
        a.prodi,
        a.phone,
        a.address,
        a.photo_url,
        a.profile_completed
      FROM users u
      LEFT JOIN anggota a ON u.email = a.email
      WHERE u.email = $1
    `, [selected.email]);

    const user = result.rows[0];

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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const defaultRole = getDefaultRole(email);
    const jenis = getIdentityType(email);

    const userCheck = await client.query(`
      SELECT id, role
      FROM users
      WHERE email = $1
    `, [email]);

    let userId;
    let finalRole = defaultRole;

    if (userCheck.rows.length > 0) {
      userId = userCheck.rows[0].id;

      finalRole =
        email === ADMIN_EMAIL
          ? 'admin'
          : userCheck.rows[0].role || defaultRole;

      await client.query(`
        UPDATE users
        SET username = $1, role = $2
        WHERE id = $3
      `, [name, finalRole, userId]);
    } else {
      const insertedUser = await client.query(`
        INSERT INTO users (username, email, password, role)
        VALUES ($1, $2, NULL, $3)
        RETURNING id
      `, [name, email, defaultRole]);

      userId = insertedUser.rows[0].id;
      finalRole = defaultRole;
    }

    const anggotaCheck = await client.query(`
      SELECT id
      FROM anggota
      WHERE email = $1
    `, [email]);

    let anggotaId;

    if (anggotaCheck.rows.length > 0) {
      anggotaId = anggotaCheck.rows[0].id;

      await client.query(`
        UPDATE anggota
        SET
          name = $1,
          jenis = CASE
            WHEN jenis IS NULL THEN $2
            ELSE jenis
          END
        WHERE id = $3
      `, [name, jenis, anggotaId]);
    } else {
      const customId = await generateCustomId(jenis, finalRole);

      const localPart = email.split('@')[0];
      const autoNim = localPart; // mahasiswa & dosen sama-sama dapat local part email
      const insertedAnggota = await client.query(`
        INSERT INTO anggota
          (custom_id, name, email, jenis, nim, jurusan, departemen, prodi, profile_completed)
        VALUES
          ($1, $2, $3, $4, $5, NULL, NULL, NULL, FALSE)
        RETURNING id
      `, [customId, name, email, jenis, autoNim]);

      anggotaId = insertedAnggota.rows[0].id;
    }

    const userResult = await client.query(`
      SELECT
        u.id AS "userId",
        u.username,
        u.email,
        u.role,
        a.id AS "anggotaId",
        a.custom_id,
        a.nim,
        a.jenis AS type,
        a.departemen,
        a.prodi,
        a.phone,
        a.address,
        a.photo_url,
        a.profile_completed
      FROM users u
      LEFT JOIN anggota a ON u.email = a.email
      WHERE u.email = $1
    `, [email]);

    await client.query('COMMIT');

    const user = userResult.rows[0];

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
    await client.query('ROLLBACK');
    console.error('Google Login Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal login Google'
    });
  } finally {
    client.release();
  }
});

app.get('/api/current-user', async (req, res) => {
  const email = normalizeEmail(req.query.email);

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email wajib dikirim'
    });
  }

  try {
    const result = await pool.query(`
      SELECT
        u.id AS "userId",
        u.username,
        u.email,
        u.role,
        a.id AS "anggotaId",
        a.custom_id,
        a.nim,
        a.jenis AS type,
        a.departemen,
        a.prodi,
        a.phone,
        a.address,
        a.photo_url,
        a.profile_completed
      FROM users u
      LEFT JOIN anggota a ON LOWER(TRIM(u.email)) = LOWER(TRIM(a.email))
      WHERE LOWER(TRIM(u.email)) = LOWER(TRIM($1))
    `, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const user = result.rows[0];

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
    console.error('Current User Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data user terbaru'
    });
  }
});

app.get('/api/books', async (req, res) => {
  try {
    const booksResult = await pool.query(`
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
      FROM buku
      ORDER BY id DESC
    `);

    const copiesResult = await pool.query(`
      SELECT
        id,
        buku_id AS "bookId",
        copy_code,
        status
      FROM buku_copy
      ORDER BY buku_id, id
    `);

    const copiesByBook = {};

    copiesResult.rows.forEach(copy => {
      if (!copiesByBook[copy.bookId]) copiesByBook[copy.bookId] = [];
      copiesByBook[copy.bookId].push(copy);
    });

    const books = booksResult.rows.map(book => ({
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

let image_url = null;

const client = await pool.connect();

try {
  await client.query('BEGIN');

  if (req.file) {
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'perpus-fmipa/books'
    );

    image_url = uploadResult.secure_url;

    console.log('Cloudinary book upload success:', image_url);
  }

    const insertedBook = await client.query(`
      INSERT INTO buku
      (no_induk, no_klasifikasi, title, author, publisher, year, isbn, category, stock, available, description, image_url)
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11)
      RETURNING id
    `, [
      no_induk,
      no_klasifikasi,
      title,
      author,
      publisher || null,
      year ? Number(year) : null,
      isbn || null,
      category,
      Number(stock),
      description || null,
      image_url
    ]);

    const bookId = insertedBook.rows[0].id;

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
      await client.query(`
        INSERT INTO buku_copy (buku_id, copy_code, status)
        VALUES ($1, $2, $3)
      `, [bookId, copy.copy_code, copy.status || 'available']);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Buku berhasil ditambahkan'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add Book Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan buku'
    });
  } finally {
    client.release();
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
    const oldBook = await pool.query(`
      SELECT image_url, stock, available
      FROM buku
      WHERE id = $1
    `, [id]);

    if (oldBook.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Buku tidak ditemukan'
      });
    }

    let image_url = oldBook.rows[0]?.image_url || null;

if (req.file) {
  const uploadResult = await uploadToCloudinary(
    req.file.buffer,
    'perpus-fmipa/books'
  );

  image_url = uploadResult.secure_url;
}

    const oldStock = Number(oldBook.rows[0]?.stock ?? 0);
    const oldAvailable = Number(oldBook.rows[0]?.available ?? 0);
    const borrowed = oldStock - oldAvailable;
    const newStock = Number(stock);
    const available = Math.max(0, Math.min(newStock, newStock - borrowed));

    await pool.query(`
      UPDATE buku
      SET
        no_induk = $1,
        no_klasifikasi = $2,
        title = $3,
        author = $4,
        publisher = $5,
        year = $6,
        isbn = $7,
        category = $8,
        stock = $9,
        available = $10,
        description = $11,
        image_url = $12
      WHERE id = $13
    `, [
      no_induk,
      no_klasifikasi,
      title,
      author,
      publisher || null,
      year ? Number(year) : null,
      isbn || null,
      category,
      Number(stock),
      available,
      description || null,
      image_url,
      id
    ]);

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

        if (Number.isInteger(copyId)) {
          const updatedCopy = await pool.query(`
            UPDATE buku_copy
            SET copy_code = $1,
                status = $2
            WHERE id = $3
              AND buku_id = $4
          `, [copy.copy_code, copy.status || 'available', copyId, id]);

          if (updatedCopy.rowCount > 0) continue;
        }

        await pool.query(`
          INSERT INTO buku_copy (buku_id, copy_code, status)
          VALUES ($1, $2, $3)
          ON CONFLICT (copy_code)
          DO UPDATE SET buku_id = EXCLUDED.buku_id,
                        status = EXCLUDED.status
        `, [id, copy.copy_code, copy.status || 'available']);
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
    const bookResult = await pool.query(`
      SELECT image_url
      FROM buku
      WHERE id = $1
    `, [id]);

    if (bookResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Buku tidak ditemukan'
      });
    }

    const activeLoan = await pool.query(`
      SELECT id
      FROM peminjaman
      WHERE buku_id = $1
        AND status IN ('dipinjam', 'terlambat', 'diperpanjang')
      LIMIT 1
    `, [id]);

    if (activeLoan.rows.length > 0) {
      return res.json({
        success: false,
        message: 'Buku tidak bisa dihapus karena masih sedang dipinjam'
      });
    }

    const loanHistory = await pool.query(`
      SELECT id
      FROM peminjaman
      WHERE buku_id = $1
      LIMIT 1
    `, [id]);

    if (loanHistory.rows.length > 0) {
      return res.json({
        success: false,
        message: 'Buku tidak bisa dihapus karena sudah memiliki riwayat peminjaman'
      });
    }

    const imageUrl = bookResult.rows[0].image_url;

    await pool.query(`
      DELETE FROM buku_copy
      WHERE buku_id = $1
    `, [id]);

    await pool.query(`
      DELETE FROM buku
      WHERE id = $1
    `, [id]);

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

app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        a.id,
        a.custom_id,
        a.name,
        a.nim,
        COALESCE(a.departemen, a.jurusan) AS departemen,
        a.prodi,
        a.jenis AS type,
        a.email,
        COALESCE(u.role, a.jenis) AS role,
        'aktif' AS status,
        a.phone,
        a.address,
        a.photo_url,
        a.profile_completed,
        TO_CHAR(a.created_at, 'YYYY-MM-DD') AS "joinDate"
      FROM anggota a
      LEFT JOIN users u ON a.email = u.email
      ORDER BY a.id DESC
    `);

    res.json({
      success: true,
      members: result.rows
    });

  } catch (err) {
    console.error('Get Members Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data anggota'
    });
  }
});

app.post('/api/members', uploadMember.single('photo'), async (req, res) => {
  const { name, nim, departemen, prodi, type, email, phone, address, password } = req.body;

  let photo_url = null;

if (req.file) {
  const uploadResult = await uploadToCloudinary(
    req.file.buffer,
    'perpus-fmipa/members'
  );

  photo_url = uploadResult.secure_url;

  console.log('Cloudinary member upload success:', photo_url);
}

  try {
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan tipe anggota wajib diisi'
      });
    }

    if (type === 'staff') {
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail || !isDosenOrStaffEmail(cleanEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Email staff/petugas harus menggunakan email UNESA (@unesa.ac.id)'
    });
  }

  if (!nim || !phone || !address) {
    return res.status(400).json({
      success: false,
      message: 'Data petugas belum lengkap'
    });
  }

  const checkUser = await pool.query(`
    SELECT id FROM users WHERE email = $1
  `, [cleanEmail]);

  if (checkUser.rows.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Email sudah digunakan sebagai akun login'
    });
  }

  const resultUser = await pool.query(`
    INSERT INTO users (username, email, password, role)
    VALUES ($1, $2, NULL, 'petugas')
    RETURNING id
  `, [name, cleanEmail]);

  const userId = resultUser.rows[0].id;
  const staffNim = nim || `STF${String(userId).padStart(3, '0')}`;
  const customId = await generateCustomId('dosen', 'petugas');

  const inserted = await pool.query(`
    INSERT INTO anggota
      (custom_id, name, nim, jurusan, departemen, prodi, jenis, email, phone, address, photo_url, profile_completed)
    VALUES
      ($1, $2, $3, $4, $5, $6, 'dosen', $7, $8, $9, $10, TRUE)
    RETURNING id
  `, [
    customId,
    name,
    staffNim,
    'Perpustakaan FMIPA',
    'Perpustakaan FMIPA',
    null,
    cleanEmail,
    phone || null,
    address || null,
    photo_url
  ]);

  return res.json({
    success: true,
    message: 'Petugas berhasil ditambahkan',
    id: inserted.rows[0].id,
    photo_url
  });
    }

    const cleanEmail = normalizeEmail(email);

if (!['mahasiswa', 'dosen'].includes(type)) {
  return res.status(400).json({
    success: false,
    message: 'Tipe anggota tidak valid'
  });
}

if (!cleanEmail || !isAllowedUnesaEmail(cleanEmail)) {
  return res.status(400).json({
    success: false,
    message: 'Gunakan email resmi UNESA'
  });
}

if (type === 'mahasiswa' && !isMahasiswaEmail(cleanEmail)) {
  return res.status(400).json({
    success: false,
    message: 'Email mahasiswa harus menggunakan @mhs.unesa.ac.id'
  });
}

if (type === 'dosen' && !isDosenOrStaffEmail(cleanEmail)) {
  return res.status(400).json({
    success: false,
    message: 'Email dosen harus menggunakan @unesa.ac.id'
  });
}

if (!nim || !departemen || !prodi || !phone || !address) {
  return res.status(400).json({
    success: false,
    message: 'Data anggota belum lengkap'
  });
}

const profileCompleted = Boolean(
  name &&
  nim &&
  cleanEmail &&
  phone &&
  address &&
  departemen &&
  prodi
);

const customId = await generateCustomId(type);

const inserted = await pool.query(`
  INSERT INTO anggota
    (custom_id, name, nim, jurusan, departemen, prodi, jenis, email, phone, address, photo_url, profile_completed)
  VALUES
    ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
  RETURNING id
`, [
  customId,
  name,
  nim || null,
  departemen || prodi || null,
  departemen || null,
  prodi || null,
  type,
  cleanEmail,
  phone || null,
  address || null,
  photo_url,
  profileCompleted
]);

    res.json({
      success: true,
      message: 'Anggota berhasil ditambahkan',
      id: inserted.rows[0].id,
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

  let photo_url = null;

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
    if (req.file) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'perpus-fmipa/members'
      );

      photo_url = uploadResult.secure_url;

      console.log('Cloudinary member update upload success:', photo_url);
    }

    const anggotaCheck = await pool.query(`
      SELECT id, email
      FROM anggota
      WHERE id = $1
    `, [id]);

    if (anggotaCheck.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const oldEmail = anggotaCheck.rows[0].email;

    await pool.query(`
      UPDATE anggota
      SET
        name = COALESCE($1, name),
        nim = COALESCE($2, nim),
        jurusan = COALESCE($3, jurusan),
        departemen = COALESCE($4, departemen),
        prodi = COALESCE($5, prodi),
        jenis = COALESCE($6, jenis),
        email = COALESCE($7, email),
        phone = COALESCE($8, phone),
        address = COALESCE($9, address),
        photo_url = COALESCE($10, photo_url),
        profile_completed = COALESCE($11, profile_completed)
      WHERE id = $12
    `, [
      name || null,
      nim || null,
      departemen || prodi || null,
      departemen || null,
      prodi || null,
      jenis || null,
      email || null,
      phone || null,
      address || null,
      photo_url || null,
      profileCompleted === null ? null : Boolean(profileCompleted),
      id
    ]);

    if (oldEmail) {
      await pool.query(`
        UPDATE users
        SET username = COALESCE($1, username),
            email = COALESCE($2, email),
            role = COALESCE($3, role)
        WHERE email = COALESCE($4, $2)
      `, [
        name || null,
        email || null,
        userRole || null,
        oldEmail
      ]);
    }

    const updated = await pool.query(`
      SELECT
        a.id,
        a.custom_id,
        a.name,
        a.nim,
        COALESCE(a.departemen, a.jurusan) AS departemen,
        a.prodi,
        a.jenis AS type,
        a.email,
        COALESCE(u.role, a.jenis) AS role,
        'aktif' AS status,
        a.phone,
        a.address,
        a.photo_url,
        a.profile_completed,
        TO_CHAR(a.created_at, 'YYYY-MM-DD') AS "joinDate"
      FROM anggota a
      LEFT JOIN users u ON a.email = u.email
      WHERE a.id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Anggota berhasil diupdate',
      member: updated.rows[0]
    });

  } catch (err) {
    console.error('Update Member Error:', err);

    res.status(500).json({
      success: false,
      message: err.message || 'Gagal mengupdate anggota'
    });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const anggota = await client.query(`
      SELECT email
      FROM anggota
      WHERE id = $1
    `, [id]);

    if (anggota.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const email = anggota.rows[0].email;

    if (email) {
      await client.query(`
        DELETE FROM users
        WHERE email = $1
      `, [email]);
    }

    await client.query(`
      DELETE FROM anggota
      WHERE id = $1
    `, [id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Anggota berhasil dihapus'
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Delete Member Error:', err);

    res.status(500).json({
      success: false,
      message: err.message
    });
  } finally {
    client.release();
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

  try {
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      'perpus-fmipa/members'
    );

    const photo_url = uploadResult.secure_url;

    console.log('Cloudinary member photo upload success:', photo_url);

    await pool.query(`
      UPDATE anggota
      SET photo_url = $1
      WHERE id = $2
    `, [photo_url, id]);

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

app.put('/api/members/:id/promote-petugas', async (req, res) => {
  const { id } = req.params;

  try {
    const anggotaResult = await pool.query(`
      SELECT id, name, email, jenis
      FROM anggota
      WHERE id = $1
    `, [id]);

    if (anggotaResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const anggota = anggotaResult.rows[0];
    const email = normalizeEmail(anggota.email);

    if (!isDosenOrStaffEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Hanya email @unesa.ac.id yang bisa dijadikan petugas'
      });
    }

    await pool.query(`
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, NULL, 'petugas')
      ON CONFLICT (email)
      DO UPDATE SET role = 'petugas'
    `, [anggota.name, email]);

    await pool.query(`
      UPDATE anggota
      SET jenis = 'dosen'
      WHERE id = $1
    `, [id]);

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

app.get('/api/loans', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id,
        p.buku_id AS "bookId",
        p.copy_id AS "copyId",
        p.copy_code AS "copyCode",
        b.no_induk AS "bookCode",
        b.title AS "bookTitle",
        b.image_url,
        a.id AS "memberId",
        a.name AS "memberName",
        a.jenis AS "memberType",
        TO_CHAR(p.tgl_pinjam, 'YYYY-MM-DD') AS "loanDate",
        TO_CHAR(p.tgl_jatuh_tempo, 'YYYY-MM-DD') AS "dueDate",
       TO_CHAR(p.tgl_kembali, 'YYYY-MM-DD') AS "returnDate",
p.denda,
p.denda_bayar AS "dendaBayar",
p.jumlah_perpanjangan AS "jumlahPerpanjangan",
p.status
      FROM peminjaman p
      JOIN buku b ON p.buku_id = b.id
      JOIN anggota a ON p.anggota_id = a.id
      ORDER BY p.id DESC
    `);

    res.json({
      success: true,
      loans: result.rows
    });

  } catch (err) {
    console.error('Get Loans Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data peminjaman'
    });
  }
});

app.get('/api/loans/user/:nim', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.buku_id AS "bookId",
        p.copy_id AS "copyId",
        p.copy_code AS "copyCode",
        b.no_induk AS "bookCode",
        b.title AS "bookTitle",
        b.image_url,
        p.status,
        p.denda,
        TO_CHAR(p.tgl_pinjam, 'YYYY-MM-DD') AS "loanDate", 
        TO_CHAR(p.tgl_jatuh_tempo, 'YYYY-MM-DD') AS "dueDate"
      FROM peminjaman p
      JOIN buku b ON p.buku_id = b.id 
      JOIN anggota a ON p.anggota_id = a.id
      WHERE a.nim = $1
      ORDER BY p.id DESC
    `, [req.params.nim]);

    res.json({ success: true, loans: result.rows });
  } catch (err) {
    console.error('Get User Loans Error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengambil riwayat' });
  }
});

app.post('/api/loans', async (req, res) => {
  const { memberId, bookId, copyId } = req.body;

  if (!memberId || !bookId || !copyId) {
    return res.status(400).json({
      success: false,
      message: 'memberId, bookId, dan copyId wajib dikirim'
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const copyResult = await client.query(`
      SELECT
        c.id AS "copyId",
        c.copy_code,
        c.status AS "copyStatus",
        b.id AS "bookId",
        b.title,
        b.available
      FROM buku_copy c
      JOIN buku b ON c.buku_id = b.id
      WHERE c.id = $1
        AND c.buku_id = $2
    `, [copyId, bookId]);

    if (copyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({
        success: false,
        message: 'Copy buku tidak ditemukan'
      });
    }

    const copy = copyResult.rows[0];

    if (copy.copyStatus !== 'available') {
      await client.query('ROLLBACK');
      return res.json({
        success: false,
        message: 'Copy buku sedang tidak tersedia'
      });
    }

    const memberResult = await client.query(`
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
      FROM anggota
      WHERE id = $1
    `, [memberId]);

    if (memberResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({
        success: false,
        message: 'Anggota tidak ditemukan'
      });
    }

    const member = memberResult.rows[0];
    const memberType = String(member.jenis || '').toLowerCase();
    const rule = LOAN_RULES[memberType];

    const isProfileCompleted =
      member.profile_completed === true ||
      member.profile_completed === 1;

    if (!isProfileCompleted) {
      await client.query('ROLLBACK');

      return res.json({
        success: false,
        message: `${member.name} harus melengkapi profil terlebih dahulu sebelum meminjam buku`
      });
    }

    if (!rule) {
      await client.query('ROLLBACK');
      return res.json({
        success: false,
        message: `${member.name} tidak memiliki hak peminjaman`
      });
    }

    const activeCountResult = await client.query(`
      SELECT COUNT(*)::int AS total
      FROM peminjaman
      WHERE anggota_id = $1
        AND status IN ('dipinjam', 'terlambat', 'diperpanjang')
    `, [memberId]);

    const activeCount = activeCountResult.rows[0].total;

    if (activeCount >= rule.maxBuku) {
      await client.query('ROLLBACK');
      return res.json({
        success: false,
        message: `${member.name} sudah mencapai batas maksimal peminjaman`
      });
    }

    const sameBookResult = await client.query(`
      SELECT id
      FROM peminjaman
      WHERE anggota_id = $1
        AND buku_id = $2
        AND status IN ('dipinjam', 'terlambat', 'diperpanjang')
      LIMIT 1
    `, [memberId, bookId]);

    if (sameBookResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.json({
        success: false,
        message: 'Anggota sudah meminjam buku ini dan belum mengembalikannya'
      });
    }

    const insertedLoan = await client.query(`
      INSERT INTO peminjaman
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
        $1,
        $2,
        $3,
        $4,
        CURRENT_DATE,
        CURRENT_DATE + ($5 || ' days')::interval,
        NULL,
        0,
        FALSE,
        0,
        'dipinjam'
      )
      RETURNING id
    `, [
      bookId,
      memberId,
      copy.copyId,
      copy.copy_code,
      rule.hariPinjam
    ]);

    const loanId = insertedLoan.rows[0].id;

    await client.query(`
      UPDATE buku_copy
      SET status = 'borrowed'
      WHERE id = $1
    `, [copy.copyId]);

    await client.query(`
      UPDATE buku
      SET available = CASE
        WHEN available > 0 THEN available - 1
        ELSE 0
      END
      WHERE id = $1
    `, [bookId]);

    const loanResult = await client.query(`
      SELECT
        id,
        buku_id AS "bookId",
        copy_id AS "copyId",
        copy_code AS "copyCode",
        TO_CHAR(tgl_pinjam, 'YYYY-MM-DD') AS "loanDate",
        TO_CHAR(tgl_jatuh_tempo, 'YYYY-MM-DD') AS "dueDate",
        status
      FROM peminjaman
      WHERE id = $1
    `, [loanId]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Peminjaman berhasil',
      loan: loanResult.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Add Loan Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan peminjaman'
    });
  } finally {
    client.release();
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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const loanResult = await client.query(`
      SELECT
        p.id,
        p.anggota_id,
        p.tgl_jatuh_tempo,
        p.status,
        p.jumlah_perpanjangan,
        a.jenis AS "memberType",
        a.name AS "memberName",
        b.title AS "bookTitle"
      FROM peminjaman p
      JOIN anggota a ON p.anggota_id = a.id
      JOIN buku b ON p.buku_id = b.id
      WHERE p.id = $1
    `, [id]);

    if (loanResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Data peminjaman tidak ditemukan'
      });
    }

    const loan = loanResult.rows[0];
    const memberType = String(loan.memberType || '').toLowerCase();
    const rule = LOAN_RULES[memberType] || LOAN_RULES.mahasiswa;

    if (!['dipinjam', 'diperpanjang'].includes(loan.status)) {
      await client.query('ROLLBACK');
      return res.json({
        success: false,
        message: 'Peminjaman ini tidak bisa diperpanjang karena statusnya bukan pinjaman aktif'
      });
    }

    const overdueResult = await client.query(`
      SELECT
        CASE
          WHEN $1::date < CURRENT_DATE THEN TRUE
          ELSE FALSE
        END AS "isOverdue"
    `, [loan.tgl_jatuh_tempo]);

    if (overdueResult.rows[0].isOverdue === true) {
      await client.query(`
        UPDATE peminjaman
        SET status = 'terlambat'
        WHERE id = $1
      `, [id]);

      await client.query('COMMIT');

      return res.json({
        success: false,
        message: 'Tidak bisa diperpanjang karena buku sudah terlambat'
      });
    }

    const currentExt = Number(loan.jumlah_perpanjangan || 0);

    if (currentExt >= rule.maxPerpanjangan) {
      await client.query('ROLLBACK');
      return res.json({
        success: false,
        message: `Sudah mencapai batas maksimal perpanjangan (${rule.maxPerpanjangan}x)`
      });
    }

    await client.query(`
      UPDATE peminjaman
      SET
        tgl_jatuh_tempo = tgl_jatuh_tempo + ($1 || ' days')::interval,
        jumlah_perpanjangan = jumlah_perpanjangan + 1,
        status = 'diperpanjang'
      WHERE id = $2
    `, [tambahHari, id]);

    const updatedResult = await client.query(`
      SELECT
        id,
        TO_CHAR(tgl_jatuh_tempo, 'YYYY-MM-DD') AS "dueDate",
        jumlah_perpanjangan AS "jumlahPerpanjangan",
        status
      FROM peminjaman
      WHERE id = $1
    `, [id]);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Peminjaman berhasil diperpanjang',
      loan: updatedResult.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Extend Loan Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memperpanjang peminjaman'
    });
  } finally {
    client.release();
  }
});

app.put('/api/loans/:id/return', async (req, res) => {
  const { id } = req.params;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const loanResult = await client.query(`
      SELECT
        p.id,
        p.buku_id,
        p.tgl_jatuh_tempo,
        p.status,
        p.copy_id,
        p.copy_code,
        b.title AS "bookTitle",
        a.name AS "memberName"
      FROM peminjaman p
      JOIN buku b ON p.buku_id = b.id
      JOIN anggota a ON p.anggota_id = a.id
      WHERE p.id = $1
        AND p.status IN ('dipinjam', 'terlambat', 'diperpanjang')
    `, [id]);

    if (loanResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.json({
        success: false,
        message: 'Peminjaman aktif tidak ditemukan'
      });
    }

    const loan = loanResult.rows[0];

    const dendaResult = await client.query(`
      SELECT
        CASE
          WHEN (CURRENT_DATE - $1::date) > 0
          THEN (CURRENT_DATE - $1::date) * $2
          ELSE 0
        END AS denda,
        CASE
          WHEN (CURRENT_DATE - $1::date) > 0
          THEN (CURRENT_DATE - $1::date)
          ELSE 0
        END AS "lateDays"
    `, [loan.tgl_jatuh_tempo, DENDA_PER_HARI]);

    const denda = Number(dendaResult.rows[0].denda || 0);
    const lateDays = Number(dendaResult.rows[0].lateDays || 0);

    await client.query(`
      UPDATE peminjaman
      SET
        tgl_kembali = CURRENT_DATE,
        denda = $1,
        denda_bayar = TRUE,
        tgl_bayar_denda = CASE
          WHEN $1 > 0 THEN CURRENT_DATE
          ELSE NULL
        END,
        status = 'dikembalikan'
      WHERE id = $2
    `, [denda, loan.id]);

    if (loan.copy_id) {
      await client.query(`
        UPDATE buku_copy
        SET status = 'available'
        WHERE id = $1
      `, [loan.copy_id]);
    }

    await client.query(`
      UPDATE buku
      SET available =
        CASE
          WHEN available + 1 > stock THEN stock
          ELSE available + 1
        END
      WHERE id = $1
    `, [loan.buku_id]);

    await client.query('COMMIT');

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
    await client.query('ROLLBACK');
    console.error('Return Loan By ID Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses pengembalian'
    });
  } finally {
    client.release();
  }
});

app.put('/api/loans/:id/pay-fine', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(`
      UPDATE peminjaman
      SET
        denda_bayar = TRUE,
        tgl_bayar_denda = CURRENT_DATE
      WHERE id = $1
        AND status = 'dikembalikan'
        AND COALESCE(denda, 0) > 0
        AND COALESCE(denda_bayar, FALSE) = FALSE
    `, [id]);

    if (result.rowCount === 0) {
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

// ─── Activity Logs ───────────────────────────────────────────────────────────

app.get('/api/activity-logs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        type,
        description AS desc,
        icon,
        TO_CHAR(created_at + INTERVAL '7 hours', 'DD/MM/YYYY HH24:MI') AS time,
        TO_CHAR(created_at + INTERVAL '7 hours', 'YYYY-MM-DD') AS "dateKey"
      FROM activity_logs
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({
      success: true,
      logs: result.rows
    });

  } catch (err) {
    console.error('Get Activity Logs Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil activity logs'
    });
  }
});


app.post('/api/activity-logs', async (req, res) => {
  const { type, desc, icon } = req.body;

  if (!type || !desc) {
    return res.status(400).json({
      success: false,
      message: 'type dan desc wajib dikirim'
    });
  }

  try {
    await pool.query(`
      INSERT INTO activity_logs (type, description, icon)
      VALUES ($1, $2, $3)
    `, [type, desc, icon || 'info']);

    res.json({
      success: true,
      message: 'Activity log berhasil disimpan'
    });

  } catch (err) {
    console.error('Add Activity Log Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan activity log'
    });
  }
});

const updateOverdueStatus = async () => {
  try {
    const result = await pool.query(`
      UPDATE peminjaman
      SET status = 'terlambat'
      WHERE status IN ('dipinjam', 'diperpanjang')
        AND tgl_jatuh_tempo < CURRENT_DATE
    `);

    if (result.rowCount > 0) {
      console.log(`[System] ${result.rowCount} buku terdeteksi terlambat.`);
    }
  } catch (err) {
    console.error('[System Error] Gagal update status terlambat:', err);
  }
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`Server Backend WebPerpusFMIPA jalan di http://localhost:${PORT}`);
  await updateOverdueStatus();
});