import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY || '';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(resendApiKey);

export async function GET(request: Request) {
  try {
    // 1. Scrape logic (Mocked - User should fill in real Cheerio logic here)
    const newCompetitions = [
      {
        title: '2026 全國美展 書法類',
        category: 'national',
        start_date: '2026-08-01',
        location: '國立台灣美術館',
        deadline: '2026-06-30',
        fee: '免費',
      }
    ];

    // Assuming we found new data
    for (const comp of newCompetitions) {
      const approval_token = crypto.randomBytes(16).toString('hex');
      
      // 2. Insert into Supabase as pending
      const { data, error } = await supabase
        .from('competitions')
        .insert([{ ...comp, status: 'pending', approval_token }])
        .select()
        .single();

      if (error) throw error;

      // 3. Send Approval Email via Resend
      if (data && resendApiKey) {
        const approveUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/action?id=${data.id}&token=${approval_token}&action=approve`;
        const declineUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/action?id=${data.id}&token=${approval_token}&action=decline`;

        await resend.emails.send({
          from: 'Calligraphy Bot <onboarding@resend.dev>',
          to: adminEmail,
          subject: `[需要審核] 新的書法比賽：${comp.title}`,
          html: `
            <h2>發現新的書法比賽！</h2>
            <ul>
              <li><strong>名稱：</strong>${comp.title}</li>
              <li><strong>日期：</strong>${comp.start_date}</li>
              <li><strong>地點：</strong>${comp.location}</li>
            </ul>
            <p>請選擇是否發布到網站：</p>
            <a href="${approveUrl}" style="padding: 10px 20px; background: #C9A962; color: #fff; text-decoration: none; border-radius: 5px; margin-right: 10px;">核准 (Approve)</a>
            <a href="${declineUrl}" style="padding: 10px 20px; background: #EAEAEA; color: #333; text-decoration: none; border-radius: 5px;">拒絕 (Decline)</a>
          `
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Scrape completed and emails sent.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
