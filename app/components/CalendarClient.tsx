'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, MapPin, Calendar, Clock, Users, ExternalLink, AlertCircle } from 'lucide-react';

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
  const [sortBy, setSortBy] = useState<'event' | 'deadline'>('event');

  const scrollToComp = (id: string | number) => {
    // If we are sorting by event date, but they click a deadline link, switch to deadline view?
    // Actually, both views contain all events (unless past events are faded). Let's just scroll.
    const el = document.getElementById(`comp-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Temporary highlight effect
      const originalBg = el.style.backgroundColor;
      el.style.backgroundColor = '#fff3cd';
      setTimeout(() => {
        el.style.backgroundColor = originalBg;
      }, 1500);
    }
  };

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

  // 1. Calculate Urgent Deadlines (Next 14 Days)
  const urgencyThresholdMs = todayMs + 14 * 24 * 60 * 60 * 1000;
  const urgentCompetitions = initialCompetitions.filter(comp => {
    if (!comp.deadline) return false;
    const dMs = new Date(comp.deadline).getTime();
    return dMs >= todayMs && dMs <= urgencyThresholdMs;
  }).sort((a,b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  // 2. Sort Logic Based on User Toggle
  let competitionsToGroup = [...initialCompetitions];
  if (sortBy === 'deadline') {
    competitionsToGroup.sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1; // null to bottom
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }

  // 3. Grouping Logic Based on Chosen Date Type
  const groupedCompetitions: Record<string, any[]> = {};
  competitionsToGroup.forEach(comp => {
    let yearMonth = '日期未定';
    const targetDateRaw = sortBy === 'event' ? comp.start_date : comp.deadline;
    
    if (targetDateRaw) {
       const dateObj = new Date(targetDateRaw);
       if (!isNaN(dateObj.getTime())) {
          yearMonth = `${dateObj.getFullYear()} 年 ${dateObj.getMonth() + 1} 月`;
       }
    }
    if (!groupedCompetitions[yearMonth]) groupedCompetitions[yearMonth] = [];
    groupedCompetitions[yearMonth].push(comp);
  });

  // Calculate "Today" marker insertion point
  let firstFutureCompId: number | string | null = null;
  for (const comp of competitionsToGroup) {
    const tDate = sortBy === 'event' ? comp.start_date : comp.deadline;
    if (tDate) {
      const d = new Date(tDate).getTime();
      if (d >= todayMs) {
        firstFutureCompId = comp.id;
        break;
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Urgency Banner */}
      {urgentCompetitions.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #fff3cd 0%, #fff8e1 100%)',
          border: '1px solid #ffeeba',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 4px 6px rgba(255, 160, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b97a00', fontWeight: 'bold' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '1.1rem' }}>🔥 即将截止 (14天內)</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {urgentCompetitions.map(comp => {
              const daysLeft = Math.ceil((new Date(comp.deadline).getTime() - todayMs) / (1000 * 60 * 60 * 24));
              return (
                <button 
                  key={`urgent-${comp.id}`} 
                  onClick={() => scrollToComp(comp.id)}
                  style={{
                    background: '#fff',
                    border: '1px solid #ffdf7e',
                    borderRadius: '20px',
                    padding: '6px 14px',
                    fontSize: '0.85rem',
                    color: '#856404',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, boxShadow 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 3px 6px rgba(0,0,0,0.08)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                  }}
                >
                  <strong style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {comp.title}
                  </strong>
                  <span style={{ background: '#dc3545', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                    剩 {daysLeft} 天
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Header with Toggle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '4px' 
      }}>
        
        {/* Sort Toggle Group */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: '24px',
          padding: '4px',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)'
        }}>
          <button 
            onClick={() => setSortBy('event')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              background: sortBy === 'event' ? '#1a5b74' : 'transparent',
              color: sortBy === 'event' ? '#fff' : '#64748b',
              fontWeight: sortBy === 'event' ? 'bold' : '500',
              border: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
          >
            📌 依比賽/展覽日期
          </button>
          <button 
            onClick={() => setSortBy('deadline')}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              background: sortBy === 'deadline' ? '#d35400' : 'transparent',
              color: sortBy === 'deadline' ? '#fff' : '#64748b',
              fontWeight: sortBy === 'deadline' ? 'bold' : '500',
              border: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease'
            }}
          >
            ⏰ 依徵件截止日
          </button>
        </div>

        {/* Existing Past Event Visibility Toggle */}
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
            borderColor: showPastClearly ? '#1a5b74' : '#e2e8f0',
            fontSize: '0.9rem',
            fontWeight: '500',
            boxShadow: '0 2px 5px rgba(0,0,0,0.03)',
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
                const targetDateStr = sortBy === 'event' ? comp.start_date : comp.deadline;
                const { day, weekday } = getDayAndWeekday(targetDateStr);
                const isNational = comp.category === 'national';
                const isRegional = comp.category === 'regional';
                const themeColor = isNational ? '#1a5b74' : isRegional ? '#d35400' : '#27ae60';
                const highlightColor = sortBy === 'deadline' ? '#d35400' : themeColor;
                
                const isPast = targetDateStr ? new Date(targetDateStr).getTime() < todayMs : false;

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
                        color: highlightColor, // Matches current sort accent
                        fontWeight: 'bold',
                        fontSize: '0.95rem' 
                      }}>
                        <div style={{ flex: 1, height: '1.5px', background: `linear-gradient(to right, transparent, ${highlightColor})` }}></div>
                        <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={16} />
                          <span style={{ letterSpacing: '0.05em' }}>今日 ({todayStr})</span>
                          <Clock size={16} />
                        </div>
                        <div style={{ flex: 1, height: '1.5px', background: `linear-gradient(to left, transparent, ${highlightColor})` }}></div>
                      </div>
                    )}
                    <div id={`comp-${comp.id}`} className="competition-card" style={{
                      background: '#fff',
                      borderRadius: '8px',
                      padding: '14px 18px',
                      borderLeft: `5px solid ${themeColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '18px',
                      opacity: displayOpacity,
                      filter: displayFilter,
                    }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '55px' }}>
                        <span style={{ fontSize: '1.7rem', fontWeight: 'bold', color: highlightColor, lineHeight: 1 }}>
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
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', 
                            background: sortBy === 'event' ? '#f8f9fa' : 'transparent',
                            padding: sortBy === 'event' ? '2px 6px' : '0',
                            borderRadius: '4px',
                            fontWeight: sortBy === 'event' ? 'bold' : 'normal'
                          }}>
                            <Calendar size={14} color="#cf9840" />
                            <b>比賽:</b> {comp.start_date ? comp.start_date : '依簡章'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px',
                            background: sortBy === 'deadline' ? '#fff4eb' : 'transparent',
                            padding: sortBy === 'deadline' ? '2px 6px' : '0',
                            borderRadius: '4px',
                            fontWeight: sortBy === 'deadline' ? 'bold' : 'normal'
                          }}>
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

