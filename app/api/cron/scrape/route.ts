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
    // 1. 真實爬蟲邏輯 (Real Scrape Logic)
    // 我們鎖定長榮大學書畫藝術學系佈告欄這類高公信力的官方網站
    console.log('Fetching official calligraphy news...');
    const response = await fetch('https://dweb.cjcu.edu.tw/cpa/news', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch website. Status: ${response.status}`);
    }

    const html = await response.text();
    const cheerio = require('cheerio');
    const $ = cheerio.load(html);

    const newCompetitions: any[] = [];
    const baseUrl = 'https://dweb.cjcu.edu.tw';
    const currentYear = new Date().getFullYear();

    // 啟動萬用探測器：抓出所有包含「書法」與「比賽」/「徵件」/「美展」的連結
    $('a').each((_, element) => {
      const text = $(element).text().trim();
      const href = $(element).attr('href');

      if (text.includes('書法') && (text.includes('賽') || text.includes('展') || text.includes('徵件'))) {
        if (href && !newCompetitions.some(c => c.title === text)) {
          const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
          
          newCompetitions.push({
            title: text,
            category: 'national', // 預設為 national，可在前端自行修改
            start_date: `${currentYear}-12-31`, // 需要手動由簡章確認，先給預設
            location: '請參閱簡章',
            deadline: `${currentYear}-12-31`,
            fee: '詳見簡章',
            url: fullUrl,
            description: `爬蟲自動抓取自：長榮書畫學系佈告欄。請點擊連結查看詳細簡章與確切日期。`
          });
        }
      }
    });

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
            <h2>發現新的官方書法活動與比賽！</h2>
            <ul>
              <li><strong>名稱：</strong>${comp.title}</li>
              <li><strong>原始公告：</strong><a href="${comp.url}">點我查看官方簡章</a></li>
              <li><strong>備註：</strong>因為是程式自動讀取，確切的比賽日期與報名費請以官方簡章為準。</li>
            </ul>
            <p>請確認是否要在您的網站上發布：</p>
            <a href="${approveUrl}" style="padding: 10px 20px; background: #C9A962; color: #fff; text-decoration: none; border-radius: 5px; margin-right: 10px;">核准發布 (Approve)</a>
            <a href="${declineUrl}" style="padding: 10px 20px; background: #EAEAEA; color: #333; text-decoration: none; border-radius: 5px;">忽略 (Decline)</a>
          `
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Scrape completed and emails sent.' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
