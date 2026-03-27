'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const COFFEE = { deep: '#3E2723', medium: '#5D4037', light: '#8D6E63', bg: '#FDF5E6', border: '#D7CCC8' };

export default function AdminDashboard() {
  const [tab, setTab] = useState('books'); 
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  if (user?.email !== 'yuyuriri443@gmail.com') return <div style={{padding: '50px', textAlign: 'center'}}>☕ Bạn không có quyền truy cập khu vực pha chế này!</div>;

  return (
    <div style={adminLayout}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;800&display=swap'); * { font-family: 'Lexend', sans-serif !important; }`}} />
      
      <div style={sidebarStyle}>
        <div style={logoAdmin}>MOKA ADMIN ☕</div>
        <button onClick={() => setTab('books')} style={tabBtn(tab === 'books')}>📚 Quản lý Truyện</button>
        <button onClick={() => setTab('chapters')} style={tabBtn(tab === 'chapters')}>📑 Quản lý Chương</button>
        <button onClick={() => setTab('noti')} style={tabBtn(tab === 'noti')}>🔔 Gửi Thông báo</button>
        <button onClick={() => setTab('reviews')} style={tabBtn(tab === 'reviews')}>⭐ Duyệt Reviews</button>
        <button onClick={() => setTab('users')} style={tabBtn(tab === 'users')}>👥 Người dùng</button>
        <button onClick={() => window.location.href='/'} style={{...tabBtn(false), marginTop: 'auto', opacity: 0.7}}>← Về Trang chủ</button>
      </div>

      <div style={mainContent}>
        {tab === 'books' && <ManageBooks />}
        {tab === 'chapters' && <ManageChapters />}
        {tab === 'noti' && <ManageNoti />}
        {tab === 'reviews' && <ManageReviews />}
        {tab === 'users' && <ManageUsers />}
      </div>
    </div>
  );
}

// --- 1. QUẢN LÝ TRUYỆN (THÊM/SỬA/XÓA) ---
function ManageBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [form, setForm] = useState({ id: '', title: '', author: '', cover_url: '', download_url: '', password: '', description: '' });
  const [upLoading, setUpLoading] = useState(false);

  const fetchBooks = async () => {
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    setBooks(data || []);
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleFileUpload = async (e: any, folder: string) => {
    const file = e.target.files[0];
    if (!file) return;
    setUpLoading(true);
    const fileName = `${folder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('assets').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('assets').getPublicUrl(fileName) as any;
      folder === 'covers' ? setForm({...form, cover_url: data.publicUrl}) : setForm({...form, download_url: data.publicUrl});
    } else {
      alert("Lỗi upload: Hãy đảm bảo bạn đã tạo Bucket 'assets' và để Public!");
    }
    setUpLoading(false);
  };

  const saveBook = async () => {
    if (form.id) {
      const { error } = await supabase.from('books').update(form).eq('id', form.id);
      if (!error) alert("Cập nhật truyện thành công!");
    } else {
      const { error } = await supabase.from('books').insert([form]);
      if (!error) alert("Thêm truyện thành công!");
    }
    setForm({ id: '', title: '', author: '', cover_url: '', download_url: '', password: '', description: '' });
    fetchBooks();
  };

  const handleDeleteBook = async (bookId: string) => {
  const confirmDelete = confirm("Bạn có chắc muốn xóa cuốn truyện 'chill' này không? ☕");
  if (!confirmDelete) return;

  try {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);

    if (error) throw error;

    alert("Đã xóa truyện thành công! ✨");
    // Reload lại trang hoặc cập nhật state để truyện biến mất
    window.location.reload(); 
    
  } catch (error: any) {
    alert("Lỗi xóa truyện: " + error.message);
  }
};

  return (
    <div>
      <div style={cardStyle}>
        <h2 style={titleSection}>{form.id ? '✏️ CHỈNH SỬA TRUYỆN' : '📖 ĐĂNG TRUYỆN MỚI'}</h2>
        <div style={formGrid}>
          <div style={{display:'flex', gap:'10px'}}>
             <div style={upBox}>
                {form.cover_url ? <img src={form.cover_url} style={imgPrev}/> : 'Bìa'}
                <input type="file" style={fileHidden} onChange={e => handleFileUpload(e, 'covers')} />
             </div>
             <div style={{flex:1, display:'flex', flexDirection:'column', gap:'10px'}}>
                <input placeholder="Tên truyện" value={form.title} style={inputStyle} onChange={e => setForm({...form, title: e.target.value})} />
                <input placeholder="Tác giả" value={form.author} style={inputStyle} onChange={e => setForm({...form, author: e.target.value})} />
             </div>
          </div>
          <input placeholder="Mật khẩu truyện" value={form.password} style={inputStyle} onChange={e => setForm({...form, password: e.target.value})} />
          <textarea placeholder="Mô tả..." value={form.description} style={{...inputStyle, height:'60px'}} onChange={e => setForm({...form, description: e.target.value})} />
          <button onClick={saveBook} style={btnPrimary} disabled={upLoading}>{form.id ? 'CẬP NHẬT' : 'PHÁT HÀNH'}</button>
          {form.id && <button onClick={() => setForm({ id: '', title: '', author: '', cover_url: '', download_url: '', password: '', description: '' })} style={{background: '#999', ...btnPrimary}}>HỦY SỬA</button>}
        </div>
      </div>

      <div style={{...cardStyle, marginTop: '20px'}}>
        <h2 style={titleSection}>📚 DANH SÁCH TRUYỆN ĐÃ ĐĂNG</h2>
        {books.map(b => (
          <div key={b.id} style={rowItem}>
            <img src={b.cover_url} style={{width:'40px', height:'55px', borderRadius:'5px', objectFit:'cover'}} />
            <div style={{flex:1, marginLeft:'15px'}}><b>{b.title}</b> <br/> <small>{b.author}</small></div>
            <button onClick={() => setForm(b)} style={btnMini}>Sửa</button>
            <button onClick={() => deleteBook(b.id)} style={{...btnMini, background:'#ff4444'}}>Xóa</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 2. QUẢN LÝ CHƯƠNG (XÓA/SỬA) ---
function ManageChapters() {
  const [books, setBooks] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [form, setForm] = useState({ id: '', book_id: '', title: '', content: '', chapter_number: 1, password: '' });

  useEffect(() => {
    supabase.from('books').select('id, title').then(({data}) => setBooks(data || []));
  }, []);

  useEffect(() => {
    if (selectedBook) {
      supabase.from('chapters').select('*').eq('book_id', selectedBook).order('chapter_number', {ascending: false})
      .then(({data}) => setChapters(data || []));
    }
  }, [selectedBook]);

  const saveChapter = async () => {
    if (form.id) {
      await supabase.from('chapters').update(form).eq('id', form.id);
      alert("Đã sửa chương!");
    } else {
      await supabase.from('chapters').insert([form]);
      alert("Đã thêm chương!");
    }
    setForm({ id: '', book_id: selectedBook, title: '', content: '', chapter_number: 1, password: '' });
    // Refresh list
    const { data } = await supabase.from('chapters').select('*').eq('book_id', selectedBook).order('chapter_number', {ascending: false});
    setChapters(data || []);
  };

  return (
    <div style={cardStyle}>
      <h2 style={titleSection}>📑 QUẢN LÝ CHƯƠNG</h2>
      <select style={inputStyle} value={selectedBook} onChange={e => {setSelectedBook(e.target.value); setForm({...form, book_id: e.target.value})}}>
        <option value="">--- Chọn bộ truyện để quản lý ---</option>
        {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
      </select>

      {selectedBook && (
        <>
          <div style={{...formGrid, borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px'}}>
            <input placeholder="Số chương" type="number" value={form.chapter_number} style={inputStyle} onChange={e => setForm({...form, chapter_number: parseInt(e.target.value)})} />
            <input placeholder="Tên chương" value={form.title} style={inputStyle} onChange={e => setForm({...form, title: e.target.value})} />
            <textarea placeholder="Nội dung..." value={form.content} style={{...inputStyle, height:'200px'}} onChange={e => setForm({...form, content: e.target.value})} />
            <button onClick={saveChapter} style={btnPrimary}>{form.id ? 'CẬP NHẬT CHƯƠNG' : 'ĐĂNG CHƯƠNG'}</button>
          </div>
          
          <h3>Danh sách chương:</h3>
          {chapters.map(c => (
            <div key={c.id} style={rowItem}>
              <div style={{flex:1}}>Chương {c.chapter_number}: {c.title}</div>
              <button onClick={() => setForm(c)} style={btnMini}>Sửa</button>
              <button onClick={async () => { if(confirm("Xóa chap?")) { await supabase.from('chapters').delete().eq('id', c.id); setSelectedBook(selectedBook); } }} style={{...btnMini, background:'#ff4444'}}>Xóa</button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// Giữ nguyên các hàm ManageNoti, ManageReviews, ManageUsers và Styles của bạn bên dưới...
function ManageNoti() { return <div style={cardStyle}><h2>Thông báo</h2></div> }
function ManageReviews() { return <div style={cardStyle}><h2>Reviews</h2></div> }
function ManageUsers() { return <div style={cardStyle}><h2>Users</h2></div> }

const adminLayout: any = { display: 'flex', minHeight: '100vh', background: COFFEE.bg };
const sidebarStyle: any = { width: '260px', background: COFFEE.deep, padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'fixed', height: '100vh' };
const logoAdmin: any = { color: '#fff', fontSize: '1.2rem', fontWeight: '800', marginBottom: '30px', textAlign: 'center', letterSpacing: '2px' };
const mainContent: any = { flex: 1, marginLeft: '260px', padding: '40px' };
const cardStyle: any = { background: '#fff', padding: '35px', borderRadius: '30px', border: `2px dashed ${COFFEE.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' };
const titleSection: any = { fontSize: '1.1rem', fontWeight: '800', color: COFFEE.deep, marginBottom: '25px', borderLeft: `5px solid ${COFFEE.deep}`, paddingLeft: '15px' };
const inputStyle: any = { width: '100%', padding: '12px 15px', borderRadius: '12px', border: `1px solid ${COFFEE.border}`, marginBottom: '10px', outline: 'none', fontSize: '0.9rem' };
const btnPrimary: any = { width: '100%', background: COFFEE.deep, color: '#fff', padding: '15px', border: 'none', borderRadius: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' };
const tabBtn = (active: boolean): any => ({ padding: '12px 20px', borderRadius: '12px', border: 'none', textAlign: 'left', cursor: 'pointer', background: active ? COFFEE.light : 'transparent', color: '#fff', fontWeight: active ? 'bold' : 'normal', transition: '0.3s' });
const upBox: any = { width: '100px', height: '140px', border: `2px dashed ${COFFEE.border}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: COFFEE.light, position: 'relative', overflow: 'hidden' };
const fileHidden: any = { position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' };
const imgPrev: any = { width: '100%', height: '100%', objectFit: 'cover' };
const btnMini: any = { background: COFFEE.medium, color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', marginLeft: '5px' };
const rowItem: any = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee', fontSize: '0.9rem' };
const formGrid: any = { display: 'flex', flexDirection: 'column', gap: '5px' };