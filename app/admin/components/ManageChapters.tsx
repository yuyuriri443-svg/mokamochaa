'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 

interface Props { styles: any; COFFEE: any; }

export default function ManageChapters({ styles, COFFEE }: Props) {
  const [books, setBooks] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(''); // State tìm kiếm truyện
  const [selectedBook, setSelectedBook] = useState('');
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    id: '', 
    title: '', 
    chapter: '', 
    content: '', 
    password: '', 
    password_hint: '' 
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
      .order('chapter', { ascending: false }); 
    setChapters(data || []);
  };

  const handleSave = async () => {
    if (!selectedBook || !form.title || !form.content) return alert("Vui lòng điền đủ Tiêu đề và Nội dung!");
    setLoading(true);
    try {
      const { id, ...formData } = form;
      
      // Payload đầy đủ các trường để lưu vào database
      const payload = { 
        title: formData.title,
        chapter: formData.chapter,
        content: formData.content,
        password: formData.password || null, // Nếu trống thì để null
        password_hint: formData.password_hint || null,
        book_id: selectedBook 
      };

      if (id) {
        // CẬP NHẬT
        const { error } = await supabase.from('chapters').update(payload).eq('id', id);
        if (error) throw error;
        alert("✅ Đã cập nhật chương thành công!");
      } else {
        // THÊM MỚI
        const { error } = await supabase.from('chapters').insert([payload]);
        if (error) throw error;
        alert("✨ Đã thêm chương mới thành công!");
      }

      // Reset form về trạng thái trống
      setForm({ id: '', title: '', chapter: '', content: '', password: '', password_hint: '' });
      fetchChapters();
    } catch (err: any) { 
      console.error("Lỗi Supabase:", err);
      alert("Lỗi: " + err.message); 
    }
    setLoading(false);
  };

  // Lọc danh sách truyện theo từ khóa tìm kiếm
  const filteredBooks = books.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.cardStyle}>
      <h3 style={{ color: COFFEE.deep, marginBottom: '20px', borderLeft: `5px solid ${COFFEE.medium}`, paddingLeft: '15px' }}>
        📑 QUẢN LÝ CHƯƠNG
      </h3>
      
      {/* 🔍 KHU VỰC TÌM KIẾM TRUYỆN */}
      <div style={{ marginBottom: '15px', position: 'relative' }}>
        <input 
          style={{ ...styles.inputStyle, marginBottom: '8px', border: `2px solid ${COFFEE.medium}` }} 
          placeholder="🔍 Tìm nhanh tên truyện..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          style={styles.inputStyle} 
          value={selectedBook} 
          onChange={e => {
            setSelectedBook(e.target.value);
            setForm({ id: '', title: '', chapter: '', content: '', password: '', password_hint: '' });
          }}
        >
          <option value="">-- CHỌN TRUYỆN ({filteredBooks.length} kết quả) --</option>
          {filteredBooks.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
      </div>

      {selectedBook && (
        <div style={{ marginTop: '20px', padding: '20px', background: '#FDF5E6', borderRadius: '20px', border: '1px solid #EEDCC5' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px', marginBottom: '15px' }}>
            <input 
              style={styles.inputStyle} 
              placeholder="Số chương" 
              value={form.chapter} 
              onChange={e => setForm({ ...form, chapter: e.target.value })} 
            />
            <input 
              style={styles.inputStyle} 
              placeholder="Tiêu đề chương..." 
              value={form.title} 
              onChange={e => setForm({ ...form, title: e.target.value })} 
            />
          </div>

          {/* 🔐 KHU VỰC NHẬP PASS VÀ HINT (Đã sửa để đảm bảo ăn vào state) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: COFFEE.deep }}>🔑 Mật khẩu riêng chương:</label>
              <input 
                style={{ ...styles.inputStyle, background: '#fff' }} 
                placeholder="Để trống nếu không khóa..." 
                value={form.password || ''} 
                onChange={e => setForm({ ...form, password: e.target.value })} 
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: COFFEE.deep }}>💡 Gợi ý mật khẩu:</label>
              <input 
                style={{ ...styles.inputStyle, background: '#fff' }} 
                placeholder="Gợi ý cho độc giả..." 
                value={form.password_hint || ''} 
                onChange={e => setForm({ ...form, password_hint: e.target.value })} 
              />
            </div>
          </div>

          <textarea 
            style={{ ...styles.inputStyle, height: '300px', fontFamily: 'serif', lineHeight: '1.6', background: '#fff' }} 
            placeholder="Nội dung chương (Hỗ trợ HTML)..." 
            value={form.content} 
            onChange={e => setForm({ ...form, content: e.target.value })} 
          />
          
          <button 
            onClick={handleSave} 
            style={{ ...styles.btnPrimary, background: COFFEE.deep, marginTop: '15px', width: '100%' }} 
            disabled={loading}
          >
            {loading ? '⌛ ĐANG XỬ LÝ...' : (form.id ? '💾 CẬP NHẬT CHƯƠNG' : '☕ XUẤT BẢN CHƯƠNG MỚI')}
          </button>

          {form.id && (
            <button 
              onClick={() => setForm({ id: '', title: '', chapter: '', content: '', password: '', password_hint: '' })}
              style={{ ...styles.btnMini, width: '100%', marginTop: '10px', background: '#A1887F', height: '35px' }}
            >
              HỦY CHẾ ĐỘ SỬA
            </button>
          )}

          <div style={{ marginTop: '40px' }}>
            <h4 style={{ color: COFFEE.deep, borderBottom: `2px solid ${COFFEE.medium}`, paddingBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>📚 DANH SÁCH CHƯƠNG</span>
              <span style={{ fontSize: '0.8rem' }}>Tổng: {chapters.length}</span>
            </h4>
            <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '15px' }}>
              {chapters.length > 0 ? chapters.map(c => (
                <div key={c.id} style={{ ...styles.rowItem, background: '#FFF', marginBottom: '10px', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  <div style={{ flex: 1 }}>
                    <b style={{ color: COFFEE.deep }}>Chương {c.chapter}:</b> {c.title} 
                    {c.password && (
                      <span title={`Mật khẩu: ${c.password}`} style={{ marginLeft: '10px', cursor: 'help' }}>🔐</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => { 
                        setForm({
                          id: c.id,
                          title: c.title,
                          chapter: c.chapter,
                          content: c.content,
                          password: c.password || '',
                          password_hint: c.password_hint || ''
                        }); 
                        window.scrollTo({ top: 0, behavior: 'smooth' }); 
                      }} 
                      style={styles.btnMini}
                    >
                      Sửa
                    </button>
                    <button 
                      onClick={async () => { 
                        if(confirm(`Bạn có chắc muốn xóa Chương ${c.chapter} không?`)) { 
                          const { error } = await supabase.from('chapters').delete().eq('id', c.id); 
                          if (!error) fetchChapters(); 
                        } 
                      }} 
                      style={{ ...styles.btnMini, background: '#E57373' }}
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: '#998f8a', padding: '20px' }}>Chưa có chương nào cho truyện này...</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}