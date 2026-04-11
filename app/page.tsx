import { createClient } from '@supabase/supabase-js';
import React from 'react';
import CalendarClient from './components/CalendarClient';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default async function Home() {
  let competitions: any[] = [];

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

  const now = new Date();
  now.setHours(0,0,0,0);
  const todayMs = now.getTime();

  const todayStr = new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei'
  }).format(new Date()).replace(/\//g, '-');

  return (
    <div className="container" style={{ padding: '24px' }}>
      <CalendarClient 
        initialCompetitions={competitions} 
        todayStr={todayStr} 
        todayMs={todayMs} 
      />
    </div>
  );
}
