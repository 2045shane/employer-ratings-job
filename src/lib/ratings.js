(function(root){
'use strict';
const company=typeof module!=='undefined'&&module.exports?require('./company'):root.EmployerRatings;
function validateMap(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('JSON 必须是公司名到评分的对象。');
 const result=Object.create(null);
 for(const [name,r] of Object.entries(value)){
  const key=company.normalizeCompany(name);
  if(!key||!r||typeof r!=='object'||Array.isArray(r))throw new Error('公司名或评分对象无效。');
  for(const field of ['overall','workLife','compensation'])if(typeof r[field]!=='number'||!Number.isFinite(r[field])||r[field]<1||r[field]>5)throw new Error(name+'：'+field+' 必须在 1–5 之间。');
  if(typeof r.recommendPct!=='number'||!Number.isFinite(r.recommendPct)||r.recommendPct<0||r.recommendPct>100)throw new Error(name+'：推荐率必须在 0–100 之间。');
  if(typeof r.source!=='string'||!r.source.trim()||typeof r.updated!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.updated)||!Number.isFinite(Date.parse(r.updated))||new Date(r.updated).toISOString().slice(0,10)!==r.updated)throw new Error(name+'：请提供来源和有效 updated 日期（YYYY-MM-DD）。');
  if(Object.hasOwn(result,key))throw new Error('存在规范化后重复的公司名：'+name);
  result[key]={overall:r.overall,workLife:r.workLife,compensation:r.compensation,recommendPct:r.recommendPct,source:r.source.trim(),updated:r.updated};
 }
 return result;
}
function parseCustomJSON(text){let value;try{value=JSON.parse(text);}catch{throw new Error('非法 JSON，请检查语法。');}return validateMap(value);}
function findRating(name,builtIn,custom={}){const key=company.normalizeCompany(name);const base=validateMap(builtIn),overrides=validateMap(custom);const isCustom=Object.hasOwn(overrides,key);const rating=isCustom?overrides[key]:base[key];return rating?{...rating,isExample:!isCustom||rating.source.includes('示例'),isCustom}:null;}
const api={validateMap,parseCustomJSON,findRating};
Object.assign(root.EmployerRatings ||= {},api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
