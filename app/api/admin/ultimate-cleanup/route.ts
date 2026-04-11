import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    // 1. Fetch ALL records to be absolutely sure
    const { data: allItems } = await supabase
      .from('competitions')
      .select('id, title');

    if (!allItems) return NextResponse.json({ error: 'Failed to fetch items' });

    // 2. Filter for zombies
    const zombies = allItems.filter(item => 
      item.title.includes('推估') || 
      item.title.includes('(') && item.title.includes(')') && item.title.includes('估')
    );

    if (zombies.length === 0) {
      return NextResponse.json({ success: true, message: 'No zombie data found in DB.', count: allItems.length, allTitles: allItems.map(i => i.title) });
    }

    // 3. Destroy them
    const idsToDestroy = zombies.map(z => z.id);
    const { data: deleted, error } = await supabase
      .from('competitions')
      .delete()
      .in('id', idsToDestroy)
      .select();

    return NextResponse.json({ 
      success: true, 
      count: deleted?.length || 0, 
      deletedItems: deleted, 
      error,
      remainingCount: allItems.length - (deleted?.length || 0)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
