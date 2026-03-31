'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import JSZip from 'jszip';

interface Props { styles: any; COFFEE: any; }

export default function ManageBooks({ styles, COFFEE }: Props) {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); 
  
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });

  const [form, setForm] = useState({
    id: '', title: '', author: '', cover_url: '', 
    file_url: '', 
    password: '', 
    password_hint: '', 
    description: '', category: '', is_public: true 
  });

  const fetchBooks = async () => {
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    setBooks(data || []);
  };

  useEffect(() => { fetchBooks(); }, []);

  const uploadToGithub = async (bookSlug: string, fileName: string, content: string) => {
    const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
    const REPO = 'yuyuriri443-svg/book-storage'; 
    const path = `truyen/${bookSlug}/${fileName}.txt`;
    const url = `https://api.github.com/repos/${REPO}/contents/${path}`;

    try {
      const bytes = new TextEncoder().encode(content);
      const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
      const b64Content = btoa(binString);

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Upload chương: ${fileName}`,
          content: b64Content
        })
      });
      
      if (res.ok) return `https://raw.githubusercontent.com/${REPO}/main/${path}`;
      return null;
    } catch (e) {
      console.error("Lỗi GitHub:", e);
      return null;
    }
  };

  const handleEpubFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sanitize = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');

    setLoading(true);
    try {
      setProgress({ current: 0, total: 0, status: ' đang giải nén file EPUB...' });
      
      const cleanFileName = `files/${Date.now()}_${sanitize(file.name)}`;
      await supabase.storage.from('moka-storage').upload(cleanFileName, file);
      const { data: urlData } = supabase.storage.from('moka-storage').getPublicUrl(cleanFileName);
      
      const zip = await JSZip.loadAsync(file);
      let epubTitle = file.name.replace('.epub', '');
      let epubAuthor = '';
      let epubDesc = '';
      
      const opfPath = Object.keys(zip.files).find(fn => fn.endsWith('.opf'));
      if (opfPath) {
        const opfText = await zip.files[opfPath].async("text");
        const xmlDoc = new DOMParser().parseFromString(opfText, "text/xml");
        epubTitle = xmlDoc.getElementsByTagName("dc:title")[0]?.textContent || epubTitle;
        epubAuthor = xmlDoc.getElementsByTagName("dc:creator")[0]?.textContent || '';
        epubDesc = xmlDoc.getElementsByTagName("dc:description")[0]?.textContent || '';
      }

      const contentFiles = Object.keys(zip.files)
        .filter(fn => fn.endsWith('.xhtml') || fn.endsWith('.html'))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      let chapterList: any[] = [];
      const bookSlug = sanitize(epubTitle).toLowerCase();

      for (const fn of contentFiles) {
        const html = await zip.files[fn].async("text");
        const doc = new DOMParser().parseFromString(html, 'text/html');
        
        const imgs = doc.querySelectorAll('img');
        for (const img of Array.from(imgs)) {
          const src = img.getAttribute('src') || "";
          if (!src.startsWith('http')) {
            const imgName = src.split('/').pop();
            const imgPath = Object.keys(zip.files).find(key => key.includes(imgName || ""));
            if (imgPath) {
              const imgData = await zip.files[imgPath].async("base64");
              img.setAttribute('src', `data:image/png;base64,${imgData}`);
              img.setAttribute('style', 'max-width:100%; height:auto; display:block; margin:10px auto;');
            }
          }
        }
        chapterList.push({ 
          title: doc.querySelector('h1, h2, h3, b')?.innerText || `Chương ${chapterList.length + 1}`, 
          content: doc.body.innerHTML,
          sort_order: chapterList.length + 1
        });
      }

      const finalChapters = [];
      setProgress({ current: 0, total: chapterList.length, status: 'Đang đẩy lên GitHub...' });

      for (let i = 0; i < chapterList.length; i++) {
        const chap = chapterList[i];
        setProgress(prev => ({ ...prev, current: i + 1, status: `Đang tải: ${chap.title}` }));
        const githubUrl = await uploadToGithub(bookSlug, `chuong-${chap.sort_order}`, chap.content);
        if (githubUrl) {
          finalChapters.push({ title: chap.title, content: githubUrl, chapter: chap.sort_order });
        }
      }

      setForm(prev => ({ 
        ...prev, 
        file_url: urlData.publicUrl, 
        title: epubTitle, 
        author: epubAuthor, 
        description: epubDesc 
      }));

      (window as any).tempChapters = finalChapters;
      setProgress({ current: 0, total: 0, status: 'Hoàn tất!' });
      alert(`✅ Thành công! Đã đẩy ${finalChapters.length}/${chapterList.length} chương lên GitHub.`);

    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title) return alert("Vui lòng nhập tên truyện!");
    setLoading(true);
    try {
      const { id, ...dataToSave } = form;
      
      // Payload chuẩn để lưu vào Supabase
      const payload = {
        title: dataToSave.title,
        author: dataToSave.author,
        cover_url: dataToSave.cover_url,
        file_url: dataToSave.file_url,
        password: dataToSave.password || null,
        password_hint: dataToSave.password_hint || null,
        description: dataToSave.description,
        category: dataToSave.category,
        is_public: dataToSave.is_public
      };

      let bookId = id;

      if (id) {
        const { error } = await supabase.from('books').update(payload).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('books').insert([payload]).select().single();
        if (error) throw error;
        bookId = data.id;
      }

      const tempChapters = (window as any).tempChapters;
      if (tempChapters && tempChapters.length > 0) {
        const finalChapters = tempChapters.map((c: any) => ({ ...c, book_id: bookId }));
        // Nếu là update truyện cũ, xóa chương cũ trước khi nạp chương mới từ epub
        if (id) await supabase.from('chapters').delete().eq('book_id', id);
        const { error: cError } = await supabase.from('chapters').insert(finalChapters);
        if (cError) throw cError;
        (window as any).tempChapters = null;
      }

      alert("🚀 Đã lưu truyện và cập nhật Database!");
      setForm({ id: '', title: '', author: '', cover_url: '', file_url: '', password: '', password_hint: '', description: '', category: '', is_public: true });
      fetchBooks();
    } catch (error: any) { 
        console.error(error);
        alert("Lỗi lưu dữ liệu: " + error.message); 
    }
    setLoading(false);
  };

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fileName = `covers/${Date.now()}_${file.name}`;
      await supabase.storage.from('moka-storage').upload(fileName, file);
      const { data } = supabase.storage.from('moka-storage').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, cover_url: data.publicUrl }));
    } catch (error: any) { alert(error.message); }
    setUploading(false);
  };

  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={styles.cardStyle}>
        <h3 style={{ color: COFFEE.deep, marginBottom: '25px', borderLeft: `5px solid ${COFFEE.medium}`, paddingLeft: '15px' }}>
          {form.id ? '✨ CHỈNH SỬA TÁC PHẨM' : '✍️ ĐĂNG TRUYỆM MỚI'}
        </h3>

        {loading && progress.total > 0 && (
          <div style={{ marginBottom: '20px', background: '#f5f5f5', borderRadius: '10px', padding: '15px', border: `1px solid ${COFFEE.medium}` }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: COFFEE.deep, marginBottom: '5px' }}>
              {progress.status} ({progress.current}/{progress.total})
            </div>
            <div style={{ width: '100%', height: '10px', background: '#ddd', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${(progress.current / progress.total) * 100}%`, 
                height: '100%', 
                background: COFFEE.medium, 
                transition: 'width 0.3s' 
              }} />
            </div>
          </div>
        )}

        <div style={uploadBoxStyle(COFFEE)}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block' }}>🚀 TRÌNH NHẬP TRUYỆN EPUB</span>
            <span style={{ fontSize: '0.75rem', color: '#6d4c41' }}>Tự động giải nén và đẩy chương lên GitHub storage</span>
          </div>
          <input type="file" accept=".epub" onChange={handleEpubFile} disabled={loading} />
        </div>

        <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', marginTop: '20px' }}>
          <div style={coverPreviewStyle}>
            {form.cover_url ? (
              <img src={form.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Cover" />
            ) : (
              <div style={{ color: '#998f8a', fontSize: '0.7rem' }}>CHƯA CÓ BÌA</div>
            )}
            {uploading && <div style={overlayStyle}>Đang tải...</div>}
          </div>

          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <label style={vibeBtn(COFFEE)}>
                🖼️ CHỌN ẢNH BÌA
                <input type="file" hidden accept="image/*" onChange={handleUploadCover} />
              </label>
              {form.file_url && <span style={tagStyle}>✔️ Đã nhận file EPUB</span>}
            </div>

            <input style={styles.inputStyle} placeholder="Tiêu đề truyện..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input style={styles.inputStyle} placeholder="Tên tác giả..." value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
            <input style={styles.inputStyle} placeholder="Thể loại / Tags" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '0.7rem', color: COFFEE.deep, fontWeight: 'bold' }}>🔑 Mật khẩu (nếu có):</span>
                <input style={{...styles.inputStyle, background: '#fff9c4'}} placeholder="Nhập pass..." value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '0.7rem', color: COFFEE.deep, fontWeight: 'bold' }}>💡 Gợi ý:</span>
                <input style={styles.inputStyle} placeholder="Gợi ý mật khẩu..." value={form.password_hint} onChange={e => setForm({ ...form, password_hint: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <textarea style={{ ...styles.inputStyle, height: '100px', marginTop: '10px' }} placeholder="Tóm tắt nội dung truyện..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
        
        <button onClick={handleSave} style={{...styles.btnPrimary, background: COFFEE.deep, fontSize: '1rem', marginTop: '20px'}} disabled={loading || uploading}>
          {loading ? '⌛ ĐANG XỬ LÝ...' : (form.id ? '💾 CẬP NHẬT TRUYỆN' : '☕ XUẤT BẢN TRUYỆN')}
        </button>

        {form.id && (
          <button onClick={() => setForm({ id:'', title:'', author:'', cover_url:'', file_url:'', password:'', password_hint: '', description:'', category:'', is_public:true })} style={{ ...styles.btnMini, marginTop: '10px', width: '100%', background: '#bcaaa4', height: '35px' }}>HỦY CHẾ ĐỘ CHỈNH SỬA</button>
        )}
      </div>

      <div style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h4 style={{ color: COFFEE.deep, fontSize: '1.1rem', margin: 0 }}>📚 DANH SÁCH TRUYỆN</h4>
          <input 
            style={{ ...styles.inputStyle, width: '250px', marginBottom: 0, border: `1px solid ${COFFEE.medium}` }} 
            placeholder="🔍 Tìm nhanh tên truyện..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '15px' }}>
          {filteredBooks.length > 0 ? filteredBooks.map(b => (
            <div key={b.id} style={bookRowStyle}>
              <img src={b.cover_url} style={{ width: '55px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} alt="Cover" />
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: '0.95rem', color: COFFEE.deep, display: 'block' }}>{b.title}</b>
                <div style={{ fontSize: '0.75rem', color: '#8d6e63', marginBottom: '4px' }}>{b.author}</div>
                {b.password ? (
                  <div style={{ fontSize: '0.7rem', color: '#d84315', fontWeight: 'bold' }}>🔐 Pass: {b.password}</div>
                ) : (
                  <div style={{ fontSize: '0.7rem', color: '#757575' }}>🔓 Không mật khẩu</div>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button onClick={() => { setForm(b); window.scrollTo({top:0, behavior:'smooth'}); }} style={styles.btnMini}>Sửa</button>
                <button onClick={async () => { if(confirm('Bạn có chắc muốn xóa truyện này và toàn bộ chương của nó?')) { await supabase.from('books').delete().eq('id', b.id); fetchBooks(); } }} style={{ ...styles.btnMini, background: '#e57373' }}>Xóa</button>
              </div>
            </div>
          )) : <div style={{ color: '#998f8a', fontStyle: 'italic', textAlign: 'center', width: '100%' }}>Không có truyện nào trùng khớp...</div>}
        </div>
      </div>
    </div>
  );
}

// STYLES 
const uploadBoxStyle = (COFFEE: any) => ({ background: '#f5f5f5', padding: '20px', borderRadius: '18px', border: `2px dashed ${COFFEE.medium}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' });
const vibeBtn = (COFFEE: any): React.CSSProperties => ({ background: COFFEE.medium, color: '#fff', padding: '10px 18px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-block' });
const coverPreviewStyle: React.CSSProperties = { width: '160px', height: '230px', borderRadius: '15px', border: '3px solid #efebe9', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', position: 'relative' };
const overlayStyle: React.CSSProperties = { position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' };
const tagStyle: React.CSSProperties = { padding: '8px 12px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' };
const bookRowStyle: React.CSSProperties = { display: 'flex', gap: '15px', background: '#fff', padding: '15px', borderRadius: '18px', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f0f0f0' };