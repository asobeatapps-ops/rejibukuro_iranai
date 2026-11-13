(()=>{'use strict';
let controllerPromise,viewEpoch=0,latest=null;
const el=id=>document.getElementById(id);
function rows(records){const root=el('onlineRows');root.replaceChildren();if(!records.length){const p=document.createElement('p');p.className='ranking-note';p.textContent='まだ記録がありません';root.append(p);return}let rank=1;records.forEach((r,i)=>{if(i&&r.score!==records[i-1].score)rank=i+1;const row=document.createElement('div');row.className='rank-row'+(r.isMe?' is-me':'');const name=document.createElement('span'),score=document.createElement('b');name.textContent=`${rank}. ${r.name}${r.isMe?'（あなた）':''}`;score.textContent=`${r.score} 個`;row.append(name,score);root.append(row)})}
function controller(){return controllerPromise??=(async()=>{
 const[{createLeaderboard},{createAutoRanking}]=await Promise.all([import('./leaderboard-service.mjs?v=auto-holder-5'),import('./ranking-auto.mjs?v=auto-holder-5')]);
 let storage;try{storage=localStorage}catch{}
 const config=window.BagRankingConfig||{},api=createLeaderboard({config,gameId:'bagless-bombs-v1',maxScore:10000});
 return createAutoRanking({getService:async()=>api,storage,key:'asobeat-auto:'+config.projectId+':bagless-bombs-v1',onRows:rows,onStatus:text=>{el('rankingStatus').textContent=text},pageVisible:()=>!document.hidden});
})().catch(e=>{controllerPromise=null;throw e})}
async function show(score,name,token){try{const c=await controller();if(token===viewEpoch)await c.showResult(score,name)}catch{if(token===viewEpoch)el('rankingStatus').textContent='通信が戻り次第、自動更新します。'}}
window.BagRanking={showResult(score,name){const token=++viewEpoch;latest={score,name,token};el('rankingStatus').textContent='記録を自動更新中…';rows([]);show(score,name,token)},cancelView(){latest=null;viewEpoch++;controllerPromise?.then(c=>c.cancelView()).catch(()=>{})}};
window.addEventListener('online',()=>{controller().then(c=>c.retry()).catch(()=>{if(latest)show(latest.score,latest.name,latest.token)})});
controller().then(c=>c.retry()).catch(()=>{});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&latest)controller().then(c=>c.retry()).catch(()=>show(latest.score,latest.name,latest.token))});
})();
