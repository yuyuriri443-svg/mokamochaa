'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Props { styles: any; COFFEE: any; }

export default function ManageNoti({ styles, COFFEE }: Props) {
  const [notis, setNotis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // Thêm is_active để có thể ẩn/hiện thông báo mà không cần xóa
  const [form, setForm] = useState({ id: '', title: '', content: '', type: 'info', is_active: true });

  const fetchNotis = async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Lỗi lấy thông báo:", error.message);
      return;
    }
    setNotis(data || []);
  };

  useEffect(() => { fetchNotis(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.content) return alert("Cậu ơi, nhập đủ Tiêu đề và Nội dung đã nhé! ☕");
    setLoading(true);
    
    try {
      const { id, ...dataToSave } = form;
      
      if (id) {
        // Cập nhật thông báo cũ
        const { error } = await supabase.from('notifications').update(dataToSave).eq('id', id);
        if (error) throw error;
        alert("✅ Đã cập nhật thông báo thành công!");
      } else {
        // Thêm thông báo mới
        const { error } = await supabase.from('notifications').insert([dataToSave]);
        if (error) throw error;
        alert("✨ Đã đăng thông báo mới toanh!");
      }

      // Reset form sạch sẽ
      setForm({ id: '', title: '', content: '', type: 'info', is_active: true });
      fetchNotis();
    } catch (err: any) { 
      console.error("Lỗi Supabase:", err);
      alert("Lỗi rồi: " + err.message); 
    }
    setLoading(false);
  };

  // Hàm helper để lấy màu theo loại thông báo
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert': return '#E57373'; // Đỏ nhẹ
      case 'event': return '#81C784'; // Xanh lá
      default: return COFFEE.medium;   // Nâu cà phê
    }
  };

  return (
    <div style={styles.cardStyle}>
      <h3 style={{ color: COFFEE.deep, marginBottom: '20px', borderLeft: `5px solid ${COFFEE.medium}`, paddingLeft: '15px' }}>
        🔔 QUẢN LÝ THÔNG BÁO
      </h3>
      
      <div style={{ background: '#FDF5E6', padding: '20px', borderRadius: '15px', border: `1px solid #EEDCC5` }}>
        <input 
          style={styles.inputStyle} 
          placeholder="Tiêu đề thông báo (VD: Bảo trì hệ thống...)" 
          value={form.title} 
          onChange={e => setForm({ ...form, title: e.target.value })} 
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <select 
            style={styles.inputStyle} 
            value={form.type} 
            onChange={e => setForm({ ...form, type: e.target.value })}
          >
            <option value="info">☕ Thông tin (Nâu)</option>
            <option value="alert">⚠️ Cảnh báo (Đỏ)</option>
            <option value="event">🎉 Sự kiện (Xanh)</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: COFFEE.deep }}>
            <input 
              type="checkbox" 
              checked={form.is_active} 
              onChange={e => setForm({ ...form, is_active: e.target.checked })} 
            />
            Hiển thị thông báo này
          </label>
        </div>

        <textarea 
          style={{ ...styles.inputStyle, height: '100px', background: '#fff' }} 
          placeholder="Nội dung chi tiết muốn nhắn gửi đến độc giả..." 
          value={form.content} 
          onChange={e => setForm({ ...form, content: e.target.value })} 
        />
        
        <button 
          onClick={handleSave} 
          style={{ ...styles.btnPrimary, background: COFFEE.deep, width: '100%' }} 
          disabled={loading}
        >
          {loading ? '⌛ ĐANG LƯU...' : (form.id ? '💾 CẬP NHẬT' : '🚀 ĐĂNG THÔNG BÁO')}
        </button>

        {form.id && (
          <button 
            onClick={() => setForm({ id: '', title: '', content: '', type: 'info', is_active: true })}
            style={{ ...styles.btnMini, width: '100%', marginTop: '10px', background: '#A1887F' }}
          >
            HỦY SỬA
          </button>
        )}
      </div>

      <div style={{ marginTop: '30px' }}>
        <h4 style={{ color: COFFEE.deep, borderBottom: `2px solid ${COFFEE.medium}`, paddingBottom: '10px' }}>
          📜 LỊCH SỬ THÔNG BÁO
        </h4>
        <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '15px' }}>
          {notis.length > 0 ? notis.map(n => (
            <div 
              key={n.id} 
              style={{ 
                ...styles.rowItem, 
                background: '#fff',
                marginBottom: '10px',
                borderLeft: `6px solid ${getTypeColor(n.type)}`,
                opacity: n.is_active ? 1 : 0.5 // Mờ đi nếu đang ẩn
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <b style={{ color: COFFEE.deep }}>{n.title}</b>
                  {!n.is_active && <span style={{ fontSize: '0.7rem', color: '#999' }}>(Đang ẩn)</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8d6e63' }}>
                  📅 {new Date(n.created_at).toLocaleString('vi-VN')}
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: '5px', color: '#555' }}>{n.content}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                <button onClick={() => { setForm(n); window.scrollTo({top: 0, behavior: 'smooth'}); }} style={styles.btnMini}>Sửa</button>
                <button 
                  onClick={async () => { 
                    if(confirm('Cậu có chắc muốn xóa vĩnh viễn thông báo này?')) { 
                      const { error } = await supabase.from('notifications').delete().eq('id', n.id); 
                      if (!error) fetchNotis(); 
                    } 
                  }} 
                  style={{ ...styles.btnMini, background: '#E57373' }}
                >
                  Xóa
                </button>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', color: '#998f8a', padding: '20px' }}>Chưa có thông báo nào...</div>
          )}
        </div>
      </div>
    </div>
  );
}