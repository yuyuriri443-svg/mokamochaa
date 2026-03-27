'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// ID ADMIN CỦA BẠN
const ADMIN_ID = '973562bf-bd2c-46b2-aa1d-bafca49b1237';

const COFFEE = {
  deep: '#3E2723',
  medium: '#5D4037',
  light: '#8D6E63',
  cream: 'rgba(253, 245, 230, 0.95)',
  border: '#D7CCC8',
  gradient: 'linear-gradient(135deg, #3E2723 0%, #8D6E63 100%)'
}

exportdefault function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null) // Người đang đăng nhập
  const [profileUser, setProfileUser] = useState<any>(null) // Thông tin profile đang hiển thị
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  useEffect(() => {
    async function getInitialData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        setProfileUser(user)
        
        // Lấy avatar từ bảng profiles thay vì metadata
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .maybeSingle()
          
        if (profileData?.avatar_url) {
          setAvatarUrl(profileData.avatar_url)
        }
      }
    }
    getInitialData()
  }, [])

  // Hàm xử lý bắt đầu Chat (Chủ động contact)
  const handleStartChat = async () => {
    if (!currentUser) return alert("Vui lòng đăng nhập để nhắn tin! ☕");

    // Tạo cuộc hội thoại (conversations) giữa Mình và người trong Profile
    // Sắp xếp ID để tránh trùng lặp cặp (A,B) và (B,A)
    const [u1, u2] = [currentUser.id, profileUser.id].sort();

    const { error } = await supabase
      .from('conversations')
      .upsert([{ user_1: u1, user_2: u2 }], { onConflict: 'user_1, user_2' });

    if (!error) {
      window.location.href = '/chat'; // Chuyển sang trang chat nét đứt
    } else {
      alert("Lỗi kết nối chat: " + error.message);
    }
  }

  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true)
      const file = event.target.files[0]
      if (!file) return
      
      const fileExt = file.name.split('.').pop()
      // Tạo tên file duy nhất để tránh bị cache trình duyệt
      const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // 1. Upload lên Storage
      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)
      if (uploadError) throw uploadError

      // 2. Lấy URL công khai
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      // 3. CẬP NHẬT VÀO BẢNG PROFILES (Để Navbar lấy được)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl } as any)
        .eq('id', currentUser.id)

      if (updateError) throw updateError

      // 4. Cập nhật State tại chỗ
      setAvatarUrl(publicUrl)

      // 5. PHÁT TÍN HIỆU CHO NAVBAR (Đồng bộ tức thì)
      window.dispatchEvent(new Event('storage'))
      
      alert('Cập nhật ảnh đại diện thành công! ✨')
    } catch (error: any) {
      console.error("Lỗi upload:", error.message)
      alert("Lỗi: " + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={fullPageBg}>
      <div style={profileCard}>
        
        {/* Banner Header */}
        <div style={{ height: '160px', background: COFFEE.gradient, position: 'relative' }}>
          <Link href="/" style={backBtn}>⬅ Quay lại trang chủ</Link>
          {profileUser?.id === ADMIN_ID && (
            <span style={adminBadge}>ADMIN MOKA ☕</span>
          )}
        </div>

        {/* Nội dung chính */}
        <div style={{ padding: '0 40px 40px', marginTop: '-60px', textAlign: 'center' }}>
          
          {/* Avatar Area */}
          <div style={avatarWrapper}>
            <div style={avatarCircle}>
              {avatarUrl ? (
                <img src={avatarUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '3rem', color: '#fff' }}>{profileUser?.email?.[0].toUpperCase()}</span>
              )}
            </div>
            
            <label htmlFor="avatar-up" style={cameraBtn} className="upload-btn">
              📷
              <input type="file" id="avatar-up" accept="image/*" onChange={uploadAvatar} disabled={uploading} style={{ display: 'none' }} />
            </label>
          </div>

          <h2 style={{ color: COFFEE.deep, margin: '10px 0 5px' }}>{profileUser?.email?.split('@')[0]}</h2>
          <p style={{ color: COFFEE.light, margin: '0 0 25px', fontSize: '0.9rem' }}>{profileUser?.email}</p>

          {/* Stats */}
          <div style={statsGrid}>
            <div style={statBox}>
              <b style={{ color: COFFEE.deep }}>12</b>
              <span style={{ fontSize: '0.7rem' }}>Truyện đã lưu</span>
            </div>
            <div style={statBox}>
              <b style={{ color: COFFEE.deep }}>45</b>
              <span style={{ fontSize: '0.7rem' }}>Bình luận</span>
            </div>
          </div>

          {/* Nút Nhắn Tin (Chủ động contact) */}
          <button 
            onClick={handleStartChat}
            style={chatActionBtn}
          >
            💬 {profileUser?.id === currentUser?.id ? "Nhắn tin " : "Bắt đầu trò chuyện"}
          </button>

          {/* Form chỉnh sửa (Chỉ hiện nếu là profile của chính mình) */}
          {profileUser?.id === currentUser?.id && (
            <div style={{ textAlign: 'left', marginTop: '20px' }}>
              <label style={labelStyle}>Tên hiển thị</label>
              <input style={inputStyle} defaultValue={profileUser?.email?.split('@')[0]} />
              
              <label style={labelStyle}>Giới thiệu bản thân</label>
              <textarea style={{ ...inputStyle, height: '80px', resize: 'none' }} placeholder="Viết gì đó thật chill..." />

              <button style={saveBtn}>Lưu thay đổi ✨</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .upload-btn:hover { transform: scale(1.1); transition: 0.2s; }
      `}</style>
    </div>
  )
}

// STYLES
const fullPageBg: any = { minHeight: '100vh', backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("/bg-coffee.png")`, backgroundSize: 'cover', backgroundAttachment: 'fixed', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'Quicksand' };
const profileCard: any = { width: '100%', maxWidth: '550px', background: COFFEE.cream, borderRadius: '30px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' };
const backBtn: any = { position: 'absolute', top: '20px', left: '20px', color: '#fff', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold', background: 'rgba(0,0,0,0.2)', padding: '5px 12px', borderRadius: '15px' };
const adminBadge: any = { position: 'absolute', top: '20px', right: '20px', background: '#FFD700', color: '#3E2723', padding: '5px 12px', borderRadius: '15px', fontSize: '0.7rem', fontWeight: '800' };
const avatarWrapper: any = { position: 'relative', width: '120px', height: '120px', margin: '0 auto 20px' };
const avatarCircle: any = { width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: COFFEE.medium, border: '5px solid #fff', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const cameraBtn: any = { position: 'absolute', bottom: '5px', right: '5px', background: '#fff', color: COFFEE.deep, width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' };
const statsGrid: any = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' };
const statBox: any = { background: 'rgba(255,255,255,0.5)', padding: '12px', borderRadius: '15px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.3)' };

const chatActionBtn: any = {
  width: '100%', padding: '15px', borderRadius: '15px', 
  border: `2px dashed ${COFFEE.deep}`, // VIỀN NÉT ĐỨT
  background: 'transparent', color: COFFEE.deep, 
  fontWeight: 'bold', cursor: 'pointer', transition: '0.3s',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
};

const saveBtn: any = { width: '100%', padding: '15px', borderRadius: '15px', border: 'none', background: COFFEE.deep, color: '#fff', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 20px rgba(62, 39, 35, 0.2)' };
const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: COFFEE.medium, marginBottom: '8px', marginLeft: '5px' };
const inputStyle = { width: '100%', padding: '12px 15px', borderRadius: '12px', border: `1px solid ${COFFEE.border}`, background: '#fff', marginBottom: '15px', outline: 'none', fontSize: '0.9rem', boxSizing: 'border-box' as any };