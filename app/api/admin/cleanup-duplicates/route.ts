import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const TITLES_TO_DELETE = [
  '2026年 妙手金筆 全國硬筆書法比賽',
  '第廿屆沙連堡盃全國書法比賽（推估）',
  '115年新竹縣第五屆縣長盃全國書法比賽（推估）',
  '第19屆台積電青年書法暨篆刻大賞（推估）'
];

export async function GET() {
  try {
    const results = [];
    for (const title of TITLES_TO_DELETE) {
      const { data, error } = await supabase
        .from('competitions')
        .delete()
        .eq('title', title)
        .select();
      
      results.push({ title, count: data?.length || 0, error });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
