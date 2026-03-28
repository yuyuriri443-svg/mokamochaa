'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 

interface Props { styles: any; COFFEE: any; }

export default function ManageChapters({ styles, COFFEE }: Props) {
  const [books, setBooks] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: '', title: '', chapter: '', content: '', password: ''
  });

  useEffect(() => { fetchBooks(); }, []);
  useEffect(() => { if (selectedBook) fetchChapters(); }, [selectedBook]);

  const fetchBooks = async () => {
    const { data } = await supabase.from('books').select('id, title');
    setBooks(data || []);
  };

  const fetchChapters = async () => {
    const { data } = await supabase.from('chapters')
      .select('*')
      .eq('book_id', selectedBook)
      .order('chapter', { ascending: false }); // Sắp xếp theo cột chapter
    setChapters(data || []);
  };

  const handleSave = async () => {
    if (!selectedBook || !form.title || !form.content) return alert("Vui lòng điền đủ Tiêu đề và Nội dung!");
    setLoading(true);
    try {
      const { id, ...data } = form;
      const payload = { ...data, book_id: selectedBook };

      if (id) {
        await supabase.from('chapters').update(payload).eq('id', id);
        alert("Đã cập nhật chương!");
      } else {
        await supabase.from('chapters').insert([payload]);
        alert("Đã thêm chương mới!");
      }
      setForm({ id: '', title: '', chapter: '', content: '', password: '' });
      fetchChapters();
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div style={styles.cardStyle}>
      <h3 style={{ color: COFFEE.deep, marginBottom: '20px' }}>📑 QUẢN LÝ CHƯƠNG</h3>
      
      <select style={styles.inputStyle} value={selectedBook} onChange={e => setSelectedBook(e.target.value)}>
        <option value="">-- CHỌN TRUYỆN ĐỂ QUẢN LÝ --</option>
        {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
      </select>

      {selectedBook && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px' }}>
            <input style={styles.inputStyle} placeholder="Số (Ví dụ: 1)" value={form.chapter} onChange={e => setForm({ ...form, chapter: e.target.value })} />
            <input style={styles.inputStyle} placeholder="Tiêu đề chương..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <input style={styles.inputStyle} placeholder="🔑 Mật khẩu chương (nếu có)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <textarea style={{ ...styles.inputStyle, height: '300px', fontFamily: 'serif' }} placeholder="Nội dung chương..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
          
          <button onClick={handleSave} style={styles.btnPrimary} disabled={loading}>
            {loading ? 'ĐANG LƯU...' : (form.id ? 'CẬP NHẬT CHƯƠNG' : 'LƯU CHƯƠNG MỚI')}
          </button>

          <div style={{ marginTop: '30px' }}>
            <h4>MỤC LỤC ({chapters.length} chương)</h4>
            {chapters.map(c => (
              <div key={c.id} style={styles.rowItem}>
                <span><b>Chương {c.chapter}:</b> {c.title} {c.password && '🔑'}</span>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button onClick={() => { setForm(c); window.scrollTo(0,0); }} style={styles.btnMini}>Sửa</button>
                  <button onClick={async () => { if(confirm('Xóa?')) { await supabase.from('chapters').delete().eq('id', c.id); fetchChapters(); } }} style={{ ...styles.btnMini, background: '#ff4444' }}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}