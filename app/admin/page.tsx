'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function AdminDashboard() {
  const [books, setBooks] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [notiText, setNotiText] = useState('')
  const [bookForm, setBookForm] = useState({ 
    title: '', author: '', cover_url: '', file_url: '', review: '', tags: '' 
  })

  // Chỉ lấy dữ liệu, không check quyền nữa
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: b } = await supabase.from('books').select('*').order('created_at', { ascending: false })
    const { data: c } = await supabase.from('comments').select('*').order('created_at', { ascending: false })
    if (b) setBooks(b)
    if (c) setComments(c)
  }

  const handleAddBook = async (e: any) => {
    e.preventDefault()
    const { error } = await supabase.from('books').insert([bookForm])
    if (error) alert(error.message)
    else {
      alert('Đã lên kệ sách mới! 📚')
      setBookForm({ title: '', author: '', cover_url: '', file_url: '', review: '', tags: '' })
      fetchData()
    }
  }

  const handleUpdateNoti = async () => {
    const { error } = await supabase.from('announcements').insert([{ content: notiText }])
    if (error) alert(error.message)
    else {
      alert('Đã cập nhật bảng tin! 📢')
      setNotiText('')
    }
  }

  const deleteComment = async (id: string) => {
    if (confirm('Xóa bình luận này?')) {
      await supabase.from('comments').delete().eq('id', id)
      fetchData()
    }
  }

  return (
    <div style={{ padding: '40px', backgroundColor: '#FDFCF0', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#2C3E50', marginBottom: '10px' }}>Quản trị Mokamocha ☕</h1>
      <p style={{ textAlign: 'center', color: '#888', marginBottom: '30px' }}>Chế độ tự do - Không cần đăng nhập Admin</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* CỘT 1: THÊM SÁCH & THÔNG BÁO */}
        <div>
          <section style={sectionStyle}>
            <h3>📚 Thêm sách mới</h3>
            <form onSubmit={handleAddBook} style={formStyle}>
              <input placeholder="Tên sách" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} style={inputStyle} required />
              <input placeholder="Tác giả" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} style={inputStyle} required />
              <input placeholder="Link ảnh bìa (URL)" value={bookForm.cover_url} onChange={e => setBookForm({...bookForm, cover_url: e.target.value})} style={inputStyle} required />
              <input placeholder="Link file EPUB (.epub)" value={bookForm.file_url} onChange={e => setBookForm({...bookForm, file_url: e.target.value})} style={inputStyle} />
              <input placeholder="Tags (Ví dụ: Kinh dị, Trinh thám)" value={bookForm.tags} onChange={e => setBookForm({...bookForm, tags: e.target.value})} style={inputStyle} />
              <textarea placeholder="Review nội dung..." value={bookForm.review} onChange={e => setBookForm({...bookForm, review: e.target.value})} style={{...inputStyle, height: '80px'}} />
              <button type="submit" style={btnStyle}>Đăng sách</button>
            </form>
          </section>

          <section style={{...sectionStyle, marginTop: '20px'}}>
            <h3>📢 Đăng thông báo mới</h3>
            <textarea placeholder="Nội dung thông báo..." value={notiText} onChange={e => setNotiText(e.target.value)} style={{...inputStyle, height: '80px'}} />
            <button onClick={handleUpdateNoti} style={{...btnStyle, background: '#F59E0B'}}>Cập nhật bảng tin</button>
          </section>
        </div>

        {/* CỘT 2: QUẢN LÝ BÌNH LUẬN & SÁCH */}
        <div>
          <section style={sectionStyle}>
            <h3>💬 Quản lý bình luận</h3>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {comments.length === 0 && <p style={{color: '#999'}}>Chưa có bình luận nào.</p>}
              {comments.map(c => (
                <div key={c.id} style={itemStyle}>
                  <p style={{ margin: 0, fontSize: '0.8rem' }}><strong>{c.user_email}:</strong> {c.content}</p>
                  <button onClick={() => deleteComment(c.id)} style={delBtnStyle}>Xóa</button>
                </div>
              ))}
            </div>
          </section>

          <section style={{...sectionStyle, marginTop: '20px'}}>
            <h3>📖 Sách đang có</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {books.map(b => (
                <div key={b.id} style={itemStyle}>
                  <span style={{fontSize: '0.9rem'}}>{b.title}</span>
                  <button onClick={async () => { if(confirm('Gỡ sách?')) { await supabase.from('books').delete().eq('id', b.id); fetchData(); } }} style={delBtnStyle}>Gỡ</button>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  )
}

const sectionStyle = { background: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }
const formStyle = { display: 'flex', flexDirection: 'column' as const, gap: '10px' }
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.9rem' }
const btnStyle = { padding: '12px', background: '#B08968', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' as const }
const itemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }
const delBtnStyle = { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.7rem' }
