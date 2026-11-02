(function(root){
'use strict';
const company=typeof module!=='undefined'&&module.exports?require('./company'):root.EmployerRatings;
const indexCache=new WeakMap();
const SCORE_FIELDS=['overall','workLife','compensation','recommendPct','rating','stars','score'];

function splitListedName(name){
 return String(name).split(/\s+(?:t\/as|t\/a|trading as)\s+/i).map(part=>part.replace(/^[\s()]+|[\s()]+$/g,'').trim()).filter(Boolean);
}
function preferredName(list){return list.find(n=>n!==n.toUpperCase())||list[0];}
function displayNames(list){const pref=preferredName(list);return [pref,...list.filter(n=>n!==pref)].slice(0,3);}
function buildIndex(names){
 const groups=new Map(),alias=new Map();
 function addAlias(key,legalKey){let set=alias.get(key);if(!set){set=new Set();alias.set(key,set);}set.add(legalKey);}
 for(const raw of names){
  const parts=splitListedName(raw);
  const legalKey=company.normalizeCompany(parts[0]||raw);
  if(!legalKey)continue;
  let group=groups.get(legalKey);
  if(!group){group={names:[]};groups.set(legalKey,group);}
  if(!group.names.includes(raw))group.names.push(raw);
  addAlias(legalKey,legalKey);
  for(let i=1;i<parts.length;i++){const key=company.normalizeCompany(parts[i]);if(key)addAlias(key,legalKey);}
 }
 return {groups,alias,keys:[...alias.keys()].sort()};
}
function getIndex(names){let index=indexCache.get(names);if(!index){index=buildIndex(names);indexCache.set(names,index);}return index;}
function prefixKeys(keys,query){
 const start=query+' ',end=query+'!';
 function lower(target){let lo=0,hi=keys.length;while(lo<hi){const mid=(lo+hi)>>1;if(keys[mid]<target)lo=mid+1;else hi=mid;}return lo;}
 return keys.slice(lower(start),lower(end));
}
function citation(meta){
 if(!meta||typeof meta!=='object'||Array.isArray(meta))throw new Error('名册说明无效。');
 if(typeof meta.source!=='string'||!meta.source.trim())throw new Error('名册缺少来源。');
 if(typeof meta.csvDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(meta.csvDate))throw new Error('名册缺少 CSV 日期。');
 return {source:meta.source.trim(),sourceUrl:typeof meta.sourceUrl==='string'?meta.sourceUrl:'',csvUrl:typeof meta.csvUrl==='string'?meta.csvUrl:'',csvDate:meta.csvDate,retrieved:typeof meta.retrieved==='string'?meta.retrieved:'',route:typeof meta.route==='string'&&meta.route.trim()?meta.route.trim():'Skilled Worker',licenceName:typeof meta.licenceName==='string'?meta.licenceName:''};
}
function readNote(key,notes){
 if(!notes||typeof notes!=='object'||Array.isArray(notes))return null;
 for(const [name,entry] of Object.entries(notes)){
  if(company.normalizeCompany(name)!==key||!entry||typeof entry!=='object'||Array.isArray(entry))continue;
  if(typeof entry.note==='string'&&entry.note.trim())return entry.note.trim();
 }
 return null;
}
function pack(base,extra){return {...base,matches:[],matchCount:0,ambiguous:false,matchKind:'none',note:extra.note??null,...extra};}
function summarize(ids,index){const list=[...ids];return {matchCount:list.length,matches:list.slice(0,5).map(id=>preferredName(index.groups.get(id).names))};}

function validateNotes(value){
 if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('JSON 必须是机构名到备注的对象。');
 const result=Object.create(null);
 for(const [name,entry] of Object.entries(value)){
  const key=company.normalizeCompany(name);
  if(!key||!entry||typeof entry!=='object'||Array.isArray(entry))throw new Error('机构名或备注对象无效。');
  for(const field of SCORE_FIELDS)if(Object.hasOwn(entry,field))throw new Error(name+'：不能保存评分字段。');
  const note=typeof entry.note==='string'?entry.note.replace(/\s+/g,' ').trim():'';
  if(!note||note.length>200)throw new Error(name+'：备注需为 1–200 字。');
  if(typeof entry.updated!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(entry.updated)||!Number.isFinite(Date.parse(entry.updated))||new Date(entry.updated).toISOString().slice(0,10)!==entry.updated)throw new Error(name+'：请提供有效 updated 日期（YYYY-MM-DD）。');
  if(Object.hasOwn(result,key))throw new Error('存在规范化后重复的机构名：'+name);
  result[key]={note,updated:entry.updated};
 }
 return result;
}
function parseNotesJSON(text){let value;try{value=JSON.parse(text);}catch{throw new Error('非法 JSON，请检查语法。');}return validateNotes(value);}

// yes = this name is on the bundled register. no = this snapshot has no such name.
// unknown = the LinkedIn name hits several organisations, so we do not guess.
function findSponsor(name,register,notes={}){
 if(!register||!Array.isArray(register.names))throw new Error('名册格式无效。');
 const base=citation(register.meta);
 const key=company.normalizeCompany(name);
 const note=readNote(key,notes);
 if(!key)return pack(base,{status:'unknown',confidence:'none',note});
 const index=getIndex(register.names);
 const exact=index.alias.get(key);
 if(exact&&exact.size===1){
  const id=[...exact][0],group=index.groups.get(id);
  return pack(base,{status:'yes',confidence:'high',matchKind:id===key?'legal':'trading',matches:displayNames(group.names),matchCount:1,note});
 }
 if(exact&&exact.size>1)return pack(base,{status:'unknown',confidence:'low',ambiguous:true,matchKind:'ambiguous',...summarize(exact,index),note});
 if(key.length>=3){
  const ids=new Set();
  for(const prefix of prefixKeys(index.keys,key))for(const id of index.alias.get(prefix))ids.add(id);
  if(ids.size===1){const id=[...ids][0];return pack(base,{status:'yes',confidence:'medium',matchKind:'prefix',matches:displayNames(index.groups.get(id).names),matchCount:1,note});}
  if(ids.size>1)return pack(base,{status:'unknown',confidence:'low',ambiguous:true,matchKind:'ambiguous',...summarize(ids,index),note});
 }
 return pack(base,{status:'no',confidence:'none',note});
}

function formatSponsor(result){
 const lines=[];
 if(result.status==='yes')lines.push({cls:'ok',text:'在册：是（Skilled Worker）'});
 else if(result.status==='no')lines.push({cls:'warn',text:'在册：否（这份 Skilled Worker 名册里没有该名称）'});
 else lines.push({cls:'warn',text:'在册：无法判定'});
 const confidence={high:result.matchKind==='trading'?'高（与名册中的商号 T/A 一致）':'高（与名册机构名规范化后一致）',medium:'中（没有完全同名，只对应一家更长的官方名称）',low:'低（多家机构都可能，未下结论）',none:'无'}[result.confidence]||result.confidence;
 lines.push({cls:'',text:'名称匹配置信：'+confidence});
 if(result.matches&&result.matches.length)lines.push({cls:'',text:(result.status==='yes'?'官方机构名：':'候选官方机构名：')+result.matches.join('；')});
 if(result.ambiguous&&result.matchCount>result.matches.length)lines.push({cls:'muted',text:`另有 ${result.matchCount-result.matches.length} 家未列出`});
 lines.push({cls:'',text:'来源：'+(result.source||'')});
 lines.push({cls:'',text:'CSV 日期：'+(result.csvDate||'')+(result.retrieved?'（打包于 '+result.retrieved+'）':'')});
 if(result.route)lines.push({cls:'muted',text:'路线：'+result.route+(result.licenceName?'。'+result.licenceName:'')});
 lines.push({cls:'muted',text:'这是签证担保名册查询，不是雇主评分。'});
 if(result.status==='no')lines.push({cls:'muted',text:'未在册可能是因为商号和注册名不同、快照较旧，或该雇主只在其他担保路线上。'});
 if(result.ambiguous)lines.push({cls:'muted',text:'名称对上了多家机构，所以不标成在册，也不标成不在册。'});
 if(result.note)lines.push({cls:'',text:'本地备注（非官方）：'+result.note});
 if(result.sourceUrl)lines.push({cls:'muted',text:'公开页面：'+result.sourceUrl});
 return lines;
}

const api={validateNotes,parseNotesJSON,findSponsor,formatSponsor};
Object.assign(root.EmployerRatings ||= {},api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
