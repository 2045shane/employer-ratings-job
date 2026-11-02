'use strict';
importScripts('../lib/company.js','../lib/sponsors.js','../lib/license.js','../lib/quota.js','../content/selectors.js');
const api=EmployerRatings,store=api.createQuotaStore(chrome.storage.local);
let registerPromise;
function loadRegister(){
 registerPromise||=(async()=>{
  const metaRes=await fetch(chrome.runtime.getURL('src/data/sponsors-meta.json'));
  if(!metaRes.ok)throw new Error('名册说明读取失败');
  const meta=await metaRes.json();
  const binRes=await fetch(chrome.runtime.getURL('src/data/sponsors-names.txt.gz'));
  if(!binRes.ok)throw new Error('名册读取失败');
  const text=await new Response(binRes.body.pipeThrough(new DecompressionStream('gzip'))).text();
  const names=text.split('\n').filter(Boolean);
  if(!names.length)throw new Error('名册为空');
  return {meta,names};
 })().catch(err=>{registerPromise=null;throw err;});
 return registerPromise;
}
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
   if(!isOptions(sender))throw new Error('请在设置页保存备注。');
   const notes=api.parseNotesJSON(m.json);await chrome.storage.local.set({[api.STORAGE_KEYS.custom]:notes});return {ok:true};
  }
  const key=api.jobKey(sender.url||'');
  if(!sender.tab||!key)throw new Error('请打开带职位 ID 的 LinkedIn 职位详情。');
  const company=typeof m.company==='string'?m.company.trim().slice(0,200):'';
  if(!company)throw new Error('未识别公司名。请打开 LinkedIn 职位详情页后重试。');
  const data=await chrome.storage.local.get(api.STORAGE_KEYS.custom);
  let notes={};
  try{notes=api.validateNotes(data[api.STORAGE_KEYS.custom]||{});}catch{notes={};}
  const sponsor=api.findSponsor(company,await loadRegister(),notes);
  const quota=await store.consume(key);
  return {ok:quota.recorded,error:quota.recorded?null:api.CTA,company,sponsor:quota.recorded?sponsor:null,quota};
 })().then(reply).catch(e=>reply({ok:false,error:e.message||'本地操作失败，请重试。'}));return true;
});
