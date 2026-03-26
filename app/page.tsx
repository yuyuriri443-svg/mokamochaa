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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([])
  const [filteredBooks, setFilteredBooks] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTag, setActiveTag] = useState('Tất cả')
  const [showNoti, setShowNoti] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false); // ĐÃ THÊM DÒNG NÀY ĐỂ HẾT LỖI

  const searchRef = useRef<HTMLDivElement>(null)
  const notiRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  const allTags = ['Tất cả', 'Đam mỹ', 'Trọng sinh', 'Cổ đại', 'Hiện đại', 'Ngọt sủng', 'Ngược']
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSuggestions([])
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) setShowNoti(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

// Thêm tham số "tag" vào cuối (mặc định là 'Tất cả')
const renderBookGrid = (title: string, dataList: any[], tag: string = 'Tất cả') => (
  <section style={{ marginBottom: '50px', padding: '0 10px' }}>
    {/* Tiêu đề mục */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${COFFEE.border}`, paddingBottom: '10px', marginBottom: '20px' }}>
      <h2 style={{ fontSize: '1.4rem', color: COFFEE.deep, margin: 0, fontWeight: '800' }}>{title}</h2>
      <Link href={`/more?tag=${tag}`} style={{ color: COFFEE.light, textDecoration: 'none', fontSize: '0.9rem', fontWeight: '700' }}>
        Tất cả ➜
      </Link>
    </div>

    {/* Danh sách cuộn ngang - Giới hạn chiều cao thiết bị */}
    <div className="hide-scrollbar" style={{ 
      display: 'flex', 
      gap: '20px', 
      overflowX: 'auto', 
      padding: '20px 5px',
      perspective: '1000px' // Tạo môi trường 3D
    }}>
      {dataList.slice(0, 10).map((book) => (
        <Link href={`/book/${book.id}`} key={book.id} style={{ textDecoration: 'none', flex: '0 0 auto' }}>
          
          {/* Card Sách Nổi Khối 3D */}
          <div className="book-3d-card" style={{
            width: '160px', // Block bé bé xinh xinh theo ý bạn
            backgroundColor: '#fff',
            borderRadius: '24px',
            padding: '12px',
            border: '1px solid #D7CCC8',
            boxShadow: '0 10px 20px rgba(93, 64, 55, 0.1)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            position: 'relative',
            textAlign: 'center'
          }}>
            
            {/* Ảnh bìa */}
            <div style={{ 
              height: '210px', 
              borderRadius: '18px', 
              overflow: 'hidden', 
              marginBottom: '10px',
              boxShadow: '0 8px 15px rgba(0,0,0,0.1)'
            }}>
              <img 
                src={book.cover_url} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                alt={book.title}
              />
            </div>

            {/* Tên truyện */}
            <h3 style={{ 
              fontSize: '0.85rem', 
              fontWeight: '700', 
              color: '#3E2723', 
              margin: '5px 0',
              height: '34px',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {book.title}
            </h3>

            {/* Nút Đọc Tác Phẩm (Hiện lên khi Hover) */}
            <div className="read-now-btn" style={{
              marginTop: '8px',
              padding: '6px 0',
              backgroundColor: '#5D4037',
              color: '#fff',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              opacity: 0,
              transition: '0.3s'
            }}>
              Đọc tác phẩm
            </div>
          </div>
        </Link>
      ))}
    </div>

    {/* CSS để tạo hiệu ứng NỔI KHỐI 3D khi di chuột vào */}
    <style jsx global>{`
      .book-3d-card:hover {
        transform: translateZ(30px) translateY(-12px); /* Nổi lên phía trước và bay lên trên */
        box-shadow: 0 25px 50px rgba(93, 64, 55, 0.25) !important;
        border-color: #A1887F !important;
      }
      .book-3d-card:hover .read-now-btn {
        opacity: 1 !important;
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
  </section>
);

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

  return (
    <div style={{ backgroundImage: `linear-gradient(${COFFEE.bgOverlay}, ${COFFEE.bgOverlay}), url("/bg-coffee.png")`, backgroundAttachment: 'fixed', backgroundSize: 'cover', minHeight: '100vh' }}>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap');
        body { font-family: 'Quicksand', sans-serif; margin: 0; }
        .book-card { transition: 0.3s; } .book-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(62, 39, 35, 0.15); }
        div::-webkit-scrollbar { display: none; }
      `}</style>

      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8%', background: '#fff', position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <Link href="/" style={{ textDecoration: 'none', fontSize: '1.4rem', fontWeight: '800', color: COFFEE.medium }}>MOKAMOCHA</Link>
        
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

          {searchTerm && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '45px', left: 0, right: 0, background: '#fff', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', border: `1px solid ${COFFEE.border}`, zIndex: 2000, overflow: 'hidden' }}>
              {suggestions.map(s => (
                <div key={s.id}>
                  {s.cover_url ? (
                    <Link href={`/book/${s.id}`} style={navSearchItemStyle} onClick={() => setSearchTerm('')}>
                      <img src={s.cover_url} style={{ width: '35px', height: '50px', borderRadius: '4px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: COFFEE.deep }}>{s.title}</div>
                        <div style={{ fontSize: '0.7rem', color: COFFEE.light }}>Truyện</div>
                      </div>
                    </Link>
                  ) : (
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          <Link href="/chat" style={{ fontSize: '1.4rem', textDecoration: 'none', color: COFFEE.deep }} title="Trò chuyện">💬</Link>
          
          <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNoti(!showNoti)}>
            <span style={{ fontSize: '1.4rem' }}>🔔</span>
            <span style={{ position: 'absolute', top: '-5px', right: '-8px', background: COFFEE.medium, color: '#fff', fontSize: '0.65rem', padding: '2px 5px', borderRadius: '50%', fontWeight: 'bold' }}>
              {notifications.length}
            </span>
          </div>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = '/';
                }}
                style={{
                  background: 'transparent', border: `1px solid ${COFFEE.medium}`,
                  color: COFFEE.medium, padding: '6px 14px', borderRadius: '15px',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600'
                }}
              > Đăng xuất </button>
            </div>
          ) : (
            <Link href="/login">
              <button style={{ background: COFFEE.medium, color: '#fff', border: 'none', padding: '8px 18px', borderRadius: '20px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>Đăng nhập</button>
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
              {renderBookGrid("Đề cử cho bạn", books.slice(0, 6), "Tất cả")}
              {renderBookGrid("Đam mỹ hot", books.filter(b => b.tags?.includes('Đam mỹ')), "Đam mỹ")}
              {renderBookGrid("Ngọt sủng", books.filter(b => b.tags?.includes('Ngọt sủng')), "Ngọt sủng")}

            </>
          )}
        </div>

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

      <footer style={{ background: COFFEE.deep, color: '#D7CCC8', padding: '60px 10% 40px', marginTop: '100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          <div>
            <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '0.9rem' }}>VỀ MOKAMOCHA</h4>
            <ul style={{ listStyle: 'none', padding: 0, lineHeight: '2.2', fontSize: '0.85rem' }}>
              <li>Giới thiệu</li> <li>Chính sách</li> <li>Liên hệ</li>
            </ul>
          </div>
          <div>
             <h4 style={{ color: '#fff', marginBottom: '20px', fontSize: '0.9rem' }}>DMCA</h4>
             <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>mimimeomeo345@gmail.com</p>
          </div>
        </div>
      </footer>

      {selectedUser && (
        <div style={modalOverlay}>
          <div style={profileCard}>
            <button onClick={() => setSelectedUser(null)} style={closeBtn}>✕</button>
            <div style={avatarBig}>{selectedUser.email?.charAt(0).toUpperCase()}</div>
            <h2 style={{color: COFFEE.deep}}>{selectedUser.email}</h2>
            <Link href={`/chat?u=${selectedUser.id}`} style={messageBtn}>💬 Nhắn tin ngay</Link>
          </div>
        </div>
      )}
    </div>
  )
  
}

const navSearchItemStyle = { display: 'flex', gap: '12px', padding: '12px', textDecoration: 'none', borderBottom: '1px solid #F5F5F5', alignItems: 'center', cursor: 'pointer' };
const navMiniAvatarStyle = { width: '35px', height: '35px', borderRadius: '50%', background: '#5D4037', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem' };
const modalOverlay: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 };
const profileCard: React.CSSProperties = { background: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center', position: 'relative', width: '300px' };
const closeBtn: React.CSSProperties = { position: 'absolute', top: '10px', right: '15px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' };
const avatarBig: React.CSSProperties = { width: '80px', height: '80px', borderRadius: '50%', background: '#5D4037', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 'bold', margin: '0 auto 15px' };
const messageBtn: React.CSSProperties = { display: 'block', marginTop: '20px', padding: '10px', background: '#5D4037', color: '#fff', borderRadius: '10px', textDecoration: 'none' };