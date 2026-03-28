// Lưu tại: components/ManageNoti.tsx
import React, { useState } from 'react';
import { supabase } from '.../../../lib/supabaseClient';

export default function ManageNoti({ styles }: any) {
  const [noti, setNoti] = useState({ title: '', content: '' });

  const send = async () => {
    await supabase.from('notifications').insert([noti]);
    alert("Đã gửi thông báo!");
  };

  return (
    <div style={styles.cardStyle}>
      <h3>🔔 GỬI THÔNG BÁO</h3>
      <input placeholder="Tiêu đề" style={styles.inputStyle} onChange={e => setNoti({...noti, title: e.target.value})} />
      <textarea placeholder="Nội dung..." style={{...styles.inputStyle, height:'100px'}} onChange={e => setNoti({...noti, content: e.target.value})} />
      <button onClick={send} style={styles.btnPrimary}>GỬI NGAY</button>
    </div>
  );
}