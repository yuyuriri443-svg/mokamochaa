'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const [noti, setNoti] = useState<any>(null); // State cho thông báo
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Tất cả');
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    async function fetchData() {
      // Lấy danh sách truyện
      const { data: bookData } = await supabase.from('books').select('*');
      setBooks(bookData || []);

      // Lấy thông báo mới nhất đang hoạt động
      const { data: notiData } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      setNoti(notiData);

      setLoading(false);
    }
    fetchData();
  }, []);

  const isAdmin = user?.email === 'yuyuriri443@gmail.com';

  const filteredBooks = useMemo(() => {
    if (filter === 'Tất cả') return books;
    if (filter === 'Hoàn thành') return books.filter(b => b.status === 'Hoàn thành');
    return books.filter(b => b.category === filter);
  }, [books, filter]);

  if (loading) return <div style={loadingStyle}>☕ Đang pha cà phê...</div>;

  return (
    <div style={pageWrapper}>
      <div style={bgOverlayStyle}></div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap');
        * { font-family: 'Lexend', sans-serif !important; box-sizing: border-box; }
        .book-card { transition: 0.3s ease; flex: 0 0 auto; width: 150px; }
        .book-card:hover { transform: translateY(-5px); }
        .filter-item { transition: 0.2s; cursor: pointer; padding: 6px 16px; border-radius: 20px; white-space: nowrap; }
        .filter-item:hover { background: #F0EBE3; color: ${COFFEE.deep}; }
        /* Thanh cuộn ngang mượt mà cho mobile */
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* BỘ LỌC STICKY */}
      <div style={filterContainer}>
        <div style={filterWrap} className="hide-scrollbar">
          {['Tất cả', 'Thịnh hành', 'Đề cử', 'Đam mỹ', 'Ngôn tình', 'Hoàn thành'].map((cat) => (
            <span 
              key={cat}
              onClick={() => setFilter(cat)}
              className="filter-item"
              style={filter === cat ? (filterActive as any) : (filterNormal as any)}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* HIỂN THỊ THÔNG BÁO */}
      {noti && (
        <div style={notiBar(noti.type)}>
          <span style={{ marginRight: '10px' }}>{noti.type === 'alert' ? '⚠️' : '🔔'}</span>
          <marquee scrollamount="5" style={{ flex: 1 }}>
            <b>{noti.title}:</b> {noti.content}
          </marquee>
        </div>
      )}

      <div style={container}>
        <div style={leftColumn}>
          {/* LUÔN HIỆN PHẦN LỌC TRÊN CÙNG */}
          <BookBlock 
            title={filter === 'Tất cả' ? " TẤT CẢ " : `📖 THỂ LOẠI: ${filter.toUpperCase()}`} 
            items={filteredBooks} 
            isFullGrid={filter !== 'Tất cả'} // Nếu lọc thể loại thì hiện Grid, nếu là Tất cả thì hiện dòng
          />
          
          {/* NẾU ĐANG Ở "TẤT CẢ" THÌ HIỆN CÁC DÒNG ĐỀ XUẤT */}
          {filter === 'Tất cả' && (
            <>
              <BookBlock 
                title="ĐAM MỸ " 
                items={books.filter(b => b.category === 'Đam mỹ')} 
                isRow={true} 
              />
              <BookBlock 
                title="HOÀN THÀNH" 
                items={books.filter(b => b.status === 'Hoàn thành' || b.category === 'Hoàn thành')} 
                isRow={true} 
              />
            </>
          )}
        </div>

        {/* BXH BÊN PHẢI */}
        <aside style={sidebarStyle}>
          <div style={rankWrapper}>
            <div style={rankHeader}>BẢNG XẾP HẠNG</div>
            <div style={{ padding: '10px 5px' }}>
              {[...books].sort((a,b) => (b.views || 0) - (a.views || 0)).slice(0, 8).map((b, i) => (
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

      {isAdmin && (
        <Link href="/admin">
          <div style={adminFixedBtn}>⚙️ Quản trị</div>
        </Link>
      )}

      <footer style={footerStyle}>
        <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>MOKAMOCHA</div>
        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>© 2026 Reading with Coffee</p>
      </footer>
    </div>
  );
}

// COMPONENT CON: BOOKBLOCK
function BookBlock({ title, items, isRow = false, isFullGrid = false }: { title: string, items: any[], isRow?: boolean, isFullGrid?: boolean }) {
  const router = useRouter();

  // Kiểu hiển thị: Nếu là Row (ngoài home) thì dàn hàng ngang, nếu FullGrid thì dàn lưới
  const displayStyle: React.CSSProperties = isRow ? {
    display: 'flex',
    gap: '15px',
    overflowX: 'auto',
    paddingBottom: '10px'
  } : {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '20px'
  };

  return (
    <section style={blockArea}>
      <div style={blockHead}>
        <h2 style={blockTitle}>{title}</h2>
        <Link href="/more" style={viewMore}>Xem thêm →</Link>
      </div>
      
      <div style={displayStyle} className="hide-scrollbar">
        {items.length > 0 ? items.map(book => (
          <div 
            key={book.id} 
            className="book-card" 
            style={cardStyle} 
            onClick={() => router.push(`/book/${book.id}`)}
          >
            <div style={coverWrap}>
              <img src={book.cover_url} style={coverImg} alt={book.title} />
            </div>
            <div style={{ padding: '10px 8px' }}>
              <div style={bookName}>{book.title}</div>
              <div style={bookAuthor}>{book.author}</div>
              <button style={readBtn}>ĐỌC NGAY</button>
            </div>
          </div>
        )) : <div style={{padding: '20px', color: '#999', fontSize: '0.8rem'}}>Đang cập nhật dữ liệu...</div>}
      </div>
    </section>
  );
}

// --- STYLES ---
const pageWrapper: React.CSSProperties = { minHeight: '100vh', backgroundColor: '#FDF5E6', position: 'relative' };
const bgOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url('/bg-coffee.png')`, backgroundSize: '350px', opacity: 0.2, zIndex: 0, pointerEvents: 'none' };
const filterContainer: React.CSSProperties = { background: '#fff', padding: '12px', position: 'sticky', top: 0, zIndex: 100, borderBottom: `1px solid ${COFFEE.border}` };
const filterWrap = { display: 'flex', gap: '10px', maxWidth: '1300px', margin: '0 auto', overflowX: 'auto' as any };
const filterNormal = { fontSize: '0.8rem', fontWeight: '600', color: COFFEE.light };
const filterActive = { fontSize: '0.8rem', fontWeight: '700', color: COFFEE.deep, background: '#F0EBE3' };

const notiBar = (type: string): React.CSSProperties => ({
  maxWidth: '1300px', margin: '15px auto 0', padding: '10px 20px',
  background: type === 'alert' ? '#FFEBEE' : '#EFEBE9',
  color: type === 'alert' ? '#C62828' : COFFEE.deep,
  borderRadius: '50px', display: 'flex', alignItems: 'center',
  fontSize: '0.8rem', border: `1px solid ${type === 'alert' ? '#FFCDD2' : COFFEE.border}`,
  zIndex: 1, position: 'relative'
});

const container: React.CSSProperties = { display: 'flex', gap: '25px', maxWidth: '1300px', margin: '0 auto', padding: '20px 15px', position: 'relative', zIndex: 1 };
const leftColumn: React.CSSProperties = { flex: '1', minWidth: 0 }; // fix flex shrink lỗi grid
const sidebarStyle: React.CSSProperties = { width: '300px', display: 'block' };

const blockArea: React.CSSProperties = { background: '#FFF', padding: '20px', borderRadius: '24px', marginBottom: '25px', border: `1px solid ${COFFEE.border}` };
const blockHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' };
const blockTitle = { fontSize: '0.95rem', fontWeight: '700', color: COFFEE.deep, margin: 0, borderLeft: `4px solid ${COFFEE.medium}`, paddingLeft: '10px' };
const viewMore = { fontSize: '0.7rem', fontWeight: '600', color: COFFEE.medium, textDecoration: 'none' };

const cardStyle: React.CSSProperties = { background: '#fff', borderRadius: '16px', overflow: 'hidden', border: `1px solid #F5F5F5`, cursor: 'pointer', textAlign: 'center' };
const coverWrap = { width: '100%', height: '190px' };
const coverImg = { width: '100%', height: '100%', objectFit: 'cover' as any };
const bookName = { fontWeight: '600', fontSize: '0.8rem', color: COFFEE.deep, marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 5px' } as any;
const bookAuthor = { fontSize: '0.65rem', color: COFFEE.light, marginBottom: '8px' };
const readBtn: React.CSSProperties = { width: '100%', padding: '6px 0', borderRadius: '10px', fontWeight: '700', fontSize: '0.65rem', border: `1px solid ${COFFEE.medium}`, background: 'transparent', color: COFFEE.medium };

const rankWrapper = { background: '#fff', borderRadius: '24px', border: `1px solid ${COFFEE.border}`, overflow: 'hidden', position: 'sticky' as any, top: '80px' };
const rankHeader = { background: COFFEE.deep, color: '#fff', padding: '12px', textAlign: 'center' as any, fontWeight: '700', fontSize: '0.8rem' };
const rankItem = { display: 'flex', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #F9F9F9', textDecoration: 'none', color: COFFEE.deep };
const rankNum = (i: number): React.CSSProperties => ({ minWidth: '22px', height: '22px', borderRadius: '6px', background: i < 3 ? COFFEE.medium : '#F0EBE3', color: i < 3 ? '#fff' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700' });
const rankTitle = { fontSize: '0.75rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } as any;
const rankMeta = { fontSize: '0.6rem', color: COFFEE.light };

const footerStyle: React.CSSProperties = { textAlign: 'center', padding: '40px', background: COFFEE.deep, color: '#fff', marginTop: '30px' };
const loadingStyle: React.CSSProperties = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDF5E6', color: COFFEE.deep };
const adminFixedBtn: React.CSSProperties = { position: 'fixed', bottom: '25px', right: '25px', background: COFFEE.deep, color: '#fff', padding: '10px 20px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', zIndex: 999, fontSize: '0.8rem', border: '2px solid #fff' };