// Lưu tại: components/ManageChapters.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '.../../../lib/supabaseClient';

export default function ManageChapters({ styles }: any) {
  const [books, setBooks] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [form, setForm] = useState({ id: '', title: '', content: '', chapter: '', password: '' });

  useEffect(() => {
    supabase.from('books').select('id, title').then(({data}) => setBooks(data || []));
  }, []);

  useEffect(() => {
    if (selectedBook) {
      supabase.from('chapters').select('*').eq('book_id', selectedBook).order('chapter', {ascending: false})
      .then(({data}) => setChapters(data || []));
    }
  }, [selectedBook]);

  const saveChapter = async () => {
    const { id, ...rest } = form;
    if (id) {
      await supabase.from('chapters').update(rest).eq('id', id);
    } else {
      await supabase.from('chapters').insert([{...rest, book_id: selectedBook}]);
    }
    alert("Lưu chương thành công!");
    setForm({ id: '', title: '', content: '', chapter: '', password: '' });
  };

  return (
    <div style={styles.cardStyle}>
      <h3>📑 QUẢN LÝ CHƯƠNG</h3>
      <select style={styles.inputStyle} value={selectedBook} onChange={e => setSelectedBook(e.target.value)}>
        <option value="">-- CHỌN TRUYỆN (BỘ LỌC) --</option>
        {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
      </select>

      {selectedBook && (
        <div style={{marginTop:'15px'}}>
          <input placeholder="Số chương (VD: 1)" value={form.chapter} style={styles.inputStyle} onChange={e => setForm({...form, chapter: e.target.value})} />
          <input placeholder="Tên chương" value={form.title} style={styles.inputStyle} onChange={e => setForm({...form, title: e.target.value})} />
          <input placeholder="Mật khẩu chương (nếu cần)" value={form.password} style={styles.inputStyle} onChange={e => setForm({...form, password: e.target.value})} />
          <textarea placeholder="Nội dung..." value={form.content} style={{...styles.inputStyle, height:'100px'}} onChange={e => setForm({...form, content: e.target.value})} />
          <button onClick={saveChapter} style={styles.btnPrimary}>LƯU CHƯƠNG</button>
          
          <div style={{marginTop:'20px'}}>
            {chapters.map(c => (
              <div key={c.id} style={styles.rowItem}>
                <span>Chương {c.chapter}: {c.title}</span>
                <div>
                  <button onClick={() => setForm(c)} style={styles.btnMini}>Sửa</button>
                  <button onClick={async () => { if(confirm("Xóa?")) { await supabase.from('chapters').delete().eq('id', c.id); } }} style={{...styles.btnMini, background:'#ff4444'}}>Xóa</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}