import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center py-6 px-4 border-b border-[#B08968]/20">
      <Link href="/">
        <h1 className="text-2xl font-playfair font-bold tracking-tight hover:opacity-80 transition-opacity">
          Mokamocha <span className="text-sm font-normal">☕</span>
        </h1>
      </Link>

      <div className="flex items-center gap-6 font-medium">
        <Link href="/books" className="hover:text-[#B08968]">Sách</Link>
        <Link href="/chat" className="hover:text-[#B08968]">Tám chuyện</Link>
        
        {/* Icon chuông thông báo */}
        <button className="relative p-1 hover:bg-[#B08968]/10 rounded-full transition-colors">
          <span className="text-xl">🔔</span>
          {/* Chấm đỏ thông báo Realtime (sẽ logic sau) */}
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* Nút đăng nhập/Avatar sẽ thêm ở đây sau */}
      </div>
    </nav>
  );
}
