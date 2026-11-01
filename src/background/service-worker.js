'use strict';
importScripts('../lib/company.js','../lib/ratings.js','../lib/license.js','../lib/quota.js','../content/selectors.js');
const api=EmployerRatings,store=api.createQuotaStore(chrome.storage.local);
const sample=fetch(chrome.runtime.getURL('src/data/sample-ratings.json')).then(r=>{if(!r.ok)throw new Error('示例数据读取失败');return r.json();});
function isOptions(sender){return !sender.tab&&sender.url===chrome.runtime.getURL('src/options/options.html');}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(!['ERJ_STATUS','ERJ_CHECK','ERJ_SAVE_LICENSE','ERJ_SAVE_CUSTOM','ERJ_OPTIONS'].includes(m?.type))return;
 (async()=>{
  if(m.type==='ERJ_OPTIONS'){await chrome.runtime.openOptionsPage();return {ok:true};}
  if(m.type==='ERJ_STATUS')return {ok:true,quota:await store.status()};
  if(m.type==='ERJ_SAVE_LICENSE'){
   if(!isOptions(sender))throw new Error('请在设置页保存许可。');
   const token=typeof m.license==='string'?m.license.trim():'';
   if(token&&!await api.verifyLicense(token))throw new Error('许可无效，请检查 ERJ1. 前缀与完整内容。');
   await chrome.storage.local.set({[api.STORAGE_KEYS.license]:token});return {ok:true};
  }
  if(m.type==='ERJ_SAVE_CUSTOM'){
   if(!isOptions(sender))throw new Error('请在设置页保存评分。');
   const custom=api.parseCustomJSON(m.json);await chrome.storage.local.set({[api.STORAGE_KEYS.custom]:custom});return {ok:true};
  }
  const key=api.jobKey(sender.url||'');
  if(!sender.tab||!key)throw new Error('请打开带职位 ID 的 LinkedIn 或 Indeed 职位详情。');
  const company=typeof m.company==='string'?m.company.trim().slice(0,200):'';
  if(!company)throw new Error('未识别公司名；选择器尚未经真站验收，Indeed 仅为占位。');
  const data=await chrome.storage.local.get(api.STORAGE_KEYS.custom);
  const rating=api.findRating(company,await sample,data[api.STORAGE_KEYS.custom]||{});
  const quota=await store.consume(key);
  return {ok:quota.recorded,error:quota.recorded?null:api.CTA,company,rating:quota.recorded?rating:null,quota};
 })().then(reply).catch(e=>reply({ok:false,error:e.message||'本地操作失败，请重试。'}));return true;
});
