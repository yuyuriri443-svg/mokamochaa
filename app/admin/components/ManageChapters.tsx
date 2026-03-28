'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Dùng @ hoặc ../../../ tùy cấu hình của bạn

interface Props {
  styles: {
    cardStyle: React.CSSProperties;
    inputStyle: React.CSSProperties;
    btnPrimary: React.CSSProperties;
    btnMini: React.CSSProperties;
    rowItem: React.CSSProperties;
  };
}

export default function ManageChapters({ styles }: Props) {
  const [books, setBooks] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // Bộ lọc tên truyện
  const [selectedBook, setSelectedBook] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ 
    id: '', 
    title: '', 
    content: '', 
    chapter: '', 
    password: '' 
  });

  // 1. Lấy danh sách truyện để bỏ vào ô chọn (Select)
  useEffect(() => {
    supabase.from('books').select('id, title').then(({ data }) => setBooks(data || []));
  }, []);

  // 2. Lấy danh sách chương khi chọn một truyện cụ thể
  const fetchChapters = async (bookId: string) => {
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter', { ascending: false }); // Chương mới nhất hiện lên đầu
    setChapters(data || []);
  };

  useEffect(() => {
    if (selectedBook) {
      fetchChapters(selectedBook);
    } else {
      setChapters([]);
    }
  }, [selectedBook]);

  // 3. Hàm lưu chương (Thêm/Sửa)
  const saveChapter = async () => {
    if (!selectedBook) return alert("Vui lòng chọn truyện trước!");
    if (!form.chapter || !form.content) return alert("Thiếu số chương hoặc nội dung!");

    setLoading(true);
    const { id, ...rest } = form;

    if (id) {
      // CẬP NHẬT
      await supabase.from('chapters').update(rest).eq('id', id);
      alert("Đã cập nhật chương!");
    } else {
      // THÊM MỚI
      await supabase.from('chapters').insert([{ ...rest, book_id: selectedBook }]);
      alert("Đã thêm chương mới!");
    }

    setForm({ id: '', title: '', content: '', chapter: '', password: '' });
    fetchChapters(selectedBook);
    setLoading(false);
  };

  // 4. Lọc danh sách truyện theo ô tìm kiếm
  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.cardStyle}>
      <h3 style={{ marginBottom: '15px' }}>📑 QUẢN LÝ CHƯƠNG</h3>

      {/* BỘ LỌC TRUYỆN */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '15px' }}>
        <p style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px' }}>Bước 1: Tìm & Chọn truyện</p>
        <input 
          style={styles.inputStyle} 
          placeholder="🔍 Nhập tên truyện để tìm nhanh..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select 
          style={styles.inputStyle} 
          value={selectedBook} 
          onChange={e => setSelectedBook(e.target.value)}
        >
          <option value="">-- CHỌN TRUYỆN TRONG DANH SÁCH --</option>
          {filteredBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
      </div>

      {/* FORM NHẬP CHƯƠNG (Chỉ hiện khi đã chọn truyện) */}
      {selectedBook && (
        <div style={{ marginTop: '15px', borderTop: '2px solid #eee', paddingTop: '20px' }}>
          <h4>{form.id ? '✏️ Đang sửa chương' : '➕ Thêm chương mới'}</h4>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              placeholder="Số chương (VD: 1)" 
              value={form.chapter} 
              style={{ ...styles.inputStyle, width: '30%' }} 
              onChange={e => setForm({ ...form, chapter: e.target.value })} 
            />
            <input 
              placeholder="Tên chương (Không bắt buộc)" 
              value={form.title} 
              style={{ ...styles.inputStyle, width: '70%' }} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
            />
          </div>

          <input 
            placeholder="🔑 Mật khẩu chương (Để trống nếu muốn đọc tự do)" 
            value={form.password || ''} 
            style={styles.inputStyle} 
            onChange={e => setForm({ ...form, password: e.target.value })} 
          />

          <textarea 
            placeholder="Nội dung chương..." 
            value={form.content} 
            style={{ ...styles.inputStyle, height: '250px', fontFamily: 'serif' }} 
            onChange={e => setForm({ ...form, content: e.target.value })} 
          />

          <button onClick={saveChapter} style={styles.btnPrimary} disabled={loading}>
            {loading ? 'ĐANG LƯU...' : 'LƯU CHƯƠNG'}
          </button>

          {form.id && (
            <button 
              onClick={() => setForm({ id: '', title: '', content: '', chapter: '', password: '' })} 
              style={{ ...styles.btnMini, width: '100%', marginTop: '10px', background: '#999', padding: '10px' }}
            >
              HỦY SỬA
            </button>
          )}

          {/* DANH SÁCH CHƯƠNG ĐÃ ĐĂNG */}
          <div style={{ marginTop: '30px' }}>
            <h4 style={{ marginBottom: '10px' }}>Các chương đã có:</h4>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '10px' }}>
              {chapters.length === 0 && <p style={{ padding: '20px', textAlign: 'center' }}>Truyện này chưa có chương nào.</p>}
              {chapters.map(c => (
                <div key={c.id} style={styles.rowItem}>
                  <span>
                    <b>C.{c.chapter}</b>: {c.title || 'Không tiêu đề'} 
                    {c.password && <span style={{ marginLeft: '10px' }}>🔑</span>}
                  </span>
                  <div>
                    <button onClick={() => setForm(c)} style={styles.btnMini}>Sửa</button>
                    <button 
                      onClick={async () => { 
                        if (confirm(`Xóa chương ${c.chapter}?`)) { 
                          await supabase.from('chapters').delete().eq('id', c.id); 
                          fetchChapters(selectedBook); 
                        } 
                      }} 
                      style={{ ...styles.btnMini, background: '#ff4444' }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}