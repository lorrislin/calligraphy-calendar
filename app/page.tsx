import { createClient } from '@supabase/supabase-js';
import React from 'react';

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

  const groupedCompetitions: Record<string, any[]> = {};
  competitions.forEach(comp => {
    let yearMonth = '日期未定';
    if (comp.start_date) {
       const dateObj = new Date(comp.start_date);
       if (!isNaN(dateObj.getTime())) {
          yearMonth = `${dateObj.getFullYear()} 年 ${dateObj.getMonth() + 1} 月`;
       }
    }
    if (!groupedCompetitions[yearMonth]) groupedCompetitions[yearMonth] = [];
    groupedCompetitions[yearMonth].push(comp);
  });

  const getDayAndWeekday = (dateStr: string) => {
     if (!dateStr) return { day: '--', weekday: '' };
     const d = new Date(dateStr);
     if (isNaN(d.getTime())) return { day: '--', weekday: '' };
     const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
     return { day: d.getDate(), weekday: `(${weekdays[d.getDay()]})` };
  };

  const renderLocation = (loc: string) => {
    if (!loc || loc === '依簡章' || loc === '請參閱簡章' || loc === '依簡章公告') return '依簡章';
    
    // 1. Handle potential Semicolon (Salianbao example: "Address; extra info")
    let target = loc.split(/[；;]/)[0].trim();
    
    // 2. Extract Prefix (like "送件：")
    let prefix = "";
    const prefixMatch = target.match(/^(.*?[：:])\s*(.*)$/);
    if (prefixMatch) {
      prefix = prefixMatch[1];
      target = prefixMatch[2].trim();
    }

    // 3. Handle Parentheses (花蓮縣立體育館 (Address) )
    const parenParts = target.split(/[（(]/);
    target = parenParts[0].trim();

    // 4. Handle Space between Address and Entity (台中市...99號 大墩文化局)
    // We look for parts after the final "number/floor" pattern if there is a space
    const spaceParts = target.split(/\s+/);
    if (spaceParts.length > 1) {
      // If there's a space, the last part is usually the Name
      target = spaceParts[spaceParts.length - 1];
    }
    
    const displayName = `${prefix}${target}`;
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
    
    return (
      <a 
        href={mapUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="location-link"
        style={{ 
          color: 'inherit', 
          textDecoration: 'underline', 
          textDecorationColor: '#d1d5db',
          textUnderlineOffset: '3px'
        }}
      >
        {displayName}
      </a>
    );
  };

  const now = new Date();
  now.setHours(0,0,0,0);
  const todayMs = now.getTime();

  const todayStr = new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei'
  }).format(new Date()).replace(/\//g, '-');

  let firstFutureCompId: number | string | null = null;
  for (const comp of competitions) {
    if (comp.start_date) {
      const d = new Date(comp.start_date).getTime();
      if (d >= todayMs) {
        firstFutureCompId = comp.id;
        break;
      }
    }
  }

  return (
    <div className="container" style={{ padding: '24px' }}>

      {/* Filters (Minimal Modern UI) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'flex-end', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', color: '#888', marginRight: '4px' }}>分類篩選：</span>
        <button style={{ padding: '6px 14px', fontSize: '0.9rem', borderRadius: '4px', border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}>全部</button>
        <button style={{ padding: '6px 14px', fontSize: '0.9rem', borderRadius: '4px', border: '1px solid #eee', background: 'transparent', color: '#666', cursor: 'pointer' }}>全國賽</button>
        <button style={{ padding: '6px 14px', fontSize: '0.9rem', borderRadius: '4px', border: '1px solid #eee', background: 'transparent', color: '#666', cursor: 'pointer' }}>區域賽</button>
      </div>

      {/* List Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {Object.keys(groupedCompetitions).length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>尚無可顯示的比賽</p>
        ) : (
          Object.entries(groupedCompetitions).map(([monthYear, comps]) => (
            <div key={monthYear} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h2 style={{ 
                fontSize: '1.25rem', 
                color: '#333', 
                borderLeft: '5px solid #333', 
                paddingLeft: '12px', 
                marginBottom: '4px',
                marginTop: '12px',
                fontWeight: 'bold'
              }}>
                {monthYear}
              </h2>
              {comps.map((comp) => {
                const { day, weekday } = getDayAndWeekday(comp.start_date);
                
                // Dynamic styling for category
                const isNational = comp.category === 'national';
                const isRegional = comp.category === 'regional';
                const themeColor = isNational ? '#1a5b74' : isRegional ? '#d35400' : '#27ae60';
                
                const isPast = comp.start_date ? new Date(comp.start_date).getTime() < todayMs : false;

                return (
                  <React.Fragment key={comp.id}>
                    {comp.id === firstFutureCompId && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        margin: '12px 0 8px 0', 
                        color: '#c0392b', 
                        fontWeight: 'bold',
                        fontSize: '0.95rem' 
                      }}>
                        <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(to right, transparent, #c0392b)' }}></div>
                        <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>⏳</span>
                          <span style={{ letterSpacing: '0.05em' }}>今日 ({todayStr})</span>
                          <span>⏳</span>
                        </div>
                        <div style={{ flex: 1, height: '1.5px', background: 'linear-gradient(to left, transparent, #c0392b)' }}></div>
                      </div>
                    )}
                    <div className="competition-card" style={{
                      background: '#fff',
                      borderRadius: '8px',
                      padding: '14px 18px',
                      borderLeft: `5px solid ${themeColor}`,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      opacity: isPast ? 0.6 : 1,
                      filter: isPast ? 'grayscale(100%)' : 'none',
                    }}
                    >
                    {/* Calendar Block */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '55px' }}>
                      <span style={{ fontSize: '1.7rem', fontWeight: 'bold', color: '#111', lineHeight: 1 }}>
                        {day}
                      </span>
                      <span style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px', fontWeight: '500' }}>
                        {weekday}
                      </span>
                    </div>

                    {/* Content Block */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {/* Title & Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.15rem', color: '#000', margin: 0, fontWeight: 'bold', lineHeight: 1.35 }}>
                          {comp.title}
                        </h3>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          background: themeColor,
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: '500',
                          whiteSpace: 'nowrap'
                        }}>
                          {isNational ? '全國賽' : isRegional ? '區域賽' : '一般展賽'}
                        </span>
                      </div>
                      
                      {/* Details Row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.85rem', color: '#444', lineHeight: 1.4 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#cf9840', fontSize: '1rem' }}>📅</span>
                          <b>比賽:</b> {comp.start_date ? comp.start_date : '依簡章'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#d35400', fontSize: '1rem' }}>⏰</span>
                          <b>截止:</b> {comp.deadline ? comp.deadline : '依簡章'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#c0392b', fontSize: '1rem' }}>📍</span>
                          {renderLocation(comp.location)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#34495e', fontSize: '1rem' }}>👥</span>
                          {comp.age_group ? comp.age_group : '詳見簡章'}
                        </span>

                        {comp.url && comp.url !== '#' && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                            <a href={comp.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0056b3', fontWeight: 'bold', textDecoration: 'underline', fontSize: '0.9rem' }}>
                              🔗 官方連結
                            </a>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  </React.Fragment>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
