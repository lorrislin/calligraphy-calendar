import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// Setup Supabase Client (Will work once user adds SUPERBASE_URL and SUPABASE_ANON_KEY to Vercel env)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Mock data as fallback for UI design
const mockData = [
  {
    id: 1,
    title: '第十五屆 新竹市全國書法比賽',
    category: 'national',
    start_date: '2026-05-15',
    location: '新竹市文化局',
    deadline: '2026-04-30',
    fee: '免費',
    url: '#',
    age_group: '國小/國中',
    status: 'approved'
  },
  {
    id: 2,
    title: '桃竹苗區 青年書法聯展',
    category: 'regional',
    start_date: '2026-06-20',
    location: '桃園市立美術館',
    deadline: '2026-05-15',
    fee: 'NT$ 200',
    url: '#',
    age_group: '社會組',
    status: 'approved'
  }
];

export default async function Home() {
  let competitions = mockData;

  if (supabase) {
    const { data, error } = await supabase
      .from('competitions')
      .select('*')
      .eq('status', 'approved')
      .order('start_date', { ascending: true });

    if (data && !error) {
      competitions = data;
    }
  }

  return (
    <div className="container" style={{ padding: '60px 24px' }}>

      {/* Filters (Mock UI) */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '40px', justifyContent: 'center' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', padding: '8px 0' }}>篩選: </span>
        <button style={{ padding: '8px 24px', borderRadius: '30px', border: '1px solid var(--text-primary)', background: 'var(--text-primary)', color: '#fff' }}>全部</button>
        <button style={{ padding: '8px 24px', borderRadius: '30px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>全國賽</button>
        <button style={{ padding: '8px 24px', borderRadius: '30px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>區域賽</button>
      </div>

      {/* List Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {competitions.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>尚無可顯示的比賽</p>
        ) : (
          competitions.map((comp) => (
            <div key={comp.id} className="competition-card" style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            >
              <div style={{ flex: 1, paddingRight: '16px' }}>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '14px', color: 'var(--text-primary)' }}>
                  {comp.title}
                </h3>
                
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 24px', fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--accent-gold)' }}>📅</span>
                    比賽日：{comp.start_date ? comp.start_date : '依簡章公告'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#d35400' }}>⏰</span>
                    收件截止：{comp.deadline ? comp.deadline : '依簡章公告'}
                  </span>
                  
                  {/* 強制換行 */}
                  <div style={{ flexBasis: '100%', height: 0 }}></div>

                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#34495e' }}>📍</span>
                    地點：{comp.location ? comp.location : '依簡章公告'}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#16a085' }}>👥</span>
                    對象：{comp.age_group ? comp.age_group : '詳見簡章'}
                  </span>

                  {comp.url && comp.url !== '#' && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px' }}>
                      <a href={comp.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0056b3', fontWeight: 'bold', textDecoration: 'underline' }}>
                        🔗 官方連結
                      </a>
                    </span>
                  )}
                </div>
              </div>
              
              <div style={{ textAlign: 'right', minWidth: '90px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  background: 'var(--bg-color)',
                  color: 'var(--accent-gold)',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  letterSpacing: '0.05em'
                }}>
                  {comp.category === 'national' ? '全國賽' : comp.category === 'regional' ? '區域賽' : '一般展賽'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
