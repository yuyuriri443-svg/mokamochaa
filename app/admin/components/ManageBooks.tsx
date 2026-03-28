'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; 
import JSZip from 'jszip';

// Định nghĩa kiểu dữ liệu để TypeScript không báo lỗi
interface Props {
  styles: {
    cardStyle: React.CSSProperties;
    inputStyle: React.CSSProperties;
    btnPrimary: React.CSSProperties;
    btnMini: React.CSSProperties;
    rowItem: React.CSSProperties;
  };
  COFFEE: any;
}

export default function ManageBooks({ styles, COFFEE }: Props) {
  // --- TẤT CẢ BIẾN VÀ HÀM PHẢI NẰM TRONG NÀY ---
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: '', 
    title: '', 
    author: '', 
    cover_url: '', 
    password: '', 
    description: '', 
    category: '', // Thêm Thể loại/Tag
    is_public: true 
  });

  // Lấy danh sách truyện
  const fetchBooks = async () => {
    const { data } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });
    setBooks(data || []);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Hàm Lưu (Thêm mới hoặc Cập nhật)
  const handleSave = async () => {
    if (!form.title) return alert("Vui lòng nhập tên truyện!");
    
    setLoading(true);
    const { id, ...data } = form;

    if (id) {
      // TRƯỜNG HỢP SỬA
      const { error } = await supabase.from('books').update(data).eq('id', id);
      if (error) alert("Lỗi cập nhật: " + error.message);
      else alert("Đã cập nhật truyện thành công!");
    } else {
      // TRƯỜNG HỢP THÊM MỚI
      const { error } = await supabase.from('books').insert([data]);
      if (error) alert("Lỗi thêm mới: " + error.message);
      else alert("Đã thêm truyện mới thành công!");
    }

    // Reset Form
    setForm({ 
      id: '', title: '', author: '', cover_url: '', 
      password: '', description: '', category: '', is_public: true 
    });
    fetchBooks();
    setLoading(false);
  };

  // Giao diện
  return (
    <div>
      <div style={styles.cardStyle}>
        <h3 style={{ color: COFFEE.deep, marginBottom: '15px' }}>
          {form.id ? '✏️ CHỈNH SỬA TRUYỆN' : '📖 ĐĂNG TRUYỆN MỚI'}
        </h3>
        
        <input 
          style={styles.inputStyle} 
          placeholder="Tên truyện" 
          value={form.title} 
          onChange={e => setForm({ ...form, title: e.target.value })} 
        />
        
        <input 
          style={styles.inputStyle} 
          placeholder="Tác giả" 
          value={form.author} 
          onChange={e => setForm({ ...form, author: e.target.value })} 
        />

        <input 
          style={styles.inputStyle} 
          placeholder="Thể loại / Tag (VD: Linh dị, Đam mỹ)" 
          value={form.category} 
          onChange={e => setForm({ ...form, category: e.target.value })} 
        />

        <input 
          style={styles.inputStyle} 
          placeholder="Link ảnh bìa (URL)" 
          value={form.cover_url} 
          onChange={e => setForm({ ...form, cover_url: e.target.value })} 
        />

        <input 
          style={styles.inputStyle} 
          placeholder="Mật khẩu truyện (Để trống nếu không có)" 
          value={form.password || ''} 
          onChange={e => setForm({ ...form, password: e.target.value })} 
        />

        <textarea 
          style={{ ...styles.inputStyle, height: '80px' }} 
          placeholder="Mô tả nội dung..." 
          value={form.description || ''} 
          onChange={e => setForm({ ...form, description: e.target.value })} 
        />
        
        <button 
          onClick={handleSave} 
          style={styles.btnPrimary} 
          disabled={loading}
        >
          {loading ? 'ĐANG XỬ LÝ...' : (form.id ? 'CẬP NHẬT TRUYỆN' : 'PHÁT HÀNH TRUYỆN')}
        </button>

        {form.id && (
          <button 
            onClick={() => setForm({ id: '', title: '', author: '', cover_url: '', password: '', description: '', category: '', is_public: true })} 
            style={{ ...styles.btnMini, marginTop: '10px', width: '100%', background: '#999', padding: '10px' }}
          >
            HỦY CHẾ ĐỘ SỬA
          </button>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4 style={{ color: COFFEE.medium, marginBottom: '10px' }}>DANH SÁCH TRUYỆN HIỆN CÓ</h4>
        {books.map(b => (
          <div key={b.id} style={styles.rowItem}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <img 
                src={b.cover_url || 'https://via.placeholder.com/40x60'} 
                width="40" 
                height="55" 
                style={{ borderRadius: '5px', objectFit: 'cover' }} 
              />
              <div>
                <b style={{ display: 'block' }}>{b.title}</b>
                <small style={{ color: '#888' }}>{b.category || 'Chưa có tag'}</small>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => setForm(b)} style={styles.btnMini}>Sửa</button>
              <button 
                onClick={async () => { 
                  if (confirm(`Bạn có chắc muốn xóa truyện "${b.title}"?`)) { 
                    await supabase.from('books').delete().eq('id', b.id); 
                    fetchBooks(); 
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
  );
} // ĐÓNG HÀM MANAGEBOOKS Ở ĐÂY LÀ CHUẨN!