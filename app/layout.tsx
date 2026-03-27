import Navbar from '../components/Navbar'; // Nếu file Navbar nằm trong thư mục components
// import Navbar from './components/Navbar'; // Thử dòng này nếu dòng trên lỗi

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
    <html lang="vi">
      <body style={{ margin: 0, fontFamily: 'sans-serif' }}>
        {/* Navbar sẽ hiện ở mọi trang */}
        <Navbar />
        
        {/* Nội dung của từng trang (Home, Book, Profile...) sẽ hiện ở đây */}
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}