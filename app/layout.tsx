import './globals.css';
import React from 'react';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: 'MokaMocha Chat',
  description: 'Ứng dụng chat của tôi',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="antialiased overflow-x-hidden min-h-screen bg-[#FFF9F5]">
        <main className="w-full max-w-full overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}