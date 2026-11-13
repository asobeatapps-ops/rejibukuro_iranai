const req=require;
const {initializeTestEnvironment,assertFails,assertSucceeds}=req('@firebase/rules-unit-testing');
const {doc,getDoc,setDoc,deleteDoc,getDocs,collection,query,orderBy,limit,writeBatch,serverTimestamp,Timestamp,setLogLevel}=req('firebase/firestore');
const fs=require('fs'),assert=require('node:assert/strict');setLogLevel('silent');
(async()=>{const results=[];
for(const[game,max]of[['bagless',10000]]){let checks=0;const pid='demo-bagless-ranking';const env=await initializeTestEnvironment({projectId:pid,firestore:{host:'127.0.0.1',port:Number((process.env.FIRESTORE_EMULATOR_HOST||'127.0.0.1:8085').split(':').at(-1)),rules:fs.readFileSync(require('node:path').join(__dirname,'../firestore.rules'),'utf8')}});
try{await env.clearFirestore();const a=env.authenticatedContext('alice').firestore(),b=env.authenticatedContext('bob').firestore(),guest=env.unauthenticatedContext().firestore();
const record=(score=10,name='Alice')=>({name,score,achievedAt:serverTimestamp()});
async function denied(p){await assertFails(p);checks++;}async function allowed(p){const r=await assertSucceeds(p);checks++;return r;}
function pair(db,uid,data,lock={lastSubmittedAt:serverTimestamp()}){const batch=writeBatch(db);batch.set(doc(db,'leaderboard',uid),data);batch.set(doc(db,'submissionLocks',uid),lock);return batch.commit();}
const age=()=>env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),'submissionLocks','alice'),{lastSubmittedAt:Timestamp.fromMillis(Date.now()-11000)}));
await denied(setDoc(doc(a,'leaderboard','alice'),record()));
await denied(setDoc(doc(a,'submissionLocks','alice'),{lastSubmittedAt:serverTimestamp()}));
await denied(pair(guest,'alice',record()));await denied(pair(b,'alice',record()));
for(const score of[-1,1.5,max+1])await denied(pair(a,'alice',record(score)));
if(game==='slot_bakuhatu')for(const score of[1,9,938794,999999])await denied(pair(a,'alice',record(score)));
for(const name of['',' '.repeat(5),'x'.repeat(17),'line\nname','A\u202eB','A\u200bB'])await denied(pair(a,'alice',record(10,name)));
await denied(pair(a,'alice',{...record(),extra:true}));await denied(pair(a,'alice',{score:10,achievedAt:serverTimestamp()}));
await denied(pair(a,'alice',{...record(),achievedAt:Timestamp.fromMillis(0)}));
await denied(pair(a,'alice',record(),{lastSubmittedAt:Timestamp.fromMillis(0)}));
await denied(pair(a,'alice',record(),{lastSubmittedAt:serverTimestamp(),admin:true}));
await allowed(pair(a,'alice',record(0)));
await denied(pair(a,'alice',record(100)));await denied(setDoc(doc(a,'leaderboard','alice'),record(100)));
await denied(deleteDoc(doc(a,'submissionLocks','alice')));await denied(deleteDoc(doc(a,'leaderboard','alice')));
await denied(getDoc(doc(b,'submissionLocks','alice')));await denied(getDoc(doc(guest,'submissionLocks','alice')));await denied(getDocs(collection(a,'submissionLocks')));
await allowed(getDoc(doc(a,'submissionLocks','alice')));
await age();await denied(pair(a,'alice',record(0))); // same score cannot rewrite achievedAt
const initial=(await getDoc(doc(a,'leaderboard','alice'))).data();await allowed(pair(a,'alice',{...initial,name:'Alice 2'}));
const renamed=(await getDoc(doc(a,'leaderboard','alice'))).data();assert.equal(renamed.achievedAt.toMillis(),initial.achievedAt.toMillis());
await denied(pair(a,'alice',{...renamed,name:'Spam'}));
await age();await allowed(pair(a,'alice',record(9999)));
await age();await denied(pair(a,'alice',record(10)));
await allowed(pair(a,'alice',record(max)));
await allowed(pair(b,'bob',record(max,'Bob')));
const top=await allowed(getDocs(query(collection(a,'leaderboard'),orderBy('score','desc'),orderBy('achievedAt','asc'),limit(100))));assert.equal(top.size,2);assert.equal(top.docs[0].id,'alice');
await denied(getDoc(doc(guest,'leaderboard','alice')));await denied(getDocs(query(collection(guest,'leaderboard'),limit(100))));await denied(getDocs(collection(guest,'leaderboard')));await denied(getDocs(query(collection(guest,'leaderboard'),limit(101))));
await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),'leaderboard','legacy'),{name:'Legacy',score:100,achievedAt:Timestamp.fromMillis(0)}));
const legacy=env.authenticatedContext('legacy').firestore();await allowed(pair(legacy,'legacy',record(200,'Legacy')));
const emoji=env.authenticatedContext('emoji').firestore();await denied(pair(emoji,'emoji',record(10,'😀'.repeat(16))));await allowed(pair(emoji,'emoji',record(10,'😀'.repeat(8))));
await denied(setDoc(doc(a,'other','alice'),record()));await denied(setDoc(doc(a,'leaderboard','alice','hidden','x'),{admin:true}));
results.push({game,checks,status:'PASS'});console.log('PASS',game,checks);
}finally{await env.cleanup();}}
console.log(JSON.stringify(results));})().catch(e=>{console.error(e);process.exitCode=1});
