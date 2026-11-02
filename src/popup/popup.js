'use strict';
const status=document.getElementById('status'),button=document.getElementById('check');
async function refresh(){const r=await chrome.runtime.sendMessage({type:'ERJ_STATUS'});if(!r.ok)throw new Error(r.error);document.getElementById('quota').textContent=r.quota.unlocked?'已解锁，不限次数':`今日剩余 ${r.quota.remaining} / 3 次`;}
button.onclick=async()=>{button.disabled=true;try{const [tab]=await chrome.tabs.query({active:true,currentWindow:true});const r=await chrome.tabs.sendMessage(tab.id,{type:'ERJ_TRIGGER'});status.textContent=r?.ok?'担保结果已显示在页面右侧。':r?.error||'查询失败';await refresh();}catch{status.textContent='请打开 LinkedIn 职位详情页；安装插件后已打开的页面需要刷新。';}finally{button.disabled=false;}};
document.getElementById('options').onclick=()=>chrome.runtime.openOptionsPage();
refresh().catch(e=>{status.textContent=e.message;});
chrome.storage.onChanged.addListener(()=>refresh().catch(e=>{status.textContent=e.message;}));
