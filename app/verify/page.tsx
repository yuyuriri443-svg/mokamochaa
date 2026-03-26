'use client'
import { useState, Suspense } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, useSearchParams } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Thành phần chính xử lý nhập mã
function VerifyForm() {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') // Lấy email từ link: /verify?email=abc@gmail.com

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return alert('Không tìm thấy email xác thực!')
    
    setLoading(true)
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup' // Xác thực cho người mới đăng ký
    })

    if (error) {
      alert('Mã xác nhận không đúng hoặc đã hết hạn!')
    } else {
      alert('Xác thực thành công! Chào mừng bạn đến với Mokamocha ☕')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
      <h2 style={{ color: '#2C3E50', marginBottom: '10px' }}>Xác thực Email ✉️</h2>
      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '25px' }}>
        Mã 6 số đã được gửi đến:<br/><strong>{email || 'Email của bạn'}</strong>
      </p>

      <form onSubmit={handleVerify}>
        <input 
          type="text" 
          placeholder="000000" 
          maxLength={6}
          value={token} 
          onChange={e => setToken(e.target.value)} 
          style={{ 
            width: '100%', padding: '15px', fontSize: '1.8rem', textAlign: 'center', 
            letterSpacing: '8px', borderRadius: '12px', border: '2px solid #B08968', 
            marginBottom: '25px', outline: 'none' 
          }} 
          required 
        />
        <button type="submit" disabled={loading} style={{ 
          width: '100%', padding: '14px', background: '#B08968', color: '#fff', 
          border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' 
        }}>
          {loading ? 'Đang kiểm tra...' : 'Xác thực ngay'}
        </button>
      </form>
      
      <p style={{ marginTop: '20px', fontSize: '0.85rem', color: '#999' }}>
        Không nhận được mã? Kiểm tra hòm thư Spam nhé!
      </p>
    </div>
  )
}

// Bọc trong Suspense để tránh lỗi Build trên Vercel
export default function VerifyPage() {
  return (
    <div style={{ backgroundColor: '#FDFCF0', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      <Suspense fallback={<p>Đang tải...</p>}>
        <VerifyForm />
      </Suspense>
    </div>
  )
}
