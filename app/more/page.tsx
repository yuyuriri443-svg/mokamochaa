'use client';
import React, { useEffect, useState, Suspense, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient'; 
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Màu sắc chủ đạo đồng bộ với Home
const COFFEE = {
  deep: '#3E2723',
  medium: '#5D4037',
  light: '#8D6E63',
  border: '#D7CCC8',
  bg: '#FFF9F5'
};

function MoreContent() {
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get('tag') || 'Tất cả';
  
  // --- DÁN CÁC DÒNG NÀY ĐỂ HẾT LỖI NOT DEFINED ---
  const searchRef = useRef(null);
  const [user, setUser] = useState<any>(null); // Lưu thông tin người dùng
  const [notifications, setNotifications] = useState<any[]>([]); // Lưu thông tin thông báo
  const [showNoti, setShowNoti] = useState(false); // Ẩn hiện menu thông báo
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]); // Gợi ý tìm kiếm
  const setSelectedUser = (u: any) => { console.log("Selected:", u); };
  // ----------------------------------------------

  const [books, setBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const booksPerPage = 27;

  // Lấy dữ liệu user và thông báo khi trang load
  useEffect(() => {
    async function getInitialData() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      // Bạn có thể fetch notifications từ supabase ở đây nếu muốn
    }
    getInitialData();
  }, []);

  // ... (Các useEffect fetch books giữ nguyên)
  useEffect(() => {
    async function fetchBooks() {
      const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      if (data) {
        setBooks(data);
        const filtered = tagFromUrl === 'Tất cả' 
          ? data 
          : data.filter((b: any) => b.tags?.includes(tagFromUrl));
        setFilteredBooks(filtered);
      }
      setLoading(false);
    }
    fetchBooks();
  }, [tagFromUrl]);

  // Xử lý tìm kiếm nhanh tại trang More
  const displayBooks = filteredBooks.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastBook = currentPage * booksPerPage;
  const indexOfFirstBook = indexOfLastBook - booksPerPage;
  const currentBooks = displayBooks.slice(indexOfFirstBook, indexOfLastBook);
  const totalPages = Math.ceil(displayBooks.length / booksPerPage);

  if (loading) return <div style={loadingStyle}> Đang load ...</div>;

  return (
    <div style={pageWrapper}>
      <div style={backgroundOverlay}></div>

  

      <main style={mainContainer}>
        <Link href="/" style={backButtonStyle}>
            <span>Quay lại Trang chủ</span>
        </Link>

        <header style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'flex-start', // Đẩy hết qua bên trái
    marginBottom: '30px', 
    position: 'relative',
    borderBottom: `2px dashed ${COFFEE.border}`, // Thêm gạch chân nét đứt cho đồng bộ
    paddingBottom: '10px'
  }}>
    <h1 style={{ 
      fontSize: '1.2rem', // Chữ bé lại (bằng size tiêu đề trang chủ)
      fontWeight: '800', 
      color: COFFEE.deep, 
      margin: 0,
      textTransform: 'uppercase'
    }}>
      📖 {tagFromUrl}
    </h1>
    {/* Bỏ dòng "Tìm thấy X tác phẩm" và dấu gạch cam cũ */}
  </header>

        {/* Grid Truyện 3D */}
        <div style={gridStyle} className="book-grid-responsive">
          {currentBooks.map((book) => (
            <Link href={`/book/${book.id}`} key={book.id} style={{ textDecoration: 'none' }}>
              <div className="book-card-3d" style={cardStyle}>
                <div style={imageWrapperStyle}>
                  <img src={book.cover_url} style={imageStyle} alt={book.title} />
                  <div className="read-btn-overlay">Đọc truyện </div>
                </div>
                <h3 style={bookTitleStyle}>{book.title}</h3>
                <div style={priceRow}>
                  <span style={priceText}>{book.price?.toLocaleString()}đ</span>
                  <span style={{fontSize: '1rem'}}></span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Phân trang tròn */}
        {totalPages > 1 && (
          <div style={paginationContainer}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button 
                key={i + 1} 
                onClick={() => {setCurrentPage(i + 1); window.scrollTo(0,0);}}
                style={{
                  ...pageBtn,
                  backgroundColor: currentPage === i + 1 ? COFFEE.deep : 'rgba(255,255,255,0.9)',
                  color: currentPage === i + 1 ? '#fff' : COFFEE.deep,
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </main>

      <footer style={footerStyle}>
        <p>© 2024 Moka Mocha</p>
      </footer>

      <style jsx global>{`
        .book-card-3d {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          z-index: 1;
        }
        .book-card-3d:hover {
          transform: translateY(-12px) translateZ(30px);
          box-shadow: 0 25px 50px rgba(62, 39, 35, 0.4) !important;
          background: #fff !important;
          z-index: 10;
        }
        .read-btn-overlay {
  position: absolute; 
  bottom: 20px; /* Cách đáy ảnh */
  left: 50%;
  transform: translateX(-50%); /* Căn giữa */
  background: #3E2723; /* Màu nâu đậm */
  color: white; 
  padding: 8px 20px;
  opacity: 0; 
  transition: 0.3s; 
  font-weight: bold; 
  border-radius: 20px; /* Bo oval */
  font-size: 0.8rem;
  white-space: nowrap;
}
        .book-card-3d:hover .read-btn-overlay { opacity: 1; }
      `}</style>
    </div>
  );
}

export default function MorePage() {
  return (
    <Suspense fallback={<div>Đang tải Thư viện...</div>}>
      <MoreContent />
    </Suspense>
  );
}

// --- HỆ THỐNG STYLES ---

const pageWrapper: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  backgroundImage: 'url("/bg-coffee.png")', backgroundSize: 'cover',
  backgroundPosition: 'center', backgroundAttachment: 'fixed', position: 'relative',
};

const backgroundOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  backgroundColor: 'rgba(255, 249, 245, 0.75)',
  backdropFilter: 'blur(4px)', zIndex: 0,
};

const navbarStyle: React.CSSProperties = {
  position: 'fixed', top: 0, width: '100%', zIndex: 1000,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  padding: '12px 5%', display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', borderBottom: `2px  ${COFFEE.border}`,
  backdropFilter: 'blur(10px)'
};

const searchBoxStyle: React.CSSProperties = {
  background: '#F5F5F5', borderRadius: '20px', padding: '8px 15px',
  display: 'flex', alignItems: 'center', border: `1px solid ${COFFEE.border}`
};

const inputStyle: React.CSSProperties = {
  border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem'
};

const mainContainer: React.CSSProperties = {
  flex: 1, 
  padding: '120px 15px 60px', // Thay 5% bằng 15px để trên điện thoại chữ không bị dính lề mà vẫn rộng
  maxWidth: '1400px',
  margin: '0 auto', 
  width: '100%', 
  position: 'relative', 
  zIndex: 1,
  boxSizing: 'border-box', // Đảm bảo padding không làm tràn chiều rộng
};

const backButtonStyle: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fff',
  padding: '10px 20px', borderRadius: '25px', border: `2px solid ${COFFEE.medium}`,
  textDecoration: 'none', color: COFFEE.medium, fontWeight: 'bold', fontSize: '0.85rem',
  marginBottom: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
};

const gridStyle: React.CSSProperties = {
  display: 'grid', 
  // Chỉnh 165px xuống 140px để trên đt nó xếp được 2 cột thay vì 1 cột to đùng
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
  gap: '15px', // Giảm gap xuống một chút để tiết kiệm không gian ngang
  width: '100%',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '24px',
  padding: '12px', border: `2px solid ${COFFEE.border}`, textAlign: 'center',
};

const navLinkStyle = { textDecoration: 'none', color: COFFEE.medium, fontWeight: '700', fontSize: '0.9rem' };

const avatarStyle: React.CSSProperties = {
  width: '35px', height: '35px', borderRadius: '50%', background: COFFEE.medium,
  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
};

const titleStyle: React.CSSProperties = { fontSize: '2.5rem', fontWeight: '900', color: COFFEE.deep, marginBottom: '10px' };
const solidLine = { width: '120px', height: '4px', borderBottom: '4px none #F97316', margin: '0 auto 20px' };
const imageWrapperStyle: React.CSSProperties = { position: 'relative', height: '220px', borderRadius: '18px', overflow: 'hidden', marginBottom: '12px', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' };
const imageStyle: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const bookTitleStyle: React.CSSProperties = { fontSize: '0.9rem', fontWeight: '800', color: COFFEE.deep, height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' };
const priceRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #eee', paddingTop: '10px' };
const priceText = { fontSize: '0.95rem', fontWeight: '900', color: COFFEE.light };
const paginationContainer: React.CSSProperties = { marginTop: '60px', display: 'flex', justifyContent: 'center', gap: '15px' };
const pageBtn: React.CSSProperties = { width: '45px', height: '45px', borderRadius: '50%', border: `2px  ${COFFEE.deep}`, fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const footerStyle: React.CSSProperties = { backgroundColor: 'rgba(62, 39, 35, 0.98)', color: '#fff', textAlign: 'center', padding: '25px', fontSize: '0.85rem', marginTop: 'auto', zIndex: 1 };
const loadingStyle: React.CSSProperties = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COFFEE.bg, fontWeight: 'bold', color: COFFEE.medium };
const navSearchItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '12px', padding: '10px',
  textDecoration: 'none', borderBottom: `1px solid #eee`, transition: '0.2s'
};

const navMiniAvatarStyle: React.CSSProperties = {
  width: '35px', height: '35px', borderRadius: '50%', background: COFFEE.medium,
  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '0.8rem', fontWeight: 'bold'
};

const logoutBtnStyle: React.CSSProperties = {
  background: 'transparent', border: `1px solid ${COFFEE.medium}`,
  color: COFFEE.medium, padding: '6px 14px', borderRadius: '15px',
  cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600'
};

const loginBtnStyle: React.CSSProperties = {
  background: COFFEE.medium, color: '#fff', border: 'none',
  padding: '8px 18px', borderRadius: '20px', cursor: 'pointer',
  fontWeight: '600', fontSize: '0.85rem'
};