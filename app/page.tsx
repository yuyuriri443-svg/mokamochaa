'use client'
import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const COFFEE = {
  deep: '#3E2723',
  medium: '#5D4037',
  light: '#8D6E63',
  border: '#D7CCC8',
  bgOverlay: 'rgba(253, 245, 230, 0.94)'
}

export default function HomePage() {
  const [selectedUser, setSelectedUser] = useState<any>(null); // Để lưu user đang xem profile
  const [books, setBooks] = useState<any[]>([])
  const [filteredBooks, setFilteredBooks] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTag, setActiveTag] = useState('Tất cả')
  const [showNoti, setShowNoti] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notiRef = useRef<HTMLDivElement>(null)    // Thêm dòng này
  const userRef = useRef<HTMLDivElement>(null)    // Thêm dòng này

  const allTags = ['Tất cả', 'Đam mỹ', 'Trọng sinh', 'Cổ đại', 'Hiện đại', 'Ngọt sủng', 'Ngược']
  // Dữ liệu thông báo giả lập (Sau này bạn có thể fetch từ Supabase table 'notifications')
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Truyện 'Vết Sẹo' vừa cập nhật chương 50", time: "2 phút trước", isRead: false },
    { id: 2, text: "Chào mừng bạn đến với MokaMocha Haven!", time: "1 ngày trước", isRead: true },
    { id: 3, text: "Admin đã phản hồi bình luận của bạn", time: "3 ngày trước", isRead: true },
  ])

  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
      const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false })
      if (data) { setBooks(data); setFilteredBooks(data); }
      setLoading(false)
    }
    init()
  }, [])
  // Hàm mở Profile khi click vào tên
const openProfile = (userData: any) => {
  setSelectedUser(userData);
};

// Giao diện Modal Profile (Thêm vào cuối phần return, trước thẻ đóng </div> cuối cùng)
{selectedUser && (
  <div style={modalOverlay}>
    <div style={profileCard}>
      <button onClick={() => setSelectedUser(null)} style={closeBtn}>✕</button>
      <div style={avatarBig}>{selectedUser.email?.charAt(0).toUpperCase()}</div>
      <h2 style={{color: COFFEE.deep}}>{selectedUser.email}</h2>
      <p style={{color: COFFEE.light}}> MokaMocha</p>
      
      <Link href={`/chat?u=${selectedUser.id}`} style={messageBtn}>
        💬 Nhắn tin ngay
      </Link>
    </div>
  </div>
)}

  // Đóng các bảng sổ xuống khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSuggestions([])
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) setShowNoti(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleGlobalLogout = async () => {
  const { error } = await supabase.auth.signOut();
  if (!error) {
    // Xóa sạch cache và đẩy về trang login hoặc reload trang chủ
    window.location.href = '/'; 
  } else {
    console.error("Lỗi đăng xuất:", error.message);
  }
};

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })))
  }

  const renderBookGrid = (title: string, dataList: any[]) => (
    <section style={{ marginBottom: '50px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${COFFEE.border}`, paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.4rem', color: COFFEE.deep, margin: 0, fontWeight: '700' }}>{title}</h2>
        <Link href="/more" style={{ color: COFFEE.light, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }}>Tất cả ➜</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '20px' }}>
        {dataList.map((book) => (
          <Link href={`/book/${book.id}`} key={book.id} style={{ textDecoration: 'none' }}>
            <div className="book-card" style={{ background: '#fff', borderRadius: '10px', overflow: 'hidden', border: `1px solid ${COFFEE.border}`, height: '100%' }}>
              <div style={{ height: '220px' }}><img src={book.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              <div style={{ padding: '10px', textAlign: 'center' }}>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', color: COFFEE.deep, height: '36px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{book.title}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )

  useEffect(() => {
    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      setUser(authUser)
      const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false })
      if (data) { setBooks(data); setFilteredBooks(data); }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      const matches = books.filter(b => 
        b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.tags?.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 6)
      setSuggestions(matches)
    } else { setSuggestions([]) }
  }, [searchTerm, books])

  useEffect(() => {
    let result = books || []
    if (activeTag !== 'Tất cả') result = result.filter(b => b.tags?.includes(activeTag))
    if (searchTerm) result = result.filter(b => b.title?.toLowerCase().includes(searchTerm.toLowerCase()))
    setFilteredBooks(result)
  }, [searchTerm, activeTag, books])

  useEffect(() => {
    const close = (e: any) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSuggestions([]) }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [])

  
  return (
    <div style={{ backgroundImage: `linear-gradient(${COFFEE.bgOverlay}, ${COFFEE.bgOverlay}), url("/bg-coffee.png")`, backgroundAttachment: 'fixed', backgroundSize: 'cover', minHeight: '100vh' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap');
        body { font-family: 'Quicksand', sans-serif; margin: 0; }
        .book-card { transition: 0.3s; } .book-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(62, 39, 35, 0.15); }
        div::-webkit-scrollbar { display: none; }
      `}</style>

{/* NAVBAR NÂNG CẤP */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8%', background: '#fff', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Link href="/" style={{ textDecoration: 'none', fontSize: '1.4rem', fontWeight: '800', color: COFFEE.medium }}>MOKAMOCHA</Link>
        
        {/* THANH TÌM KIẾM THÔNG MINH */}
        <div style={{ position: 'relative', width: '35%' }} ref={searchRef}>
          <div style={{ background: '#F5F5F5', borderRadius: '20px', padding: '8px 15px', display: 'flex', alignItems: 'center', border: `1px solid ${COFFEE.border}` }}>
            <input 
              style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem' }} 
              placeholder="Tìm truyện hoặc bạn bè..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <span>🔍</span>
          </div>

          {/* HIỂN THỊ GỢI Ý (TRUYỆN & NGƯỜI DÙNG) */}
          {searchTerm && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '45px', left: 0, right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: `1px solid ${COFFEE.border}`, zIndex: 2000, overflow: 'hidden' }}>
              {suggestions.map(s => (
                <div key={s.id}>
                  {s.cover_url ? (
                    /* Kết quả là Truyện */
                    <Link href={`/book/${s.id}`} style={navSearchItemStyle} onClick={() => setSearchTerm('')}>
                      <img src={s.cover_url} style={{ width: '35px', height: '50px', borderRadius: '4px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: COFFEE.deep }}>{s.title}</div>
                        <div style={{ fontSize: '0.7rem', color: COFFEE.light }}>Truyện</div>
                      </div>
                    </Link>
                  ) : (
                    /* Kết quả là Người dùng */
                    <div style={navSearchItemStyle} onClick={() => { setSelectedUser(s); setSearchTerm(''); }}>
                      <div style={navMiniAvatarStyle}>{s.email?.[0].toUpperCase()}</div>
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: COFFEE.deep }}>{s.email}</div>
                        <div style={{ fontSize: '0.7rem', color: COFFEE.light }}>Người dùng - Xem Profile</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CỤM ICON TIỆN ÍCH */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          {/* Nút Chat */}
          <Link href="/chat" style={{ fontSize: '1.4rem', textDecoration: 'none', color: COFFEE.deep }} title="Trò chuyện">💬</Link>
          
          {/* Thông báo */}
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNoti(!showNoti)}>
            <span style={{ fontSize: '1.4rem' }}>🔔</span>
            <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: COFFEE.medium, color: '#fff', fontSize: '0.65rem', padding: '2px 5px', borderRadius: '50%', fontWeight: 'bold' }}>
              {notifications.length}
            </span>
          </div>

          {/* Avatar User - Click vào là đi đến Profile */}
          {user ? (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    {/* Vòng tròn Profile */}
    <Link href="/profile" style={{ textDecoration: 'none' }} title="Hồ sơ của tôi">
      <div style={{ 
        width: '38px', height: '38px', borderRadius: '50%', 
        background: COFFEE.medium, color: '#fff', 
        display: 'flex', alignItems: 'center', justifyContent: 'center', 
        fontWeight: 'bold', fontSize: '1rem', border: `2px solid #fff`, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' 
      }}>
        {user.email?.charAt(0).toUpperCase()}
      </div>
    </Link>

    {/* Nút Đăng xuất - Thêm mới ở đây */}
    <button 
      onClick={async () => {
        await supabase.auth.signOut();
        window.location.href = '/'; // Đuổi về trang chủ cho sạch session
      }}
      style={{
        background: 'transparent',
        border: `1px solid ${COFFEE.medium}`,
        color: COFFEE.medium,
        padding: '6px 14px',
        borderRadius: '15px',
        cursor: 'pointer',
        fontSize: '0.8rem',
        fontWeight: '600',
        transition: '0.2s'
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(93, 64, 55, 0.1)')}
      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      Đăng xuất 
    </button>
  </div>
) : (
  <Link href="/login">
    <button style={{ background: COFFEE.medium, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
      Đăng nhập
    </button>
  </Link>
)}
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px', display: 'flex', gap: '30px' }}>
        <div style={{ flex: 3 }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', flexWrap: 'wrap' }}>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setActiveTag(tag)} style={{ padding: '7px 18px', borderRadius: '20px', border: `1px solid ${COFFEE.border}`, background: activeTag === tag ? COFFEE.medium : '#fff', color: activeTag === tag ? '#fff' : COFFEE.medium, fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' }}>{tag}</button>
            ))}
          </div>
          {loading ? <p>Đang pha cafe...</p> : (
            <>
              {renderBookGrid(" Đề cử cho bạn", books.slice(0, 6))}
              {renderBookGrid("Đam mỹ hot", books.filter(b => b.tags?.includes('Đam mỹ')))}
            </>
          )}
        </div>

        {/* SIDEBAR BẢNG XẾP HẠNG QUAY TRỞ LẠI */}
        <aside style={{ flex: 1 }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: `1px solid ${COFFEE.border}`, position: 'sticky', top: '90px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: COFFEE.deep, borderBottom: `2px solid ${COFFEE.border}`, paddingBottom: '10px' }}>🔥 BXH HOT</h3>
            {books.slice(0, 5).map((b, i) => (
              <Link href={`/book/${b.id}`} key={i} style={{ display: 'flex', gap: '12px', marginBottom: '15px', textDecoration: 'none', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: COFFEE.border }}>{i+1}</span>
                <img src={b.cover_url} style={{ width: '40px', height: '55px', borderRadius: '5px', objectFit: 'cover' }} />
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: COFFEE.deep, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.title}</div>
              </Link>
            ))}
          </div>
        </aside>
      </main>

      {/* FOOTER NÂU ĐẬM THEO ẢNH */}
      <footer style={{ background: COFFEE.deep, color: '#D7CCC8', padding: '60px 10% 40px', marginTop: '100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          <div>
            <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '0.9rem' }}>VỀ MOKAMOCHA</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2.2', fontSize: '0.85rem' }}>
              <li>Giới thiệu</li> <li>Chính sách</li> <li>Liên hệ</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '0.9rem' }}>LIÊN KẾT</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2.2', fontSize: '0.85rem' }}>
              <li>Truyện Mới</li> <li>Truyện Hot</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '0.9rem' }}>DMCA</h4>
            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Mọi nội dung đều được sưu tầm. Liên hệ: mimimeomeo345@gmail.com</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px', fontSize: '0.75rem' }}>
          © 2026 <strong>mokamocha.com</strong>
        </div>
      </footer>
    </div>
  )
}
const navSearchItemStyle = {
  display: 'flex', 
  gap: '12px', 
  padding: '12px', 
  textDecoration: 'none', 
  borderBottom: '1px solid #F5F5F5', 
  alignItems: 'center',
  cursor: 'pointer'
};

const navMiniAvatarStyle = {
  width: '35px', 
  height: '35px', 
  borderRadius: '50%', 
  background: '#5D4037', // Màu nâu COFFEE.medium
  color: '#fff', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  fontWeight: 'bold',
  fontSize: '0.85rem'
};