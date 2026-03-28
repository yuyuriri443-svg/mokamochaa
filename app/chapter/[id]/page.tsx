'use client';
import React, { useState, useEffect, use as reactUse } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const COFFEE = { deep: '#3E2723', medium: '#5D4037', bg: '#FDF5E6', border: '#D7CCC8' };

export default function AdvancedReader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = reactUse(params);
  const router = useRouter();
  
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nav, setNav] = useState({ prevId: null, nextId: null });
  
  // Settings Giao diện
  const [fontSize, setFontSize] = useState(19);
  const [theme, setTheme] = useState('light'); // light, dark, sepia
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputPass, setInputPass] = useState('');

  // Bình luận
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);
  const [selectedParaIndex, setSelectedParaIndex] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    // Cuộn lên đầu trang mỗi khi đổi ID chương
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Lấy thông tin chương hiện tại
      const { data: currentChap, error } = await (supabase
        .from('chapters')
        .select('*, books(title, password, id)')
        .eq('id', id)
        .single() as any);

      if (currentChap) {
        setChapter(currentChap);
        
        // Kiểm tra Pass (Chap hoặc Book có pass đều tính)
        const requiredPass = currentChap.password || currentChap.books?.password;
        if (!requiredPass) setIsUnlocked(true);
        else setIsUnlocked(false); // Reset nếu chuyển từ chap ko pass sang chap có pass

        // 2. TÌM CHƯƠNG TRƯỚC & SAU DỰA TRÊN SORT_ORDER
        const bId = currentChap.book_id;
        const sOrder = currentChap.sort_order;

        // Tìm chương trước (Thằng lớn nhất trong đám nhỏ hơn mình)
        const { data: prev } = await supabase
          .from('chapters')
          .select('id')
          .eq('book_id', bId)
          .lt('sort_order', sOrder)
          .order('sort_order', { ascending: false })
          .limit(1);

        // Tìm chương sau (Thằng nhỏ nhất trong đám lớn hơn mình)
        const { data: next } = await supabase
          .from('chapters')
          .select('id')
          .eq('book_id', bId)
          .gt('sort_order', sOrder)
          .order('sort_order', { ascending: true })
          .limit(1);

        setNav({
          prevId: prev?.[0]?.id || null,
          nextId: next?.[0]?.id || null
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = () => {
    const requiredPass = chapter?.password || chapter?.books?.password;
    if (inputPass === requiredPass) {
      setIsUnlocked(true);
    } else {
      alert("Mật khẩu không đúng! ☕");
    }
  };

  const fetchComments = async (index: number) => {
    setSelectedParaIndex(index);
    setShowCommentSidebar(true);
    const { data } = await supabase
      .from('paragraph_comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('chapter_id', id)
      .eq('paragraph_index', index)
      .order('created_at', { ascending: true });
    setComments(data || []);
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Bạn cần đăng nhập để bình luận nha! ☕");
    const { error } = await supabase.from('paragraph_comments').insert([{
      chapter_id: id,
      paragraph_index: selectedParaIndex,
      user_id: user.id,
      content: newComment
    }] as any);
    if (!error) {
      setNewComment('');
      fetchComments(selectedParaIndex!);
    }
  };

  // Tách đoạn văn để cmt (Hỗ trợ cả HTML nếu có ảnh từ EPUB)
  const paragraphs = chapter?.content?.split('\n').filter((p: string) => p.trim() !== '') || [];

  if (loading) return <div style={center}>☕ Đang lật mở trang sách...</div>;

  return (
    <div style={{ ...containerStyle, background: theme === 'dark' ? '#1a1a1a' : COFFEE.bg }}>
      {theme === 'sepia' && <div style={sepiaOverlay} />}

      <style dangerouslySetInnerHTML={{ __html: `
        * { font-family: 'Segoe UI', Roboto, sans-serif !important; }
        .nav-btn { transition: 0.3s; background: ${COFFEE.deep}; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .nav-btn:hover { background: ${COFFEE.medium} !important; transform: translateY(-2px); }
        .nav-btn:disabled { background: #ccc !important; cursor: not-allowed; transform: none; }
        .para-line { position: relative; padding: 10px 35px 10px 10px; border-radius: 5px; transition: 0.2s; line-height: 1.8; word-wrap: break-word; }
        .para-line:hover { background: rgba(62, 39, 35, 0.05); border-right: 4px solid ${COFFEE.deep}; }
        .para-line:hover .cmt-icon { opacity: 1; }
        .cmt-icon { position: absolute; right: 8px; top: 12px; opacity: 0.3; font-size: 14px; cursor: pointer; }
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
      `}} />

      <header style={headerStyle}>
        <div style={{ fontWeight: '800', fontSize: '1.2rem', letterSpacing: '1px' }}>{chapter?.books?.title?.toUpperCase()}</div>
        <div style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '6px' }}>
          {chapter?.title}
        </div>
      </header>

      <div style={toolbarStyle}>
        <div style={btnGroup}>
          <button onClick={() => setTheme('light')} style={{...toolBtn, background: theme==='light'?COFFEE.medium:'#fff', color: theme==='light'?'#fff':'#000'}}>Sáng</button>
          <button onClick={() => setTheme('sepia')} style={{...toolBtn, background: theme==='sepia'?'#d4a373':'#fff', color: theme==='sepia'?'#fff':'#000'}}>Sepia 💡</button>
          <button onClick={() => setTheme('dark')} style={{...toolBtn, background: theme==='dark'?'#333':'#fff', color: theme==='dark'?'#fff':'#000'}}>Tối</button>
        </div>
        <div style={btnGroup}>
          <button onClick={() => setFontSize(f => Math.max(12, f - 1))} style={toolBtn}>A-</button>
          <span style={{color: COFFEE.deep, fontWeight:'bold', minWidth:'40px', textAlign:'center'}}>{fontSize}px</span>
          <button onClick={() => setFontSize(f => Math.min(30, f + 1))} style={toolBtn}>A+</button>
        </div>
      </div>

      <main style={mainContent}>
        {!isUnlocked ? (
          <div style={lockCard}>
            <div style={{fontSize: '3rem'}}>🔒</div>
            <h3 style={{margin: '15px 0', color: COFFEE.deep}}>Nội dung này cần mật khẩu</h3>
            <p style={{fontSize: '0.85rem', color: '#666', marginBottom: '20px'}}>
              Chương này đã được chủ quán khóa lại. Vui lòng nhập mã để thưởng thức cafe.
            </p>
            <div style={{display:'flex', justifyContent:'center', gap:'10px', flexWrap:'wrap'}}>
              <input 
                type="password" 
                placeholder="Mật khẩu..." 
                style={passField} 
                value={inputPass}
                onChange={e => setInputPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              />
              <button onClick={handleUnlock} style={unlockBtn}>MỞ KHÓA</button>
            </div>
          </div>
        ) : (
          <div style={{ 
            ...readerBox, 
            borderColor: COFFEE.deep, 
            color: theme === 'dark' ? '#ccc' : '#222',
            background: theme === 'dark' ? '#252525' : '#fff'
          }}>
            {paragraphs.map((txt: string, i: number) => (
              <div key={i} className="para-line" style={{ fontSize: `${fontSize}px` }}>
                {/* Dùng dangerouslySetInnerHTML để hiện được ảnh nhúng trong nội dung */}
                <div dangerouslySetInnerHTML={{ __html: txt }} />
                <span className="cmt-icon" onClick={() => fetchComments(i)}>
                  💬 {comments.filter(c => c.paragraph_index === i).length || ''}
                </span>
              </div>
            ))}
            
            {/* Thanh điều hướng nhanh cuối nội dung */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '50px', borderTop: `1px dashed ${COFFEE.border}`, paddingTop: '20px' }}>
               {nav.prevId ? (
                 <Link href={`/reader/${nav.prevId}`} style={navLink}>« Chương trước</Link>
               ) : <span></span>}
               {nav.nextId ? (
                 <Link href={`/reader/${nav.nextId}`} style={navLink}>Chương sau »</Link>
               ) : <span></span>}
            </div>
          </div>
        )}
      </main>

      <div style={footerNav}>
        <button 
          className="nav-btn" 
          style={bottomBtn} 
          disabled={!nav.prevId}
          onClick={() => nav.prevId && router.push(`/reader/${nav.prevId}`)}
        >
          ← TRƯỚC
        </button>
        
        <Link href={`/book/${chapter?.books?.id}`} style={{textDecoration:'none'}}>
           <button className="nav-btn" style={{...bottomBtn, background: '#8d6e63'}}>MỤC LỤC</button>
        </Link>
        
        <button 
          className="nav-btn" 
          style={bottomBtn} 
          disabled={!nav.nextId}
          onClick={() => nav.nextId && router.push(`/reader/${nav.nextId}`)}
        >
          SAU →
        </button>
      </div>

      {/* Sidebar Bình luận */}
      {showCommentSidebar && (
        <div style={sidebarStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <b style={{color: COFFEE.deep}}>Bình luận đoạn {selectedParaIndex! + 1}</b>
            <button onClick={() => setShowCommentSidebar(false)} style={closeBtn}>✕</button>
          </div>
          <div style={commentListStyle}>
            {comments.map(c => (
              <div key={c.id} style={cmtItem}>
                <small style={{fontWeight: 'bold', color: COFFEE.medium}}>{c.profiles?.full_name || 'Khách quý'}</small>
                <p style={{margin: '5px 0', fontSize: '0.9rem', lineHeight: '1.4'}}>{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && <p style={{fontSize: '0.8rem', color: '#999', textAlign:'center', marginTop:'20px'}}>Chưa có bình luận nào. <br/>Khai bát ngay thôi! ✨</p>}
          </div>
          <div style={inputArea}>
            <textarea 
              placeholder="Cảm nhận của bạn..." 
              style={textAreaStyle} 
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button onClick={postComment} style={sendBtn}>GỬI CẢM NHẬN</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES (ĐÃ ĐƯỢC TỐI ƯU) ---
const containerStyle: any = { minHeight: '100vh', transition: '0.3s', position: 'relative', paddingBottom: '40px' };
const sepiaOverlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255, 180, 0, 0.08)', pointerEvents: 'none', zIndex: 999 };
const headerStyle: any = { background: COFFEE.deep, color: '#fff', padding: '25px 20px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' };
const toolbarStyle: any = { display: 'flex', justifyContent: 'center', gap: '20px', padding: '15px', background: 'rgba(0,0,0,0.03)', alignItems: 'center', flexWrap: 'wrap' };
const btnGroup: any = { display: 'flex', gap: '8px', alignItems: 'center' };
const toolBtn: any = { padding: '6px 12px', borderRadius: '8px', border: `1px solid ${COFFEE.border}`, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', transition: '0.2s' };
const mainContent: any = { maxWidth: '800px', margin: '30px auto', padding: '0 15px' };
const readerBox: any = { border: '1px solid', padding: '40px 30px', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', minHeight: '600px' };
const lockCard: any = { textAlign: 'center', padding: '60px 20px', border: `2px dashed ${COFFEE.border}`, borderRadius: '20px', background: '#fff', maxWidth: '500px', margin: '0 auto' };
const passField: any = { padding: '12px', borderRadius: '10px', border: `1px solid ${COFFEE.border}`, outline: 'none', width: '200px' };
const unlockBtn: any = { background: COFFEE.deep, color: '#fff', padding: '12px 25px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' };
const footerNav: any = { display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' };
const bottomBtn: any = { padding: '12px 20px', borderRadius: '30px', fontWeight: 'bold', fontSize: '0.8rem', minWidth: '100px' };
const navLink: any = { color: COFFEE.medium, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' };
const center: any = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: COFFEE.bg, color: COFFEE.deep, fontSize: '1.2rem', fontWeight: 'bold' };
const sidebarStyle: any = { position: 'fixed', right: 0, top: 0, width: '320px', height: '100vh', background: '#fff', boxShadow: '-5px 0 25px rgba(0,0,0,0.15)', padding: '25px', zIndex: 1001, display: 'flex', flexDirection: 'column' };
const commentListStyle: any = { flex: 1, overflowY: 'auto', marginBottom: '20px' };
const cmtItem: any = { padding: '12px 0', borderBottom: '1px solid #f5f5f5' };
const inputArea: any = { borderTop: '1px solid #eee', paddingTop: '15px' };
const textAreaStyle: any = { width: '100%', height: '90px', borderRadius: '12px', border: `1px solid ${COFFEE.border}`, padding: '12px', outline: 'none', fontSize: '0.85rem', resize: 'none' };
const sendBtn: any = { width: '100%', background: COFFEE.deep, color: '#fff', border: 'none', padding: '12px', borderRadius: '12px', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '1px' };
const closeBtn: any = { background: '#f5f5f5', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' };