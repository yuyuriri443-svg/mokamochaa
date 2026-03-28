'use client';
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ReaderPage({ params }: { params: { id: string } }) {
  const [chapter, setChapter] = useState<any>(null);
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToc, setShowToc] = useState(false);
  
  // Chế độ & Settings
  const [viewMode, setViewMode] = useState<'scroll' | 'flip'>('flip');
  const [settings, setSettings] = useState({
    fontSize: 22,
    fontFamily: 'Lexend, sans-serif',
    theme: 'sepia', 
    eyeProtection: false
  });

  // State cho lật trang & tiến độ
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [progress, setProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => { fetchData(); }, [params.id]);

  // Tính toán số trang và tiến độ
  useEffect(() => {
    if (viewMode === 'scroll') {
      const handleScroll = () => {
        const winScroll = window.scrollY;
        const height = document.documentElement.scrollHeight - window.innerHeight;
        if (height > 0) setProgress((winScroll / height) * 100);
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    } else {
      if (chapter && contentRef.current) {
        const container = contentRef.current;
        const totalWidth = container.scrollWidth;
        // Lấy width thực tế của container để tính trang chính xác
        const pageWidth = container.clientWidth + 60; 
        const pages = Math.ceil(totalWidth / pageWidth);
        setTotalPages(pages || 1);
        setProgress(((currentPage + 1) / (pages || 1)) * 100);
      }
    }
  }, [viewMode, chapter, currentPage, settings.fontSize, settings.fontFamily]);

  const fetchData = async () => {
    const { data: current } = await supabase.from('chapters').select('*').eq('id', params.id).single();
    if (current) {
      setChapter(current);
      const { data: list } = await supabase.from('chapters')
        .select('id, title, sort_order') // Dùng sort_order cho chuẩn
        .eq('book_id', current.book_id)
        .order('sort_order', { ascending: true });
      setAllChapters(list || []);
    }
    setLoading(false);
  };

  // Tính toán chương trước/sau
  const currentIndex = allChapters.findIndex(c => c.id === (chapter?.id));
  const prevChap = allChapters[currentIndex - 1];
  const nextChap = allChapters[currentIndex + 1];

  // Logic lật trang
  const handleFlipClick = (e: React.MouseEvent) => {
    if (viewMode !== 'flip') return;
    const x = e.clientX;
    const width = window.innerWidth;
    if (x > width / 2) {
      if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
    } else {
      if (currentPage > 0) setCurrentPage(currentPage - 1);
    }
  };

  if (loading) return <div style={{textAlign:'center', padding:'100px', background:'#EFE6D5', minHeight:'100vh'}}>☕ Đang pha cafe...</div>;
  if (!chapter) return <div style={{textAlign:'center', padding:'100px'}}>Không tìm thấy nội dung!</div>;

  return (
    <div style={{ 
      background: settings.theme === 'sepia' ? '#EFE6D5' : '#f0f0f0', 
      minHeight: '100vh',
      height: viewMode === 'flip' ? '100vh' : 'auto',
      overflow: viewMode === 'flip' ? 'hidden' : 'auto'
    }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .btn-3d {
          background: #5D4037; color: white; border: none;
          padding: 10px 18px; border-radius: 25px; cursor: pointer;
          font-weight: bold; font-size: 0.8rem; box-shadow: 0 4px #3E2723;
          transition: all 0.1s; display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .btn-3d:active { transform: translateY(2px); box-shadow: 0 2px #3E2723; }
        .btn-3d:disabled { background: #ccc; box-shadow: 0 4px #999; opacity: 0.6; }

        /* 💡 FIX LỖI THẺ P VÀ ẢNH */
        .epub-render-content p { margin-bottom: 1.5em; min-height: 1em; text-align: justify; }
        .epub-render-content img { 
          max-width: 100%; 
          height: auto; 
          display: block; 
          margin: 20px auto; 
          border-radius: 8px; 
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .book-columns {
          column-width: ${viewMode === 'flip' ? 'calc(100vw - 120px)' : 'auto'};
          column-gap: 60px;
          height: ${viewMode === 'flip' ? 'calc(100vh - 360px)' : 'auto'};
          column-fill: auto;
          transition: transform 0.4s cubic-bezier(0.2, 0, 0.2, 1);
        }
        @media (min-width: 1000px) { .book-columns { column-width: ${viewMode === 'flip' ? '800px' : 'auto'}; } }
      `}} />

      {/* 🟡 ĐÈN VÀNG */}
      {settings.eyeProtection && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255, 145, 0, 0.12)', pointerEvents: 'none', zIndex: 10000 }} />
      )}

      {/* 🛠️ THANH CÔNG CỤ */}
      <div style={toolbarStyle}>
        <div style={toolbarContent}>
          <div style={{display:'flex', gap:'8px'}}>
            <button className="btn-3d" onClick={() => setShowToc(true)}>📖 MỤC LỤC</button>
            <button className="btn-3d" disabled={!prevChap} onClick={() => window.location.href=`/reading/${prevChap?.id}`}>«</button>
            <button className="btn-3d" disabled={!nextChap} onClick={() => window.location.href=`/reading/${nextChap?.id}`}>»</button>
          </div>

          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
             <button className="btn-3d" style={{background: '#8D6E63'}} onClick={() => { setViewMode(viewMode === 'flip' ? 'scroll' : 'flip'); setCurrentPage(0); }}>
                {viewMode === 'flip' ? '📑 LẬT' : '📜 CUỘN'}
             </button>
             <select value={settings.fontFamily} onChange={(e) => setSettings({...settings, fontFamily: e.target.value})} style={selectControl}>
                <option value="Lexend, sans-serif">Lexend</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times</option>
             </select>

             <button className="btn-3d" style={{minWidth:'45px'}} onClick={() => setSettings({...settings, fontSize: Math.max(12, settings.fontSize - 2)})}>A-</button>
             <button className="btn-3d" style={{minWidth:'45px'}} onClick={() => setSettings({...settings, fontSize: Math.min(40, settings.fontSize + 2)})}>A+</button>
             
             <button className="btn-3d" style={{background: settings.eyeProtection ? '#FF9800' : '#795548'}} onClick={() => setSettings({...settings, eyeProtection: !settings.eyeProtection})}>🌙</button>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, height: '4px', background: '#FF9800', width: `${progress}%`, transition: '0.3s' }} />
      </div>

      {/* 📖 VÙNG NỘI DUNG */}
      <div style={viewMode === 'flip' ? flipContainer : scrollContainer} onClick={handleFlipClick}>
        <div style={{ ...paperStyle, background: settings.theme === 'sepia' ? '#F4ECD8' : '#FFF' }}>
          <h2 style={headerTitleStyle}>{chapter.title}</h2>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div 
              ref={contentRef}
              className="book-columns epub-render-content"
              style={{ 
                fontSize: `${settings.fontSize}px`, 
                fontFamily: settings.fontFamily,
                transform: viewMode === 'flip' ? `translateX(-${currentPage * ((contentRef.current?.clientWidth || 0) + 60)}px)` : 'none',
                lineHeight: '1.8', color: '#2b1b17'
              }}
              /* 💡 THAY ĐỔI MẤU CHỐT: Không dùng map nữa mà render HTML trực tiếp */
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />
          </div>

          {viewMode === 'flip' && (
            <div style={{ textAlign: 'center', padding: '10px', fontSize: '0.8rem', opacity: 0.6, fontWeight: 'bold' }}>
              Trang {currentPage + 1} / {totalPages}
            </div>
          )}

          <div style={navigationStyle} onClick={(e) => e.stopPropagation()}>
            <button className="btn-3d" disabled={!prevChap} onClick={() => window.location.href=`/reading/${prevChap?.id}`}>« TRƯỚC</button>
            <button className="btn-3d" onClick={() => setShowToc(true)}>DANH SÁCH CHƯƠNG</button>
            <button className="btn-3d" disabled={!nextChap} onClick={() => window.location.href=`/reading/${nextChap?.id}`}>SAU »</button>
          </div>
        </div>
      </div>

      {/* MỤC LỤC */}
      {showToc && (
        <div style={overlayToc} onClick={() => setShowToc(false)}>
          <div style={sidebarToc} onClick={e => e.stopPropagation()}>
            <h3 style={{borderBottom:'2px solid #3E2723', paddingBottom:'15px', color:'#3E2723'}}>DANH SÁCH CHƯƠNG</h3>
            {allChapters.map(c => (
              <div key={c.id} onClick={() => window.location.href=`/reading/${c.id}`} style={tocItem(c.id === chapter.id)}>{c.title}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Giữ nguyên toàn bộ Style cũ của bạn
const toolbarStyle: React.CSSProperties = { position: 'sticky', top: 0, zIndex: 1000, background: '#3E2723', padding: '12px 15px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' };
const toolbarContent: React.CSSProperties = { maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const flipContainer: React.CSSProperties = { height: 'calc(100vh - 100px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' };
const scrollContainer: React.CSSProperties = { maxWidth: '900px', margin: '20px auto', padding: '0 20px', paddingBottom: '50px' };
const paperStyle: React.CSSProperties = { 
  width: '100%', height: '100%', padding: '40px', borderRadius: '40px', 
  boxShadow: '0 10px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', border: '1px solid rgba(0,0,0,0.05)'
};
const headerTitleStyle = { textAlign: 'center' as const, color: '#3E2723', marginBottom: '30px', fontSize: '1.5rem', fontWeight: 'bold', borderBottom: '1px solid #D7CCC8', paddingBottom: '20px' };
const navigationStyle: React.CSSProperties = { marginTop: '20px', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', paddingTop: '20px', gap: '10px' };
const selectControl = { background: '#FFF', border: 'none', padding: '10px 15px', borderRadius: '25px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer' };
const overlayToc: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex' };
const sidebarToc: React.CSSProperties = { width: '350px', maxWidth: '85%', background: '#FFF', height: '100%', padding: '30px', overflowY: 'auto' };
const tocItem = (active: boolean): React.CSSProperties => ({
  padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', borderRadius: '12px', marginBottom: '8px',
  backgroundColor: active ? '#FDF5E6' : 'transparent', fontWeight: active ? 'bold' : 'normal', color: active ? '#8D6E63' : '#333'
});