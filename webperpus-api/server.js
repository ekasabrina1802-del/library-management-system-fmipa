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
            .input('jurusan', sql.VarChar, 'Informatika')
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

// 🔹 Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server Backend WebPerpusFMIPA jalan di http://localhost:${PORT}`);
});

