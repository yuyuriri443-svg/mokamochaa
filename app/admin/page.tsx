'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

const COFFEE = { deep: '#3E2723', medium: '#5D4037', light: '#8D6E63', bg: '#FDF5E6', border: '#D7CCC8' };

export default function AdminDashboard() {
  const [tab, setTab] = useState('books'); 
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  if (user?.email !== 'yuyuriri443@gmail.com') return <div style={{padding: '50px', textAlign: 'center'}}>☕ Bạn không có quyền truy cập khu vực pha chế này!</div>;

  return (
    <div style={adminLayout as any}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;800&display=swap'); * { font-family: 'Lexend', sans-serif !important; }`}} />
      <div style={sidebarStyle as any}>
        <div style={logoAdmin as any}>MOKA ADMIN ☕</div>
        <button onClick={() => setTab('books')} style={tabBtn(tab === 'books')}>📚 Quản lý Truyện</button>
        <button onClick={() => setTab('chapters')} style={tabBtn(tab === 'chapters')}>📑 Quản lý Chương</button>
        <button onClick={() => setTab('noti')} style={tabBtn(tab === 'noti')}>🔔 Gửi Thông báo</button>
        <button onClick={() => window.location.href='/'} style={{...tabBtn(false), marginTop: 'auto', opacity: 0.7}}>← Về Trang chủ</button>
      </div>
      <div style={mainContent as any}>
        {tab === 'books' && <ManageBooks />}
        {tab === 'chapters' && <ManageChapters />}
        {tab === 'noti' && <ManageNoti />}
      </div>
    </div>
  );
}

// --- 1. QUẢN LÝ TRUYỆN & MỔ EPUB ---
function ManageBooks() {
  const [books, setBooks] = useState<any[]>([]);
  const [upLoading, setUpLoading] = useState(false);
  const [extractedChapters, setExtractedChapters] = useState<any[]>([]);
  const [form, setForm] = useState({ 
    id: '', title: '', author: '', cover_url: '', download_url: '', 
    password: '', description: '', is_public: true, allow_download: true 
  });

  const fetchBooks = async () => {
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    setBooks(data || []);
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleFileUpload = async (e: any, folder: string) => {
    const file = e.target.files[0];
    if (!file) return;
    setUpLoading(true);

    // --- LOGIC MỔ XẺ EPUB ---
    if (folder === 'ebooks' && file.name.endsWith('.epub')) {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = await new JSZip().loadAsync(file);
        const opfPath = Object.keys(zip.files).find(f => f.endsWith('.opf'));
        
        if (opfPath) {
          const opfContent = await zip.files[opfPath].async("text");
          const parser = new DOMParser();
          const xml = parser.parseFromString(opfContent, "text/xml");

          // 1. Lấy Metadata
          const title = xml.getElementsByTagName("dc:title")[0]?.textContent || "";
          const author = xml.getElementsByTagName("dc:creator")[0]?.textContent || "";
          const desc = xml.getElementsByTagName("dc:description")[0]?.textContent || "";
          
          setForm(prev => ({ ...prev, title, author, description: desc.replace(/<[^>]*>?/gm, '') }));

          // 2. Mổ Chương (Tìm các file .html / .xhtml nội dung)
          const manifestItems = Array.from(xml.getElementsByTagName("item"));
          const spineItems = Array.from(xml.getElementsByTagName("itemref"));
          const chapterFiles = spineItems.map(s => {
            const idref = s.getAttribute("idref");
            return manifestItems.find(m => m.getAttribute("id") === idref)?.getAttribute("href");
          }).filter(Boolean);

          const folderPath = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);
          const chaptersData = [];
          
          for (let i = 0; i < chapterFiles.length; i++) {
            const fullPath = folderPath + chapterFiles[i];
            if (zip.files[fullPath]) {
              const html = await zip.files[fullPath].async("text");
              const doc = parser.parseFromString(html, "text/html");
              const content = doc.body.innerText.trim();
              if (content.length > 100) { // Chỉ lấy file có nội dung thực sự
                chaptersData.push({
                  title: doc.querySelector('h1, h2, h3')?.textContent || `Chương ${chaptersData.length + 1}`,
                  content: content,
                  chapter_number: chaptersData.length + 1
                });
              }
            }
          }
          setExtractedChapters(chaptersData);
          alert(`☕ Đã tìm thấy ${chaptersData.length} chương trong EPUB!`);
        }
      } catch (err) { alert("Không thể mổ xẻ file EPUB này!"); }
    }

    // Upload file lên Supabase
    const fileName = `${folder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('assets').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('assets').getPublicUrl(fileName) as any;
      folder === 'covers' ? setForm(p => ({...p, cover_url: data.publicUrl})) : setForm(p => ({...p, download_url: data.publicUrl}));
    }
    setUpLoading(false);
  };

  const saveFullBook = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { id, ...rest } = form;
    const bookData: any = { ...rest, id_user: user.id };

    // 1. Lưu truyện chính
    const { data: newBook, error: bErr } = await supabase.from('books').insert([bookData]).select().single();
    if (bErr) return alert("Lỗi lưu truyện: " + bErr.message);

    // 2. Nếu có chương đã mổ, lưu luôn vào bảng chapters
    if (extractedChapters.length > 0) {
      const chaptersToInsert = extractedChapters.map(c => ({
        ...c,
        book_id: newBook.id,
        id_user: user.id
      }));
      const { error: cErr } = await supabase.from('chapters').insert(chaptersToInsert);
      if (cErr) alert("Truyện đã lưu nhưng lỗi lưu chương: " + cErr.message);
      else alert("🚀 Đã phát hành truyện và tự động đăng " + extractedChapters.length + " chương!");
    } else {
      alert("Đã đăng truyện thành công!");
    }

    setForm({ id: '', title: '', author: '', cover_url: '', download_url: '', password: '', description: '', is_public: true, allow_download: true });
    setExtractedChapters([]);
    fetchBooks();
  };

  return (
    <div>
      <div style={cardStyle as any}>
        <h2 style={titleSection as any}>📖 ĐĂNG TRUYỆN TỰ ĐỘNG (EPUB)</h2>
        <div style={formGrid as any}>
          <div style={{display:'flex', gap:'10px'}}>
             <div style={upBox as any}>
                {form.cover_url ? <img src={form.cover_url} style={imgPrev as any}/> : 'Bìa'}
                <input type="file" style={fileHidden as any} onChange={e => handleFileUpload(e, 'covers')} />
             </div>
             <div style={{... (upBox as any), background: form.download_url ? '#e8f5e9' : 'transparent'}}>
                {form.download_url ? '✅ EPUB OK' : 'File EPUB'}
                <input type="file" style={fileHidden as any} onChange={e => handleFileUpload(e, 'ebooks')} />
             </div>
             <div style={{flex:1, display:'flex', flexDirection:'column', gap:'10px'}}>
                <input placeholder="Tên truyện" value={form.title} style={inputStyle as any} onChange={e => setForm({...form, title: e.target.value})} />
                <input placeholder="Tác giả" value={form.author} style={inputStyle as any} onChange={e => setForm({...form, author: e.target.value})} />
             </div>
          </div>
          <textarea placeholder="Mô tả..." value={form.description} style={{...(inputStyle as any), height:'80px'}} onChange={e => setForm({...form, description: e.target.value})} />
          {extractedChapters.length > 0 && <p style={{fontSize:'0.8rem', color:COFFEE.medium}}>✨ Sẵn sàng để đăng {extractedChapters.length} chương tự động.</p>}
          <button onClick={saveFullBook} style={btnPrimary as any} disabled={upLoading}>PHÁT HÀNH TOÀN BỘ</button>
        </div>
      </div>
      <div style={{...(cardStyle as any), marginTop: '20px'}}>
        {books.map(b => (
          <div key={b.id} style={rowItem as any}>
            <img src={b.cover_url} style={{width:'40px', height:'55px', borderRadius:'5px', objectFit:'cover'}} />
            <div style={{flex:1, marginLeft:'15px'}}><b>{b.title}</b></div>
            <button onClick={async () => { if(confirm("Xóa?")) { await supabase.from('books').delete().eq('id', b.id); fetchBooks(); } }} style={{...(btnMini as any), background:'#ff4444'}}>Xóa</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 2. QUẢN LÝ CHƯƠNG (GIỮ NGUYÊN TÍNH NĂNG CŨ) ---
function ManageChapters() {
  const [books, setBooks] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [form, setForm] = useState({ id: '', title: '', content: '', chapter_number: 1 });

  useEffect(() => {
    supabase.from('books').select('id, title').then(({data}) => setBooks(data || []));
  }, []);

  useEffect(() => {
    if (selectedBook) {
      supabase.from('chapters').select('*').eq('book_id', selectedBook).order('chapter_number', {ascending: false}).then(({data}) => setChapters(data || []));
    }
  }, [selectedBook]);

  const saveChapter = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { id, ...rest } = form;
    const data = { ...rest, book_id: selectedBook, id_user: user?.id };
    if (id) await supabase.from('chapters').update(data as any).eq('id', id);
    else await supabase.from('chapters').insert([data] as any);
    alert("Xong!");
    setForm({ id: '', title: '', content: '', chapter_number: form.chapter_number + 1 });
    const { data: fresh } = await supabase.from('chapters').select('*').eq('book_id', selectedBook).order('chapter_number', {ascending: false});
    setChapters(fresh || []);
  };

  return (
    <div style={cardStyle as any}>
      <h2 style={titleSection as any}>📑 QUẢN LÝ CHƯƠNG</h2>
      <select style={inputStyle as any} value={selectedBook} onChange={e => setSelectedBook(e.target.value)}>
        <option value="">--- Chọn truyện ---</option>
        {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
      </select>
      {selectedBook && (
        <div style={{marginTop:'20px'}}>
          <input type="number" value={form.chapter_number} style={inputStyle as any} onChange={e => setForm({...form, chapter_number: parseInt(e.target.value)})} />
          <input placeholder="Tên chương" value={form.title} style={inputStyle as any} onChange={e => setForm({...form, title: e.target.value})} />
          <textarea placeholder="Nội dung..." value={form.content} style={{...(inputStyle as any), height:'150px'}} onChange={e => setForm({...form, content: e.target.value})} />
          <button onClick={saveChapter} style={btnPrimary as any}>LƯU CHƯƠNG</button>
          <div style={{marginTop:'20px'}}>
            {chapters.map(c => <div key={c.id} style={rowItem as any}>Chương {c.chapter_number}: {c.title} <button onClick={() => setForm(c)} style={btnMini as any}>Sửa</button></div>)}
          </div>
        </div>
      )}
    </div>
  );
}

function ManageNoti() { return <div style={cardStyle as any}><h2>🔔 Gửi Thông báo</h2></div> }
function ManageReviews() { return <div style={cardStyle as any}><h2>⭐ Duyệt Reviews</h2></div> }
function ManageUsers() { return <div style={cardStyle as any}><h2>👥 Người dùng</h2></div> }

// STYLES (Giữ nguyên giao diện chill)
const adminLayout = { display: 'flex', minHeight: '100vh', background: COFFEE.bg };
const sidebarStyle = { width: '260px', background: COFFEE.deep, padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'fixed', height: '100vh' };
const logoAdmin = { color: '#fff', fontSize: '1.2rem', fontWeight: '800', marginBottom: '30px', textAlign: 'center', letterSpacing: '2px' };
const mainContent = { flex: 1, marginLeft: '260px', padding: '40px' };
const cardStyle = { background: '#fff', padding: '35px', borderRadius: '30px', border: `2px dashed ${COFFEE.border}`, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' };
const titleSection = { fontSize: '1.1rem', fontWeight: '800', color: COFFEE.deep, marginBottom: '25px', borderLeft: `5px solid ${COFFEE.deep}`, paddingLeft: '15px' };
const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '12px', border: `1px solid ${COFFEE.border}`, marginBottom: '10px', outline: 'none', fontSize: '0.9rem' };
const btnPrimary = { width: '100%', background: COFFEE.deep, color: '#fff', padding: '15px', border: 'none', borderRadius: '15px', fontWeight: '800', cursor: 'pointer', marginTop: '10px' };
const tabBtn = (active: boolean) => ({ padding: '12px 20px', borderRadius: '12px', border: 'none', textAlign: 'left', cursor: 'pointer', background: active ? COFFEE.light : 'transparent', color: '#fff', fontWeight: active ? 'bold' : 'normal', transition: '0.3s' });
const upBox = { width: '100px', height: '140px', border: `2px dashed ${COFFEE.border}`, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: COFFEE.light, position: 'relative', overflow: 'hidden' };
const fileHidden = { position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' };
const imgPrev = { width: '100%', height: '100%', objectFit: 'cover' };
const btnMini = { background: COFFEE.medium, color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', marginLeft: '5px' };
const rowItem = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eee', fontSize: '0.9rem' };
const formGrid = { display: 'flex', flexDirection: 'column', gap: '5px' };