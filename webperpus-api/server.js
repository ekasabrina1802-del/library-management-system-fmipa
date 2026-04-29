const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors()); // agar frontend bisa akses API

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

// 🔹 Route LOGIN
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request()
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .query(`
                SELECT username, email, role 
                FROM Users 
                WHERE email = @email AND password = @password
            `);

        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            // ✅ Mapping username → name (INI YANG PENTING)
            res.json({
                success: true,
                user: {
                    name: user.username,
                    email: user.email,
                    role: user.role,
                    avatar: user.username.charAt(0).toUpperCase() // optional
                }
            });

        } else {
            res.status(401).json({
                success: false,
                message: 'Email atau Password salah!'
            });
        }

    } catch (err) {
        console.error("Database Error:", err);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan pada server'
        });
    }
});

app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let pool = await sql.connect(dbConfig);

        // ✅ 1. CEK EMAIL DULU (INI HARUS DI ATAS)
        const checkUser = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM Users WHERE email = @email');

        if (checkUser.recordset.length > 0) {
            return res.json({
                success: false,
                message: 'Email sudah terdaftar'
            });
        }

        // ✅ 2. INSERT KE USERS
        let resultUser = await pool.request()
            .input('username', sql.VarChar, name)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, password)
            .input('role', sql.VarChar, 'mahasiswa')
            .query(`
                INSERT INTO Users (username, email, password, role)
                OUTPUT INSERTED.id
                VALUES (@username, @email, @password, @role)
            `);

        const userId = resultUser.recordset[0].id;

        // ✅ 3. INSERT KE ANGGOTA
        await pool.request()
            .input('user_id', sql.Int, userId)
            .input('nama', sql.VarChar, name)
            .input('email', sql.VarChar, email)
            .input('jenis', sql.VarChar, 'mahasiswa')
            .input('nim', sql.VarChar, 'AUTO' + userId)
            .input('jurusan', sql.VarChar, null)
            .query(`
                INSERT INTO Anggota (user_id, nama, email, jenis, nim, jurusan)
                VALUES (@user_id, @nama, @email, @jenis, @nim, @jurusan)
            `);

        // ✅ 4. SUCCESS
        res.json({ success: true });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
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
        description
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

app.post('/api/books', async (req, res) => {
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
      .query(`
        INSERT INTO Buku
        (no_induk, no_klasifikasi, title, author, publisher, year, isbn, category, stock, available, description)
        VALUES
        (@no_induk, @no_klasifikasi, @title, @author, @publisher, @year, @isbn, @category, @stock, @available, @description)
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

app.put('/api/books/:id', async (req, res) => {
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
          description = @description
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

app.delete('/api/books/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input('id', sql.Int, id)
      .query(`DELETE FROM Buku WHERE id = @id`);

    res.json({
      success: true,
      message: 'Buku berhasil dihapus'
    });

  } catch (err) {
    console.error('Delete Book Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus buku'
    });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT
        id,
        user_id,
        nama AS name,
        nim,
        jurusan AS departemen,
        jurusan AS prodi,
        jenis AS type,
        email,
        'aktif' AS status,
        CAST(NULL AS VARCHAR(20)) AS phone,
        CAST(NULL AS VARCHAR(255)) AS address,
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

app.post('/api/members', async (req, res) => {
  const { name, nim, departemen, prodi, type, email } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input('nama', sql.VarChar, name)
      .input('nim', sql.VarChar, nim)
      .input('jurusan', sql.VarChar, departemen || prodi || null)
      .input('jenis', sql.VarChar, type)
      .input('email', sql.VarChar, email || null)
      .query(`
        INSERT INTO Anggota
        (nama, nim, jurusan, jenis, email)
        VALUES
        (@nama, @nim, @jurusan, @jenis, @email)
      `);

    res.json({
      success: true,
      message: 'Anggota berhasil ditambahkan'
    });

  } catch (err) {
    console.error('Add Member Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal menambahkan anggota'
    });
  }
});

app.put('/api/members/:id', async (req, res) => {
  const { id } = req.params;
  const { name, nim, departemen, prodi, type, email } = req.body;

  try {
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input('id', sql.Int, id)
      .input('nama', sql.VarChar, name)
      .input('nim', sql.VarChar, nim)
      .input('jurusan', sql.VarChar, departemen || prodi || null)
      .input('jenis', sql.VarChar, type)
      .input('email', sql.VarChar, email || null)
      .query(`
        UPDATE Anggota
        SET
          nama = @nama,
          nim = @nim,
          jurusan = @jurusan,
          jenis = @jenis,
          email = @email
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Anggota berhasil diupdate'
    });

  } catch (err) {
    console.error('Update Member Error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Gagal mengupdate anggota'
    });
  }
});

app.get('/api/loans', async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT
        P.id,
        B.no_induk AS bookCode,
        B.title AS bookTitle,
        A.id AS memberId,
        A.nama AS memberName,
        A.jenis AS memberType,
        CONVERT(varchar, P.tgl_pinjam, 23) AS loanDate,
        CONVERT(varchar, P.tgl_jatuh_tempo, 23) AS dueDate,
        CONVERT(varchar, P.tgl_kembali, 23) AS returnDate,
        P.denda,
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
        SELECT id, nama, jenis
        FROM Anggota
        WHERE id = @memberId
      `);

    if (memberResult.recordset.length === 0) {
      await transaction.rollback();
      return res.json({ success: false, message: 'Anggota tidak ditemukan' });
    }

    await new sql.Request(transaction)
      .input('buku_id', sql.Int, book.id)
      .input('anggota_id', sql.Int, memberId)
      .query(`
        INSERT INTO Peminjaman
        (buku_id, anggota_id, tgl_pinjam, tgl_jatuh_tempo, tgl_kembali, denda, status)
        VALUES
        (@buku_id, @anggota_id, CAST(GETDATE() AS DATE), DATEADD(DAY, 1, CAST(GETDATE() AS DATE)), NULL, 0, 'dipinjam')
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

app.put('/api/loans/return/:bookCode', async (req, res) => {
  const { bookCode } = req.params;

  try {
    const pool = await sql.connect(dbConfig);
    const transaction = new sql.Transaction(pool);

    await transaction.begin();

    const loanResult = await new sql.Request(transaction)
      .input('bookCode', sql.VarChar, bookCode)
      .query(`
        SELECT TOP 1
          P.id,
          P.buku_id,
          P.tgl_jatuh_tempo,
          B.title AS bookTitle,
          A.nama AS memberName
        FROM Peminjaman P
        JOIN Buku B ON P.buku_id = B.id
        JOIN Anggota A ON P.anggota_id = A.id
        WHERE B.no_induk = @bookCode
          AND P.status IN ('dipinjam', 'terlambat')
        ORDER BY P.id DESC
      `);

    if (loanResult.recordset.length === 0) {
      await transaction.rollback();
      return res.json({
        success: false,
        message: 'Tidak ada peminjaman aktif untuk kode buku ini'
      });
    }

    const loan = loanResult.recordset[0];

    const dendaResult = await new sql.Request(transaction)
      .input('dueDate', sql.Date, loan.tgl_jatuh_tempo)
      .query(`
        SELECT 
          CASE 
            WHEN DATEDIFF(DAY, @dueDate, CAST(GETDATE() AS DATE)) > 0
            THEN DATEDIFF(DAY, @dueDate, CAST(GETDATE() AS DATE)) * 10000
            ELSE 0
          END AS denda
      `);

    const denda = dendaResult.recordset[0].denda;

    await new sql.Request(transaction)
      .input('id', sql.Int, loan.id)
      .input('denda', sql.Int, denda)
      .query(`
        UPDATE Peminjaman
        SET
          tgl_kembali = CAST(GETDATE() AS DATE),
          denda = @denda,
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
      message: 'Pengembalian berhasil',
      denda
    });

  } catch (err) {
    console.error('Return Loan Error:', err);
    res.status(500).json({
      success: false,
      message: 'Gagal memproses pengembalian'
    });
  }
});





// 🔹 Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend WebPerpusFMIPA jalan di http://localhost:${PORT}`);
});

