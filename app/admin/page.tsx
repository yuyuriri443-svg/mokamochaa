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

export default function AdminDashboard() {
  const [tab, setTab] = useState('books');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // --- HÀM STYLE (ĐÃ FIX LỖI ĐỎ) ---
  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '12px 20px',
    borderRadius: '12px',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    background: active ? COFFEE.light : 'transparent',
    color: '#fff',
    fontWeight: active ? 'bold' : 'normal',
    transition: '0.3s',
    display: 'block',
    width: '100%',
    marginBottom: '5px'
  });

  // --- CÁC STYLE KHÁC ---
  const styles = {
    adminLayout: { display: 'flex', minHeight: '100vh', background: COFFEE.bg } as React.CSSProperties,
    sidebarStyle: { width: '260px', background: COFFEE.deep, padding: '30px 20px', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh' } as React.CSSProperties,
    logoAdmin: { color: '#fff', fontSize: '1.2rem', fontWeight: '800', marginBottom: '30px', textAlign: 'center', letterSpacing: '2px' } as React.CSSProperties,
    mainContent: { flex: 1, marginLeft: '260px', padding: '40px' } as React.CSSProperties,
    cardStyle: { background: '#fff', padding: '35px', borderRadius: '30px', border: `2px dashed ${COFFEE.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' } as React.CSSProperties,
    inputStyle: { width: '100%', padding: '12px 15px', borderRadius: '12px', border: `1px solid ${COFFEE.border}`, marginBottom: '10px', outline: 'none', fontSize: '0.9rem' } as React.CSSProperties,
    btnPrimary: { width: '100%', background: COFFEE.deep, color: '#fff', padding: '15px', border: 'none', borderRadius: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' } as React.CSSProperties,
    btnMini: { background: COFFEE.medium, color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem' } as React.CSSProperties,
    rowItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee', fontSize: '0.9rem' } as React.CSSProperties,
  };

  if (user && user.email !== 'yuyuriri443@gmail.com') {
    return <div style={{padding: '50px', textAlign: 'center'}}>☕ Xin lỗi, khu vực này chỉ dành cho chủ quán!</div>;
  }

  return (
    <div style={styles.adminLayout}>
      <div style={styles.sidebarStyle}>
        <div style={styles.logoAdmin}>MOKA ADMIN ☕</div>
        
        <button onClick={() => setTab('books')} style={tabBtn(tab === 'books')}>📚 Quản lý Truyện</button>
        <button onClick={() => setTab('chapters')} style={tabBtn(tab === 'chapters')}>📑 Quản lý Chương</button>
        <button onClick={() => setTab('noti')} style={tabBtn(tab === 'noti')}>🔔 Thông báo</button>
        
        <button 
          onClick={() => window.location.href='/'} 
          style={{...tabBtn(false), marginTop: 'auto', opacity: 0.7}}
        >
          ← Về Trang chủ
        </button>
      </div>

      <div style={styles.mainContent}>
        {tab === 'books' && <ManageBooks styles={styles} COFFEE={COFFEE} />}
        {tab === 'chapters' && <ManageChapters styles={styles} />}
        {tab === 'noti' && <ManageNoti styles={styles} />}
      </div>
    </div>
  );
}