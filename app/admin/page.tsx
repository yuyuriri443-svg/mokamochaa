'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import ManageBooks from './components/ManageBooks';
import ManageChapters from './components/ManageChapters';
import ManageNoti from './components/ManageNoti';

// 1. Định nghĩa bảng màu đồng nhất cho toàn hệ thống
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
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthLoading(false);
    });
  }, []);

  // 2. Styles tổng hợp
  const styles = {
    adminLayout: { display: 'flex', minHeight: '100vh', background: COFFEE.bg } as React.CSSProperties,
    sidebarStyle: { 
      width: '260px', 
      background: COFFEE.deep, 
      padding: '30px 20px', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'fixed', 
      height: '100vh',
      boxShadow: '4px 0 10px rgba(0,0,0,0.1)'
    } as React.CSSProperties,
    logoAdmin: { 
      color: '#fff', 
      fontSize: '1.4rem', 
      fontWeight: '900', 
      marginBottom: '40px', 
      textAlign: 'center', 
      letterSpacing: '3px',
      borderBottom: `1px solid ${COFFEE.light}`,
      paddingBottom: '15px'
    } as React.CSSProperties,
    mainContent: { flex: 1, marginLeft: '260px', padding: '40px' } as React.CSSProperties,
    // Các style con truyền xuống cho Component
    cardStyle: { background: '#fff', padding: '30px', borderRadius: '25px', border: `1px solid ${COFFEE.border}`, boxShadow: '0 10px 25px rgba(0,0,0,0.05)' } as React.CSSProperties,
    inputStyle: { width: '100%', padding: '12px 15px', borderRadius: '12px', border: `1px solid ${COFFEE.border}`, marginBottom: '12px', outline: 'none', fontSize: '0.9rem' } as React.CSSProperties,
    btnPrimary: { width: '100%', background: COFFEE.deep, color: '#fff', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' } as React.CSSProperties,
    btnMini: { background: COFFEE.medium, color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem' } as React.CSSProperties,
    rowItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #f0f0f0', background: '#fff', marginBottom: '5px', borderRadius: '10px' } as React.CSSProperties,
  };

  // 3. Hàm tạo Style cho nút Sidebar
  const tabBtn = (active: boolean): React.CSSProperties => ({
    padding: '14px 20px',
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
    marginBottom: '8px',
    fontSize: '0.95rem'
  });

  // Kiểm tra trạng thái đăng nhập
  if (authLoading) return <div style={{background: COFFEE.bg, height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>☕ Đang kiểm tra quyền Admin...</div>;

  // Kiểm tra quyền Admin (Email của bạn)
  if (!user || user.email !== 'yuyuriri443@gmail.com') {
    return (
      <div style={{padding: '100px 20px', textAlign: 'center', background: COFFEE.bg, height: '100vh'}}>
        <h2 style={{color: COFFEE.deep}}>☕ Khu vực hạn chế</h2>
        <p>Vui lòng đăng nhập bằng tài khoản Admin để tiếp tục.</p>
        <button onClick={() => window.location.href='/login'} style={{...styles.btnPrimary, width: '200px', marginTop: '20px'}}>Đến Đăng nhập</button>
      </div>
    );
  }

  return (
    <div style={styles.adminLayout}>
      {/* SIDEBAR DỌC */}
      <div style={styles.sidebarStyle}>
        <div style={styles.logoAdmin}>MOKA ADMIN</div>
        
        <button onClick={() => setTab('books')} style={tabBtn(tab === 'books')}>📚 Quản lý Truyện</button>
        <button onClick={() => setTab('chapters')} style={tabBtn(tab === 'chapters')}>📑 Quản lý Chương</button>
        <button onClick={() => setTab('noti')} style={tabBtn(tab === 'noti')}>🔔 Thông báo</button>
        
        <button 
          onClick={() => window.location.href='/'} 
          style={{...tabBtn(false), marginTop: 'auto', background: 'rgba(255,255,255,0.1)'}}
        >
          ← Về Trang chủ
        </button>
      </div>

      {/* VÙNG HIỂN THỊ NỘI DUNG CHÍNH */}
      <div style={styles.mainContent}>
        {/* QUAN TRỌNG: Truyền đầy đủ styles và COFFEE vào các component con */}
        {tab === 'books' && <ManageBooks styles={styles} COFFEE={COFFEE} />}
        
        {tab === 'chapters' && (
          <ManageChapters 
            styles={styles} 
            COFFEE={COFFEE}  /* ĐÃ THÊM: Sửa lỗi undefined 'deep' */
          />
        )}
        
        {tab === 'noti' && (
          <ManageNoti 
            styles={styles} 
            COFFEE={COFFEE}  /* ĐÃ THÊM: Để đồng bộ màu sắc */
          />
        )}
      </div>
    </div>
  );
}