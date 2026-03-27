'use client';
import React, { useState, useEffect, use as reactUse } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';

const COFFEE = { deep: '#3E2723', medium: '#5D4037', bg: '#FDF5E6', border: '#D7CCC8' };

export default function AdvancedReader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = reactUse(params);
  const [chapter, setChapter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCommentSidebar, setShowCommentSidebar] = useState(false);
const [selectedParaIndex, setSelectedParaIndex] = useState<number | null>(null);
const [newComment, setNewComment] = useState('');
const [comments, setComments] = useState<any[]>([]);

// Hàm lấy bình luận của đoạn văn đó
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

// Hàm gửi bình luận mới
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
    fetchComments(selectedParaIndex!); // Load lại list
  }
};
  
  // Settings Giao diện
  const [fontSize, setFontSize] = useState(19);
  const [theme, setTheme] = useState('light'); // light, dark, sepia
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [inputPass, setInputPass] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await (supabase
      .from('chapters')
      .select('*, books(title, password, id)')
      .eq('id', id)
      .single() as any);

    if (data) {
      setChapter(data);
      // Logic Pass: Nếu cả chap và bộ truyện đều không có pass -> Mở luôn
      const requiredPass = data.password || data.books?.password;
      if (!requiredPass) {
        setIsUnlocked(true);
      }
    }
    setLoading(false);
  };

  const handleUnlock = () => {
    const requiredPass = chapter.password || chapter.books?.password;
    if (inputPass === requiredPass) {
      setIsUnlocked(true);
    } else {
      alert("Mật khẩu không đúng! ☕");
    }
  };

  // Tách đoạn văn để cmt giống Wattpad
  const paragraphs = chapter?.content?.split('\n').filter((p: string) => p.trim() !== '') || [];

  if (loading) return <div style={center}>☕ Đang lật mở trang sách...</div>;

  return (
    <div style={{ ...containerStyle, background: theme === 'dark' ? '#1a1a1a' : COFFEE.bg }}>
      {/* 1. LỚP PHỦ ÁNH SÁNG XANH (VÀNG GÀ) */}
      {theme === 'sepia' && <div style={sepiaOverlay} />}

      <style dangerouslySetInnerHTML={{ __html: `
        * { font-family: Arial, Helvetica, sans-serif !important; }
        .nav-btn { transition: 0.3s; background: ${COFFEE.deep}; color: white; border: none; cursor: pointer; }
        .nav-btn:hover { background: ${COFFEE.medium} !important; transform: translateY(-2px); }
        .para-line { position: relative; padding: 10px 35px 10px 10px; border-radius: 5px; transition: 0.2s; line-height: 1.8; }
        .para-line:hover { background: rgba(62, 39, 35, 0.05); border-right: 4px solid ${COFFEE.deep}; }
        .para-line:hover .cmt-icon { opacity: 1; }
        .cmt-icon { position: absolute; right: 8px; top: 12px; opacity: 0; font-size: 14px; cursor: pointer; }
      `}} />

      {/* 2. HEADER Tên truyện & Chương */}
      <header style={headerStyle}>
        <div style={{ fontWeight: '800', fontSize: '1.2rem' }}>{chapter?.books?.title?.toUpperCase()}</div>
        <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px' }}>
          Chương {chapter?.chapter_number}: {chapter?.title}
        </div>
      </header>

      {/* 3. THANH TOOLBAR ĐIỀU CHỈNH */}
      <div style={toolbarStyle}>
        <div style={btnGroup}>
          <button onClick={() => setTheme('light')} style={toolBtn}>Sáng</button>
          <button onClick={() => setTheme('sepia')} style={toolBtn}>Lọc Xanh 💡</button>
          <button onClick={() => setTheme('dark')} style={toolBtn}>Tối</button>
        </div>
        <div style={btnGroup}>
          <button onClick={() => setFontSize(f => f - 1)} style={toolBtn}>A-</button>
          <span style={{color: COFFEE.deep, fontWeight:'bold'}}>{fontSize}px</span>
          <button onClick={() => setFontSize(f => f + 1)} style={toolBtn}>A+</button>
        </div>
      </div>

      <main style={mainContent}>
        {/* 4. LOGIC NHẬP PASS */}
        {!isUnlocked ? (
          <div style={lockCard}>
            <div style={{fontSize: '3rem'}}>🔒</div>
            <h3 style={{margin: '15px 0'}}>Nội dung này cần mật khẩu</h3>
            <p style={{fontSize: '0.85rem', color: '#666', marginBottom: '20px'}}>
              Chương này đã được chủ quán khóa lại. Vui lòng nhập mã để đọc.
            </p>
            <div style={{display:'flex', justifyContent:'center', gap:'10px'}}>
              <input 
                type="password" 
                placeholder="Mật khẩu..." 
                style={passField} 
                onChange={e => setInputPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
              />
              <button onClick={handleUnlock} style={unlockBtn}>MỞ KHÓA</button>
            </div>
          </div>
        ) : (
          /* 5. KHUNG ĐỌC NÉT LIỀN */
          <div style={{ 
            ...readerBox, 
            borderColor: COFFEE.deep, 
            color: theme === 'dark' ? '#ddd' : '#222',
            background: theme === 'dark' ? '#252525' : '#fff'
          }}>
            {paragraphs.map((txt: string, i: number) => (
  <div key={i} className="para-line" style={{ fontSize: `${fontSize}px` }}>
    {txt}
    <span 
      className="cmt-icon" 
      onClick={() => fetchComments(i)} 
      title="Bình luận đoạn này"
    >
      💬 {comments.filter(c => c.paragraph_index === i).length || ''}
    </span>
  </div>
))}
          </div>
        )}
      </main>

      {/* 6. ĐIỀU HƯỚNG CHƯƠNG (Nâu đậm) */}
      <div style={footerNav}>
        <button className="nav-btn" style={bottomBtn}>← CHƯƠNG TRƯỚC</button>
        <Link href={`/book/${chapter?.books?.id}`} style={{textDecoration:'none'}}>
           <button className="nav-btn" style={bottomBtn}>MỤC LỤC</button>
        </Link>
        <button className="nav-btn" style={bottomBtn}>CHƯƠNG SAU →</button>
      {/* SIDEBAR BÌNH LUẬN THEO ĐOẠN */}
{showCommentSidebar && (
  <div style={sidebarStyle}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
      <b style={{color: COFFEE.deep}}>Bình luận đoạn {selectedParaIndex! + 1}</b>
      <button onClick={() => setShowCommentSidebar(false)} style={closeBtn}>✕</button>
    </div>

    <div style={commentListStyle}>
      {comments.map(c => (
        <div key={c.id} style={cmtItem}>
          <small style={{fontWeight: 'bold'}}>{c.profiles?.full_name || 'Ẩn danh'}</small>
          <p style={{margin: '5px 0', fontSize: '0.9rem'}}>{c.content}</p>
        </div>
      ))}
      {comments.length === 0 && <p style={{fontSize: '0.8rem', color: '#999'}}>Chưa có bình luận nào. Hãy là người đầu tiên! ✨</p>}
    </div>

    <div style={inputArea}>
      <textarea 
        placeholder="Cảm nhận của bạn..." 
        style={textAreaStyle} 
        value={newComment}
        onChange={e => setNewComment(e.target.value)}
      />
      <button onClick={postComment} style={sendBtn}>GỬI</button>
    </div>
  </div>
)}
      </div>
      
    </div>
  );
}

// --- STYLES ---
const containerStyle: any = { minHeight: '100vh', transition: '0.3s', position: 'relative' };
const sepiaOverlay: any = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255, 180, 0, 0.12)', pointerEvents: 'none', zIndex: 999 };
const headerStyle: any = { background: COFFEE.deep, color: '#fff', padding: '20px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };
const toolbarStyle: any = { display: 'flex', justifyContent: 'center', gap: '30px', padding: '15px', background: 'rgba(0,0,0,0.03)', alignItems: 'center' };
const btnGroup: any = { display: 'flex', gap: '8px', alignItems: 'center' };
const toolBtn: any = { padding: '6px 15px', borderRadius: '8px', border: `1px solid ${COFFEE.border}`, background: '#fff', cursor: 'pointer', fontSize: '0.8rem' };

const mainContent: any = { maxWidth: '850px', margin: '40px auto', padding: '0 20px' };
const readerBox: any = { border: '3px solid', padding: '50px 40px', borderRadius: '4px', boxShadow: '10px 10px 0px rgba(62, 39, 35, 0.1)', minHeight: '600px' };

const lockCard: any = { textAlign: 'center', padding: '80px 40px', border: `2px dashed ${COFFEE.border}`, borderRadius: '20px', background: '#fff' };
const passField: any = { padding: '12px', borderRadius: '10px', border: `1px solid ${COFFEE.border}`, outline: 'none' };
const unlockBtn: any = { background: COFFEE.deep, color: '#fff', padding: '12px 25px', borderRadius: '10px', border: 'none', fontWeight: 'bold', cursor: 'pointer' };

const footerNav: any = { display: 'flex', justifyContent: 'center', gap: '15px', paddingBottom: '60px' };
const bottomBtn: any = { padding: '15px 30px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' };
const center: any = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: COFFEE.bg, color: COFFEE.deep };
const sidebarStyle: any = { 
  position: 'fixed', right: 0, top: 0, width: '320px', height: '100vh', 
  background: '#fff', boxShadow: '-5px 0 15px rgba(0,0,0,0.1)', 
  padding: '25px', zIndex: 1000, display: 'flex', flexDirection: 'column',
  borderLeft: `2px solid ${COFFEE.deep}`
};
const commentListStyle: any = { flex: 1, overflowY: 'auto', marginBottom: '20px' };
const cmtItem: any = { padding: '10px', borderBottom: '1px solid #eee' };
const inputArea: any = { borderTop: '1px solid #eee', paddingTop: '15px' };
const textAreaStyle: any = { width: '100%', height: '80px', borderRadius: '10px', border: `1px solid ${COFFEE.border}`, padding: '10px', outline: 'none', fontSize: '0.85rem' };
const sendBtn: any = { width: '100%', background: COFFEE.deep, color: '#fff', border: 'none', padding: '10px', borderRadius: '10px', marginTop: '10px', cursor: 'pointer', fontWeight: 'bold' };
const closeBtn: any = { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#999' };