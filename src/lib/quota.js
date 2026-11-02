(function(root){
'use strict';
const license=typeof module!=='undefined'&&module.exports?require('./license'):root.EmployerRatings;
const CTA='免费次数已用完，解锁请小红书私信「珊哥爱读书」';
const STORAGE_KEYS={quota:'erjQuota',license:'erjLicense',custom:'erjSponsorNotes'};
function localDateKey(now=new Date()){return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;}
function readQuota(stored,now=new Date(),unlocked=false){const date=localDateKey(now),valid=stored?.date===date;const count=valid&&Number.isSafeInteger(stored.count)&&stored.count>=0?stored.count:0;const jobs=valid&&Array.isArray(stored.jobs)?stored.jobs.filter(x=>typeof x==='string'):[];return {date,count,jobs,unlocked,remaining:unlocked?null:Math.max(0,3-count),allowed:unlocked||count<3};}
function createQuotaStore(storage,now=()=>new Date()){
 let queue=Promise.resolve();
 async function status(){const d=await storage.get([STORAGE_KEYS.quota,STORAGE_KEYS.license]);return readQuota(d[STORAGE_KEYS.quota],now(),await license.verifyLicense(d[STORAGE_KEYS.license]));}
 function consume(job){const task=queue.then(async()=>{if(typeof job!=='string'||!job)throw new Error('缺少职位标识');const q=await status();if(q.jobs.includes(job)||q.unlocked)return {...q,recorded:true,repeated:q.jobs.includes(job)};if(!q.allowed)return {...q,recorded:false};const stored={date:q.date,count:q.count+1,jobs:[...q.jobs,job]};await storage.set({[STORAGE_KEYS.quota]:stored});return {...readQuota(stored,now()),recorded:true};});queue=task.catch(()=>{});return task;}
 return {status,consume};
}
const api={CTA,STORAGE_KEYS,localDateKey,readQuota,createQuotaStore};
Object.assign(root.EmployerRatings ||= {},api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
