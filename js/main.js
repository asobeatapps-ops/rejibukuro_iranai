(()=>{'use strict';
const $=id=>document.getElementById(id),hide=(id,on)=>$(id).classList.toggle('hidden',!!on);
let flashTimeout=0,profile=BagStorage.get(),latestScore=0;
BagAudio.setEnabled(profile.sound);
function syncSound(){profile=BagStorage.get();$('titleSound').textContent=profile.sound?'♪ SOUND ON':'♪ SOUND OFF';$('soundHud').textContent=profile.sound?'♪':'♪̸';$('soundHud').setAttribute('aria-label',profile.sound?'音をオフにする':'音をオンにする')}
function syncBest(){profile=BagStorage.get();$('titleBest').textContent=profile.best}
function award(score){return score===0?'レジ袋、ください':score<=3?'エコ初心者':score<=6?'素手の達人':score<=9?'限界買い物客':score<=14?'人間エコバッグ':'レジ袋という概念を超えた'}
function renderRanks(ranks){
 const container=$('rankingRows');container.replaceChildren();
 if(!ranks.length){const p=document.createElement('div');p.className='rank-row';p.textContent='まだ記録がありません';container.append(p);return}
 ranks.forEach(r=>{const row=document.createElement('div'),name=document.createElement('span'),score=document.createElement('b');row.className='rank-row';name.textContent=`1. ${r.name}`;score.textContent=`${r.score} 個`;row.append(name,score);container.append(row)});
}
function updateShare(){
 const url=new URL('https://x.com/intent/tweet');
 url.searchParams.set('text',`『レジ袋いりません。』で${latestScore}個キャッチ！\n称号「${award(latestScore)}」`);
 url.searchParams.set('url','https://asobeatapps-ops.github.io/rejibukuro_iranai/');
 url.searchParams.set('hashtags','レジ袋いらない');$('shareX').href=url.href;
}
function drawTitleGoods(){
 const canvas=$('titleGoods'),rect=canvas.getBoundingClientRect(),w=rect.width||145,h=rect.height||110,dpr=Math.min(2,devicePixelRatio||1);
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const scale=Math.min(w/1.2,h),cam={scale,toScreen:(x,y)=>({x:w/2+x*scale,y:h/2+y*scale})},preview=new BagPhysics.Physics();
 // Same goods specifications, collision outlines and artwork as the play screen.
 for(const[index,x,y,angle]of[[2,0,-.20,.12],[3,.23,.18,-.10],[4,-.27,.18,-.20]]){
  const spec=BagGoods.specAt(index),b=preview.spawn(spec,x,y,spec.physicalMass);b.spec=spec;b.angle=angle;BagArt.drawItem(ctx,b,cam);
 }
}
const game=new BagGame($('game'),{
 onIntro(speaker,text){hide('introSpeech',!speaker);if(speaker){$('speakerName').textContent=speaker;$('speechText').textContent=text}},
 onBombWarning(show){hide('bombWarning',!show)},
 onPlay(){hide('tip',false);setTimeout(()=>hide('tip',true),1700)},
 onNext(name){$('nextName').textContent=name},
 onThrow(){$('nextLabel').textContent='NEXT'},
 onScore(n,name){$('scoreHud').textContent=String(n).padStart(2,'0');$('nextName').textContent=name;if(n>0){hide('banner',false);$('banner').textContent=`${n} CATCH!`;clearTimeout(flashTimeout);flashTimeout=setTimeout(()=>hide('banner',true),440)}},
 onGameOver(){hide('tip',true);hide('banner',false);$('banner').textContent='GAME OVER';clearTimeout(flashTimeout);flashTimeout=setTimeout(()=>hide('banner',true),900)},
 onError(msg){console.warn(msg)},
 onResult(score){
  latestScore=score;const r=BagStorage.record(score);BagRanking.showResult(score,r.data.name);if(r.best)BagAudio.play('best');
  hide('titleScreen',true);hide('hud',true);hide('resultScreen',false);
  $('resultScore').textContent=score;$('resultBest').textContent=r.data.best;$('resultTitle').textContent=award(score);$('resultPlayer').textContent=r.data.name;
  $('playerName').value=r.data.name==='匿名'?'':r.data.name;$('nameStatus').textContent='';
  hide('newBest',!r.best);renderRanks(r.data.ranks);syncBest();updateShare();
 }
});
new BagInput($('game'),game);
function start(){hide('bombWarning',true);BagRanking.cancelView();BagAudio.unlock();BagAudio.play('click');hide('resultScreen',true);hide('titleScreen',true);hide('hud',false);hide('banner',true);game.start()}
$('startBtn').addEventListener('click',start);$('retryBtn').addEventListener('click',start);
$('homeBtn').addEventListener('click',()=>{BagAudio.stopMusic();BagRanking.cancelView();hide('bombWarning',true);game.state='title';game.physics.clear();game.effects.reset();hide('titleScreen',false);hide('resultScreen',true);hide('hud',true);hide('banner',true);syncBest();drawTitleGoods()});
function soundToggle(){profile=BagStorage.get();const next=!profile.sound;BagAudio.setEnabled(next);BagStorage.setSound(next);if(next){BagAudio.unlock();if(['intro','play'].includes(game.state))BagAudio.startMusic();BagAudio.play('click')}else BagAudio.stopMusic();syncSound()}
$('titleSound').addEventListener('click',soundToggle);$('soundHud').addEventListener('click',soundToggle);
$('resultNameForm').addEventListener('submit',event=>{
 event.preventDefault();if(game.state!=='result')return;
 const saved=BagStorage.setName($('playerName').value),data=BagStorage.get();
 $('resultPlayer').textContent=data.name;$('playerName').value=data.name==='匿名'?'':data.name;
 $('nameStatus').textContent=`名前を「${data.name}」に登録しました。`+(saved?'':'次回は再入力が必要です。');
 renderRanks(data.ranks);BagRanking.showResult(latestScore,data.name);
});
window.addEventListener('resize',drawTitleGoods,{passive:true});
syncSound();syncBest();renderRanks(profile.ranks);drawTitleGoods();
})();
