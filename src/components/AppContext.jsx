import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';

const AppContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL;

const ngrokHeaders = {
  'ngrok-skip-browser-warning': 'true'
};

const jsonHeaders = {
  'Content-Type': 'application/json',
  'ngrok-skip-browser-warning': 'true'
};

export function AppProvider({ children }) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    console.log("REMINDERS:", reminders);
  }, [reminders]);

  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [activityLog, setActivityLog] = useState(() => {
    const saved = localStorage.getItem('activityLog');
    return saved ? JSON.parse(saved) : [];
  });

  // ─── Fetch ───────────────────────────────────────────────────────────────────

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/books`, { headers: ngrokHeaders });
      const data = await res.json();
      if (data.success) setBooks(data.books);
    } catch (err) {
      console.error('Gagal ambil data buku:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/members`, { headers: ngrokHeaders });
      const data = await res.json();
      console.log('SAMPLE MEMBER:', JSON.stringify(data.members[0], null, 2));
      if (data.success) {
        const mapped = data.members.map(m => ({
          ...m,
          displayId: m.custom_id || String(m.id),
        }));
        setMembers(mapped);
      }
    } catch (err) {
      console.error('Gagal ambil data anggota:', err);
    }
  };

  const fetchLoans = async () => {
    try {
      const res = await fetch(`${API_URL}/api/loans`, { headers: ngrokHeaders });
      const data = await res.json();
      if (data.success) {
        console.log("LOANS:", data.loans);
        setLoans(data.loans);
      }
    } catch (err) {
      console.error('Gagal ambil data peminjaman:', err);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchMembers();
    fetchLoans();
  }, []);

  // ─── Activity Log ─────────────────────────────────────────────────────────────

  const addLog = (type, desc, icon = 'info') => {
    const now = new Date();
    const time = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    setActivityLog(prev => {
      const updated = [{ id: Date.now(), time, type, desc, icon }, ...prev].slice(0, 100);
      localStorage.setItem('activityLog', JSON.stringify(updated));
      return updated;
    });
  };

  // ─── Books ────────────────────────────────────────────────────────────────────

  const uploadMemberPhoto = async (memberId, file) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch(`${API_URL}/api/members/${memberId}/photo`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await fetchMembers();
        return { success: true, photo_url: data.photo_url };
      }
      return { success: false };
    } catch (err) {
      console.error('Upload photo error:', err);
      return { success: false };
    }
  };

  const addBook = async (book) => {
    try {
      const formData = new FormData();
      Object.keys(book).forEach((key) => {
        if (key === 'copies') {
          formData.append(
            'copies',
            JSON.stringify(book.copies)
          );
        } else {
          formData.append(key, book[key]);
        }
      });
      const res = await fetch(`${API_URL}/api/books`, {
        method: 'POST',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await fetchBooks();
        addLog('book', `Menambahkan buku baru: "${book.title}" (${book.no_induk}) — Copy: ${book.copies?.length || 0}, Kategori: ${book.category}`, 'book');
        return true;
      }
      alert(data.message);
      return false;
    } catch (err) {
      console.error('Gagal tambah buku:', err);
      alert('Gagal menambahkan buku');
      return false;
    }
  };

  const updateBook = async (id, updates) => {
    try {
      const formData = new FormData();
      Object.keys(updates).forEach((key) => {
        if (key === 'copies') {
          formData.append(
            'copies',
            JSON.stringify(updates.copies)
          );
        } else {
          formData.append(key, updates[key]);
        }
      });
      const res = await fetch(`${API_URL}/api/books/${id}`, {
        method: 'PUT',
        headers: { 'ngrok-skip-browser-warning': 'true' },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        await fetchBooks();
        addLog('book', `Memperbarui data buku: "${updates.title}" (ID: ${id}) — Jumlah copy: ${updates.copies?.length || 0}, Kategori: ${updates.category}`, 'book');
        return true;
      }
      alert(data.message);
      return false;
    } catch (err) {
      console.error('Gagal update buku:', err);
      alert('Gagal mengupdate buku');
      return false;
    }
  };

  const deleteBook = async (ids) => {
    try {
      for (const id of ids) {
        const res = await fetch(`${API_URL}/api/books/${id}`, {
          method: 'DELETE',
          headers: ngrokHeaders
        });
        const data = await res.json();
        if (!data.success) {
          alert(data.message);
          return false;
        }
      }
      await fetchBooks();
      addLog('delete', `Menghapus ${ids.length} eksemplar buku dari koleksi (ID: ${ids.join(', ')})`, 'delete');
      return true;
    } catch (err) {
      console.error('Gagal hapus buku:', err);
      alert('Gagal menghapus buku');
      return false;
    }
  };

  // ─── Members ──────────────────────────────────────────────────────────────────

  const getField = (obj, key) => {
    if (obj instanceof FormData) return obj.get(key);
    return obj?.[key];
  };

  const addMember = async (member) => {
    try {
      const isFormData = member instanceof FormData;
      const res = await fetch(`${API_URL}/api/members`, {
        method: 'POST',
        headers: isFormData ? { 'ngrok-skip-browser-warning': 'true' } : jsonHeaders,
        body: isFormData ? member : JSON.stringify(member)
      });
      const data = await res.json();
      if (data.success) {
        await fetchMembers();
        const name = getField(member, 'name');
        const nim = getField(member, 'nim');
        const type = getField(member, 'type');
        const prodi = getField(member, 'prodi');
        const departemen = getField(member, 'departemen');
        addLog('member', `Mendaftarkan anggota baru: ${name || '-'} (${nim || '-'}) — ${type || '-'}, ${prodi || departemen || '-'}`, 'member');
        return true;
      }
      alert(data.message || 'Gagal menambahkan anggota');
      return false;
    } catch (err) {
      console.error('Gagal tambah anggota:', err);
      alert('Gagal menambahkan anggota');
      return false;
    }
  };

  const updateMember = async (id, updates) => {
    try {
      const isFormData = updates instanceof FormData;
      const res = await fetch(`${API_URL}/api/members/${id}`, {
        method: 'PUT',
        headers: isFormData ? { 'ngrok-skip-browser-warning': 'true' } : jsonHeaders,
        body: isFormData ? updates : JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        await fetchMembers();
        const name = getField(updates, 'name');
        const nim = getField(updates, 'nim');
        const email = getField(updates, 'email');
        addLog('member', `Memperbarui data anggota: ${name || '-'} (${nim || '-'}) — ${email || '-'}`, 'member');
        return true;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const deleteMember = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/members/${id}`, {
        method: 'DELETE',
        headers: ngrokHeaders
      });
      const data = await res.json();
      if (data.success) {
        await fetchMembers();
        addLog('delete', `Menghapus data anggota ID ${id}`, 'delete');
        return true;
      }
      alert(data.message || 'Delete gagal');
      return false;
    } catch (err) {
      console.error('DELETE ERROR:', err);
      alert('Backend delete error');
      return false;
    }
  };

  // ─── Loans ────────────────────────────────────────────────────────────────────

  /**
   * Tambah peminjaman baru.
   * Backend diharapkan menghitung due_date sesuai tipe anggota:
   *   mahasiswa → +7 hari, dosen → +30 hari
   * Response: { success, loan: { id, dueDate, memberName, bookTitle, ... }, message }
   */
const addLoan = async ({ memberId, bookId, copyId, copyCode }) => {
  try {
    const res = await fetch(`${API_URL}/api/loans`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({
        memberId,
        bookId,
        copyId,
        copyCode
      })
    });

    const data = await res.json();

    if (data.success) {
      await fetchBooks();
      await fetchLoans();

      addLog(
        'loan',
        `Copy buku "${copyCode}" dipinjam oleh anggota ID ${memberId}`,
        'loan'
      );

      return {
        success: true,
        loan: data.loan || null
      };
    }

    return {
      success: false,
      message: data.message || 'Gagal memproses peminjaman'
    };

  } catch (err) {
    console.error('Gagal tambah peminjaman:', err);

    return {
      success: false,
      message: 'Gagal menambahkan peminjaman'
    };
  }
};

  /**
   * Perpanjang pinjaman berdasarkan loan ID.
   * Backend diharapkan:
   *   - Tambah due_date sesuai tambahHari
   *   - Increment jumlah_perpanjangan
   *   - Update status ke 'diperpanjang'
   * Response: { success, loan: { id, dueDate, jumlahPerpanjangan }, message }
   */
  const extendLoan = async (loanId, tambahHari) => {
    try {
      const res = await fetch(`${API_URL}/api/loans/${loanId}/extend`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ tambahHari })
      });
      const data = await res.json();
      if (data.success) {
        await fetchLoans();
        addLog('loan', `Perpanjangan pinjaman ID ${loanId} oleh ${user?.name} (+${tambahHari} hari)`, 'loan');
        return { success: true, loan: data.loan || null };
      }
      return { success: false, message: data.message || 'Gagal memperpanjang peminjaman' };
    } catch (err) {
      console.error('Gagal perpanjang peminjaman:', err);
      return { success: false, message: 'Gagal memperpanjang peminjaman' };
    }
  };

  /**
   * Kembalikan buku berdasarkan loanId spesifik (bukan hanya bookCode).
   * Menggunakan loanId agar tidak ambigu jika ada beberapa pinjaman aktif
   * untuk buku yang sama (edge case).
   * Response: { success, denda, lateDays, message }
   */
  const returnBook = async (bookCode, loanId) => {
    try {
      // Ambil data loan aktif untuk keperluan log
      const activeLoan = loans.find(l => l.id === loanId);
      const memberName = activeLoan?.memberName || 'Tidak diketahui';
      const bookTitle = activeLoan?.bookTitle || bookCode;

      // Kirim loanId jika tersedia, fallback ke endpoint lama
      const endpoint = loanId
        ? `${API_URL}/api/loans/${loanId}/return`
        : `${API_URL}/api/loans/return/${encodeURIComponent(bookCode)}`;

      const method = 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: ngrokHeaders
      });
      const data = await res.json();

      if (data.success) {
        const returnedCopyId =
          data.copyId;

        const returnedBookId =
          data.bookId;

        setBooks(prev =>
          prev.map(book => {

            if (book.id !== returnedBookId)
              return book;

            return {

              ...book,

              copies: book.copies.map(copy => {

                if (copy.id === returnedCopyId) {

                  return {
                    ...copy,
                    status: 'available'
                  };

                }

                return copy;
              })
            };
          })
        );

        await fetchBooks();
        await fetchLoans();
        addLog(
          'return',
          `Pengembalian buku "${bookTitle}" oleh ${memberName} selesai — Denda: ${data.denda > 0 ? 'Rp ' + Number(data.denda).toLocaleString('id-ID') : 'Tidak ada'}`,
          'return'
        );
        return {
          success: true,
          denda: data.denda || 0,
          lateDays: data.lateDays || 0,
          loan: activeLoan || null
        };
      }

      return { success: false, message: data.message || 'Gagal memproses pengembalian' };
    } catch (err) {
      console.error('Gagal pengembalian buku:', err);
      return { success: false, message: 'Gagal memproses pengembalian' };
    }
  };

  // ─── Denda ────────────────────────────────────────────────────────────────────

  const getDendaTotal = (userId) => {
    return loans
      .filter(l => {
        if (Number(l.denda) === 0) return false;
        if (userId && String(l.user_id || l.memberId) !== String(userId)) return false;
        return true;
      })
      .reduce((sum, l) => sum + Number(l.denda), 0);
  };

  // ─── Reminders ───────────────────────────────────────────────────────────────

  const addReminder = (book, userId) => {
  const key = `reminders_${userId}`;
  const existing =
    JSON.parse(localStorage.getItem(key) || '[]');

  // cek duplicate reminder
  const alreadyExists = existing.find(
    r =>
      String(r.bookId) ===
      String(book.id || book.no_induk)
  );

  if (alreadyExists) return;
  const newReminder = {
  id: Date.now(),
  bookId: book.id, // internal id
  bookCode: book.no_induk, // kode buku asli
  title: book.title, // nama buku
  userId,
  createdAt: new Date().toISOString(),
};

  const updated = [
    ...existing,
    newReminder
  ];

  localStorage.setItem(
    key,
    JSON.stringify(updated)
  );

  setReminders(updated);
};

  useEffect(() => {
  if (!user?.id) return;
  const key = `reminders_${user.id}`;
  const saved =
    JSON.parse(localStorage.getItem(key) || '[]');

  // update realtime status buku
  const updated = saved

    .map(reminder => {

      const relatedBook = books.find(
        b =>
          String(b.id) === String(reminder.bookId) ||
          String(b.no_induk) === String(reminder.bookId)
      );

      const isAvailable =
        relatedBook?.copies?.some(
          c => c.status === 'available'
        );

      return {
        ...reminder,
        available: isAvailable,
      };
    })

    // notif tersedia hanya tampil 2 hari
    .filter(reminder => {

      // kalau belum tersedia → tetap tampil
      if (!reminder.available) {
        return true;
      }

      // cek umur notif
      const created =
        new Date(reminder.createdAt).getTime();
      const now = Date.now();
      const diffDays =
        (now - created) /
        (1000 * 60 * 60 * 24);

      // maksimal 2 hari
      return diffDays <= 2;
    });

  // save ulang hasil bersih
  localStorage.setItem(
    key,
    JSON.stringify(updated)
  );

  setReminders(updated);
}, [user?.id, books]);

  const getUserNotifications = () => {
    return reminders.map(r => {
      const book = books.find(
        b =>
          String(b.id || b.book_id)
          === String(r.bookId)
      );
      const availableCopies =
        book?.copies?.filter(
          c => c.status === 'available'
        ) || [];
      return {
        ...r,
        stock: availableCopies.length,
        available:
          availableCopies.length > 0
      };
    });
  };

  const updateMemberPhoto = (photo_url) => {
    setMembers(prev =>
      prev.map(m => m.id === user.memberId ? { ...m, photo_url } : m)
    );
  };

  const promoteToPetugas = async (memberId) => {
  try {
    const res = await fetch(`${API_URL}/api/members/${memberId}/promote-petugas`, {
      method: 'PUT',
      headers: jsonHeaders
    });

    const data = await res.json();

    if (data.success) {
      await fetchMembers();
      addLog('member', `Anggota ID ${memberId} dijadikan petugas`, 'member');
      return true;
    }

    alert(data.message || 'Gagal menjadikan petugas');
    return false;

  } catch (err) {
    console.error('Promote petugas error:', err);
    alert('Backend promote petugas error');
    return false;
  }
};

  // ─── Provider ────────────────────────────────────────────────────────────────

  return (
    <AppContext.Provider
      value={{
        books,
        members,
        loans,
        activityLog,
        reminders,
        addReminder,
        getUserNotifications,
        addBook,
        updateBook,
        deleteBook,
        addMember,
        updateMember,
        deleteMember,
        promoteToPetugas,
        addLoan,
        extendLoan,
        returnBook,
        getDendaTotal,
        uploadMemberPhoto,
        updateMemberPhoto,
        addLog
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);