import { createContext, useContext, useState } from 'react';
import { BOOKS, MEMBERS, LOANS, ACTIVITY_LOG } from '../data/db';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [books, setBooks] = useState(BOOKS);
  const [members, setMembers] = useState(MEMBERS);
  const [loans, setLoans] = useState(LOANS);
  const [activityLog, setActivityLog] = useState(ACTIVITY_LOG);

  const addLog = (type, desc, icon = 'info') => {
    const now = new Date();
    const time = `${now.toLocaleDateString('id-ID')} ${now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    setActivityLog(prev => [{ id: Date.now(), time, type, desc, icon }, ...prev]);
  };

  const addBook = (book) => {
    const newBook = { ...book, id: `B${String(books.length + 1).padStart(3, '0')}`, available: book.stock };
    setBooks(prev => [...prev, newBook]);
    addLog('Penambahan Buku', `Buku baru: "${book.title}" (${book.no_induk})`, 'book');
  };

  const updateBook = (id, updates) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    addLog('Edit Buku', `Buku "${updates.title}" diperbarui`, 'book');
  };

  const deleteBook = (ids) => {
    const titles = books.filter(b => ids.includes(b.id)).map(b => b.title).join(', ');
    setBooks(prev => prev.filter(b => !ids.includes(b.id)));
    addLog('Hapus Buku', `Buku dihapus: ${titles}`, 'delete');
  };

  const addMember = (member) => {
    const newMember = { ...member, id: `M${String(members.length + 1).padStart(3, '0')}`, joinDate: new Date().toISOString().split('T')[0], status: 'aktif' };
    setMembers(prev => [...prev, newMember]);
    addLog('Pendaftaran Anggota', `Anggota baru: ${member.name} (${member.type})`, 'member');
  };

  const updateMember = (id, updates) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const addLoan = (bookCode, memberId) => {
    const book = books.find(b => b.no_induk === bookCode);
    const member = members.find(m => m.id === memberId);
    if (!book || !member) return { success: false, message: 'Kode buku atau ID anggota tidak ditemukan.' };
    if (book.available === 0) return { success: false, message: 'Buku tidak tersedia.' };

    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 14);

    const newLoan = {
      id: `L${String(loans.length + 1).padStart(3, '0')}`,
      bookCode: book.no_induk, bookTitle: book.title,
      memberId: member.id, memberName: member.name, memberType: member.type,
      loanDate: today.toISOString().split('T')[0],
      dueDate: due.toISOString().split('T')[0],
      returnDate: null, status: 'dipinjam', denda: 0
    };
    setLoans(prev => [...prev, newLoan]);
    setBooks(prev => prev.map(b => b.no_induk === bookCode ? { ...b, available: b.available - 1 } : b));
    addLog('Peminjaman Buku', `${member.name} meminjam "${book.title}"`, 'loan');
    return { success: true, loan: newLoan };
  };

  const returnBook = (bookCode) => {
    const loan = loans.find(l => l.bookCode === bookCode && (l.status === 'dipinjam' || l.status === 'terlambat'));
    if (!loan) return { success: false, message: 'Tidak ada peminjaman aktif untuk kode buku ini.' };

    const today = new Date();
    const dueDate = new Date(loan.dueDate);
    let denda = 0;
    if (today > dueDate) {
      const days = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      denda = days * 1000;
    }

    const updated = { ...loan, returnDate: today.toISOString().split('T')[0], status: 'dikembalikan', denda };
    setLoans(prev => prev.map(l => l.id === loan.id ? updated : l));
    setBooks(prev => prev.map(b => b.code === bookCode ? { ...b, available: b.available + 1 } : b));
    addLog('Pengembalian Buku', `${loan.memberName} mengembalikan "${loan.bookTitle}"${denda > 0 ? ` — Denda: Rp ${denda.toLocaleString('id-ID')}` : ''}`, 'return');
    return { success: true, loan: updated, denda };
  };

  const getDendaTotal = () => {
    const thisMonth = new Date().getMonth();
    return loans.filter(l => {
      if (l.denda === 0) return false;
      const d = new Date(l.returnDate || l.dueDate);
      return d.getMonth() === thisMonth;
    }).reduce((sum, l) => sum + l.denda, 0);
  };

  return (
    <AppContext.Provider value={{ books, members, loans, activityLog, addBook, updateBook, deleteBook, addMember, updateMember, addLoan, returnBook, getDendaTotal }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);