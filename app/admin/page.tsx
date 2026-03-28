'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import ManageBooks from './components/ManageBooks';
import ManageChapters from './components/ManageChapters';
import ManageNoti from './components/ManageNoti';

// 1. Định nghĩa bảng màu
const COFFEE = { 
  deep: '#3E2723', 
  medium: '#5D4037', 
  light: '#8D6E63', 
  bg: '#FDF5E6', 
  border: '#D7CCC8' 
};

// 2. Các hằng số Styles (Định nghĩa trước khi dùng)
const adminLayout = { display: 'flex', minHeight: '100vh', background: COFFEE.bg };
const sidebarStyle = { width: '260px', background: COFFEE.deep, padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'fixed', height: '100vh' };
const logoAdmin = { color: '#fff', fontSize: '1.2rem', fontWeight: '800', marginBottom: '30px', textAlign: 'center', letterSpacing: '2px' };
const mainContent = { flex: 1, marginLeft: '260px', padding: '40px' };
const cardStyle = { background: '#fff', padding: '35px', borderRadius: '30px', border: `2px dashed ${COFFEE.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' };
const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '12px', border: `1px solid ${COFFEE.border}`, marginBottom: '10px', outline: 'none', fontSize: '0.9rem' };
const btnPrimary = { width: '100%', background: COFFEE.deep, color: '#fff', padding: '15px', border: 'none', borderRadius: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' };
const btnMini = { background: COFFEE.medium, color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', marginLeft: '5px' };
const rowItem = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee', fontSize: '0.9rem' };
const tabBtn = (active: boolean) => ({ padding: '12px 20px', borderRadius: '12px', border: 'none', textAlign: 'left', cursor: 'pointer', background: active ? COFFEE.light : 'transparent', color: '#fff', fontWeight: active ? 'bold' : 'normal', transition: '0.3s' });

export default function AdminDashboard() {
  const [tab, setTab] = useState('books');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Kiểm tra quyền Admin (Email của bạn)
  if (user && user.email !== 'yuyuriri443@gmail.com') {
    return <div style={{padding: '50px', textAlign: 'center'}}>☕ Bạn không có quyền truy cập!</div>;
  }

  // Gom toàn bộ styles vào object để truyền xuống các component con
  const styles = { 
    cardStyle, 
    inputStyle, 
    btnPrimary, 
    btnMini, 
    rowItem 
  };

  return (
    <div style={adminLayout as any}>
      {/* Sidebar điều hướng */}
      <div style={sidebarStyle as any}>
        <div style={logoAdmin as any}>MOKA ADMIN ☕</div>
        <button onClick={() => setTab('books')} style={tabBtn(tab === 'books')}>📚 Quản lý Truyện</button>
        <button onClick={() => setTab('chapters')} style={tabBtn(tab === 'chapters')}>📑 Quản lý Chương</button>
        <button onClick={() => setTab('noti')} style={tabBtn(tab === 'noti')}>🔔 Thông báo</button>
        <button onClick={() => window.location.href='/'} style={{...tabBtn(false), marginTop: 'auto', opacity: 0.7}}>← Về Trang chủ</button>
      </div>

      {/* Nội dung chính dựa trên Tab */}
      <div style={mainContent as any}>
        {tab === 'books' && <ManageBooks styles={styles} COFFEE={COFFEE} />}
        {tab === 'chapters' && <ManageChapters styles={styles} />}
        {tab === 'noti' && <ManageNoti styles={styles} />}
      </div>
    </div>
  );
}