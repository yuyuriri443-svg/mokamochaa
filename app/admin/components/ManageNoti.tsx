'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Props { styles: any; COFFEE: any; }

export default function ManageNoti({ styles, COFFEE }: Props) {
  const [notis, setNotis] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: '', title: '', content: '', type: 'info' });

  const fetchNotis = async () => {
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
    setNotis(data || []);
  };

  useEffect(() => { fetchNotis(); }, []);

  const handleSave = async () => {
    if (!form.title || !form.content) return alert("Vui lòng nhập đủ nội dung!");
    setLoading(true);
    try {
      const { id, ...data } = form;
      if (id) {
        await supabase.from('notifications').update(data).eq('id', id);
      } else {
        await supabase.from('notifications').insert([data]);
      }
      setForm({ id: '', title: '', content: '', type: 'info' });
      fetchNotis();
      alert("Đã lưu thông báo!");
    } catch (err: any) { alert(err.message); }
    setLoading(false);
  };

  return (
    <div style={styles.cardStyle}>
      <h3 style={{ color: COFFEE.deep, marginBottom: '20px' }}>🔔 QUẢN LÝ THÔNG BÁO</h3>
      
      <input style={styles.inputStyle} placeholder="Tiêu đề thông báo..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      
      <select style={styles.inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
        <option value="info">☕ Thông tin (Màu nâu)</option>
        <option value="alert">⚠️ Cảnh báo (Màu đỏ)</option>
        <option value="event">🎉 Sự kiện (Màu xanh)</option>
      </select>

      <textarea style={{ ...styles.inputStyle, height: '120px' }} placeholder="Nội dung chi tiết..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
      
      <button onClick={handleSave} style={styles.btnPrimary} disabled={loading}>
        {loading ? 'ĐANG LƯU...' : 'ĐĂNG THÔNG BÁO'}
      </button>

      <div style={{ marginTop: '30px' }}>
        <h4>THÔNG BÁO ĐÃ ĐĂNG</h4>
        {notis.map(n => (
          <div key={n.id} style={{ ...styles.rowItem, borderLeft: `5px solid ${n.type === 'alert' ? '#ff4444' : COFFEE.medium}` }}>
            <div>
              <b>{n.title}</b>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(n.created_at).toLocaleDateString()}</div>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => setForm(n)} style={styles.btnMini}>Sửa</button>
              <button onClick={async () => { if(confirm('Xóa?')) { await supabase.from('notifications').delete().eq('id', n.id); fetchNotis(); } }} style={{ ...styles.btnMini, background: '#ff4444' }}>Xóa</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}