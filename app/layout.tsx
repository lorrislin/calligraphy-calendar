import './globals.css';

export const metadata = {
  title: '陶墨書法 | 全國書法比賽行事曆',
  description: '提供最新鮮的書法比賽資訊，隨時掌握全台灣書法比賽的報名與展覽時間。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body>
        <header style={{ padding: '40px 0', borderBottom: '1px solid var(--border-color)', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>陶墨書法</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
            2026 全國書法比賽行事曆
          </p>
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
