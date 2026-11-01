(function(){
'use strict';
const host=document.createElement('div');host.id='erj-employer-panel';
host.style.cssText='all:initial;position:fixed;right:18px;top:110px;z-index:2147483647;max-width:calc(100vw - 36px)';
const shadow=host.attachShadow({mode:'closed'});
shadow.innerHTML=`<style>:host{color-scheme:light}*{box-sizing:border-box}.panel{width:310px;max-width:calc(100vw - 36px);max-height:75vh;overflow:auto;background:#fbf6ee;color:#241c16;border:1px solid #e4d5c2;border-radius:14px;padding:18px;box-shadow:0 10px 28px #301c1620;font:14px/1.7 "Microsoft YaHei",sans-serif}h2{font:700 20px serif;margin:0 0 8px}p{margin:8px 0;overflow-wrap:anywhere}button{font:inherit;cursor:pointer;border:0;border-radius:9px;padding:8px 12px;background:#9e2f2a;color:#fffaf6;margin:4px 6px 4px 0}button:disabled{opacity:.6}.badge{background:#fff1ee;color:#9e2f2a;border:1px solid #e7b2ab;font-weight:bold;padding:6px}.muted{font-size:12px;color:#6a5e52}</style><section class="panel" aria-label="雇主评分"><h2>雇主评分</h2><p class="badge">内置评分为示例数据，非真实评分</p><div id="result" aria-live="polite"></div><button id="check">查看评分</button><button id="settings">设置</button><button id="close" aria-label="收起评分面板">收起</button><p class="muted">每日免费 3 个职位。DOM 易变、未真站验收；Indeed 为占位。</p></section>`;
const result=shadow.querySelector('#result'),button=shadow.querySelector('#check');
let locationKey='',busy=false;
function line(text,cls){const p=document.createElement('p');p.textContent=text;if(cls)p.className=cls;result.append(p);}
function refresh(){const key=EmployerRatings.jobKey(location.href)||location.href;if(key!==locationKey){locationKey=key;result.replaceChildren();line('点击查看当前职位的雇主评分。');}host.hidden=!EmployerRatings.getSite(location.href);}
async function check(){if(busy)return {ok:false,error:'正在查询，请稍候。'};busy=true;button.disabled=true;host.hidden=false;const url=location.href;
 try{const company=EmployerRatings.extractCompany(document,url);const response=await chrome.runtime.sendMessage({type:'ERJ_CHECK',company});
 if(location.href!==url){refresh();return {ok:false,error:'职位已变化，请重新查看。'};}
 result.replaceChildren();if(!response?.ok){line(response?.error||'查询失败');return response||{ok:false};}
 line(response.company);
 const r=response.rating;
 if(!r){line('未匹配到评分，可在设置里添加此公司的 JSON 数据。');}
 else{if(r.isExample)line('示例数据（非真实评分）','badge');else line('用户自定义数据（未经核验）','badge');line('总评分：'+'★'.repeat(Math.round(r.overall))+'☆'.repeat(5-Math.round(r.overall))+' '+r.overall.toFixed(1)+' / 5');line('工作生活平衡：'+r.workLife+' / 5');line('薪酬福利：'+r.compensation+' / 5');line('推荐率：'+r.recommendPct+'%');line('数据来源：'+r.source);line('更新日期：'+r.updated);}
 line(response.quota.unlocked?'已解锁，不限次数':`今日剩余 ${response.quota.remaining} / 3 次`,'muted');return {ok:true};
 }catch{result.replaceChildren();line('本地查询失败，请刷新页面后重试。');return {ok:false,error:'本地查询失败'};}finally{busy=false;button.disabled=false;}}
button.addEventListener('click',check);shadow.querySelector('#settings').onclick=()=>chrome.runtime.sendMessage({type:'ERJ_OPTIONS'});shadow.querySelector('#close').onclick=()=>{host.hidden=true;};
chrome.runtime.onMessage.addListener((m,sender,reply)=>{if(m?.type==='ERJ_TRIGGER'){check().then(reply);return true;}});
document.documentElement.append(host);refresh();setInterval(refresh,800);
})();
