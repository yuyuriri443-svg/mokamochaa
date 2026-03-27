'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function BookDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [book, setBook] = useState<any>(null)

  useEffect(() => {
    const fetchBook = async () => {
      const { data } = await supabase.from('books').select('*').eq('id', id).single()
      if (data) setBook(data)
    }
    if (id) fetchBook()
  }, [id])

  if (!book) return (
    <div style={{ backgroundColor: '#F5EFE6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "serif", fontStyle: 'italic' }}>
      Đang chuẩn bị trà và lật giở từng trang...
    </div>
  )

  const styles = {
    container: { backgroundColor: '#F5EFE6', minHeight: '100vh', padding: '40px 20px', fontFamily: "'Lora', serif", color: '#4A3F35' },
    contentWrapper: { maxWidth: '1000px', margin: '0 auto' },
    backBtn: { background: 'none', border: 'none', color: '#B08968', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'inherit' },
    mainBox: { 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
      gap: '50px', 
      backgroundColor: '#FFFBF5', 
      padding: '40px', 
      borderRadius: '8px', 
      border: '1px solid #E8DFD0', 
      boxShadow: '0 20px 40px rgba(0,0,0,0.05)' 
    },
    coverImg: { 
      width: '100%', 
      borderRadius: '4px', 
      boxShadow: '10px 10px 30px rgba(0,0,0,0.15)', 
      border: '5px solid white' 
    },
    title: { fontFamily: "'Playfair Display', serif", fontSize: '3rem', margin: '0 0 10px 0', lineHeight: '1.1' },
    author: { fontSize: '1.4rem', fontStyle: 'italic', color: '#B08968', marginBottom: '25px' },
    divider: { height: '1px', backgroundColor: '#E8DFD0', margin: '20px 0' },
    desc: { lineHeight: '1.8', fontSize: '1.1rem', textAlign: 'justify' as const, marginBottom: '40px', opacity: 0.9 },
    btnGroup: { display: 'flex', gap: '15px', flexWrap: 'wrap' as const },
    readBtn: { 
      backgroundColor: '#B08968', 
      color: 'white', 
      padding: '15px 35px', 
      borderRadius: '4px', 
      textDecoration: 'none', 
      fontWeight: 'bold', 
      fontSize: '1rem',
      boxShadow: '0 5px 0 #8E6D50',
      display: 'inline-block',
      transition: '0.1s transform, 0.1s box-shadow'
    },
    downloadBtn: { 
      border: '2px solid #4A3F35', 
      color: '#4A3F35', 
      padding: '13px 30px', 
      borderRadius: '4px', 
      textDecoration: 'none', 
      fontWeight: 'bold',
      fontSize: '1rem',
      display: 'inline-block'
    }
  }

  return (
    <div style={styles.container}>
      {/* Thêm font thủ công vào đây để chắc chắn không lỗi font */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@700&display=swap');
      `}} />
      
      <div style={styles.contentWrapper}>
        <button onClick={() => router.back()} style={styles.backBtn}>
          ← QUAY LẠI KỆ SÁCH
        </button>

        <div style={styles.mainBox}>
          <div>
            <img src={book.cover_url} alt={book.title} style={styles.coverImg} />
          </div>

          <div>
            <h1 style={styles.title}>{book.title}</h1>
            <p style={styles.author}>{book.author}</p>
            <div style={styles.divider}></div>
            <div style={styles.desc}>
              {book.description || "Cuốn sách này hiện chưa có lời tựa, nhưng chắc chắn là một hành trình thú vị đang chờ bạn khám phá tại Mokamocha."}
            </div>

            <div style={styles.btnGroup}>
              <Link href={`/reader/${book.id}`} style={{ textDecoration: 'none' }}>
                <span 
                  style={styles.readBtn}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = 'translateY(4px)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 5px 0 #8E6D50';
                  }}
                >
                  ĐỌC ONLINE NGAY
                </span>
              </Link>

              <a href={book.epub_url} style={styles.downloadBtn} target="_blank" rel="noreferrer">
                TẢI FILE EPUB
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
