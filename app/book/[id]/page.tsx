'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';

const COFFEE = {
  deep: '#3E2723',
  medium: '#5D4037',
  light: '#8D6E63',
  bg: '#FDF5E6',
  border: '#D7CCC8',
};

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [book, setBook] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 1. Kiểm tra trạng thái thư viện
  useEffect(() => {
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && id) {
        setUser(user);
        const { data } = await supabase
          .from('library')
          .select('*')
          .eq('user_id', user.id)
          .eq('book_id', id)
          .single();
        if (data) setIsSaved(true);
      }
    }
    checkStatus();
  }, [id]);
  // --- HÀM XÓA BÌNH LUẬN ---
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Cậu có chắc muốn xóa bình luận này không? ☕")) return;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id); // Chỉ chủ cmt mới xóa được

    if (!error) {
      setComments(comments.filter(c => c.id !== commentId));
      alert("Đã xóa bình luận! 🗑️");
    } else {
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  // --- HÀM LIKE BÌNH LUẬN (DEMO) ---
  const handleLikeComment = (commentId: string) => {
    alert("Cảm ơn cậu đã thả tim! ❤️ (Tính năng này đang được kết nối Database)");
    // Sau này em tạo bảng 'likes' rồi insert vào tương tự như 'library' nhé
  };

  // --- HÀM NHẮN TIN (CHUYỂN TRANG) ---
  const handleGoToChat = (targetUserId: string) => {
    if (!user) return alert("Đăng nhập để nhắn tin nhé!");
    if (user.id === targetUserId) return alert("Cậu không thể tự nhắn tin cho chính mình đâu nè!");
    router.push(`/chat?to=${targetUserId}`);
  };

  // 2. Logic Thêm/Xóa thư viện
  const handleToggleLibrary = async (isPublic: boolean) => {
    if (!user) return alert("Đăng nhập để thực hiện nhé! ☕");

    if (isSaved) {
      const { error } = await supabase
        .from('library')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', id);

      if (!error) {
        alert("Đã xóa khỏi thư viện! 🗑️");
        setIsSaved(false);
      }
    } else {
      const { error } = await supabase
        .from('library')
        .upsert([{ user_id: user.id, book_id: id, is_public: isPublic }]);

      if (!error) {
        alert(isPublic ? "Đã thêm vào thư viện công khai! ✨" : "Đã lưu riêng tư! 🔒");
        setIsSaved(true);
      }
    }
  };

  // 3. Lấy dữ liệu truyện
  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      const { data: bData } = await (supabase.from('books').select('*').eq('id', id).single() as any);
      if (bData) {
        setBook(bData);
        const { data: cData } = await (supabase.from('chapters').select('*').eq('book_id', id).order('chapter_number') as any);
        setChapters(cData || []);
        const { data: comData } = await (supabase.from('comments').select('*').eq('book_id', id).order('created_at', { ascending: false }) as any);
        setComments(comData || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const handleSendComment = async () => {
    if (!user) return alert("Bạn cần đăng nhập!");
    if (!newComment.trim()) return;
    const { data, error } = await (supabase.from('comments') as any).insert([
      { book_id: id, user_id: user.id, user_email: user.email, content: newComment, rating: 5 }
    ]).select();
    if (!error && data) {
      setComments([data[0], ...comments]);
      setNewComment('');
    }
  };

  const handleDownload = () => {
    if (book?.file_url) window.open(book.file_url, '_blank');
    else alert("Bản tải về đang được cập nhật!");
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}>☕ Đang pha cà phê...</div>;
  if (!book) return <div style={{ textAlign: 'center', padding: '100px' }}>Không tìm thấy truyện.</div>;

  return (
    <div style={pageWrapper}>
      <div style={bgOverlayStyle}></div>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap');
        * { font-family: 'Lexend', sans-serif !important; }
        .btn-hover:hover { filter: brightness(1.2); transform: translateY(-2px); transition: 0.2s; }
      `}} />

      <div style={container}>
        <Link href="/" style={backLink}>← Trở về trang chủ</Link>
        
        <div style={mainInfoBox}>
          <div style={headerGrid}>
            <div style={{ textAlign: 'center' }}>
                <img src={book.cover_url} style={bigCoverStyle} alt={book.title} />
                
                <div style={btnGroup}>
                  <button onClick={() => router.push(`/book/${id}/chapter/1`)} className="btn-hover" style={readBtn}>ĐỌC NGAY</button>
                  <button onClick={handleDownload} className="btn-hover" style={downloadBtn}>TẢI XUỐNG</button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                  <button 
                    onClick={() => handleToggleLibrary(true)} 
                    style={isSaved ? removeBtnStyle : libBtnStyle} 
                    className="btn-hover"
                  >
                    {isSaved ? "🗑️ Bỏ lưu" : "+ Thư viện"}
                  </button>
                  
                  {!isSaved && (
                    <button 
                      onClick={() => handleToggleLibrary(false)} 
                      style={privateBtnStyle} 
                      className="btn-hover"
                    >
                      🔒 Lưu kín
                    </button>
                  )}
                </div>
            </div>
            
            <div style={infoRight}>
              <h1 style={titleStyle}>{book.title}</h1>
              <p style={authorStyle}>Tác giả: <span style={{color: COFFEE.deep, fontWeight: '700'}}>{book.author}</span></p>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                <div style={tagLabel}>Thể loại: {book.category || 'Linh dị'}</div>
                <div style={statusBadge}>{book.status || 'Đang cập nhật'}</div>
              </div>
              
              <div style={reviewBox}>
                <div style={isExpanded ? { whiteSpace: 'pre-line' } : { ...lineClamp, whiteSpace: 'pre-line' }}>
                  {book.description || "Tác phẩm chưa có tóm tắt nội dung."}
                </div>
                <span onClick={() => setIsExpanded(!isExpanded)} style={toggleReview}>
                  {isExpanded ? "Thu gọn ▲" : "Xem nội dung đầy đủ ▼"}
                </span>
              </div>

              <div style={statsRow}>
                <span>👁️ {book.views || 0} lượt đọc</span>
                <span>⭐ {book.rating || 5.0} đánh giá</span>
                <span>📅 {new Date(book.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={sectionBox}>
          <h3 style={sectionTitle}>📜 MỤC LỤC</h3>
          <div style={chapterGrid}>
            {chapters.map((chap) => (
              <Link key={chap.id} href={`/book/${id}/chapter/${chap.chapter_number}`} style={chapterLink}>
                Chương {chap.chapter_number}: {chap.title}
              </Link>
            ))}
          </div>
        </div>

        <div style={sectionBox}>
          <h3 style={sectionTitle}>💬 THẢO LUẬN ({comments.length})</h3>
          <textarea 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Nhập cảm nhận của bạn..."
            style={dashTextarea}
          />
          <div style={{ textAlign: 'right', marginTop: '10px' }}>
            <button onClick={handleSendComment} className="btn-hover" style={sendBtn}>Gửi bình luận</button>
          </div>

          <div style={{ marginTop: '30px' }}>
            {comments.map((c) => (
              <div key={c.id} style={commentCard}>
                <img src={c.avatar_url || `https://ui-avatars.com/api/?name=${c.user_email}&background=random`} style={avatarStyle} />
                <div style={{ flex: 1 }}>
                  <div style={comName}>{c.user_email?.split('@')[0]}</div>
                  <p style={comContent}>{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const pageWrapper: React.CSSProperties = { minHeight: '100vh', backgroundColor: COFFEE.bg, position: 'relative' };
const bgOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url('/bg-coffee.png')`, backgroundSize: '400px', opacity: 0.2, zIndex: 0, pointerEvents: 'none' };
const container: React.CSSProperties = { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px', position: 'relative', zIndex: 1 };
const backLink: React.CSSProperties = { display: 'block', marginBottom: '20px', color: COFFEE.medium, fontSize: '0.85rem', textDecoration: 'none', fontWeight: '700' };
const mainInfoBox: React.CSSProperties = { background: '#fff', borderRadius: '30px', padding: '35px', border: `1px solid ${COFFEE.border}`, marginBottom: '30px' };
const headerGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '40px' };
const bigCoverStyle: React.CSSProperties = { width: '100%', borderRadius: '20px', boxShadow: '0 8px 20px rgba(62,39,35,0.1)' };
const btnGroup: any = { marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' };
const readBtn: React.CSSProperties = { padding: '12px', borderRadius: '15px', background: COFFEE.deep, color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer' };
const downloadBtn: React.CSSProperties = { padding: '12px', borderRadius: '15px', background: '#fff', color: COFFEE.deep, border: `1.5px solid ${COFFEE.deep}`, fontWeight: 'bold', cursor: 'pointer' };
const infoRight: any = { display: 'flex', flexDirection: 'column' };
const titleStyle = { color: COFFEE.deep, fontSize: '1.8rem', fontWeight: '800', margin: '0 0 5px 0' };
const authorStyle = { fontSize: '0.95rem', color: COFFEE.light, marginBottom: '15px' };
const tagLabel = { background: '#F0EBE3', color: COFFEE.medium, padding: '4px 12px', borderRadius: '10px', fontSize: '0.75rem', width: 'fit-content', fontWeight: 'bold', marginBottom: '15px' };
const reviewBox = { background: '#FDF5E6', padding: '20px', borderRadius: '20px', fontSize: '0.85rem', lineHeight: '1.6', color: '#555', border: '1px solid #E7D8C9' };
const lineClamp: any = { display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
const toggleReview = { display: 'block', marginTop: '10px', color: COFFEE.medium, fontWeight: '700', cursor: 'pointer', fontSize: '0.75rem' };
const sectionBox: React.CSSProperties = { background: '#fff', borderRadius: '30px', padding: '30px', marginBottom: '30px', border: `1px solid ${COFFEE.border}` };
const sectionTitle = { fontSize: '1rem', fontWeight: '800', color: COFFEE.deep, marginBottom: '20px' };
const chapterGrid: any = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' };
const chapterLink: React.CSSProperties = { padding: '12px', border: '1px solid #F0F0F0', borderRadius: '12px', textDecoration: 'none', color: '#666', fontSize: '0.8rem', fontWeight: '600' };
const dashTextarea: React.CSSProperties = { width: '100%', minHeight: '80px', border: `2px dashed ${COFFEE.border}`, borderRadius: '15px', padding: '15px', background: '#FAFAFA', outline: 'none' };
const sendBtn = { background: COFFEE.deep, color: '#fff', border: 'none', padding: '10px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const commentCard = { display: 'flex', gap: '15px', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #F5F5F5' };
const avatarStyle: any = { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' };
const comName = { fontWeight: '700', color: COFFEE.deep, fontSize: '0.9rem' };
const comContent = { fontSize: '0.85rem', color: '#444', marginTop: '5px' };

const libBtnStyle: React.CSSProperties = { flex: 1, padding: '10px', borderRadius: '15px', border: `2px solid ${COFFEE.deep}`, background: '#fff', color: COFFEE.deep, fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' };
const privateBtnStyle: React.CSSProperties = { flex: 1, padding: '10px', borderRadius: '15px', border: 'none', background: '#ECE0D1', color: COFFEE.medium, fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' };
const removeBtnStyle: React.CSSProperties = { flex: 1, padding: '10px', borderRadius: '15px', border: `2px solid #ff4d4d`, background: '#fff', color: '#ff4d4d', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer' };
const statusBadge: React.CSSProperties = { fontSize: '0.7rem', padding: '4px 12px', borderRadius: '20px', background: COFFEE.deep, color: '#fff', fontWeight: 'bold' };
const statsRow: React.CSSProperties = { display: 'flex', gap: '20px', marginTop: '20px', fontSize: '0.8rem', color: COFFEE.light, fontWeight: '600' };