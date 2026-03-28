'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import JSZip from 'jszip';

interface Props { styles: any; COFFEE: any; }

export default function ManageBooks({ styles, COFFEE }: Props) {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    id: '', title: '', author: '', cover_url: '', 
    file_url: '', 
    password: '', description: '', category: '', is_public: true 
  });

  const fetchBooks = async () => {
    const { data } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    setBooks(data || []);
  };

  useEffect(() => { fetchBooks(); }, []);

  // --- 1. XỬ LÝ FILE EPUB (Đã fix logic bóc tách) ---
  const handleEpubFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Hàm làm sạch tên file để tránh lỗi "Invalid Key"
    const sanitize = (name: string) => name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');

    setLoading(true);
    try {
      // A. Upload file gốc (Đã fix tên file)
      const cleanFileName = `files/${Date.now()}_${sanitize(file.name)}`;
      const { error: upError } = await supabase.storage.from('moka-storage').upload(cleanFileName, file);
      if (upError) throw upError;
      const { data: urlData } = supabase.storage.from('moka-storage').getPublicUrl(cleanFileName);
      
      // B. Giải nén
      const zip = await JSZip.loadAsync(file);
      
      // C. Lấy Metadata (Giữ nguyên logic của cậu)
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

      // D. Đọc nội dung & Xử lý ảnh (Hỗ trợ cả Base64)
      const contentFiles = Object.keys(zip.files)
        .filter(fn => fn.endsWith('.xhtml') || fn.endsWith('.html'))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

      let chapterList: any[] = [];
      let fullRawText = "";

      for (const fn of contentFiles) {
        const html = await zip.files[fn].async("text");
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Xử lý ảnh nhúng
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
        fullRawText += (doc.body.innerText || "") + "\n";
        
        // --- CHIẾN THUẬT MỚI: Nếu không dùng Regex tách được, ta lấy mỗi file HTML làm 1 chương ---
        // Chúng ta tạm lưu lại nội dung HTML đã xử lý ảnh
       const contentHTML = doc.body.innerHTML;
        const titleFromHTML = doc.querySelector('h1, h2, h3')?.innerText || `Chương ${chapterList.length + 1}`;
        
        chapterList.push({ title: titleFromHTML, content: contentHTML });
      }

      // E. KIỂM TRA TÁCH CHƯƠNG BẰNG REGEX (Nếu văn bản gộp chung)
      // Chấp nhận cả "Chuong", "Chương", "Chapter", "Hồi"...
      const splitRegex = /(^|\n)(Chương\s+\d+|Chuong\s+\d+|Chapter\s+\d+|Hồi\s+\d+|Hoi\s+\d+|Quyển\s+\d+|Tiết\s+tử)/gi;
      const parts = fullRawText.split(splitRegex);

      // Nếu Regex tìm thấy nhiều hơn 2 đoạn (tức là có dấu hiệu chia chương trong text)
      if (parts.length > 3) {
        const regexChapters: any[] = [];
        let order = 1;
        for (let i = 1; i < parts.length; i += 3) {
          const t = parts[i+1]?.trim();
          const c = parts[i+2]?.trim();
          if (t && c) {
            regexChapters.push({ title: t, content: c.replace(/\n/g, '<br/>'), sort_order: order++ });
          }
        }
        chapterList = regexChapters;
      } else {
        // Nếu không tách được bằng Regex, dùng danh sách file HTML đã lấy ở trên
        chapterList = chapterList.map((c, idx) => ({ ...c, sort_order: idx + 1 }));
      }

      // F. Cập nhật Form
      setForm(prev => ({ 
        ...prev, 
        file_url: urlData.publicUrl, 
        title: epubTitle, 
        author: epubAuthor, 
        description: epubDesc 
      }));

      (window as any).tempChapters = chapterList;
      alert(`✅ Thành công! Đã nhận diện ${chapterList.length} chương.`);

    } catch (err: any) {
      alert("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 2. LƯU TỔNG HỢP ---
  const handleSave = async () => {
    if (!form.title) return alert("Vui lòng nhập tên truyện!");
    setLoading(true);
    try {
      const { id, ...dataToSave } = form;
      let bookId = id;

      if (id) {
        await supabase.from('books').update(dataToSave).eq('id', id);
      } else {
        const { data, error } = await supabase.from('books').insert([dataToSave]).select().single();
        if (error) throw error;
        bookId = data.id;
      }

      const tempChapters = (window as any).tempChapters;
      if (tempChapters && tempChapters.length > 0) {
        // 💡 Gán book_id cho từng chương trước khi insert
        const finalChapters = tempChapters.map((c: any) => ({ ...c, book_id: bookId }));
        
        // Xóa chương cũ nếu là chế độ chỉnh sửa để tránh trùng lặp (tùy chọn)
        if (id) {
            await supabase.from('chapters').delete().eq('book_id', id);
        }

        const { error: cError } = await supabase.from('chapters').insert(finalChapters);
        if (cError) throw cError;
        (window as any).tempChapters = null;
      }

      alert("🚀 Lưu truyện thành công!");
      setForm({ id: '', title: '', author: '', cover_url: '', file_url: '', password: '', description: '', category: '', is_public: true });
      fetchBooks();
    } catch (error: any) { alert(error.message); }
    setLoading(false);
  };

  // --- 3. UPLOAD ẢNH BÌA (Giữ nguyên) ---
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

  return (
    <div>
      <div style={styles.cardStyle}>
        <h3 style={{ color: COFFEE.deep, marginBottom: '25px', borderLeft: `5px solid ${COFFEE.medium}`, paddingLeft: '15px' }}>
          {form.id ? '✨ CHỈNH SỬA TÁC PHẨM' : '✍️ ĐĂNG TRUYỆN MỚI'}
        </h3>

        <div style={uploadBoxStyle(COFFEE)}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block' }}>🚀 TRÌNH NHẬP TRUYỆN EPUB</span>
            <span style={{ fontSize: '0.75rem', color: '#6d4c41' }}>Tự động bóc tách chương & tạo link tải cho độc giả</span>
          </div>
          <input type="file" accept=".epub" onChange={handleEpubFile} disabled={loading} style={{ fontSize: '0.8rem' }} />
        </div>

        <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', marginTop: '20px' }}>
          <div style={coverPreviewStyle}>
            {form.cover_url ? (
              <img src={form.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
              {form.file_url && <span style={tagStyle}>✔️ Đã có file EPUB</span>}
            </div>

            <input style={styles.inputStyle} placeholder="Tiêu đề truyện..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <input style={styles.inputStyle} placeholder="Tên tác giả..." value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input style={styles.inputStyle} placeholder="Thể loại (Tag)" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              <input style={styles.inputStyle} placeholder="🔑 Mật khẩu truyện" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
        </div>

        <textarea style={{ ...styles.inputStyle, height: '100px', marginTop: '10px' }} placeholder="Tóm tắt nội dung..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
        
        <button onClick={handleSave} style={{...styles.btnPrimary, background: COFFEE.deep, fontSize: '1rem'}} disabled={loading || uploading}>
          {loading ? '⌛ ĐANG XỬ LÝ...' : (form.id ? '💾 CẬP NHẬT THAY ĐỔI' : '☕ XUẤT BẢN NGAY')}
        </button>

        {form.id && (
          <button onClick={() => setForm({ id:'', title:'', author:'', cover_url:'', file_url:'', password:'', description:'', category:'', is_public:true })} style={{ ...styles.btnMini, marginTop: '10px', width: '100%', background: '#bcaaa4' }}>HỦY CHẾ ĐỘ SỬA</button>
        )}
      </div>

      <div style={{ marginTop: '40px' }}>
        <h4 style={{ color: COFFEE.deep, marginBottom: '20px', fontSize: '1.1rem' }}>📚 TRUYỆN ĐÃ ĐĂNG</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
          {books.map(b => (
            <div key={b.id} style={bookRowStyle}>
              <img src={b.cover_url} style={{ width: '50px', height: '70px', borderRadius: '8px', objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: '0.9rem', color: COFFEE.deep }}>{b.title}</b>
                <div style={{ fontSize: '0.7rem', color: '#8d6e63' }}>{b.author} | {b.category || 'No Tag'}</div>
                {b.file_url && <div style={{ fontSize: '0.65rem', color: '#2e7d32' }}>📎 Có file đính kèm</div>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <button onClick={() => { setForm(b); window.scrollTo({top:0, behavior:'smooth'}); }} style={styles.btnMini}>Sửa</button>
                <button onClick={async () => { if(confirm('Xóa truyện này?')) { await supabase.from('books').delete().eq('id', b.id); fetchBooks(); } }} style={{ ...styles.btnMini, background: '#e57373' }}>Xóa</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Giữ nguyên các Styles phía dưới
const uploadBoxStyle = (COFFEE: any) => ({
  background: '#efebe9',
  padding: '20px',
  borderRadius: '18px',
  border: `2px dashed ${COFFEE.medium}`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '20px'
});

const vibeBtn = (COFFEE: any): React.CSSProperties => ({
  background: COFFEE.medium,
  color: '#fff',
  padding: '10px 18px',
  borderRadius: '12px',
  fontSize: '0.8rem',
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'inline-block'
});

const coverPreviewStyle: React.CSSProperties = {
  width: '160px', 
  height: '230px', 
  borderRadius: '15px', 
  border: '3px solid #efebe9', 
  overflow: 'hidden', 
  background: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
  position: 'relative'
};

const overlayStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(255,255,255,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '0.8rem'
};

const tagStyle: React.CSSProperties = {
  padding: '8px 12px',
  background: '#e8f5e9',
  color: '#2e7d32',
  borderRadius: '10px',
  fontSize: '0.75rem',
  fontWeight: 'bold'
};

const bookRowStyle: React.CSSProperties = {
  display: 'flex', 
  gap: '15px', 
  background: '#fff', 
  padding: '15px', 
  borderRadius: '18px', 
  alignItems: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  border: '1px solid #f5f5f5'
};