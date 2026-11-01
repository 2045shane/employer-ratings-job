(function(root){
'use strict';
function normalizeCompany(value){return String(value||'').normalize('NFKC').toLowerCase().replace(/&/g,' and ').replace(/\b(incorporated|inc|llc|ltd|corp|corporation|gmbh|limited)\b\.?/g,' ').replace(/有限公司/g,' ').replace(/[.,，]/g,' ').replace(/\s+/g,' ').trim();}
const api={normalizeCompany};
Object.assign(root.EmployerRatings ||= {},api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
