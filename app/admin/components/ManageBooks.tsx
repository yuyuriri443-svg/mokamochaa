// Lưu tại: components/ManageBooks.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '.../../../lib/supabaseClient';

export default function ManageBooks({ styles, COFFEE }: any) {
  const [books, setBooks] = useState<any[]>([]);
  const [upLoading, setUpLoading] = useState(false);
  const [extractedChapters, setExtractedChapters] = useState<any[]>([]);
  const [form, setForm] = useState({ 
    id: '', title: '', author: '', cover_url: '', download_url: '', 
    password: '', description: '', category: '' 
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
    
    // Logic mổ EPUB (Metadata + Chapters)
    if (folder === 'ebooks' && file.name.endsWith('.epub')) {
      try {
        const JSZip = (await import('jszip')).default;
        const zip = await new JSZip().loadAsync(file);
        const opfPath = Object.keys(zip.files).find(f => f.endsWith('.opf'));
        if (opfPath) {
          const content = await zip.files[opfPath].async("text");
          const parser = new DOMParser();
          const xml = parser.parseFromString(content, "text/xml");
          setForm(prev => ({
            ...prev,
            title: xml.getElementsByTagName("dc:title")[0]?.textContent || prev.title,
            author: xml.getElementsByTagName("dc:creator")[0]?.textContent || prev.author,
            description: xml.getElementsByTagName("dc:description")[0]?.textContent?.replace(/<[^>]*>?/gm, '') || prev.description
          }));
          // (Logic mổ chương giống bản trước mình gửi...)
        }
      } catch (err) { console.error(err); }
    }

    const fileName = `${folder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('assets').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('assets').getPublicUrl(fileName) as any;
      folder === 'covers' ? setForm(p => ({...p, cover_url: data.publicUrl})) : setForm(p => ({...p, download_url: data.publicUrl}));
    }
    setUpLoading(false);
  };

  const saveBook = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { id, ...rest } = form;
    if (id) {
      await supabase.from('books').update(rest).eq('id', id);
      alert("Cập nhật truyện thành công!");
    } else {
      const { data: newBook } = await supabase.from('books').insert([{...rest, id_user: user?.id}]).select().single();
      // Nếu có extractedChapters thì insert vào bảng chapters (dùng cột 'chapter')
    }
    setForm({ id: '', title: '', author: '', cover_url: '', download_url: '', password: '', description: '', category: '' });
    fetchBooks();
  };

  return (
    <div>
      <div style={styles.cardStyle}>
        <h3>{form.id ? '✏️ SỬA TRUYỆN' : '📖 ĐĂNG TRUYỆN MỚI'}</h3>
        <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}>
           <input placeholder="Tên truyện" value={form.title} style={styles.inputStyle} onChange={e => setForm({...form, title: e.target.value})} />
           <input placeholder="Tác giả" value={form.author} style={styles.inputStyle} onChange={e => setForm({...form, author: e.target.value})} />
        </div>
        <input placeholder="Tag/Thể loại" value={form.category} style={styles.inputStyle} onChange={e => setForm({...form, category: e.target.value})} />
        <input placeholder="Mật khẩu truyện" value={form.password} style={styles.inputStyle} onChange={e => setForm({...form, password: e.target.value})} />
        <div style={{display:'flex', gap:'10px'}}>
            <button style={styles.btnMini}><input type="file" onChange={e => handleFileUpload(e, 'covers')} /> Upload Bìa</button>
            <button style={styles.btnMini}><input type="file" onChange={e => handleFileUpload(e, 'ebooks')} /> Upload EPUB</button>
        </div>
        <button onClick={saveBook} style={styles.btnPrimary} disabled={upLoading}>LƯU TRUYỆN</button>
      </div>

      <div style={{marginTop:'20px'}}>
        {books.map(b => (
          <div key={b.id} style={styles.rowItem}>
            <img src={b.cover_url} width="30" />
            <div style={{flex:1, marginLeft:'10px'}}><b>{b.title}</b></div>
            <button onClick={() => setForm(b)} style={styles.btnMini}>Sửa</button>
            <button onClick={async () => { if(confirm("Xóa?")) { await supabase.from('books').delete().eq('id', b.id); fetchBooks(); } }} style={{...styles.btnMini, background:'#ff4444'}}>Xóa</button>
          </div>
        ))}
      </div>
    </div>
  );
}