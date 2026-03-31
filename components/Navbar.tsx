'use client';
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';

const COFFEE = {
  deep: '#3E2723',
  medium: '#5D4037',
  light: '#D7CCC8',
  border: '#D7CCC8'
};

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNoti, setShowNoti] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Auth check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // 2. Lấy thông báo và Lắng nghe Realtime
    const setupNotifications = async () => {
      // --- LẤY TIN NHẮN ADMIN (Fix web, bảo trì...) ---
      const { data: adminData } = await supabase
        .from('notifications') // Đổi từ announcements sang notifications cho khớp database của bạn
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      // --- LẤY TRUYỆN MỚI ---
      const { data: bookData } = await supabase
        .from('books')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      // Gộp 2 loại thông báo lại
      const adminNotis = adminData?.map(n => ({
        id: n.id,
        content: `📢 ${n.content || n.message}`,
        time: new Date(n.created_at).toLocaleDateString()
      })) || [];

      const bookNotis = bookData?.map(b => ({
        id: b.id,
        content: `📖 Truyện mới: ${b.title}`,
        time: new Date(b.created_at).toLocaleDateString()
      })) || [];

      setNotifications([...adminNotis, ...bookNotis]);

      // --- LẮNG NGHE REALTIME BẢNG NOTIFICATIONS ---
      const channel = supabase.channel('navbar-realtime')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
          if (payload.new.is_active) {
            const newMsg = {
              id: payload.new.id,
              content: `📢 ${payload.new.content || payload.new.message}`,
              time: 'Vừa xong'
            };
            setNotifications(prev => [newMsg, ...prev]);
          }
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'books' }, (payload) => {
          const newBook = {
            id: payload.new.id,
            content: `🚀 Truyện mới: ${payload.new.title}`,
            time: 'Vừa xong'
          };
          setNotifications(prev => [newBook, ...prev]);
        })
        .subscribe();

      return channel;
    };

    const channelInstance = setupNotifications();

    // 3. Đóng search khi click ngoài
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
      channelInstance.then(ch => ch && supabase.removeChannel(ch));
    };
  }, []);

  // Logic Tìm kiếm (Giữ nguyên tính năng cũ)
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length < 2) { setSuggestions([]); return; }
      const { data: books } = await supabase.from('books').select('id, title, cover_url').ilike('title', `%${searchTerm}%`).limit(3);
      const { data: profiles } = await supabase.from('profiles').select('id, full_name, avatar_url').ilike('full_name', `%${searchTerm}%`).limit(3);
      setSuggestions([...(books || []), ...(profiles || [])]);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <nav style={navContainerStyle}>
      <Link href="/" style={logoStyle}>MOKAMOCHA</Link>
      
      <div style={{ position: 'relative', width: '35%' }} ref={searchRef}>
        <div style={searchBarBoxStyle}>
          <input 
            style={inputStyle} 
            placeholder="Tìm truyện hoặc bạn bè..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <span>🔍</span>
        </div>

        {searchTerm && suggestions.length > 0 && (
          <div style={suggestionBoxStyle}>
            {suggestions.map((s, index) => (
              <Link key={index} href={s.title ? `/book/${s.id}` : `/profile/${s.id}`} style={navSearchItemStyle} onClick={() => setSearchTerm('')}>
                {s.cover_url || s.avatar_url ? (
                  <img src={s.cover_url || s.avatar_url} style={thumbStyle} alt="" />
                ) : (
                  <div style={miniAvatarStyle}>{(s.title || s.full_name)?.[0].toUpperCase()}</div>
                )}
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem', color: COFFEE.deep }}>{s.title || s.full_name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#999' }}>{s.title ? 'Truyện' : 'Người dùng'}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
        <Link href="/chat" style={iconStyle} title="Trò chuyện">💬</Link>
        
        {/* CHUÔNG THÔNG BÁO */}
        <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNoti(!showNoti)}>
          <span style={{ fontSize: '1.4rem' }}>🔔</span>
          {notifications.length > 0 && <span style={badgeStyle}>{notifications.length}</span>}

          {showNoti && (
            <div style={notiDropdownStyle}>
              <div style={notiHeader}>THÔNG BÁO MỚI NHẤT</div>
              <div style={notiListStyle}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#999' }}>Chưa có tin mới</div>
                ) : (
                  notifications.map((n, i) => (
                    <div key={i} style={notiItemStyle}>
                      <div style={{ color: COFFEE.deep, marginBottom: '3px', lineHeight: '1.4' }}>{n.content}</div>
                      <div style={{ fontSize: '0.65rem', color: '#aaa' }}>{n.time}</div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div style={clearNotiStyle} onClick={() => setNotifications([])}>Đã xem hết</div>
              )}
            </div>
          )}
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link href={`/profile/${user.id}`} style={{ textDecoration: 'none' }}>
              <div style={userAvatarStyle}>{user.email?.charAt(0).toUpperCase()}</div>
            </Link>
            <button onClick={() => { supabase.auth.signOut(); window.location.href='/'; }} style={logoutBtnStyle}>Thoát</button>
          </div>
        ) : (
          <Link href="/login"><button style={loginBtnStyle}>Đăng nhập</button></Link>
        )}
      </div>
    </nav>
  );
}

// --- STYLES (ĐÃ FIX LỖI TYPO maxHeight) ---
const navContainerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8%', background: '#fff', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const logoStyle: React.CSSProperties = { textDecoration: 'none', fontSize: '1.4rem', fontWeight: '800', color: COFFEE.medium };
const searchBarBoxStyle: React.CSSProperties = { background: '#F5F5F5', borderRadius: '20px', padding: '8px 15px', display: 'flex', alignItems: 'center', border: `1px solid ${COFFEE.border}` };
const inputStyle: React.CSSProperties = { border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' };
const suggestionBoxStyle: React.CSSProperties = { position: 'absolute', top: '45px', left: 0, right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: `1px solid ${COFFEE.border}`, zIndex: 2000, overflow: 'hidden' };
const navSearchItemStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', textDecoration: 'none', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' };
const thumbStyle: React.CSSProperties = { width: '35px', height: '50px', borderRadius: '4px', objectFit: 'cover' };
const miniAvatarStyle: React.CSSProperties = { width: '35px', height: '35px', borderRadius: '50%', background: COFFEE.medium, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' };
const iconStyle: React.CSSProperties = { fontSize: '1.4rem', textDecoration: 'none', color: COFFEE.deep };
const badgeStyle: React.CSSProperties = { position: 'absolute', top: '-5px', right: '-8px', background: '#e53935', color: '#fff', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold', border: '2px solid #fff' };
const notiDropdownStyle: React.CSSProperties = { position: 'absolute', top: '45px', right: '-10px', width: '280px', background: '#fff', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.15)', border: `1px solid ${COFFEE.border}`, overflow: 'hidden', zIndex: 3000 };
const notiHeader: React.CSSProperties = { background: COFFEE.light, padding: '10px', fontSize: '0.75rem', fontWeight: 'bold', color: COFFEE.deep, textAlign: 'center' };
const notiListStyle: React.CSSProperties = { maxHeight: '350px', overflowY: 'auto' };
const notiItemStyle: React.CSSProperties = { padding: '12px', borderBottom: '1px solid #f5f5f5', fontSize: '0.8rem', cursor: 'default' };
const clearNotiStyle: React.CSSProperties = { padding: '10px', textAlign: 'center', fontSize: '0.7rem', color: COFFEE.medium, cursor: 'pointer', background: '#fafafa' };
const userAvatarStyle: React.CSSProperties = { width: '38px', height: '38px', borderRadius: '50%', background: COFFEE.medium, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: `2px solid #fff`, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' };
const logoutBtnStyle: React.CSSProperties = { background: 'transparent', border: `1px solid ${COFFEE.medium}`, color: COFFEE.medium, padding: '6px 14px', borderRadius: '15px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600' };
const loginBtnStyle: React.CSSProperties = { background: COFFEE.medium, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' };