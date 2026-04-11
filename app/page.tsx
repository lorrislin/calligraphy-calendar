import { createClient } from '@supabase/supabase-js';

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
            <div key={comp.id} style={{
              background: 'var(--card-bg)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.05)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
            }}
            >
              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>{comp.title}</h3>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <span>📍 {comp.location}</span>
                  <span>📅 截止: {comp.deadline}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
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
                  {comp.start_date}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
