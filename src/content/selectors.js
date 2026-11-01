(function(root){
'use strict';
// DOM 易变、未真站验收。LinkedIn 候选需要持续维护；Indeed 为占位实现。
const SELECTORS={linkedin:['.job-details-jobs-unified-top-card__company-name a','.jobs-unified-top-card__company-name a','.jobs-details-top-card__company-url','a[data-tracking-control-name="public_jobs_topcard-org-name"]','.topcard__org-name-link'],indeed:['[data-testid="inlineHeader-companyName"]','[data-company-name="true"]']}; // TODO: Indeed 真站验证与详情区定位。
function getSite(url){try{const u=new URL(url);if(u.protocol!=='https:')return null;if(u.hostname==='www.linkedin.com'&&/^\/jobs\/(view\/|search(?:\/|$))/.test(u.pathname))return 'linkedin';if(u.hostname==='indeed.com'||u.hostname.endsWith('.indeed.com'))return 'indeed';}catch{}return null;}
function jobKey(url){try{const u=new URL(url),site=getSite(url);if(site==='linkedin'){const id=u.pathname.match(/\/jobs\/view\/(\d+)/)?.[1]||u.searchParams.get('currentJobId');return id?'linkedin:'+id:null;}if(site==='indeed'){const id=u.searchParams.get('jk')||u.searchParams.get('vjk');return id?'indeed:'+id:null;}}catch{}return null;}
function extractCompany(doc,url){const site=getSite(url);if(!site)return '';for(const selector of SELECTORS[site]){const text=doc.querySelector(selector)?.textContent?.trim();if(text)return text;}
 if(site==='linkedin'){for(const selector of ['.job-details-jobs-unified-top-card__primary-description-container','.jobs-unified-top-card__primary-description','.topcard__flavor-row']){const text=doc.querySelector(selector)?.textContent?.trim();if(text)return text.split(/[·•\n]/)[0].trim();}}return '';}
const api={SELECTORS,getSite,jobKey,extractCompany};
Object.assign(root.EmployerRatings ||= {},api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
