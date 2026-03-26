import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Kiểm tra nếu đã có instance rồi thì dùng lại, không tạo mới
let supabase: ReturnType<typeof createClient>;

if (typeof window !== 'undefined') {
  // Client-side: Tránh tạo nhiều instance trong trình duyệt
  if (!(window as any).supabaseInstance) {
    (window as any).supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }
  supabase = (window as any).supabaseInstance;
} else {
  // Server-side
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };