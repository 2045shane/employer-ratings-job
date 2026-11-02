(function(root){
'use strict';
// LinkedIn DOM 易变，候选选择器需要持续维护。
const SELECTORS={linkedin:['.job-details-jobs-unified-top-card__company-name a','.jobs-unified-top-card__company-name a','.jobs-details-top-card__company-url','a[data-tracking-control-name="public_jobs_topcard-org-name"]','.topcard__org-name-link']};
function getSite(url){try{const u=new URL(url);if(u.protocol!=='https:')return null;if(u.hostname==='www.linkedin.com'&&/^\/jobs\/(view\/|search(?:\/|$))/.test(u.pathname))return 'linkedin';}catch{}return null;}
function jobKey(url){try{const u=new URL(url);if(getSite(url)!=='linkedin')return null;const id=u.pathname.match(/\/jobs\/view\/(\d+)/)?.[1]||u.searchParams.get('currentJobId');return id?'linkedin:'+id:null;}catch{}return null;}
function extractCompany(doc,url){if(getSite(url)!=='linkedin')return '';for(const selector of SELECTORS.linkedin){const text=doc.querySelector(selector)?.textContent?.trim();if(text)return text;}
 for(const selector of ['.job-details-jobs-unified-top-card__primary-description-container','.jobs-unified-top-card__primary-description','.topcard__flavor-row']){const text=doc.querySelector(selector)?.textContent?.trim();if(text)return text.split(/[·•\n]/)[0].trim();}return '';}
const api={SELECTORS,getSite,jobKey,extractCompany};
Object.assign(root.EmployerRatings ||= {},api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
