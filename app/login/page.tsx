'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    if (isRegister) {
      // ĐĂNG KÝ: Supabase sẽ gửi mã OTP về mail
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
      })
      if (error) alert('Lỗi đăng ký: ' + error.message)
      else {
        alert('Mokamocha đã gửi mã xác nhận vào Email của bạn!')
        router.push(`/verify?email=${email}`) 
      }
    } else {
      // ĐĂNG NHẬP: Dùng Email + Password
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) alert('Sai email hoặc mật khẩu rồi nè!')
      else router.push('/')
    }
    setLoading(false)
  }

  return (
    <div style={{ backgroundColor: '#FDFCF0', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h2 style={{ color: '#2C3E50', fontSize: '1.8rem', margin: '0 0 10px 0' }}>
            {isRegister ? 'Gia nhập Mokamocha' : 'Mokamocha chào bạn! ☕'}
            </h2>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>Tiệm sách nhỏ đang đợi bạn</p>
        </div>

        <form onSubmit={handleAuth}>
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Email</label>
            <input type="email" placeholder="ban-la-ai@gmail.com" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          </div>
          <div style={{ marginBottom: '25px' }}>
            <label style={labelStyle}>Mật khẩu</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} required />
          </div>
          
          <button type="submit" disabled={loading} style={btnMainStyle}>
            {loading ? 'Đang xử lý...' : (isRegister ? 'Gửi mã xác nhận' : 'Đăng nhập ngay')}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '0.9rem', color: '#666' }}>
          {isRegister ? 'Bạn đã có tài khoản?' : 'Bạn là thành viên mới?'} 
          <span onClick={() => setIsRegister(!isRegister)} style={{ color: '#B08968', cursor: 'pointer', fontWeight: 'bold', marginLeft: '5px', textDecoration: 'underline' }}>
            {isRegister ? 'Đăng nhập' : 'Đăng ký tài khoản'}
          </span>
        </p>
      </div>
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#555', marginBottom: '5px' }
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', boxSizing: 'border-box' as const, fontSize: '1rem' }
const btnMainStyle = { width: '100%', padding: '14px', background: '#B08968', color: '#fff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' as const, fontSize: '1rem' }
