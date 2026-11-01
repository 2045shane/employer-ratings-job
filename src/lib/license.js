(function(root){
'use strict';
// Public offline checksum, not a secret or a secure entitlement system.
async function issueLicense(){
 const cryptoAPI=root.crypto || (typeof require==='function'?require('node:crypto').webcrypto:null);
 const digest=new Uint8Array(await cryptoAPI.subtle.digest('SHA-256',new TextEncoder().encode('employer-ratings-job:unlock:v1')));
 return 'ERJ1.'+Array.from(digest,b=>b.toString(16).padStart(2,'0')).join('');
}
async function verifyLicense(value){const token=typeof value==='string'?value.trim():'';return /^ERJ1\.[a-f0-9]{64}$/.test(token)&&token===await issueLicense();}
const api={issueLicense,verifyLicense};Object.assign(root.EmployerRatings ||= {},api);if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
