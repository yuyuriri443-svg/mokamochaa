import Navbar from '../components/Navbar'; 

export const metadata = {
  title: 'MOKAMOCHA - Đọc truyện cùng cà phê',
  description: 'Nền tảng đọc truyện và kết nối bạn bè',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" style={{ overflowX: 'hidden' }}>
      <body style={{ 
        margin: 0, 
        padding: 0,
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif", // Font chữ chuyên nghiệp hơn
        backgroundColor: '#FDF5E6', // Màu nền cafe nhạt toàn trang
        minHeight: '100vh',
        width: '100vw',
        overflowX: 'hidden', // CHỐNG BỂ: Cắt bỏ mọi thứ tràn ra bên phải
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        {/* Navbar cố định trên cùng */}
        <Navbar />
        
        {/* main bọc nội dung, giúp đẩy footer xuống đáy nếu trang ít nội dung */}
        <main style={{ 
          flex: 1, 
          width: '100%', 
          maxWidth: '100vw', 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          {children}
        </main>

        {/* CSS Global để xử lý các lỗi hiển thị mặc định của trình duyệt */}
        <style dangerouslySetInnerHTML={{ __html: `
          * { box-sizing: border-box; }
          body { -webkit-font-smoothing: antialiased; }
          img { max-width: 100%; height: auto; }
          /* Chống tràn cho thiết bị di động */
          html, body {
            max-width: 100%;
            overflow-x: hidden;
          }
        `}} />
      </body>
    </html>
  );
}