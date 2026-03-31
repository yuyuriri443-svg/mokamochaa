'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ReaderPage({ params }: { params: { id: string } }) {
  const [chapter, setChapter] = useState<any>(null);
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToc, setShowToc] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // State cho Password
  const [isLocked, setIsLocked] = useState(false);
  const [inputPass, setInputPass] = useState('');
  const [passError, setPassError] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [settings, setSettings] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('reader_settings');
      return saved ? JSON.parse(saved) : { fontSize: 20, fontFamily: 'Lexend, sans-serif', eyeProtection: false };
    }
    return { fontSize: 20, fontFamily: 'Lexend, sans-serif', eyeProtection: false };
  });

  useEffect(() => {
    localStorage.setItem('reader_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => { 
    fetchData(); 
  }, [params.id]);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      if (height > 0) setProgress((winScroll / height) * 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: current } = await supabase.from('chapters').select('*, books(*)').eq('id', params.id).single();
      
      if (current) {
        const bookPass = current.books?.password; // Mật khẩu cả bộ
        const chapPass = current.password;       // Mật khẩu riêng từng chương

        // Kiểm tra xem đã mở khóa bộ truyện này chưa
        const isBookUnlocked = sessionStorage.getItem(`unlocked_book_${current.book_id}`) === 'true';
        // Kiểm tra xem đã mở khóa riêng chương này chưa
        const isChapUnlocked = sessionStorage.getItem(`unlocked_chap_${current.id}`) === 'true';

        // LOGIC KHÓA:
        // 1. Nếu bộ có pass và chưa mở bộ -> KHÓA
        // 2. Nếu đã mở bộ (hoặc bộ ko pass) nhưng chap có pass riêng và chưa mở chap -> KHÓA
        if ((bookPass && !isBookUnlocked) || (chapPass && !isChapUnlocked)) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }

        let rawContent = current.content || "";
        if (rawContent.startsWith('http')) {
          try {
            const res = await fetch(rawContent);
            if (res.ok) rawContent = await res.text();
          } catch (e) { console.error("Lỗi tải file:", e); }
        }

        // Xử lý render content (Giữ nguyên logic cũ của cậu)
        let processed = rawContent.replace(/<br\s*\/?>/gi, '\n');
        const images: string[] = [];
        processed = processed.replace(/<img[^>]+>/g, (match: string) => {
          images.push(match);
          return `__IMG_HOLDER_${images.length - 1}__`;
        });
        processed = processed.replace(/<\/?[^>]+(>|$)/g, "");
        const lines = processed.split(/\r?\n/);
        let finalHTML = lines
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
          .map((line: string) => `<p>${line}</p>`)
          .join('');
        images.forEach((imgTag, index) => {
          finalHTML = finalHTML.replace(`__IMG_HOLDER_${index}__`, imgTag);
        });

        setChapter({ ...current, content: finalHTML });
        
        const { data: list } = await supabase.from('chapters')
          .select('id, title, sort_order')
          .eq('book_id', current.book_id)
          .order('sort_order', { ascending: true });
        setAllChapters(list || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = () => {
    const bookPass = chapter?.books?.password;
    const chapPass = chapter?.password;
    const isBookUnlocked = sessionStorage.getItem(`unlocked_book_${chapter.book_id}`) === 'true';

    // Trường hợp 1: Đang bị kẹt ở Pass Bộ Truyện
    if (bookPass && !isBookUnlocked) {
      if (inputPass === bookPass) {
        sessionStorage.setItem(`unlocked_book_${chapter.book_id}`, 'true');
        // Sau khi mở bộ, check xem chap này có pass riêng ko, nếu ko thì mở luôn
        if (!chapPass) setIsLocked(false);
        setPassError(false);
        setInputPass('');
        return;
      }
    }

    // Trường hợp 2: Đã xong pass bộ, nhưng chap này có Pass riêng
    if (chapPass && inputPass === chapPass) {
      sessionStorage.setItem(`unlocked_chap_${chapter.id}`, 'true');
      setIsLocked(false);
      setPassError(false);
      return;
    }

    setPassError(true);
  };

  const currentIndex = allChapters.findIndex(c => c.id === chapter?.id);
  const prevChap = allChapters[currentIndex - 1];
  const nextChap = allChapters[currentIndex + 1];

  if (loading) return <div style={{textAlign:'center', padding:'100px', background:'#EFE6D5', minHeight:'100vh'}}>Đợi 1 xíu nha ☕</div>;
  if (!chapter) return <div style={{textAlign:'center', padding:'100px'}}>Không tìm thấy chương!</div>;

  // Xác định xem đang hiển thị gợi ý của Bộ hay của Chap
  const isBookLevelLock = chapter.books?.password && sessionStorage.getItem(`unlocked_book_${chapter.book_id}`) !== 'true';
  const currentHint = isBookLevelLock ? chapter.books?.password_hint : chapter.password_hint;

  return (
    <div style={{ background: '#EFE6D5', minHeight: '100vh', color: '#2b1b17', transition: '0.3s' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        body { margin: 0; padding: 0; }
        .toolbar { position: sticky; top: 0; z-index: 1000; background: #3E2723; padding: 8px 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
        .toolbar-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; max-width: 800px; margin: 0 auto; }
        .toolbar-row:first-child { margin-bottom: 8px; }
        .btn-3d { background: #5D4037; color: white; border: none; padding: 8px 12px; border-radius: 20px; cursor: pointer; font-weight: bold; font-size: 13px; box-shadow: 0 3px #2D1D19; transition: 0.1s; }
        .btn-3d:active { transform: translateY(1px); box-shadow: 0 1px #2D1D19; }
        .btn-3d:disabled { opacity: 0.3; }
        .select-custom { background: #F4ECD8; border: none; border-radius: 15px; padding: 4px 10px; font-size: 12px; font-weight: bold; height: 32px; cursor: pointer; }
        .reader-body { max-width: 800px; margin: 0 auto; padding: 20px; box-sizing: border-box; }
        .content-render { line-height: 1.9; word-wrap: break-word; overflow-wrap: break-word; }
        .content-render p { margin-top: 0; margin-bottom: 1.8em !important; display: block; text-align: justify; }
        .content-render img { max-width: 100%; height: auto !important; display: block; margin: 30px auto; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .nav-bottom { display: flex; justify-content: space-between; gap: 10px; margin-top: 60px; padding: 40px 0 80px; border-top: 1px solid rgba(62,39,35,0.1); }
        .btn-nav { flex: 1; height: 48px; display: flex; align-items: center; justify-content: center; background: #5D4037; color: white; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px #3E2723; border:none; cursor:pointer;}
        .progress-bar { position: absolute; bottom: 0; left: 0; height: 3px; background: #FF9800; transition: width 0.2s; }
      `}} />

      {settings.eyeProtection && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255, 145, 0, 0.12)', pointerEvents: 'none', zIndex: 10000 }} />
      )}

      <div className="toolbar">
        <div className="toolbar-row">
          <button className="btn-3d" onClick={() => setShowToc(true)}>📖 MỤC LỤC</button>
          <div style={{display:'flex', gap:'6px'}}>
            <button className="btn-3d" disabled={!prevChap} onClick={() => window.location.href=`/reading/${prevChap?.id}`}>«</button>
            <button className="btn-3d" disabled={!nextChap} onClick={() => window.location.href=`/reading/${nextChap?.id}`}>»</button>
          </div>
          <button className="btn-3d" onClick={() => setSettings({...settings, eyeProtection: !settings.eyeProtection})}>
            {settings.eyeProtection ? '☀️' : '🌙'}
          </button>
        </div>
        
        <div className="toolbar-row">
          <select className="select-custom" value={settings.fontFamily} onChange={(e) => setSettings({...settings, fontFamily: e.target.value})}>
            <option value="Lexend, sans-serif">Lexend</option>
            <option value="Arial, sans-serif">Arial</option>
            <option value="'Times New Roman', serif">Times New Roman</option>
          </select>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <button className="btn-3d" style={{minWidth:'40px'}} onClick={() => setSettings({...settings, fontSize: settings.fontSize - 2})}>A-</button>
            <b style={{color:'white', fontSize:'15px', minWidth:'25px', textAlign:'center'}}>{settings.fontSize}</b>
            <button className="btn-3d" style={{minWidth:'40px'}} onClick={() => setSettings({...settings, fontSize: settings.fontSize + 2})}>A+</button>
          </div>
        </div>
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="reader-body">
        <h1 style={{ textAlign: 'center', color: '#3E2723', marginBottom: '40px', fontSize: '1.8rem', lineHeight: '1.3' }}>
          {chapter.title}
        </h1>
        
        {isLocked ? (
          <div style={{
            background: '#FFF9F2',
            padding: '40px 20px',
            borderRadius: '30px',
            textAlign: 'center',
            border: '3px solid #D7CCC8',
            margin: '30px auto',
            maxWidth: '500px',
            boxShadow: '0 10px 25px rgba(141, 110, 99, 0.1)'
          }}>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>{isBookLevelLock ? '📚' : '🔐'}</div>
            <h2 style={{ color: '#5D4037', marginBottom: '10px' }}>
                {isBookLevelLock ? 'Cần chìa khóa bộ truyện' : 'Chương này có mã bảo vệ'}
            </h2>
            
            <div style={{
              background: '#F5EBE0',
              padding: '15px',
              borderRadius: '15px',
              color: '#8D6E63',
              fontSize: '0.9rem',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              <b>🌟 Gợi ý từ Editor:</b><br/>
              {currentHint || "Nhập pass để đọc tiếp nha ~"}
            </div>
            
            <div style={{ position: 'relative', maxWidth: '280px', margin: '0 auto' }}>
              <input 
                type={showPass ? "text" : "password"} 
                placeholder="Nhập mật khẩu..." 
                value={inputPass}
                onChange={(e) => setInputPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                style={{
                  width: '100%',
                  padding: '14px 45px 14px 15px',
                  borderRadius: '15px',
                  border: '2px solid #D7CCC8',
                  outline: 'none',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
              <button 
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', opacity: 0.6
                }}
              >
                {showPass ? '👁️' : '🙈'}
              </button>
            </div>

            <button 
              className="btn-nav" 
              style={{ maxWidth: '200px', margin: '25px auto 0', background: '#8D6E63', boxShadow: '0 4px #5D4037' }} 
              onClick={handleUnlock}
            >
              MỞ KHÓA ✨
            </button>
            
            {passError && (
              <p style={{color: '#E57373', marginTop: '15px', fontWeight: 'bold', fontSize: '0.85rem'}}>
                Huhu sai mật khẩu rồi, thử lại nhé! 🧁
              </p>
            )}
          </div>
        ) : (
          <div 
            className="content-render"
            style={{ fontSize: `${settings.fontSize}px`, fontFamily: settings.fontFamily }}
            dangerouslySetInnerHTML={{ __html: chapter.content }}
          />
        )}

        <div className="nav-bottom">
          <button className="btn-nav" style={!prevChap ? {opacity:0.3} : {}} onClick={() => prevChap && (window.location.href=`/reading/${prevChap.id}`)}>« TRƯỚC</button>
          <button className="btn-nav" style={{background: '#8D6E63'}} onClick={() => setShowToc(true)}>MỤC LỤC</button>
          <button className="btn-nav" style={!nextChap ? {opacity:0.3} : {}} onClick={() => nextChap && (window.location.href=`/reading/${nextChap.id}`)}>SAU »</button>
        </div>
      </div>

      {showToc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex' }} onClick={() => setShowToc(false)}>
          <div style={{ width: '320px', background: '#FFF', height: '100%', padding: '25px', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h3 style={{color: '#3E2723', borderBottom: '2px solid #3E2723', paddingBottom: '12px', marginTop: 0}}>DANH SÁCH CHƯƠNG</h3>
            {allChapters.map(c => (
              <div 
                key={c.id} 
                onClick={() => window.location.href=`/reading/${c.id}`}
                style={{ 
                  padding: '14px', borderBottom: '1px solid #eee', cursor: 'pointer',
                  fontWeight: c.id === chapter.id ? 'bold' : 'normal',
                  color: c.id === chapter.id ? '#8D6E63' : '#333',
                  background: c.id === chapter.id ? '#FDF5E6' : 'transparent',
                  borderRadius: '8px', marginBottom: '4px'
                }}
              >
                {c.title}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}