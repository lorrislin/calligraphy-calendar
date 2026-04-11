import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// Use anon key if service key is not available, assuming RLS allows updates or we are just testing endpoint
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const results = [];

    // 1. Update Da Dun
    const { data: d1, error: e1 } = await supabase.from('competitions').update({ url: 'https://www.dadunfae.taichung.gov.tw/' }).like('title', '%大墩美展%').select();
    results.push({ name: 'Da Dun', data: d1, error: e1 });
    
    // 2. Update Salianbao
    const { data: d2, error: e2 } = await supabase.from('competitions').update({
      title: '第廿屆沙連堡盃全國書法比賽', 
      start_date: '2026-05-24', 
      deadline: '2026-04-10', 
      url: 'https://salianbao.org.tw/main.php?fid=01&page_name=news_detail&news_id=42'
    }).like('title', '%沙連堡%').select();
    results.push({ name: 'Salianbao', data: d2, error: e2 });

    // 3. Update Jin Hong (from User's Browser Tab)
    const { data: d3, error: e3 } = await supabase.from('competitions').update({
      title: '第廿九屆【金鴻獎】全國書法比賽', 
      start_date: '2026-07-12', 
      deadline: '2026-05-14',
      url: 'https://www.happynet.org.tw/OnePage.aspx?tid=116'
    }).like('title', '%金鴻獎%').select();
    results.push({ name: 'Jin Hong', data: d3, error: e3 });

    return NextResponse.json({ success: true, message: 'Database forcefully updated via Vercel env vars.', results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
