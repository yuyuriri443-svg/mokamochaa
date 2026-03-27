'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Link from 'next/link';

const COFFEE = {
  deep: '#3E2723',
  medium: '#5D4037',
  light: '#8D6E63',
  bg: '#FDF5E6',
  border: '#D7CCC8',
  white: 'rgba(255, 255, 255, 0.9)'
};

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [library, setLibrary] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    async function getData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        // Lấy profile từ bảng profiles
        const { data: pData } = await (supabase.from('profiles').select('*').eq('id', user.id).single() as any);
        if (pData) {
          setProfile(pData);
          setFullName(pData.full_name || '');
          setBio(pData.bio || '');
        }
        // Lấy thư viện truyện
        const { data: lData } = await (supabase.from('library').select('*, books(*)').eq('user_id', user.id) as any);
        setLibrary(lData || []);
      }
    }
    getData();
  }, []);

  const handleUpload = async (e: any) => {
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);

    if (!uploadError) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', currentUser.id);
      setProfile({ ...profile, avatar_url: data.publicUrl });
      alert("Đã đổi ảnh đại diện! ✨");
    }
    setUploading(false);
  };

  const saveProfile = async () => {
    const { error } = await supabase.from('profiles').update({ full_name: fullName, bio: bio }).eq('id', currentUser.id);
    if (!error) {
      setProfile({ ...profile, full_name: fullName, bio: bio });
      setIsEditing(false);
      alert("Hồ sơ đã được lưu! ☕");
    }
  };

  return (
    <div style={fullPage}>
      <div style={dashedContainer}>
        <Link href="/" style={backHome}>←</Link>
        
        {/* AVATAR & INFO */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={avatarWrapper}>
             <img src={profile?.avatar_url || 'https://via.placeholder.com/150'} style={avatarImg} />
             <label style={uploadIcon}>
               📷 <input type="file" hidden onChange={handleUpload} disabled={uploading} />
             </label>
          </div>

          {isEditing ? (
            <div style={editForm}>
              <input value={fullName} onChange={e => setFullName(e.target.value)} style={minimalInput} placeholder="Tên của bạn..." />
              <textarea value={bio} onChange={e => setBio(e.target.value)} style={minimalTextarea} placeholder="Lời giới thiệu chill chill..." />
              <button onClick={saveProfile} style={saveBtn}>Xong</button>
            </div>
          ) : (
            <>
              <h2 style={nameTitle}>{profile?.full_name || 'Người dùng Moka'}</h2>
              <p style={bioText}>{profile?.bio || 'Chưa có lời giới thiệu nào.'}</p>
              <button onClick={() => setIsEditing(true)} style={editToggle}>Chỉnh sửa hồ sơ</button>
            </>
          )}
        </div>

        {/* NÚT NHẮN TIN - NÉT ĐỨT */}
        <Link href="/chat" style={chatDashedBtn}>
          💬 TRUNG TÂM TIN NHẮN (4)
        </Link>

        {/* THƯ VIỆN ẤN TƯỢNG */}
        <div style={libSection}>
          <h4 style={libTitle}>📚 THƯ VIỆN CỦA TÔI</h4>
          <div style={libGrid}>
            {library.map((item) => (
              <div key={item.id} style={item.is_public ? libCard : privateCard}>
                <img src={item.books.cover_url} style={libCover} />
                <div style={libBadge}>{item.is_public ? 'Public' : '🔒'}</div>
                <div style={libName}>{item.books.title}</div>
              </div>
            ))}
            {library.length === 0 && <div style={emptyLib}>Chưa có truyện nào trong kệ sách...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const fullPage: any = { minHeight: '100vh', background: COFFEE.bg, display: 'flex', justifyContent: 'center', padding: '40px 20px', fontFamily: 'Lexend' };
const dashedContainer: any = { width: '100%', maxWidth: '600px', border: `3px dashed ${COFFEE.border}`, borderRadius: '40px', padding: '40px', position: 'relative', background: '#fff' };
const backHome: any = { position: 'absolute', top: '20px', left: '30px', textDecoration: 'none', fontSize: '1.5rem', color: COFFEE.deep };

const avatarWrapper: any = { width: '120px', height: '120px', margin: '0 auto 20px', position: 'relative' };
const avatarImg: any = { width: '100%', height: '100%', borderRadius: '50%', border: `4px solid ${COFFEE.deep}`, objectFit: 'cover' };
const uploadIcon: any = { position: 'absolute', bottom: '0', right: '0', background: COFFEE.deep, color: '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer', fontSize: '0.8rem' };

const nameTitle: any = { fontSize: '1.6rem', fontWeight: '800', color: COFFEE.deep, margin: '10px 0' };
const bioText: any = { fontSize: '0.9rem', color: COFFEE.light, fontStyle: 'italic', marginBottom: '15px' };
const editToggle: any = { background: 'none', border: `1px solid ${COFFEE.border}`, padding: '5px 15px', borderRadius: '10px', fontSize: '0.7rem', cursor: 'pointer', color: COFFEE.light };

const editForm: any = { display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' };
const minimalInput: any = { width: '80%', padding: '10px', border: 'none', borderBottom: `2px solid ${COFFEE.border}`, outline: 'none', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold' };
const minimalTextarea: any = { width: '80%', padding: '10px', border: `1px solid ${COFFEE.border}`, borderRadius: '10px', outline: 'none', fontSize: '0.85rem' };
const saveBtn: any = { background: COFFEE.deep, color: '#fff', border: 'none', padding: '8px 25px', borderRadius: '20px', marginTop: '10px', cursor: 'pointer' };

const chatDashedBtn: any = { display: 'block', textAlign: 'center', padding: '15px', border: `2px dashed ${COFFEE.deep}`, borderRadius: '20px', textDecoration: 'none', color: COFFEE.deep, fontWeight: '800', fontSize: '0.9rem', transition: '0.3s', marginBottom: '40px' };

const libSection: any = { marginTop: '20px' };
const libTitle: any = { fontSize: '0.85rem', fontWeight: '800', letterSpacing: '2px', color: COFFEE.medium, marginBottom: '20px' };
const libGrid: any = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' };
const libCard: any = { position: 'relative', background: '#f9f9f9', padding: '5px', borderRadius: '15px', textAlign: 'center' };
const privateCard: any = { ...libCard, opacity: 0.7, border: `1px dashed ${COFFEE.light}` };
const libCover: any = { width: '100%', height: '140px', borderRadius: '12px', objectFit: 'cover' };
const libBadge: any = { position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '0.6rem', padding: '2px 6px', borderRadius: '5px' };
const libName: any = { fontSize: '0.75rem', fontWeight: 'bold', marginTop: '8px', color: COFFEE.deep, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const emptyLib: any = { gridColumn: 'span 3', padding: '20px', color: '#ccc', fontSize: '0.8rem', textAlign: 'center' };