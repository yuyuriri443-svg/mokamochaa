'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient'; 
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function MorePage() {
  const searchParams = useSearchParams();
  const tagFromUrl = searchParams.get('tag') || 'Tất cả';
  
  const [books, setBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
      if (data) {
        setBooks(data);
        if (tagFromUrl === 'Tất cả') {
          setFilteredBooks(data);
        } else {
          setFilteredBooks(data.filter((b: any) => b.tags?.includes(tagFromUrl)));
        }
      }
      setLoading(false);
    }
    fetchBooks();
  }, [tagFromUrl]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF9F5] text-[#5D4037] font-bold">
       ☕ Đang tìm truyện cho bạn...
    </div>
  );

  return (
    <div style={containerStyle}>
      {/* Nút Back Xinh Xắn */}
      <Link href="/" style={backButtonStyle}>
        <span style={{ fontSize: '1.2rem' }}>⬅</span> <span>Quay lại</span>
      </Link>

      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={titleStyle}>
          {tagFromUrl === 'Tất cả' ? 'THƯ VIỆN' : tagFromUrl.toUpperCase()}
        </h1>
        <p style={{ color: '#8D6E63', fontSize: '0.9rem', fontWeight: '600' }}>
          {filteredBooks.length} tác phẩm đang chờ bạn
        </p>
      </header>

      {/* Grid Truyện Block Bé Bé */}
      <div style={gridStyle}>
        {filteredBooks.map((book) => (
          <Link href={`/book/${book.id}`} key={book.id} style={{ textDecoration: 'none' }}>
            <div className="book-card-mini" style={cardStyle}>
              {/* Cover bé */}
              <div style={imageWrapperStyle}>
                <img src={book.cover_url} style={imageStyle} alt={book.title} />
              </div>
              
              {/* Info */}
              <div style={{ padding: '8px 4px' }}>
                <h3 style={bookTitleStyle}>{book.title}</h3>
                <div style={priceWrapperStyle}>
                  <span style={priceStyle}>{book.price?.toLocaleString()}đ</span>
                  <div style={arrowCircleStyle}>➜</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx global>{`
        .book-card-mini {
          transition: all 0.3s ease;
        }
        .book-card-mini:hover {
          transform: translateY(-8px);
          box-shadow: 0 15px 30px rgba(93, 64, 55, 0.2) !important;
          background-color: #fff !important;
        }
      `}</style>
    </div>
  );
}

// --- STYLES (Tông xuỵt tông với Khung Chat/Home) ---

const containerStyle: React.CSSProperties = {
  backgroundColor: '#FFF9F5', // Nền kem đặc trưng
  backgroundImage: 'radial-gradient(#D7CCC8 0.5px, transparent 0.5px)', // Chấm bi mờ cho đỡ trống
  backgroundSize: '20px 20px',
  minHeight: '100vh',
  padding: '80px 5% 40px',
  position: 'relative'
};

const backButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '25px',
  left: '5%',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  textDecoration: 'none',
  color: '#5D4037',
  fontWeight: 'bold',
  fontSize: '0.9rem',
  background: '#fff',
  padding: '8px 16px',
  borderRadius: '15px',
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
};

const titleStyle: React.CSSProperties = {
  fontSize: '2rem',
  fontWeight: '900',
  color: '#3E2723',
  letterSpacing: '-1px',
  margin: 0
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', // Block bé bé xinh xinh
  gap: '25px',
  maxWidth: '1200px',
  margin: '0 auto'
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  borderRadius: '24px',
  padding: '10px',
  border: '1px solid #D7CCC8',
  boxShadow: '0 8px 20px rgba(0,0,0,0.04)',
};

const imageWrapperStyle: React.CSSProperties = {
  height: '190px',
  borderRadius: '18px',
  overflow: 'hidden',
  marginBottom: '10px'
};

const imageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
};

const bookTitleStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: '700',
  color: '#3E2723',
  margin: '0 0 8px 0',
  height: '34px',
  overflow: 'hidden',
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical'
};

const priceWrapperStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderTop: '1px solid #F5F5F5',
  paddingTop: '8px'
};

const priceStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  fontWeight: '800',
  color: '#8D6E63'
};

const arrowCircleStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: '#5D4037',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.7rem'
};