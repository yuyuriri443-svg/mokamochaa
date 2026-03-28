'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Props {
  styles: {
    cardStyle: React.CSSProperties;
    inputStyle: React.CSSProperties;
    btnPrimary: React.CSSProperties;
    btnMini: React.CSSProperties;
    rowItem: React.CSSProperties;
  };
}

export default function ManageNoti({ styles }: Props) {
  const [notis, setNotis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: '', title: '', content: '' });

  // 1. Lấy danh sách thông báo đã đăng
  const fetchNotis = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });
    setNotis(data || []);
  };

  useEffect(() => {
    fetchNotis();
  }, []);

  // 2. Gửi thông báo (Thêm hoặc Sửa)
  const handleSend = async () => {
    if (!form.title || !form.content) return alert("Vui lòng nhập đủ tiêu đề và nội dung!");
    
    setLoading(true);
    const { id, ...data } = form;

    if (id) {
      // SỬA THÔNG BÁO
      await supabase.from('notifications').update(data).eq('id', id);
      alert("Đã cập nhật thông báo!");
    } else {
      // THÊM MỚI
      await supabase.from('notifications').insert([data]);
      alert("Đã đăng thông báo mới!");
    }

    setForm({ id: '', title: '', content: '' });
    fetchNotis();
    setLoading(false);
  };

  return (
    <div style={styles.cardStyle}>
      <h3 style={{ marginBottom: '15px' }}>🔔 THÔNG BÁO HỆ THỐNG</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          style={styles.inputStyle} 
          placeholder="Tiêu đề thông báo (VD: Lịch nghỉ Tết, Truyện mới...)" 
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <textarea 
          style={{ ...styles.inputStyle, height: '120px' }} 
          placeholder="Nội dung thông báo chi tiết..." 
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
        />
        <button onClick={handleSend} style={styles.btnPrimary} disabled={loading}>
          {loading ? 'ĐANG GỬI...' : (form.id ? 'CẬP NHẬT THÔNG BÁO' : 'ĐĂNG THÔNG BÁO NGAY')}
        </button>
        {form.id && (
          <button 
            onClick={() => setForm({ id: '', title: '', content: '' })} 
            style={{ ...styles.btnMini, width: '100%', marginTop: '10px', background: '#999', padding: '10px' }}
          >
            HỦY SỬA
          </button>
        )}
      </div>

      <hr style={{ border: '0.5px solid #eee', margin: '20px 0' }} />

      {/* DANH SÁCH CÁC THÔNG BÁO CŨ */}
      <h4>Thông báo đã đăng:</h4>
      <div style={{ marginTop: '10px' }}>
        {notis.length === 0 && <p style={{ color: '#888', fontSize: '0.9rem' }}>Chưa có thông báo nào.</p>}
        {notis.map(n => (
          <div key={n.id} style={{ ...styles.rowItem, flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
              <b style={{ color: '#333' }}>{n.title}</b>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button onClick={() => setForm(n)} style={styles.btnMini}>Sửa</button>
                <button 
                  onClick={async () => {
                    if (confirm("Xóa thông báo này?")) {
                      await supabase.from('notifications').delete().eq('id', n.id);
                      fetchNotis();
                    }
                  }} 
                  style={{ ...styles.btnMini, background: '#ff4444' }}
                >
                  Xóa
                </button>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
              {n.content.substring(0, 100)}{n.content.length > 100 ? '...' : ''}
            </p>
            <small style={{ color: '#aaa', fontSize: '0.7rem' }}>
              Ngày đăng: {new Date(n.created_at).toLocaleString('vi-VN')}
            </small>
          </div>
        ))}
      </div>
    </div>
  );
}