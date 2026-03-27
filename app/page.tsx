'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

const COFFEE = {
  deep: '#3E2723',
  medium: '#5D4037',
  light: '#8D6E63',
  border: '#D7CCC8',
  card: '#FFFFFF',
  bg: '#FDF5E6',
};

export default function HomePage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tất cả'); // State cho bộ lọc
  const router = useRouter();

  useEffect(() => {
    async function getBooks() {
      const { data } = await (supabase.from('books').select('*') as any);
      setBooks(data || []);
      setLoading(false);
    }
    getBooks();
  }, []);

  // --- LOGIC BỘ LỌC ---
  const filteredBooks = useMemo(() => {
    if (filter === 'Tất cả') return books;
    if (filter === 'Hoàn thành') return books.filter(b => b.status === 'Hoàn thành');
    return books.filter(b => b.category === filter);
  }, [books, filter]);

  if (loading) return <div style={loadingStyle}>☕ Đang chuẩn bị...</div>;

  return (
    <div style={pageWrapper}>
      {/* 1. LỚP NỀN GẤU MỜ RIÊNG BIỆT (KHÔNG LÀM MỜ CHỮ) */}
      <div style={bgOverlayStyle}></div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap');
        * { 
          font-family: 'Lexend', sans-serif !important; 
          -webkit-font-smoothing: antialiased; 
          box-sizing: border-box;
        }
        .book-card { transition: 0.3s ease; }
        .book-card:hover { transform: translateY(-8px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .filter-item { transition: 0.2s; cursor: pointer; padding: 5px 15px; border-radius: 15px; }
        .filter-item:hover { background: #F0EBE3; color: ${COFFEE.deep}; }
      `}} />

      {/* 2. BỘ LỌC CÓ LOGIC CHẠY */}
      <div style={filterContainer}>
        <div style={filterWrap}>
          {['Tất cả', 'Thịnh hành', 'Đề cử', 'Đam mỹ', 'Ngôn tình', 'Hoàn thành'].map((cat) => (
            <span 
              key={cat}
              onClick={() => setFilter(cat)}
              className="filter-item"
              style={filter === cat ? filterActive : filterNormal}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      <div style={container}>
        {/* CỘT TRÁI */}
        <div style={leftColumn}>
          {/* Hiển thị tiêu đề theo bộ lọc */}
          <BookBlock 
            title={filter === 'Tất cả' ? "✨ TẤT CẢ TRUYỆN" : `📖 THỂ LOẠI: ${filter.toUpperCase()}`} 
            items={filteredBooks} 
          />
          
          {filter === 'Tất cả' && (
            <>
              <BookBlock title="ĐAM MỸ" items={books.filter(b => b.category === 'Đam mỹ').slice(0, 5)} />
              <BookBlock title="HOÀN THÀNH" items={books.slice(-5).reverse()} />
            </>
          )}
        </div>

        {/* CỘT PHẢI (BXH) */}
        <aside style={sidebarStyle}>
          <div style={rankWrapper}>
            <div style={rankHeader}>BẢNG XẾP HẠNG</div>
            <div style={{ padding: '10px 15px' }}>
              {books.sort((a,b) => b.rating - a.rating).slice(0, 8).map((b, i) => (
                <Link href={`/book/${b.id}`} key={b.id} style={rankItem}>
                  <div style={rankNum(i)}>{i + 1}</div>
                  <div style={{ flex: 1, marginLeft: '12px', overflow: 'hidden' }}>
                    <div style={rankTitle}>{b.title}</div>
                    <div style={rankMeta}>{b.views || 0} lượt đọc</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <footer style={footerStyle}>
        <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>MOKAMOCHA</div>
        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>© 2026 Reading with Coffee</p>
      </footer>
    </div>
  );
}

function BookBlock({ title, items }: { title: string, items: any[] }) {
  const router = useRouter(); // Thêm dòng này để kích hoạt điều hướng

  return (
    <section style={blockArea}>
      <div style={blockHead}>
        <h2 style={blockTitle}>{title}</h2>
        <Link href="/more" style={viewMore}>Tất cả →</Link>
      </div>
      <div style={bookGrid}>
        {items.length > 0 ? items.map(book => (
          /* THÊM onClick vào đây: Bấm vào cả cái card là đi luôn */
          <div 
            key={book.id} 
            className="book-card" 
            style={{ ...cardStyle, cursor: 'pointer' }} 
            onClick={() => router.push(`/book/${book.id}`)}
          >
            <div style={coverWrap}>
              <img src={book.cover_url} style={coverImg} alt={book.title} />
            </div>
            <div style={{ padding: '12px' }}>
              <div style={bookName}>{book.title}</div>
              <div style={bookAuthor}>{book.author}</div>
              <button className="read-btn" style={readBtn}>ĐỌC TRUYỆN</button>
            </div>
          </div>
        )) : <div style={{padding: '20px', color: '#999'}}>Không tìm thấy truyện nào...</div>}
      </div>
    </section>
  );
}

// --- STYLES ---

const pageWrapper: React.CSSProperties = { 
  minHeight: '100vh', 
  backgroundColor: '#FDF5E6',
  position: 'relative',
};

// ĐÂY LÀ LỚP NỀN GẤU MỜ (Opacity 0.3)
const bgOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundImage: `url('/bg-coffee.png')`,
  backgroundSize: '350px', backgroundRepeat: 'repeat',
  opacity: 0.3, zIndex: 0, pointerEvents: 'none'
};

const filterContainer = { 
  background: '#fff', 
  padding: '15px', // Sửa từ 8% thành 15px
  position: 'sticky' as any, 
  top: 0, 
  zIndex: 100, 
  borderBottom: `1px solid ${COFFEE.border}`,
  boxSizing: 'border-box'
};
const filterWrap = { display: 'flex', gap: '15px', maxWidth: '1300px', margin: '0 auto', flexWrap: 'wrap' as any };
const filterNormal = { fontSize: '0.85rem', fontWeight: '600', color: COFFEE.light };
const filterActive = { fontSize: '0.85rem', fontWeight: '700', color: COFFEE.deep, background: '#F0EBE3' };

const container: React.CSSProperties = { 
  display: 'flex', 
  flexDirection: 'row',
  flexWrap: 'wrap', // THÊM CÁI NÀY: Để Sidebar tự nhảy xuống dưới khi hết chỗ
  padding: '20px 15px', // Sửa từ 8% thành 15px
  gap: '20px', 
  maxWidth: '1400px', 
  margin: '0 auto', 
  position: 'relative', 
  zIndex: 1,
  boxSizing: 'border-box'
};
const sidebarStyle: React.CSSProperties = { 
  flex: '1', 
  minWidth: '280px', // Đủ rộng để hiện BXH
  width: '100%',
  marginTop: '20px' 
};
const blockArea: React.CSSProperties = { 
  background: '#FFF', 
  padding: '15px', // Giảm từ 25px xuống 15px
  borderRadius: '20px', 
  marginBottom: '25px', 
  border: `1px solid ${COFFEE.border}`, 
  boxShadow: '0 5px 15px rgba(0,0,0,0.02)',
  boxSizing: 'border-box'
};
// Dòng 135 nè bạn:
const leftColumn: React.CSSProperties = { 
  flex: '3', 
  minWidth: '320px', // Đảm bảo không bị quá hẹp trên điện thoại
  width: '100%',
  boxSizing: 'border-box'
};
const blockHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
const blockTitle = { fontSize: '1rem', fontWeight: '700', color: COFFEE.deep, margin: 0 };
const viewMore = { fontSize: '0.75rem', fontWeight: '600', color: COFFEE.medium, textDecoration: 'none' };

const bookGrid = {
  display: 'grid',
  // Tự động tính toán số cột dựa trên chiều rộng màn hình
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
  gap: '15px',
  width: '100%',
};
const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '20px', overflow: 'hidden', border: `1px solid #F0F0F0`, textAlign: 'center' };
const coverWrap = { width: '100%', height: '200px', overflow: 'hidden' };
const coverImg = { width: '100%', height: '100%', objectFit: 'cover' as any };

// CHỮ KHÔNG CÒN ĐẬM NHẠT (Fix weight)
const bookName = { fontWeight: '600', fontSize: '0.8rem', color: COFFEE.deep, marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as any;
const bookAuthor = { fontSize: '0.7rem', color: COFFEE.light, marginBottom: '10px', fontWeight: '400' };
const readBtn = { width: '100%', padding: '8px 0', borderRadius: '12px', fontWeight: '600', fontSize: '0.7rem', cursor: 'pointer', border: `1.5px solid ${COFFEE.medium}` };

const rankWrapper = { background: '#fff', borderRadius: '25px', border: `1px solid ${COFFEE.border}`, overflow: 'hidden', position: 'sticky' as any, top: '90px' };
const rankHeader = { background: COFFEE.deep, color: '#fff', padding: '15px', textAlign: 'center' as any, fontWeight: '700', fontSize: '0.85rem' };
const rankItem = { display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #F5F5F5', textDecoration: 'none', color: COFFEE.deep };
// Chèn cái này vào chỗ các biến const style ở cuối file nhé
const rankNum = (i: number): React.CSSProperties => ({ 
  minWidth: '24px', 
  height: '24px', 
  borderRadius: '50%', 
  background: i < 3 ? COFFEE.medium : '#F0EBE3', 
  color: i < 3 ? '#fff' : '#888', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  fontSize: '0.7rem', 
  fontWeight: '700' 
});
const rankTitle = { fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as any;
const rankMeta = { fontSize: '0.65rem', color: COFFEE.light };

const footerStyle: React.CSSProperties = { textAlign: 'center', padding: '50px', background: COFFEE.deep, color: '#fff', marginTop: '40px', position: 'relative', zIndex: 1 };
const loadingStyle: React.CSSProperties = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: COFFEE.deep };