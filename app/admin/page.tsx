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

  // Chỉ cho phép Email của bạn vào trang này (Bảo mật)
  if (user?.email !== 'yuyuriri443@gmail.com') return <div style={{padding: '50px', textAlign: 'center'}}>☕ Bạn không có quyền truy cập khu vực pha chế này!</div>;

  return (
    <div style={adminLayout}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;800&display=swap'); * { font-family: 'Lexend', sans-serif !important; }`}} />
      
      {/* SIDEBAR */}
      <div style={sidebarStyle}>
        <div style={logoAdmin}>MOKA ADMIN ☕</div>
        <button onClick={() => setTab('books')} style={tabBtn(tab === 'books')}>📚 Quản lý Truyện</button>
        <button onClick={() => setTab('chapters')} style={tabBtn(tab === 'chapters')}>📑 Đăng Chương mới</button>
        <button onClick={() => setTab('noti')} style={tabBtn(tab === 'noti')}>🔔 Gửi Thông báo</button>
        <button onClick={() => setTab('reviews')} style={tabBtn(tab === 'reviews')}>⭐ Duyệt Reviews</button>
        <button onClick={() => setTab('users')} style={tabBtn(tab === 'users')}>👥 Người dùng</button>
        <button onClick={() => window.location.href='/'} style={{...tabBtn(false), marginTop: 'auto', opacity: 0.7}}>← Về Trang chủ</button>
      </div>

      {/* MAIN CONTENT */}
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

// --- 1. QUẢN LÝ TRUYỆN & FILE ---
function ManageBooks() {
  const [form, setForm] = useState({ title: '', author: '', cover_url: '', download_url: '', password: '', description: '' });
  const [upLoading, setUpLoading] = useState(false);

  const handleFileUpload = async (e: any, folder: string) => {
    const file = e.target.files[0];
    if (!file) return;
    setUpLoading(true);
    const fileName = `${folder}/${Date.now()}-${file.name}`;
    const { data: upData, error } = await supabase.storage.from('assets').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('assets').getPublicUrl(fileName) as any;
      folder === 'covers' ? setForm({...form, cover_url: data.publicUrl}) : setForm({...form, download_url: data.publicUrl});
    }
    setUpLoading(false);
  };

  const saveBook = async () => {
    const { error } = await (supabase.from('books').insert([form] as any) as any);
    if (!error) alert("Đã thêm truyện thành công! ✨");
  };

  return (
    <div style={cardStyle}>
      <h2 style={titleSection}>📖 ĐĂNG TRUYỆN & FILE TẢI XUỐNG</h2>
      <div style={formGrid}>
        <div style={{display:'flex', gap:'10px'}}>
           <div style={upBox}>
              {form.cover_url ? <img src={form.cover_url} style={imgPrev}/> : 'Bìa truyện'}
              <input type="file" style={fileHidden} onChange={e => handleFileUpload(e, 'covers')} />
           </div>
           <div style={{flex:1, display:'flex', flexDirection:'column', gap:'10px'}}>
              <input placeholder="Tên truyện" style={inputStyle} onChange={e => setForm({...form, title: e.target.value})} />
              <input placeholder="Tác giả" style={inputStyle} onChange={e => setForm({...form, author: e.target.value})} />
           </div>
        </div>
        <input placeholder="Đặt mật khẩu cho cả bộ truyện (nếu có)" style={inputStyle} onChange={e => setForm({...form, password: e.target.value})} />
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
           <input placeholder="Link File tải xuống (PDF/EPUB)" value={form.download_url} style={inputStyle} readOnly />
           <label style={btnMini}>Up File<input type="file" hidden onChange={e => handleFileUpload(e, 'downloads')} /></label>
        </div>
        <textarea placeholder="Mô tả ngắn..." style={{...inputStyle, height:'80px'}} onChange={e => setForm({...form, description: e.target.value})} />
        <button onClick={saveBook} style={btnPrimary} disabled={upLoading}>{upLoading ? 'Đang tải...' : 'PHÁT HÀNH TRUYỆN'}</button>
      </div>
    </div>
  );
}

// --- 2. QUẢN LÝ CHƯƠNG (CÓ PASS) ---
function ManageChapters() {
  const [books, setBooks] = useState<any[]>([]);
  const [form, setForm] = useState({ book_id: '', title: '', content: '', chapter_number: 1, password: '' });

  useEffect(() => {
    supabase.from('books').select('id, title').then(({data}) => setBooks(data || []));
  }, []);

  const saveChapter = async () => {
    const { error } = await (supabase.from('chapters').insert([form] as any) as any);
    if (!error) alert("Đã lên chương mới! 📑");
  };

  return (
    <div style={cardStyle}>
      <h2 style={titleSection}>📑 ĐĂNG CHƯƠNG MỚI</h2>
      <select style={inputStyle} onChange={e => setForm({...form, book_id: e.target.value})}>
        <option>--- Chọn bộ truyện ---</option>
        {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
      </select>
      <div style={{display:'flex', gap:'10px'}}>
        <input placeholder="Số chương" type="number" style={{...inputStyle, width:'100px'}} onChange={e => setForm({...form, chapter_number: parseInt(e.target.value)})} />
        <input placeholder="Tên chương (VD: Khởi đầu mới)" style={inputStyle} onChange={e => setForm({...form, title: e.target.value})} />
      </div>
      <input placeholder="Đặt Pass riêng cho chương này (để trống nếu dùng pass chung của truyện)" style={inputStyle} onChange={e => setForm({...form, password: e.target.value})} />
      <textarea placeholder="Nội dung chương truyện..." style={{...inputStyle, height:'300px'}} onChange={e => setForm({...form, content: e.target.value})} />
      <button onClick={saveChapter} style={btnPrimary}>ĐĂNG CHƯƠNG</button>
    </div>
  );
}

// --- 3. THÔNG BÁO ---
function ManageNoti() {
  const [msg, setMsg] = useState('');
  const send = async () => {
    const { error } = await (supabase.from('notifications').insert([{ content: msg }] as any) as any);
    if (!error) alert("Thông báo đã bay đi! 🔔");
  };
  return (
    <div style={cardStyle}>
      <h2 style={titleSection}>🔔 GỬI THÔNG BÁO TOÀN WEB</h2>
      <textarea style={{...inputStyle, height:'100px'}} placeholder="Nội dung tin nhắn..." onChange={e => setMsg(e.target.value)} />
      <button onClick={send} style={btnPrimary}>GỬI THÔNG BÁO</button>
    </div>
  );
}

// --- 4. REVIEWS ---
function ManageReviews() {
  const [revs, setRevs] = useState<any[]>([]);
  const fetch = async () => {
    const { data } = await (supabase.from('reviews').select('*, books(title), profiles(full_name)') as any);
    setRevs(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const approve = async (id: string) => {
    await supabase.from('reviews').update({ is_approved: true } as any).eq('id', id);
    fetch();
  };

  return (
    <div style={cardStyle}>
      <h2 style={titleSection}>⭐ DUYỆT ĐÁNH GIÁ</h2>
      {revs.map(r => (
        <div key={r.id} style={rowItem}>
          <div style={{flex:1}}><b>{r.profiles?.full_name}</b> đánh giá <b>{r.books?.title}</b>: <i>"{r.comment}"</i></div>
          {!r.is_approved && <button onClick={() => approve(r.id)} style={btnMini}>Duyệt</button>}
          <button onClick={async() => {await supabase.from('reviews').delete().eq('id',r.id); fetch();}} style={{...btnMini, background:'#ff4444'}}>Xóa</button>
        </div>
      ))}
    </div>
  );
}

// --- 5. USERS ---
function ManageUsers() {
  const [users, setUsers] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('profiles').select('*').then(({data}) => setUsers(data || []));
  }, []);
  return (
    <div style={cardStyle}>
      <h2 style={titleSection}>👥 QUẢN LÝ NGƯỜI DÙNG</h2>
      {users.map(u => (
        <div key={u.id} style={rowItem}>
          <span>{u.full_name} - {u.id}</span>
          <button style={{...btnMini, background:'#eee', color:'#333'}}>Xem Profile</button>
        </div>
      ))}
    </div>
  );
}

// --- STYLES ---
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
const btnMini: any = { background: COFFEE.medium, color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem' };
const rowItem: any = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee', fontSize: '0.9rem' };
const formGrid: any = { display: 'flex', flexDirection: 'column', gap: '5px' };