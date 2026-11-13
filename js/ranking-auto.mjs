// One queue per browser: best pending score, automatic retry and visible-only reads.
export function createAutoRanking({getService,onRows=()=>{},onStatus=()=>{},storage,
  key='asobeat-bagless-auto-v1',setTimer=setTimeout,clearTimer=clearTimeout,pageVisible=()=>true}) {
  let queued=null,active=false,viewVersion=0,sending=false,reading=false,retryTimer=null,refreshTimer=null,failures=0;
  const valid=j=>j&&Number.isSafeInteger(j.score)&&j.score>=0&&j.score<=10000&&typeof j.name==='string';
  try{const saved=JSON.parse(storage?.getItem(key)||'null');if(valid(saved))queued=saved}catch{}
  function persist(){try{if(queued)storage?.setItem(key,JSON.stringify(queued));else storage?.removeItem(key)}catch{}}
  const status=text=>{if(active)onStatus(text)};
  function cancelRetry(){if(retryTimer!==null)clearTimer(retryTimer);retryTimer=null}
  function scheduleRetry(ms){cancelRetry();retryTimer=setTimer(()=>{retryTimer=null;flush()},Math.max(100,ms))}
  function scheduleRefresh(ms=15000){if(refreshTimer!==null)clearTimer(refreshTimer);refreshTimer=null;if(active)refreshTimer=setTimer(()=>{refreshTimer=null;refresh()},ms)}
  async function refresh(){
    if(!active)return;
    if(sending||reading||!pageVisible()){scheduleRefresh();return}
    reading=true;const version=viewVersion;
    try{const s=await getService();if(!s.configured()){status('オンラインランキングは準備中です。自己ベストはこの端末に保存されています。');return}
      const top=await s.loadTop();if(active&&version===viewVersion){onRows(top);if(!queued)status('記録を自動更新済み・上位100件を表示')}}
    catch{if(version===viewVersion)status('ランキングを取得できません。通信が戻り次第、自動更新します。')}
    finally{reading=false;scheduleRefresh(version===viewVersion?15000:100)}
  }
  async function flush(){
    if(sending||!queued)return;
    cancelRetry();sending=true;const job=queued;
    try{
      const s=await getService();
      if(!s.configured()){status('オンラインランキングは準備中です。自己ベストはこの端末に保存されています。');return}
      status('記録を自動更新中…');const result=await s.submitBest(job.score,job.name);
      if(queued===job){queued=null;persist()}
      failures=0;status(queued?'新しい記録を自動更新中…':`ベスト ${result.score} 個を自動更新しました`);
    }catch(error){
      failures++;const ms=error?.code==='ranking/rate-limited'?Math.max(1000,error.retryAfterMs+250):Math.min(120000,5000*2**Math.min(failures-1,5));
      status(error?.code==='ranking/rate-limited'?'投稿間隔の制限により待機中です。自動で再送します。':'通信できないため送信待ちです。通信が戻り次第、自動で再送します。');scheduleRetry(ms);
    }finally{
      sending=false;
      if(queued&&queued!==job&&retryTimer===null)scheduleRetry(100);
      if(active)refresh();
    }
  }
  return {
    showResult(score,name){
      active=true;viewVersion++;
      if(!Number.isSafeInteger(score)||score<0||score>10000){status('この記録はランキングに登録できません。');return Promise.resolve()}
      queued={score:Math.max(score,queued?.score??0),name:String(name||'ゲスト').slice(0,16)};persist();
      onRows([]);return flush();
    },
    cancelView(){active=false;viewVersion++;if(refreshTimer!==null)clearTimer(refreshTimer);refreshTimer=null},
    retry(){if(queued)return flush();return refresh()},refresh,
    pending:()=>queued?{...queued}:null
  };
}
