// ===== MOCK DATABASE =====
// In a real app, replace this with API calls to your backend (Node.js + MySQL/PostgreSQL)

export const USERS = [
  {
    email: 'admin@fmipa.ac.id',
    password: 'admin123',
    role: 'admin',
  },
  {
    email: 'petugas@fmipa.ac.id',
    password: 'petugas123',
    role: 'petugas',
  },
  {
    email: 'mahasiswa@fmipa.ac.id',
    password: 'mhs123',
    role: 'mahasiswa',
    nama: 'Budi Mahasiswa' // opsional (kalau mau ditampilkan)
  }
];

export const BOOKS = [
  { id: 'B001', no_induk: '00009/FMIPA/2025', no_klasifikasi: '510/STE/k', title: 'Kalkulus Lanjutan', author: 'James Stewart', publisher: 'Erlangga', year: 2022, isbn: '978-0-538-49781-7', category: 'Mathematics', stock: 5, available: 3, cover: 'MTK' },
  { id: 'B002', no_induk: '00010/FMIPA/2025', no_klasifikasi: '530/YOU/f', title: 'Fisika Universitas', author: 'Hugh D. Young', publisher: 'Pearson', year: 2021, isbn: '978-0-13-411513-0', category: 'Physics', stock: 4, available: 2, cover: 'FIS' },
  { id: 'B003', no_induk: '00011/FMIPA/2025', no_klasifikasi: '540/BRU/k', title: 'Kimia Organik', author: 'Paula Yurkanis Bruice', publisher: 'Pearson', year: 2020, isbn: '978-0-13-400767-5', category: 'Chemistry', stock: 3, available: 3, cover: 'KIM' },
  { id: 'B004', no_induk: '00012/FMIPA/2025', no_klasifikasi: '570/ALB/b', title: 'Biologi Sel', author: 'Bruce Alberts', publisher: 'W.W. Norton', year: 2022, isbn: '978-0-393-88410-6', category: 'Biology', stock: 6, available: 4, cover: 'BIO' },
  { id: 'B005', no_induk: '00013/FMIPA/2025', no_klasifikasi: '512/STR/a', title: 'Aljabar Linear', author: 'Gilbert Strang', publisher: 'Wellesley', year: 2019, isbn: '978-0-9802327-7-6', category: 'Mathematics', stock: 4, available: 1, cover: 'MTK' },
  { id: 'B006', no_induk: '00014/FMIPA/2025', no_klasifikasi: '530/GRI/m', title: 'Mekanika Kuantum', author: 'David Griffiths', publisher: 'Cambridge', year: 2021, isbn: '978-1-107-18963-8', category: 'Physics', stock: 2, available: 0, cover: 'FIS' },
  { id: 'B007', no_induk: '00015/FMIPA/2025', no_klasifikasi: '543/HAR/k', title: 'Kimia Analitik', author: 'Daniel Harris', publisher: 'Freeman', year: 2022, isbn: '978-1-319-35791-0', category: 'Chemistry', stock: 5, available: 3, cover: 'KIM' },
  { id: 'B008', no_induk: '00016/FMIPA/2025', no_klasifikasi: '519/WAL/s', title: 'Statistika Matematika', author: 'Walpole & Myers', publisher: 'Pearson', year: 2020, isbn: '978-0-13-461827-1', category: 'Mathematics', stock: 3, available: 2, cover: 'MTK' },
  { id: 'B009', no_induk: '00017/FMIPA/2025', no_klasifikasi: '577/RIC/e', title: 'Ekologi', author: 'Robert Ricklefs', publisher: 'Freeman', year: 2021, isbn: '978-1-319-32209-5', category: 'Biology', stock: 4, available: 4, cover: 'BIO' },
  { id: 'B010', no_induk: '00018/FMIPA/2025', no_klasifikasi: '535/HEC/o', title: 'Optika Modern', author: 'Eugene Hecht', publisher: 'Pearson', year: 2022, isbn: '978-0-13-397024-3', category: 'Physics', stock: 3, available: 2, cover: 'FIS' },
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
  { id: 'L001', bookCode: '00009/FMIPA/2025', bookTitle: 'Kalkulus Lanjutan', memberId: 'M001', memberName: 'Siti Rahayu', memberType: 'mahasiswa', loanDate: '2025-04-01', dueDate: '2025-04-15', returnDate: null, status: 'dipinjam', denda: 0 },
  { id: 'L002', bookCode: '00010/FMIPA/2025', bookTitle: 'Fisika Universitas', memberId: 'M002', memberName: 'Dr. Ahmad Fauzi', memberType: 'dosen', loanDate: '2025-03-20', dueDate: '2025-04-20', returnDate: null, status: 'dipinjam', denda: 0 },
  { id: 'L003', bookCode: '00011/FMIPA/2025', bookTitle: 'Mekanika Kuantum', memberId: 'M007', memberName: 'Nur Azizah', memberType: 'mahasiswa', loanDate: '2025-03-10', dueDate: '2025-03-24', returnDate: null, status: 'terlambat', denda: 30000 },
  { id: 'L004', bookCode: '00012/FMIPA/2025', bookTitle: 'Aljabar Linear', memberId: 'M003', memberName: 'Budi Prasetyo', memberType: 'mahasiswa', loanDate: '2025-03-15', dueDate: '2025-03-29', returnDate: null, status: 'terlambat', denda: 25000 },
  { id: 'L005', bookCode: '00013/FMIPA/2025', bookTitle: 'Kimia Organik', memberId: 'M005', memberName: 'Prof. Rina Susanti', memberType: 'dosen', loanDate: '2025-04-10', dueDate: '2025-04-25', returnDate: '2025-04-20', status: 'dikembalikan', denda: 0 },
  { id: 'L006', bookCode: '00014/FMIPA/2025', bookTitle: 'Biologi Sel', memberId: 'M004', memberName: 'Dewi Anggraini', memberType: 'mahasiswa', loanDate: '2025-04-05', dueDate: '2025-04-19', returnDate: '2025-04-18', status: 'dikembalikan', denda: 0 },
  { id: 'L007', bookCode: '00015/FMIPA/2025', bookTitle: 'Statistika Matematika', memberId: 'M006', memberName: 'Fajar Nugroho', memberType: 'mahasiswa', loanDate: '2025-04-15', dueDate: '2025-04-29', returnDate: null, status: 'dipinjam', denda: 0 },
  { id: 'L008', bookCode: '00016/FMIPA/2025', bookTitle: 'Optika Modern', memberId: 'M009', memberName: 'Dr. Hendra Kusuma', memberType: 'dosen', loanDate: '2025-04-02', dueDate: '2025-04-16', returnDate: null, status: 'terlambat', denda: 8000 },
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
  {
    id: 1,
    no_induk: "00009/FMIPA/2025",
    no_klasifikasi: "541/SHI/d",
    title: "Kalkulus Lanjutan",
    author: "James Stewart",
    category: "Mathematics",
    year: 2022,
    stock: 5,
    available: 3,
    isbn: "978-0-538-49781-7",
    publisher: "Cengage Learning",
    cover: "https://covers.openlibrary.org/b/isbn/9780538497817-L.jpg"
  },
  {
    id: 2,
    no_induk: "000010/FMIPA/2025",
    no_klasifikasi: "542/SHI/d",
    title: "Fisika Universitas",
    author: "Hugh D. Young",
    category: "Physics",
    year: 2021,
    stock: 4,
    available: 2,
    isbn: "978-0-13-411513-1",
    publisher: "Pearson",
    cover: "https://covers.openlibrary.org/b/isbn/9780134115131-L.jpg"
  },
  {
    id: 3,
    no_induk: "000011/FMIPA/2025",
    no_klasifikasi: "543/SHI/d",
    title: "Kimia Organik",
    author: "Paula Yurkanis Bruice",
    category: "Chemistry",
    year: 2020,
    stock: 3,
    available: 3,
    isbn: "978-0-13-400767-2",
    publisher: "Pearson",
    cover: "https://covers.openlibrary.org/b/isbn/9780134007672-L.jpg"
  },
  {
    id: 4,
    no_induk: "000012/FMIPA/2025",
    no_klasifikasi: "544/SHI/d",
    title: "Biologi Sel",
    author: "Bruce Alberts",
    category: "Biology",
    year: 2019,
    stock: 2,
    available: 0,
    isbn: "978-0-8153-4454-0",
    publisher: "Garland Science",
    cover: "https://covers.openlibrary.org/b/isbn/9780815344540-L.jpg"
  },
  {
    id: 5,
    no_induk: "000013/FMIPA/2025",
    no_klasifikasi: "545/SHI/d",
    title: "Optika Modern",
    author: "Eugene Hecht",
    category: "Physics",
    year: 2018,
    stock: 3,
    available: 1,
    isbn: "978-0-321-88500-0",
    publisher: "Pearson",
    cover: "https://covers.openlibrary.org/b/isbn/9780321885000-L.jpg"
  },
  {
    id: 6,
    no_induk: "000014/FMIPA/2025",
    no_klasifikasi: "546/SHI/d",
    title: "Aljabar Linear",
    author: "Gilbert Strang",
    category: "Mathematics",
    year: 2021,
    stock: 4,
    available: 4,
    isbn: "978-0-9802327-7-6",
    publisher: "Wellesley Cambridge Press",
    cover: "https://covers.openlibrary.org/b/isbn/9780980232776-L.jpg"
  }
];
