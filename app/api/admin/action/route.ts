import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const token = searchParams.get('token');
    const action = searchParams.get('action'); // 'approve' or 'decline'

    if (!id || !token || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Verify token and get the record
    const { data: record, error: fetchError } = await supabase
      .from('competitions')
      .select('*')
      .eq('id', id)
      .eq('approval_token', token)
      .single();

    if (fetchError || !record) {
      return NextResponse.json({ error: 'Invalid ID or token' }, { status: 401 });
    }

    if (record.status !== 'pending') {
      return NextResponse.json({ message: '此項目已經被審核過了。' });
    }

    // 2. Update status based on action
    const newStatus = action === 'approve' ? 'approved' : 'declined';
    const { error: updateError } = await supabase
      .from('competitions')
      .update({ status: newStatus, approval_token: null }) // clear token after use
      .eq('id', id);

    if (updateError) throw updateError;

    // 3. Clear cache so the frontend updates instantly
    if (newStatus === 'approved') {
      revalidatePath('/');
    }

    return NextResponse.json({ 
      success: true, 
      message: newStatus === 'approved' ? '已成功發布！網站已更新。' : '已拒絕該項目。' 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
