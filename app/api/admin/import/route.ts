import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import legacyData from '../../../../data/competitions.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const competitions = legacyData.competitions;
    
    // Convert legacy array to the new Supabase schema schema
    const mappedData = competitions.map((comp: any) => {
      // Safely validate dates for PostgreSQL DATE format (must be YYYY-MM-DD or null)
      const parseDate = (d: string) => {
        if (!d || d === '待公告' || d.includes('推估')) return null;
        return d; 
      };

      return {
        title: comp.title,
        category: comp.category || 'national',
        start_date: parseDate(comp.start),
        location: comp.location || '請參閱簡章',
        deadline: parseDate(comp.deadline),
        fee: comp.fee || '詳見簡章',
        url: comp.url,
        description: comp.description || '',
        age_group: comp.ageGroup || '不限/詳見簡章',
        status: 'approved' // Automatically post to the calendar
      };
    });

    // Batched bulk insert into Supabase
    const { data, error } = await supabase
      .from('competitions')
      .insert(mappedData)
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully imported ${data.length} legacy competitions!`,
      data 
    });

  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
