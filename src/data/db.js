// ===== MOCK DATABASE =====
// In a real app, replace this with API calls to your backend (Node.js + MySQL/PostgreSQL)

export const USERS = [
  { id: 1, name: 'Admin Perpustakaan', email: 'admin@fmipa.ac.id', password: 'admin123', role: 'admin', avatar: 'AP' },
  { id: 2, name: 'Budi Santoso', email: 'petugas@fmipa.ac.id', password: 'petugas123', role: 'petugas', avatar: 'BS' },
];

export const BOOKS = [
  { id: 'B001', code: 'MTK-001', title: 'Kalkulus Lanjutan', author: 'James Stewart', publisher: 'Erlangga', year: 2022, isbn: '978-0-538-49781-7', discipline: 'Mathematics', stock: 5, available: 3, cover: 'MTK', description: 'Buku kalkulus komprehensif untuk mahasiswa sains dan teknik.' },
  { id: 'B002', code: 'FIS-001', title: 'Fisika Universitas', author: 'Hugh D. Young', publisher: 'Pearson', year: 2021, isbn: '978-0-13-411513-0', discipline: 'Physics', stock: 4, available: 2, cover: 'FIS', description: 'Fisika dasar dan lanjutan untuk program universitas.' },
  { id: 'B003', code: 'KIM-001', title: 'Kimia Organik', author: 'Paula Yurkanis Bruice', publisher: 'Pearson', year: 2020, isbn: '978-0-13-400767-5', discipline: 'Chemistry', stock: 3, available: 3, cover: 'KIM', description: 'Kimia organik lengkap dengan mekanisme reaksi.' },
  { id: 'B004', code: 'BIO-001', title: 'Biologi Sel', author: 'Bruce Alberts', publisher: 'W.W. Norton', year: 2022, isbn: '978-0-393-88410-6', discipline: 'Biology', stock: 6, available: 4, cover: 'BIO', description: 'Pengantar komprehensif biologi molekuler dan sel.' },
  { id: 'B005', code: 'MTK-002', title: 'Aljabar Linear', author: 'Gilbert Strang', publisher: 'Wellesley', year: 2019, isbn: '978-0-9802327-7-6', discipline: 'Mathematics', stock: 4, available: 1, cover: 'MTK', description: 'Aljabar linear dan aplikasinya dalam berbagai bidang.' },
  { id: 'B006', code: 'FIS-002', title: 'Mekanika Kuantum', author: 'David Griffiths', publisher: 'Cambridge', year: 2021, isbn: '978-1-107-18963-8', discipline: 'Physics', stock: 2, available: 0, cover: 'FIS', description: 'Pengantar mekanika kuantum untuk fisikawan.' },
  { id: 'B007', code: 'KIM-002', title: 'Kimia Analitik', author: 'Daniel Harris', publisher: 'Freeman', year: 2022, isbn: '978-1-319-35791-0', discipline: 'Chemistry', stock: 5, available: 3, cover: 'KIM', description: 'Teknik dan metode kimia analitik modern.' },
  { id: 'B008', code: 'MTK-003', title: 'Statistika Matematika', author: 'Walpole & Myers', publisher: 'Pearson', year: 2020, isbn: '978-0-13-461827-1', discipline: 'Mathematics', stock: 3, available: 2, cover: 'MTK', description: 'Probabilitas dan statistika untuk sains dan teknik.' },
  { id: 'B009', code: 'BIO-002', title: 'Ekologi', author: 'Robert Ricklefs', publisher: 'Freeman', year: 2021, isbn: '978-1-319-32209-5', discipline: 'Biology', stock: 4, available: 4, cover: 'BIO', description: 'Prinsip-prinsip ekologi dan lingkungan.' },
  { id: 'B010', code: 'FIS-003', title: 'Optika Modern', author: 'Eugene Hecht', publisher: 'Pearson', year: 2022, isbn: '978-0-13-397024-3', discipline: 'Physics', stock: 3, available: 2, cover: 'FIS', description: 'Optika fisik dan geometri untuk fisikawan.' },
];

export const MEMBERS = [
  { id: 'M001', name: 'Siti Rahayu', nim: '20010001', departemen: 'Matematika', prodi: 'S1 Matematika', type: 'mahasiswa', joinDate: '2023-08-01', status: 'aktif', email: 'siti@mahasiswa.unesa.ac.id', phone: '081234567890', address: 'Surabaya' },
  { id: 'M002', name: 'Dr. Ahmad Fauzi', nim: '198502012010121001', departemen: 'Fisika', prodi: 'Dosen Fisika', type: 'dosen', joinDate: '2022-01-10', status: 'aktif', email: 'ahmad.fauzi@fmipa.ac.id', phone: '081298765432', address: 'Surabaya' },
  { id: 'M003', name: 'Budi Prasetyo', nim: '21010002', departemen: 'Kimia', prodi: 'S1 Kimia', type: 'mahasiswa', joinDate: '2024-02-14', status: 'aktif', email: 'budi@mahasiswa.unesa.ac.id', phone: '082345678901', address: 'Sidoarjo' },
  { id: 'M004', name: 'Dewi Anggraini', nim: '20010003', departemen: 'Biologi', prodi: 'S1 Biologi', type: 'mahasiswa', joinDate: '2023-08-01', status: 'aktif', email: 'dewi@mahasiswa.unesa.ac.id', phone: '083456789012', address: 'Gresik' },
  { id: 'M005', name: 'Prof. Rina Susanti', nim: '197803152005012002', departemen: 'Kimia', prodi: 'Dosen Kimia', type: 'dosen', joinDate: '2021-09-05', status: 'aktif', email: 'rina.susanti@fmipa.ac.id', phone: '087654321098', address: 'Surabaya' },
  { id: 'M006', name: 'Fajar Nugroho', nim: '22010004', departemen: 'Matematika', prodi: 'S1 Matematika', type: 'mahasiswa', joinDate: '2024-08-01', status: 'aktif', email: 'fajar@mahasiswa.unesa.ac.id', phone: '085678901234', address: 'Surabaya' },
  { id: 'M007', name: 'Nur Azizah', nim: '21010005', departemen: 'Fisika', prodi: 'S1 Fisika', type: 'mahasiswa', joinDate: '2024-02-20', status: 'aktif', email: 'nur@mahasiswa.unesa.ac.id', phone: '089876543210', address: 'Mojokerto' },
  { id: 'M008', name: 'Indra Wahyu', nim: '20010006', departemen: 'Biologi', prodi: 'S1 Biologi', type: 'mahasiswa', joinDate: '2023-08-10', status: 'tidak aktif', email: 'indra@mahasiswa.unesa.ac.id', phone: '081122334455', address: 'Surabaya' },
  { id: 'M009', name: 'Dr. Hendra Kusuma', nim: '197601102001121001', departemen: 'Matematika', prodi: 'Dosen Matematika', type: 'dosen', joinDate: '2022-03-15', status: 'aktif', email: 'hendra@fmipa.ac.id', phone: '081554433221', address: 'Surabaya' },
  { id: 'M010', name: 'Lina Kartika', nim: '23010007', departemen: 'Kimia', prodi: 'S1 Kimia', type: 'mahasiswa', joinDate: '2025-08-01', status: 'aktif', email: 'lina@mahasiswa.unesa.ac.id', phone: '082233445566', address: 'Lamongan' },
];

export const LOANS = [
  { id: 'L001', bookCode: 'MTK-001', bookTitle: 'Kalkulus Lanjutan', memberId: 'M001', memberName: 'Siti Rahayu', memberType: 'mahasiswa', loanDate: '2025-04-01', dueDate: '2025-04-15', returnDate: null, status: 'dipinjam', denda: 0 },
  { id: 'L002', bookCode: 'FIS-001', bookTitle: 'Fisika Universitas', memberId: 'M002', memberName: 'Dr. Ahmad Fauzi', memberType: 'dosen', loanDate: '2025-03-20', dueDate: '2025-04-20', returnDate: null, status: 'dipinjam', denda: 0 },
  { id: 'L003', bookCode: 'FIS-002', bookTitle: 'Mekanika Kuantum', memberId: 'M007', memberName: 'Nur Azizah', memberType: 'mahasiswa', loanDate: '2025-03-10', dueDate: '2025-03-24', returnDate: null, status: 'terlambat', denda: 30000 },
  { id: 'L004', bookCode: 'MTK-002', bookTitle: 'Aljabar Linear', memberId: 'M003', memberName: 'Budi Prasetyo', memberType: 'mahasiswa', loanDate: '2025-03-15', dueDate: '2025-03-29', returnDate: null, status: 'terlambat', denda: 25000 },
  { id: 'L005', bookCode: 'KIM-001', bookTitle: 'Kimia Organik', memberId: 'M005', memberName: 'Prof. Rina Susanti', memberType: 'dosen', loanDate: '2025-04-10', dueDate: '2025-04-25', returnDate: '2025-04-20', status: 'dikembalikan', denda: 0 },
  { id: 'L006', bookCode: 'BIO-001', bookTitle: 'Biologi Sel', memberId: 'M004', memberName: 'Dewi Anggraini', memberType: 'mahasiswa', loanDate: '2025-04-05', dueDate: '2025-04-19', returnDate: '2025-04-18', status: 'dikembalikan', denda: 0 },
  { id: 'L007', bookCode: 'MTK-003', bookTitle: 'Statistika Matematika', memberId: 'M006', memberName: 'Fajar Nugroho', memberType: 'mahasiswa', loanDate: '2025-04-15', dueDate: '2025-04-29', returnDate: null, status: 'dipinjam', denda: 0 },
  { id: 'L008', bookCode: 'FIS-003', bookTitle: 'Optika Modern', memberId: 'M009', memberName: 'Dr. Hendra Kusuma', memberType: 'dosen', loanDate: '2025-04-02', dueDate: '2025-04-16', returnDate: null, status: 'terlambat', denda: 8000 },
];

export const MONTHLY_LOANS = [
  { month: 'Okt', pinjam: 45, kembali: 40 },
  { month: 'Nov', pinjam: 52, kembali: 48 },
  { month: 'Des', pinjam: 38, kembali: 35 },
  { month: 'Jan', pinjam: 60, kembali: 55 },
  { month: 'Feb', pinjam: 72, kembali: 68 },
  { month: 'Mar', pinjam: 65, kembali: 62 },
  { month: 'Apr', pinjam: 48, kembali: 30 },
];

export const DAILY_LOANS = [
  { day: 'Sen', pinjam: 12, kembali: 8 },
  { day: 'Sel', pinjam: 18, kembali: 15 },
  { day: 'Rab', pinjam: 15, kembali: 12 },
  { day: 'Kam', pinjam: 22, kembali: 18 },
  { day: 'Jum', pinjam: 10, kembali: 9 },
  { day: 'Sab', pinjam: 5, kembali: 4 },
];

export const ACTIVITY_LOG = [
  { id: 1, time: '2025-04-23 09:42', type: 'Peminjaman Buku', desc: 'Siti Rahayu meminjam "Kalkulus Lanjutan"', icon: 'loan' },
  { id: 2, time: '2025-04-23 09:15', type: 'Pendaftaran Anggota', desc: 'Anggota baru: Lina Kartika (Mahasiswa Kimia)', icon: 'member' },
  { id: 3, time: '2025-04-22 16:30', type: 'Pengembalian Buku', desc: 'Dewi Anggraini mengembalikan "Biologi Sel"', icon: 'return' },
  { id: 4, time: '2025-04-22 14:00', type: 'Perhitungan Denda', desc: 'Denda keterlambatan Nur Azizah: Rp 30.000', icon: 'denda' },
  { id: 5, time: '2025-04-22 11:20', type: 'Penambahan Buku', desc: 'Buku baru ditambahkan: "Optika Modern" (FIS-003)', icon: 'book' },
  { id: 6, time: '2025-04-21 10:00', type: 'Cadangan Sistem', desc: 'Backup database otomatis berhasil', icon: 'system' },
  { id: 7, time: '2025-04-21 08:30', type: 'Hapus Buku', desc: 'Buku "Termodinamika Dasar" dihapus dari katalog', icon: 'delete' },
];

export const VISITORS = [
  { date: '2025-04-23', count: 47, mahasiswa: 38, dosen: 9 },
  { date: '2025-04-22', count: 52, mahasiswa: 44, dosen: 8 },
  { date: '2025-04-21', count: 61, mahasiswa: 50, dosen: 11 },
  { date: '2025-04-18', count: 39, mahasiswa: 32, dosen: 7 },
  { date: '2025-04-17', count: 55, mahasiswa: 46, dosen: 9 },
];