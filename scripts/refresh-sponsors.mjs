// Refresh the bundled Skilled Worker sponsor names from the public GOV.UK register.
// Usage: node scripts/refresh-sponsors.mjs
// No API key. Downloads the publication page, follows the current Worker CSV,
// keeps unique Organisation Name rows whose Route is exactly "Skilled Worker",
// and writes a gzipped name list plus a small JSON citation. Town/City, County,
// and Type & Rating are omitted on purpose: that "rating" is a Home Office
// licence grade, not an employer review score, and this extension must not
// present invented or lookalike scores.
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const PAGE='https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const headers={'user-agent':'employer-ratings-job-refresh'};

function parseCsv(text){
 const rows=[];
 let row=[],field='',quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){
   if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else quoted=false;}
   else field+=c;
  }else if(c==='"')quoted=true;
  else if(c===','){row.push(field);field='';}
  else if(c==='\n'){row.push(field);rows.push(row);row=[];field='';}
  else if(c!=='\r')field+=c;
 }
 if(field.length||row.length){row.push(field);rows.push(row);}
 return rows;
}

async function main(){
 const pageRes=await fetch(PAGE,{headers});
 if(!pageRes.ok)throw new Error('名册页面下载失败 '+pageRes.status);
 const html=await pageRes.text();
 const urls=[...new Set([...html.matchAll(/https:\/\/assets\.publishing\.service\.gov\.uk\/[^"'\\\s]+Worker_and_Temporary_Worker[^"'\\\s]+\.csv/g)].map(m=>m[0]))];
 if(!urls.length)throw new Error('页面上没有找到 Worker CSV');
 urls.sort((a,b)=>String(a.match(/\d{4}-\d{2}-\d{2}/)).localeCompare(String(b.match(/\d{4}-\d{2}-\d{2}/))));
 const csvUrl=urls[urls.length-1];
 const csvDate=csvUrl.match(/(\d{4}-\d{2}-\d{2})\.csv/)?.[1];
 if(!csvDate)throw new Error('CSV 文件名没有日期：'+csvUrl);
 const csvRes=await fetch(csvUrl,{headers});
 if(!csvRes.ok)throw new Error('CSV 下载失败 '+csvRes.status);
 const bytes=Buffer.from(await csvRes.arrayBuffer());
 if(bytes.length<100000||bytes.length>40000000)throw new Error('CSV 大小异常：'+bytes.length);
 const table=parseCsv(bytes.toString('utf8').replace(/^\uFEFF/,''));
 const headerAt=table.findIndex(r=>r.includes('Organisation Name')&&r.includes('Route'));
 if(headerAt<0)throw new Error('CSV 缺少 Organisation Name 或 Route 列');
 const header=table[headerAt];
 const nameIdx=header.indexOf('Organisation Name'),routeIdx=header.indexOf('Route');
 const names=[];
 const seen=new Set();
 for(const row of table.slice(headerAt+1)){
  if((row[routeIdx]||'').trim()!=='Skilled Worker')continue;
  const name=(row[nameIdx]||'').trim();
  if(!name||seen.has(name))continue;
  seen.add(name);
  names.push(name);
 }
 if(names.length<10000)throw new Error('Skilled Worker 机构过少，拒绝写入：'+names.length);
 names.sort();
 const body=names.join('\n')+'\n';
 const sha256=createHash('sha256').update(body).digest('hex');
 const meta={
  source:'GOV.UK Register of licensed sponsors: workers',
  sourceUrl:PAGE,
  csvUrl,
  csvDate,
  retrieved:new Date().toISOString().slice(0,10),
  route:'Skilled Worker',
  orgCount:names.length,
  sha256,
  namesFile:'src/data/sponsors-names.txt.gz',
  licence:'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
  licenceName:'Open Government Licence v3.0',
  contains:'Contains public sector information licensed under the Open Government Licence v3.0.',
  note:'Whether the organisation name appears on the Skilled Worker route in this CSV. Not an employer review score. Town/City, County, and the Home Office licence grade (CSV column Type & Rating) are omitted.'
 };
 writeFileSync(join(root,'src/data/sponsors-names.txt.gz'),gzipSync(Buffer.from(body),{level:9}));
 writeFileSync(join(root,'src/data/sponsors-meta.json'),JSON.stringify(meta,null,2)+'\n');
 console.log(`wrote ${names.length} names from ${csvDate} (${bytes.length} byte CSV)`);
}
main().catch(err=>{console.error(err.message||err);process.exit(1);});
