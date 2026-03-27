'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient'; 
import Link from 'next/link';
import { useParams } from 'next/navigation';

const COFFEE = {
  deep: '#3E2723',
  medium: '#5D4037',
  light: '#8D6E63',
  bg: '#FDF5E6',
  border: '#D7CCC8',
};

export default function ProfilePage() {
  const params = useParams();
  const profileId = params?.id; 

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  
  // States cho chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [uploading, setUploading] = useState(false);

  const isMine = !profileId || currentUser?.id === profileId;

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const targetId = profileId || user?.id;
      if (!targetId) return;

      const { data: pData } = await (supabase.from('profiles').select('*').eq('id', targetId).single() as any);

if (pData) {
  setProfile(pData);
  setFullName(pData.full_name || '');
  setBio(pData.bio || '');
}

      let query = supabase.from('library').select('*, books(*)').eq('user_id', targetId);
      if (!isMine) query = query.eq('is_public', true);
      const { data: lData } = await query;
      setLibrary(lData || []);
    }
    getData();
  }, [profileId, isMine]);

  // Sửa lại hàm handleUpload
const handleUpload = async (e: any) => {
  if (!e.target.files || e.target.files.length === 0) return;
  setUploading(true);

  try {
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    // FIX LỖI: Bỏ chữ Barb, dùng Date.now()
    const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName) as any;
    const publicUrl = data?.publicUrl;

    if (publicUrl) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl } as any)
        .eq('id', currentUser.id);

      if (updateError) throw updateError;
      
      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }));

      // ĐỒNG BỘ TOÀN WEB: Bắn tín hiệu cho các component khác (như Nav) nhận biết
      window.dispatchEvent(new Event('storage')); 
      
      alert("Avatar mới đã được phủ sóng! ✨");
    }
  } catch (error: any) {
    alert("Lỗi: " + error.message);
  } finally {
    setUploading(false);
  }
};
  // HÀM LƯU HỒ SƠ
  const saveProfile = async () => {
  if (!currentUser) return alert("Bạn cần đăng nhập để lưu!");

  console.log("Đang lưu tên:", fullName, "và bio:", bio); // Kiểm tra xem data có chạy vào đây không

  const { error } = await supabase
    .from('profiles')
    .update({ 
      full_name: fullName, 
      bio: bio 
    } as any) // Ép kiểu để tránh lỗi đỏ
    .eq('id', currentUser.id);

  if (error) {
    console.error("Lỗi Supabase:", error.message);
    alert("Không lưu được: " + error.message);
  } else {
    // Cập nhật lại giao diện chính
    setProfile((prev: any) => ({ ...prev, full_name: fullName, bio: bio }));
    setIsEditing(false);
    alert("Đã lưu hồ sơ thành công! ☕");
  }
};

  return (
    <div style={fullPage}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;600;800&display=swap'); * { font-family: 'Lexend', sans-serif !important; }`}} />

      <div style={dashedContainer}>
        <Link href="/" style={backHome}>←</Link>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          {/* PHẦN AVATAR */}
          <div style={avatarWrapper}>
             <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${fullName || 'Moka'}&background=random`} style={avatarImg} />
             {isMine && (
               <label style={uploadIcon}>
                 {uploading ? '...' : '📷'} 
                 <input type="file" hidden onChange={handleUpload} disabled={uploading} /> 
               </label>
             )}
          </div>

          {/* HIỂN THỊ TÊN & QUOTE HOẶC FORM SỬA */}
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <input value={fullName} onChange={e => setFullName(e.target.value)} style={minimalInput} placeholder="Tên hiển thị..." />
              <textarea value={bio} onChange={e => setBio(e.target.value)} style={minimalTextarea} placeholder="Quote yêu thích của bạn..." />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveProfile} style={btnSave}>Lưu</button>
                <button onClick={() => setIsEditing(false)} style={btnCancel}>Hủy</button>
              </div>
            </div>
          ) : (
            <>
              <h2 style={nameTitle}>{profile?.full_name || 'Người dùng Moka'}</h2>
              <p style={bioText}>{profile?.bio || 'Hạt cà phê này chưa có lời giới thiệu.'}</p>
              {isMine && <button onClick={() => setIsEditing(true)} style={editToggle}>Chỉnh sửa hồ sơ</button>}
            </>
          )}

          {/* NÚT NHẮN TIN GỌN GÀNG */}
          <div style={{ marginTop: '20px' }}>
            <Link href={isMine ? "/chat" : `/chat?with=${profileId}`} style={msgBtn}>
              {isMine ? "💬 HỘP THƯ CỦA TÔI" : `💌 NHẮN TIN CHO ${fullName?.toUpperCase() || 'BẠN NÀY'}`}
            </Link>
          </div>
        </div>

        {/* THƯ VIỆN PUBLIC */}
        <div style={libSection}>
          <h4 style={libTitle}>✨ KỆ SÁCH CÔNG KHAI</h4>
          <div style={libGrid}>
            {library.filter(i => i.is_public).map((item) => (
              <Link href={`/book/${item.books.id}`} key={item.id} style={{textDecoration: 'none'}}>
                <div style={libCard}>
                  <img src={item.books.cover_url} style={libCover} />
                  <div style={libName}>{item.books.title}</div>
                </div>
              </Link>
            ))}
          </div>
          {library.filter(i => i.is_public).length === 0 && <div style={emptyLib}>Chưa có truyện công khai nào...</div>}
        </div>

        {/* THƯ VIỆN CÁ NHÂN (CHỈ HIỆN NẾU LÀ CHÍNH CHỦ) */}
        {isMine && (
          <div style={{ ...libSection, marginTop: '30px' }}>
            <h4 style={{ ...libTitle, color: COFFEE.light }}>🔒 KỆ SÁCH CÁ NHÂN</h4>
            <div style={libGrid}>
              {library.filter(i => !i.is_public).map((item) => (
                <Link href={`/book/${item.books.id}`} key={item.id} style={{textDecoration: 'none'}}>
                  <div style={{ ...libCard, opacity: 0.75 }}>
                    <img src={item.books.cover_url} style={libCover} />
                    <div style={libName}>{item.books.title}</div>
                  </div>
                </Link>
              ))}
            </div>
            {library.filter(i => !i.is_public).length === 0 && <div style={emptyLib}>Không có truyện riêng tư.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// --- STYLES ---
const fullPage: any = { minHeight: '100vh', background: COFFEE.bg, display: 'flex', justifyContent: 'center', padding: '20px' };
const dashedContainer: any = { width: '100%', maxWidth: '480px', border: `2px dashed ${COFFEE.border}`, borderRadius: '35px', padding: '30px', background: '#fff', alignSelf: 'start', position: 'relative' };
const backHome: any = { position: 'absolute', top: '20px', left: '25px', textDecoration: 'none', fontSize: '1.2rem', color: COFFEE.deep };

const avatarWrapper: any = { width: '110px', height: '110px', margin: '0 auto 15px', position: 'relative' };
const avatarImg: any = { width: '100%', height: '100%', borderRadius: '50%', border: `3px solid ${COFFEE.deep}`, objectFit: 'cover' };
const uploadIcon: any = { position: 'absolute', bottom: '0', right: '0', background: COFFEE.deep, color: '#fff', padding: '7px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.7rem' };

const nameTitle: any = { fontSize: '1.4rem', fontWeight: '800', color: COFFEE.deep, margin: '5px 0' };
const bioText: any = { fontSize: '0.85rem', color: COFFEE.light, fontStyle: 'italic', marginBottom: '15px', padding: '0 20px' };
const editToggle: any = { background: 'none', border: `1px solid ${COFFEE.border}`, padding: '5px 15px', borderRadius: '10px', fontSize: '0.7rem', cursor: 'pointer', color: COFFEE.light };

const minimalInput: any = { width: '80%', padding: '8px', border: 'none', borderBottom: `2px solid ${COFFEE.border}`, outline: 'none', textAlign: 'center', fontWeight: '600', fontSize: '1rem' };
const minimalTextarea: any = { width: '85%', padding: '10px', border: `1px solid ${COFFEE.border}`, borderRadius: '12px', outline: 'none', fontSize: '0.8rem', minHeight: '50px' };
const btnSave: any = { background: COFFEE.deep, color: '#fff', border: 'none', padding: '6px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' };
const btnCancel: any = { background: '#eee', color: '#666', border: 'none', padding: '6px 15px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem' };

const msgBtn: any = { display: 'inline-block', padding: '10px 20px', border: `2px dashed ${COFFEE.deep}`, borderRadius: '15px', textDecoration: 'none', color: COFFEE.deep, fontWeight: '800', fontSize: '0.75rem' };

const libSection: any = { marginTop: '20px' };
const libTitle: any = { fontSize: '0.75rem', fontWeight: '800', color: COFFEE.medium, marginBottom: '15px', textAlign: 'left', borderLeft: `3px solid ${COFFEE.deep}`, paddingLeft: '8px' };
const libGrid: any = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' };
const libCard: any = { textAlign: 'center' };
const libCover: any = { width: '100%', height: '130px', borderRadius: '12px', objectFit: 'cover', boxShadow: '0 4px 8px rgba(0,0,0,0.05)' };
const libName: any = { fontSize: '0.65rem', fontWeight: 'bold', marginTop: '6px', color: COFFEE.deep, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const emptyLib: any = { textAlign: 'center', color: '#ccc', fontSize: '0.7rem', gridColumn: 'span 3', padding: '10px' };