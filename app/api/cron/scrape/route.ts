import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import * as cheerio from 'cheerio';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const resendApiKey = process.env.RESEND_API_KEY || '';
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';

const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(resendApiKey);

// 11 websites from the old index.html
const TARGET_URLS = [
  'https://dweb.cjcu.edu.tw/cpa/news',    // 長榮書畫系
  'https://www.shufa.org.tw/news',        // 中華民國書學會
  'https://web.arte.gov.tw/nsac/',        // 藝教館
  'https://dadunfae.taichung.gov.tw/',    // 大墩美展
  'https://art.hlc.edu.tw/lanting/',      // 蘭亭大會
  'https://education.ylc.edu.tw/',        // 雲林教育網
  'https://www.happynet.org.tw/',         // 金鴻獎
  'https://salianbao.org.tw/',            // 沙連堡
  'https://www.zgs.org.tw/',              // 慈光山
  'https://www.bocach.gov.tw/',           // 彰化縣文化局
  'https://nlc.moe.edu.tw/'               // 全國語文競賽
];

export async function GET(request: Request) {
  try {
    console.log('Initiating multi-source calligraphy web scraping...');
    const newCompetitions: any[] = [];
    const currentYear = new Date().getFullYear();

    // 1. Concurrent Fetching (max 3 seconds per site to strictly avoid Vercel 10s timeout)
    const fetchPromises = TARGET_URLS.map(async (targetUrl) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

        const response = await fetch(targetUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
          }
        });
        clearTimeout(timeoutId);

        if (!response.ok) return null;
        
        const html = await response.text();
        return { targetUrl, html };
      } catch (err) {
        // Silently skip if a site is dead or blocks us
        return null;
      }
    });

    // Wait for all websites to return (or timeout)
    const results = await Promise.all(fetchPromises);

    // 2. Parse HTML safely for all successful sites
    for (const result of results) {
      if (!result) continue;
      
      const { targetUrl, html } = result;
      const $ = cheerio.load(html);
      const urlObj = new URL(targetUrl);
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

      $('a').each((_, element) => {
        const text = $(element).text().trim();
        const href = $(element).attr('href');

        // Heuristic filtering: 更寬鬆的雷達
        // 不再要求同時具備「書法」+「比賽」，只要有關鍵字就通通抓！
        const keywords = ['書法', '書畫', '揮毫', '寫字', '硬筆', '美展', '蘭亭', '大墩'];
        const hasKeyword = keywords.some(kw => text.includes(kw));

        // 條件：包含關鍵字、且字串不會太短（過濾掉只有「書法」兩個字的按鈕）
        if (hasKeyword && text.length > 6) {
          // Deduplication: Avoid existing titles globally globally in this execution memory
          if (href && !newCompetitions.some(c => c.title === text)) {
            const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
            
            newCompetitions.push({
              title: text,
              category: 'national', // 預設類別
              start_date: `${currentYear}-12-31`,
              location: '請參閱簡章',
              deadline: `${currentYear}-12-31`,
              fee: '詳見簡章',
              url: fullUrl,
              description: `系統自動發現自：${targetUrl}。請點擊連結查看詳細簡章與確切日期。`
            });
          }
        }
      });
    }

    // 3. Write to Supabase & Send Email
    for (const comp of newCompetitions) {
      const approval_token = crypto.randomUUID();
      
      // Insert as pending
      const { data, error } = await supabase
        .from('competitions')
        .insert([{ ...comp, status: 'pending', approval_token }])
        .select()
        .single();

      // Send Email if inserted successfully
      if (!error && data && resendApiKey) {
        const approveUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/action?id=${data.id}&token=${approval_token}&action=approve`;
        const declineUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/action?id=${data.id}&token=${approval_token}&action=decline`;

        await resend.emails.send({
          from: 'Calligraphy Bot <onboarding@resend.dev>',
          to: adminEmail,
          subject: `[需要審核] 書法發佈網路雷達：${comp.title}`,
          html: `
            <h2>發現來自官方的書法比賽公告！</h2>
            <ul>
              <li><strong>名稱：</strong>${comp.title}</li>
              <li><strong>來源公告：</strong><a href="${comp.url}">點我查看此網站簡章</a></li>
              <li><strong>備註：</strong>此為多源並行爬蟲自動攔截，確切日期與報名費請以簡章為準。</li>
            </ul>
            <p>請確認是否要在您的行事曆上發布這則比賽：</p>
            <a href="${approveUrl}" style="padding: 10px 20px; background: #C9A962; color: #fff; text-decoration: none; border-radius: 5px; margin-right: 10px;">核准並發布 (Approve)</a>
            <a href="${declineUrl}" style="padding: 10px 20px; background: #EAEAEA; color: #333; text-decoration: none; border-radius: 5px;">無效/忽略 (Decline)</a>
          `
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Scrape completed across ${results.length} targets. Found ${newCompetitions.length} potential matches.` 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
