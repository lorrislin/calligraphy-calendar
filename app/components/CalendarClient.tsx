'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, MapPin, Calendar, Clock, Users, ExternalLink } from 'lucide-react';

interface Competition {
  id: string | number;
  title: string;
  category: string;
  start_date: string;
  deadline: string;
  location: string;
  age_group: string;
  url: string;
  status: string;
}

interface CalendarClientProps {
  initialCompetitions: Competition[];
  todayStr: string;
  todayMs: number;
}

export default function CalendarClient({ initialCompetitions, todayStr, todayMs }: CalendarClientProps) {
  const [showPastClearly, setShowPastClearly] = useState(false);

  const getDayAndWeekday = (dateStr: string) => {
    if (!dateStr) return { day: '--', weekday: '' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { day: '--', weekday: '' };
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return { day: d.getDate(), weekday: `(${weekdays[d.getDay()]})` };
  };

  const renderLocation = (loc: string) => {
    if (!loc || loc === '依簡章' || loc === '請參閱簡章' || loc === '依簡章公告') return '依簡章';
    
    let target = loc.split(/[；;]/)[0].trim();
    let prefix = "";
    const prefixMatch = target.match(/^(.*?[：:])\s*(.*)$/);
    if (prefixMatch) {
      prefix = prefixMatch[1];
      target = prefixMatch[2].trim();
    }

    const parenParts = target.split(/[（(]/);
    target = parenParts[0].trim();

    const spaceParts = target.split(/\s+/);
    if (spaceParts.length > 1) {
      target = spaceParts[spaceParts.length - 1];
    }
    
    const displayName = `${prefix}${target}`;
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
    
    return (
      <a 
        href={mapUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
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

  const groupedCompetitions: Record<string, any[]> = {};
  initialCompetitions.forEach(comp => {
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

  let firstFutureCompId: number | string | null = null;
  for (const comp of initialCompetitions) {
    if (comp.start_date) {
      const d = new Date(comp.start_date).getTime();
      if (d >= todayMs) {
        firstFutureCompId = comp.id;
        break;
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Dynamic Header with Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        alignItems: 'center', 
        marginBottom: '4px' 
      }}>
        <button 
          onClick={() => setShowPastClearly(!showPastClearly)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '20px',
            background: showPastClearly ? '#1a5b74' : '#fff',
            color: showPastClearly ? '#fff' : '#666',
            border: '1px solid',
            borderColor: showPastClearly ? '#1a5b74' : '#eee',
            fontSize: '0.9rem',
            fontWeight: '500',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease'
          }}
        >
          {showPastClearly ? <Eye size={16} /> : <EyeOff size={16} />}
          <span>{showPastClearly ? '已恢復過期賽事亮度' : '目前已淡化過期賽事'}</span>
        </button>
      </div>

      {/* List Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {Object.keys(groupedCompetitions).length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: '1.1rem', color: '#888' }}>尚無可顯示的比賽</p>
        ) : (
          Object.entries(groupedCompetitions).map(([monthYear, comps]) => (
            <div key={monthYear} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                const isNational = comp.category === 'national';
                const isRegional = comp.category === 'regional';
                const themeColor = isNational ? '#1a5b74' : isRegional ? '#d35400' : '#27ae60';
                const isPast = comp.start_date ? new Date(comp.start_date).getTime() < todayMs : false;

                // Determine styling based on toggle
                const displayOpacity = isPast && !showPastClearly ? 0.5 : 1;
                const displayFilter = isPast && !showPastClearly ? 'grayscale(100%)' : 'none';

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
                          <Clock size={16} />
                          <span style={{ letterSpacing: '0.05em' }}>今日 ({todayStr})</span>
                          <Clock size={16} />
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
                      opacity: displayOpacity,
                      filter: displayFilter,
                      transition: 'all 0.4s ease' // Smooth transition for toggle
                    }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '55px' }}>
                        <span style={{ fontSize: '1.7rem', fontWeight: 'bold', color: '#111', lineHeight: 1 }}>
                          {day}
                        </span>
                        <span style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px', fontWeight: '500' }}>
                          {weekday}
                        </span>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                        
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', fontSize: '0.85rem', color: '#444', lineHeight: 1.4 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={14} color="#cf9840" />
                            <b>比賽:</b> {comp.start_date ? comp.start_date : '依簡章'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} color="#d35400" />
                            <b>截止:</b> {comp.deadline ? comp.deadline : '依簡章'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <MapPin size={14} color="#c0392b" />
                            {renderLocation(comp.location)}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Users size={14} color="#34495e" />
                            {comp.age_group ? comp.age_group : '詳見簡章'}
                          </span>

                          {comp.url && comp.url !== '#' && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                              <a href={comp.url} target="_blank" rel="noopener noreferrer" style={{ color: '#0056b3', fontWeight: 'bold', textDecoration: 'underline', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ExternalLink size={14} /> 官方連結
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
