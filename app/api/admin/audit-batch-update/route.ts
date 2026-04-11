import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const AUDIT_DATA = [
  { match: '%大墩美展%', title: '臺中市第31屆大墩美展（書法類）', start_date: '2026-04-15', deadline: '2026-04-15', location: '臺中市立大墩文化中心（40359臺中市西區英才路600號）' },
  { match: '%政大盃%', title: '115年雲林縣第17屆政大盃全國硬筆書法比賽', start_date: '2026-04-26', deadline: '2026-03-31', location: '雲林國中學生活動中心（640雲林縣斗六市民生路438號）' },
  { match: '%公誠盃%', title: '第十二屆公誠盃全國書法比賽', start_date: '2026-04-25', deadline: '2026-04-14', location: '公誠國小（640雲林縣斗六市北平路95號）' },
  { match: '%蘭亭大會%', title: '第九屆花蓮蘭亭大會全國賽', start_date: '2026-07-04', deadline: '2026-05-20', location: '花蓮縣立體育館/小巨蛋（花蓮市達固湖灣大路23號）' },
  { match: '%學生美術比賽%', title: '115學年度全國學生美術比賽（書法類）', start_date: '2026-11-20', deadline: '2026-10-24', location: '國立臺灣藝術教育館（100052台北市中正區南海路47號）' },
  { match: '%語文競賽%', title: '115年全國語文競賽（寫字/書法項目）', start_date: '2026-11-21', deadline: '2026-10-15', location: '基隆市立體育館（202基隆市中正區信二路279號）' },
  { match: '%長榮藝術獎%', title: '2026 第八屆【長榮藝術獎】全國書法比賽', start_date: '2026-04-25', deadline: '2026-03-25', location: '長榮大學（71101臺南市歸仁區長大路1號）' },
  { match: '%中華翰墨情%', title: '2026 第六屆中華翰墨情書法比賽', start_date: '2026-07-24', deadline: '2026-05-10', location: '廣東省佛山市 (海外決賽)' },
  { match: '%金鴻獎%', title: '第廿九屆【金鴻獎】全國書法比賽', start_date: '2026-07-12', deadline: '2026-05-14', location: '劍潭海外青年活動中心（104台北市中山區中山北路四段16號）' },
  { match: '%慈光山%', title: '第廿屆「慈光山人文獎」全國書法比賽', start_date: '2026-07-19', deadline: '2026-06-05', location: '慈光山人乘寺文殊院（南投縣魚池鄉東池村東興巷24之1號）' },
  { match: '%元太道堂盃%', title: '第十五屆 元太道堂盃 全國書法比賽', start_date: '2026-08-22', deadline: '2026-06-30', location: '台北市元太道堂（台北市文山區指南路二段191號）' },
  { match: '%妙手金筆%', title: '2026年 妙手金筆 全國硬筆書法比賽', start_date: '2026-02-01', deadline: '2026-01-16', location: '長榮大學（71101臺南市歸仁區長大路1號）' },
  { match: '%縣長盃%', title: '115年新竹縣第五屆縣長盃全國書法比賽', start_date: '2026-10-20', deadline: '2026-09-15', location: '新竹縣六家國小（302新竹縣竹北市嘉豐六路二段104號）' },
  { match: '%文超盃%', title: '115年新竹縣翠竹書畫學會第五屆「文超盃」全國書法比賽', start_date: '2026-05-24', deadline: '2026-04-30', location: '新竹縣六家國小（302新竹縣竹北市嘉豐六路二段104號）' },
  { match: '%台積電%', title: '第19屆台積電青年書法暨篆刻大賞', start_date: '2027-02-15', deadline: '2026-12-15', location: '國立中正紀念堂（100台北市中正區中山南路21號）' }
];

export async function GET() {
  try {
    const results = [];
    for (const item of AUDIT_DATA) {
      const { data, error } = await supabase
        .from('competitions')
        .update({
          title: item.title,
          start_date: item.start_date,
          deadline: item.deadline,
          location: item.location
        })
        .like('title', item.match)
        .select();
      
      results.push({ match: item.match, count: data?.length || 0, error });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
