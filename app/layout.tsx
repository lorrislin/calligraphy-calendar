import './globals.css';
import { createClient } from '@supabase/supabase-js';

export const metadata = {
  title: '陶墨書法 | 全國書法比賽行事曆',
  description: '提供最新鮮的書法比賽資訊，隨時掌握全台灣書法比賽的報名與展覽時間。',
};

// 確保即時反映最後更新日期
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. 抓取資料庫最新異動時間
  let dbLastUpdateStr = null;
  if (supabase) {
    const { data } = await supabase
      .from('competitions')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data) dbLastUpdateStr = data.created_at;
  }

  // 2. 取部屬時間與資料庫時間中的最新者
  const buildTime = new Date(process.env.NEXT_PUBLIC_BUILD_TIME || 0);
  const dbTime = new Date(dbLastUpdateStr || 0);
  const lastUpdatedDate = new Date(Math.max(buildTime.getTime(), dbTime.getTime()));

  // 3. 完美格式化 (YYYY-MM-DD HH:mm)
  const formatter = new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'Asia/Taipei'
  });
  const lastUpdatedStr = formatter.format(lastUpdatedDate).replace(/\//g, '-');

  return (
    <html lang="zh-TW">
      <body>
        <header style={{ padding: '24px 0 16px', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '4px', color: '#111' }}>陶墨書法</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', letterSpacing: '0.1em', margin: 0 }}>
            2026 全國書法比賽行事曆
          </p>
          <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#7f8c8d' }}>
            最後更新：{lastUpdatedStr}
          </div>
        </header>
        <main>
          {children}
        </main>
        <footer style={{ padding: '60px 0', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <p>© {new Date().getFullYear()} 陶墨書法. All Rights Reserved.</p>
        </footer>
      </body>
    </html>
  );
}
