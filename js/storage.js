(()=>{'use strict';
const KEY='asobeat_bagless_v1',defaults={best:0,name:'匿名',sound:true,ranks:[]};let data={...defaults},error=false;
try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');if(saved&&typeof saved==='object')data={...data,...saved}}catch{error=true}
const normalizeName=name=>String(name||'').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'').trim().slice(0,12).replace(/[\ud800-\udbff]$/,'')||'匿名';
data.name=normalizeName(data.name);if(data.name==='ゲスト')data.name='匿名';data.sound=data.sound!==false;
const valid=(Array.isArray(data.ranks)?data.ranks:[]).filter(r=>r&&Number.isSafeInteger(r.score)&&r.score>=0&&typeof r.name==='string').sort((a,b)=>b.score-a.score||(a.date||0)-(b.date||0));
data.best=Math.max(Number.isSafeInteger(data.best)?Math.max(0,data.best):0,valid[0]?.score||0);
// Migrate old TOP10 without losing the highest record or unknown saved fields.
data.ranks=data.best>0?[valid[0]?.score===data.best?{...valid[0],name:valid[0].name.slice(0,12)}:{name:data.name,score:data.best,date:0}]:[];
function persist(){try{localStorage.setItem(KEY,JSON.stringify(data));error=false;return true}catch{error=true;return false}}
window.BagStorage={get:()=>({...data,ranks:data.ranks.map(x=>({...x}))}),getError:()=>error,
setName(name){data.name=normalizeName(name);if(data.ranks.length)data.ranks[0]={...data.ranks[0],name:data.name};return persist()},
setSound(on){data.sound=!!on;return persist()},
record(score){if(!Number.isSafeInteger(score)||score<0)return{best:false,ok:false,data:this.get()};const best=score>data.best;
 if(best){data.best=score;data.ranks=[{name:data.name,score,date:Date.now()}]}
 const ok=persist();return{best,ok,data:this.get()}}
};})();
