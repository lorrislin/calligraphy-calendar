import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 1. Fetch all items matching keywords to identify IDs
    const { data: matches } = await supabase
      .from('competitions')
      .select('id, title')
      .or('title.ilike.%推估%,title.ilike.%妙手金筆%');

    if (!matches || matches.length === 0) {
      return NextResponse.json({ message: 'No matches found to delete.' });
    }

    // 2. Filter to be sure we only delete the duplicates/old ones
    // We want to KEEP the ones that are verified (e.g., have specific locations) 
    // but the user specifically wants to remove "estimated" ones.
    const idsToDelete = matches
      .filter(item => 
        item.title.includes('（推估）') || 
        item.title.includes('(推估)') || 
        item.title === '2026年 妙手金筆 全國硬筆書法比賽'
      )
      .map(item => item.id);

    if (idsToDelete.length === 0) {
      return NextResponse.json({ message: 'Matches found but none fit the deletion criteria.', matches });
    }

    // 3. Delete by ID
    const { data: deleted, error } = await supabase
      .from('competitions')
      .delete()
      .in('id', idsToDelete)
      .select();

    return NextResponse.json({ success: true, deletedCount: deleted?.length || 0, deleted, error });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
