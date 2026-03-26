'use client'
import React, { useState, useEffect, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const COFFEE = {
  deep: '#3E2723',
  medium: '#5D4037',
  light: '#8D6E63',
  cream: 'rgba(253, 245, 230, 0.95)',
  border: 'rgba(93, 64, 55, 0.4)',
  glass: 'rgba(255, 255, 255, 0.7)',
}

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  const [selectedContact, setSelectedContact] = useState<any>(null)
  const [inputValue, setInputValue] = useState('')
  const [user, setUser] = useState<any>(null)
  const [onlineUsers, setOnlineUsers] = useState<any>({})
  const scrollRef = useRef<HTMLDivElement>(null)

  const isOnline = selectedContact?.id && onlineUsers[selectedContact.id]

  // 1. Lấy thông tin User & Khởi tạo danh sách Chat
  useEffect(() => {
    async function initData() {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        setUser(authUser)
        
        // Load danh sách contacts ngay sau khi có user
        const { data, error } = await supabase
          .from('conversations')
          .select('user_1, user_2')
          .or(`user_1.eq.${authUser.id},user_2.eq.${authUser.id}`)

        if (!error && data) {
          const chatList = await Promise.all(data.map(async (conv) => {
            const partnerId = conv.user_1 === authUser.id ? conv.user_2 : conv.user_1;
            const { data: pData } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', partnerId)
              .maybeSingle();

            return {
              id: partnerId,
              email: pData?.email || `Cà phê viên ${partnerId.slice(-4)}`,
              lastMsg: 'Nhấn để trò chuyện...'
            };
          }));
          setContacts(chatList);
        }
      }
    }
    initData()
  }, [])

  // 2. Load lịch sử chat khi chọn người dùng
  useEffect(() => {
    if (!user || !selectedContact) return;

    async function loadOldMessages() {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (!error && data) setMessages(data);
    }
    loadOldMessages();
  }, [user, selectedContact]);

  // 3. Realtime: Tin nhắn & Trạng thái Online
  useEffect(() => {
    if (!user) return;

    // Theo dõi tin nhắn mới
    const msgChannel = supabase
      .channel('messages_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        if (selectedContact && (
          (msg.sender_id === selectedContact.id && msg.receiver_id === user.id) ||
          (msg.sender_id === user.id && msg.receiver_id === selectedContact.id)
        )) {
          setMessages((prev) => [...prev, msg]);
        }
      })
      .subscribe();

    // Theo dõi Presence (Online)
    const presenceChannel = supabase.channel('online_users', { config: { presence: { key: user.id } } });
    presenceChannel
      .on('presence', { event: 'sync' }, () => setOnlineUsers(presenceChannel.presenceState()))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await presenceChannel.track({ online_at: new Date().toISOString() })
      });

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user, selectedContact]);

  // Tự động cuộn
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMsg = async () => {
    if (!inputValue.trim() || !user || !selectedContact) return
    const { error } = await supabase
      .from('messages')
      .insert([{ sender_id: user.id, receiver_id: selectedContact.id, content: inputValue }])

    if (!error) setInputValue('')
    else alert("Lỗi gửi: " + error.message)
  }

  return (
    <div style={fullPageBg}>
      <div style={glassMainContainer}>
        {/* SIDEBAR */}
        <aside style={sidebarStyle}>
          <div style={sidebarHeader}>
            <Link href="/" style={backLink}>⬅ Về trang chủ</Link>
            <h2 style={{ color: COFFEE.deep, margin: '15px 0', fontSize: '1.2rem', fontWeight: '800' }}>Menu Trò Chuyện</h2>
          </div>
          <div style={contactListStyle}>
            {contacts.length > 0 ? contacts.map(c => (
              <div 
                key={c.id} 
                onClick={() => setSelectedContact(c)}
                style={{ ...contactItem, background: selectedContact?.id === c.id ? 'rgba(93, 64, 55, 0.12)' : 'transparent', border: selectedContact?.id === c.id ? `1px dashed ${COFFEE.medium}` : '1px solid transparent' }}
              >
                <div style={avatarCircle}>{c.email[0].toUpperCase()}</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: '700', color: COFFEE.deep, fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden' }}>{c.email}</div>
                  <div style={{ fontSize: '0.7rem', color: COFFEE.light }}>{c.id === user?.id ? "Ghi chú cho mình ✨" : "Nhấn để chat..."}</div>
                </div>
              </div>
            )) : <div style={emptySidebar}>Bạn chưa có ai để chat. <br/> Hãy ghé Profile ai đó nhé! ☕</div>}
          </div>
        </aside>

        {/* MAIN CHAT */}
        <main style={chatAreaContainer}>
          {selectedContact ? (
            <div style={chatMessagesWrapper}>
              <header style={chatHeaderStyle}>
                <div style={avatarCircleSmall}>{selectedContact.email[0]}</div>
                <div>
                  <b style={{ color: COFFEE.deep, fontSize: '0.95rem' }}>{selectedContact.email}</b>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isOnline ? '#4CAF50' : '#BBB' }} />
                    <span style={{ fontSize: '0.65rem', color: isOnline ? '#4CAF50' : '#999' }}>{isOnline ? 'Đang pha cafe' : 'Đã rời quán'}</span>
                  </div>
                </div>
              </header>

              <div style={messageDisplayArea}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.sender_id === user?.id ? 'flex-end' : 'flex-start', marginBottom: '15px' }}>
                    <div style={m.sender_id === user?.id ? myBubble : otherBubble}>{m.content}</div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>

              <footer style={inputAreaStyle}>
                <button style={iconBtn}>📎</button>
                <input 
                  style={mainInput} 
                  placeholder="Gửi một lời nhắn ấm áp..." 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                />
                <button onClick={sendMsg} style={sendBtnStyle}>Gửi ✨</button>
              </footer>
            </div>
          ) : (
            <div style={emptyStateStyle}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '4rem' }}>☕</span>
                <h2 style={{ color: COFFEE.medium, marginTop: '10px' }}>Chọn một tách cafe để bắt đầu...</h2>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        body { font-family: 'Quicksand', sans-serif; margin: 0; background: #F5F5F5; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${COFFEE.light}; border-radius: 10px; }
      `}</style>
    </div>
  )
}

// STYLES (Giữ nguyên phong cách của bạn)
const fullPageBg: any = { height: '100vh', backgroundImage: `url("/bg-coffee.png")`, backgroundSize: 'cover', display: 'flex', alignItems: 'center', justifyContent: 'center' }
const glassMainContainer: any = { width: '1100px', height: '85vh', background: COFFEE.glass, backdropFilter: 'blur(25px)', borderRadius: '40px', display: 'flex', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }
const sidebarStyle: any = { width: '300px', borderRight: `1px dashed ${COFFEE.border}`, display: 'flex', flexDirection: 'column' }
const sidebarHeader: any = { padding: '30px 20px', textAlign: 'center' }
const contactListStyle: any = { flex: 1, overflowY: 'auto', padding: '0 15px' }
const contactItem: any = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 15px', borderRadius: '18px', cursor: 'pointer', marginBottom: '8px', transition: '0.2s' }
const avatarCircle: any = { width: '40px', height: '40px', borderRadius: '50%', background: COFFEE.medium, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }
const chatAreaContainer: any = { flex: 1, padding: '25px', display: 'flex' }
const chatMessagesWrapper: any = { flex: 1, background: 'rgba(255, 255, 255, 0.6)', borderRadius: '30px', border: `2px dashed ${COFFEE.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }
const chatHeaderStyle: any = { padding: '15px 25px', background: 'rgba(255,255,255,0.8)', borderBottom: `1px dashed ${COFFEE.border}`, display: 'flex', alignItems: 'center', gap: '12px' }
const avatarCircleSmall: any = { ...avatarCircle, width: '35px', height: '35px', fontSize: '0.8rem' }
const messageDisplayArea: any = { flex: 1, padding: '25px', overflowY: 'auto' }
const myBubble: any = { background: COFFEE.deep, color: '#fff', padding: '10px 18px', borderRadius: '20px 20px 4px 20px', maxWidth: '75%', fontSize: '0.9rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }
const otherBubble: any = { background: '#fff', color: COFFEE.deep, padding: '10px 18px', borderRadius: '20px 20px 20px 4px', maxWidth: '75%', fontSize: '0.9rem', border: `1px solid ${COFFEE.border}` }
const inputAreaStyle: any = { padding: '15px 20px', background: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }
const mainInput: any = { flex: 1, padding: '12px 20px', borderRadius: '20px', border: `1px solid ${COFFEE.border}`, outline: 'none', fontSize: '0.9rem' }
const sendBtnStyle: any = { background: COFFEE.deep, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }
const iconBtn: any = { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', opacity: 0.6 }
const emptyStateStyle: any = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const emptySidebar: any = { textAlign: 'center', padding: '40px 20px', color: COFFEE.light, fontSize: '0.8rem', lineHeight: 1.6 }
const backLink: any = { fontSize: '0.75rem', color: COFFEE.light, textDecoration: 'none', fontWeight: 'bold' }