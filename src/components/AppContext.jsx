import { createContext, useContext, useState, useEffect } from 'react';
import { ACTIVITY_LOG } from '../data/db';

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
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [activityLog, setActivityLog] = useState(ACTIVITY_LOG);

  const fetchBooks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/books`, {
        headers: ngrokHeaders
      });
      const data = await res.json();
      if (data.success) setBooks(data.books);
    } catch (err) {
      console.error('Gagal ambil data buku:', err);
    }
  };

  const fetchMembers = async () => {
  try {
    const res = await fetch(`${API_URL}/api/members`, {
      headers: ngrokHeaders
    });
    const data = await res.json();
    if (data.success) {
      const mapped = data.members.map(m => ({
        ...m,
        displayId: m.member_id || String(m.id),
      }));
      setMembers(mapped);
    }
  } catch (err) {
    console.error('Gagal ambil data anggota:', err);
  }
};

  const fetchLoans = async () => {
    try {
      const res = await fetch(`${API_URL}/api/loans`, {
        headers: ngrokHeaders
      });
      const data = await res.json();
      if (data.success) setLoans(data.loans);
    } catch (err) {
      console.error('Gagal ambil data peminjaman:', err);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchMembers();
    fetchLoans();
  }, []);

  const addLog = (type, desc, icon = 'info') => {
    const now = new Date();
    const time = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    setActivityLog(prev => [{ id: Date.now(), time, type, desc, icon }, ...prev]);
  };

  const addBook = async (book) => {
      try {
        const formData = new FormData();

        Object.keys(book).forEach(key => {
          formData.append(key, book[key]);
        });

        const res = await fetch(`${API_URL}/api/books`, {
          method: 'POST',
          headers: {
            'ngrok-skip-browser-warning': 'true'
          },
          body: formData
        });

        const data = await res.json();

        if (data.success) {
          await fetchBooks();
          addLog('Tambah Buku', `Buku baru: ${book.title}`, 'book');
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

        Object.keys(updates).forEach(key => {
          formData.append(key, updates[key]);
        });

        const res = await fetch(`${API_URL}/api/books/${id}`, {
          method: 'PUT',
          headers: {
            'ngrok-skip-browser-warning': 'true'
          },
          body: formData
        });

        const data = await res.json();

        if (data.success) {
          await fetchBooks();
          addLog('Edit Buku', `Buku ${updates.title} diperbarui`, 'book');
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
      addLog('Hapus Buku', `${ids.length} buku dihapus`, 'delete');
      return true;
    } catch (err) {
      console.error('Gagal hapus buku:', err);
      alert('Gagal menghapus buku');
      return false;
    }
  };

  const addMember = async (member) => {
    try {
      const res = await fetch(`${API_URL}/api/members`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(member)
      });

      const data = await res.json();

      if (data.success) {
        await fetchMembers();
        addLog('Tambah Anggota', `Anggota baru: ${member.name}`, 'member');
        return true;
      }

      alert(data.message);
      return false;
    } catch (err) {
      console.error('Gagal tambah anggota:', err);
      alert('Gagal menambahkan anggota');
      return false;
    }
  };

  const updateMember = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/api/members/${id}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(updates)
      });

      const data = await res.json();

      if (data.success) {
        await fetchMembers();
        addLog('Edit Anggota', `Data anggota ${updates.name} diperbarui`, 'member');
        return true;
      }

      alert(data.message);
      return false;
    } catch (err) {
      console.error('Gagal update anggota:', err);
      alert('Gagal mengupdate anggota');
      return false;
    }
  };

  const addLoan = async (bookCode, memberId) => {
    try {
      const res = await fetch(`${API_URL}/api/loans`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ bookCode, memberId })
      });

      const data = await res.json();

      if (data.success) {
        await fetchBooks();
        await fetchLoans();
        addLog('Peminjaman Buku', 'Peminjaman buku berhasil diproses', 'loan');
        return { success: true };
      }

      return { success: false, message: data.message };
    } catch (err) {
      console.error('Gagal tambah peminjaman:', err);
      return { success: false, message: 'Gagal menambahkan peminjaman' };
    }
  };

  const returnBook = async (bookCode) => {
    try {
      const res = await fetch(`${API_URL}/api/loans/return/${encodeURIComponent(bookCode)}`, {
        method: 'PUT',
        headers: ngrokHeaders
      });

      const data = await res.json();

      if (data.success) {
        await fetchBooks();
        await fetchLoans();
        addLog('Pengembalian Buku', 'Pengembalian buku berhasil diproses', 'return');

        return {
          success: true,
          loan: { bookCode, bookTitle: '', memberName: '' },
          denda: data.denda || 0
        };
      }

      return { success: false, message: data.message };
    } catch (err) {
      console.error('Gagal pengembalian buku:', err);
      return { success: false, message: 'Gagal memproses pengembalian' };
    }
  };

  const getDendaTotal = () => {
    const thisMonth = new Date().getMonth();
    return loans
      .filter(l => {
        if (l.denda === 0) return false;
        const d = new Date(l.returnDate || l.dueDate);
        return d.getMonth() === thisMonth;
      })
      .reduce((sum, l) => sum + l.denda, 0);
  };

  return (
    <AppContext.Provider
      value={{
        books,
        members,
        loans,
        activityLog,
        addBook,
        updateBook,
        deleteBook,
        addMember,
        updateMember,
        addLoan,
        returnBook,
        getDendaTotal
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);