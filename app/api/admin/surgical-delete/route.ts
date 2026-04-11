import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const idsToDelete = [38, 39, 41];
    
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
