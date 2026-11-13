(()=>{'use strict';const $=id=>document.getElementById(id);const hide=(id,on)=>$(id).classList.toggle('hidden',!!on);let introTimeout=0,flashTimeout=0;let profile=BagStorage.get();BagAudio.setEnabled(profile.sound);let latestScore=0;
function syncSound(){profile=BagStorage.get();$('titleSound').textContent=profile.sound?'♪ SOUND ON':'♪ SOUND OFF';$('soundHud').textContent=profile.sound?'♪':'♪̸';$('soundHud').setAttribute('aria-label',profile.sound?'音をオフにする':'音をオンにする')}
function syncBest(){profile=BagStorage.get();$('titleBest').textContent=profile.best}
function award(score){return score===0?'レジ袋、ください':score<=3?'エコ初心者':score<=6?'素手の達人':score<=9?'限界買い物客':score<=14?'人間エコバッグ':'レジ袋という概念を超えた'}
function renderRanks(ranks){const container=$('rankingRows');container.replaceChildren();if(!ranks.length){let p=document.createElement('div');p.className='rank-row';p.textContent='まだ記録がありません';container.appendChild(p);return}ranks.forEach((r,i)=>{const row=document.createElement('div');row.className='rank-row';const a=document.createElement('span'),b=document.createElement('b');const rank=1+ranks.filter(k=>k.score>r.score).length;a.textContent=`${rank}. ${r.name}`;b.textContent=`${r.score} 個`;row.append(a,b);container.appendChild(row)})}
const game=new BagGame($('game'),{
 onIntro(speaker,text){hide('introSpeech',!speaker);if(speaker){$('speakerName').textContent=speaker;$('speechText').textContent=text}},
 onPlay(){hide('tip',false);setTimeout(()=>hide('tip',true),1700)},
 onNext(name){$('nextName').textContent=name},
 onThrow(name){$('nextLabel').textContent='NEXT';},
 onScore(n,name){$('scoreHud').textContent=String(n).padStart(2,'0');$('nextName').textContent=name;if(n>0){hide('banner',false);$('banner').textContent=`${n} CATCH!`;clearTimeout(flashTimeout);flashTimeout=setTimeout(()=>hide('banner',true),440)}},
 onGameOver(){hide('tip',true);hide('banner',false);$('banner').textContent='GAME OVER';clearTimeout(flashTimeout);flashTimeout=setTimeout(()=>hide('banner',true),900)},
 onError(msg){console.warn(msg)},
 onResult(score){latestScore=score;const r=BagStorage.record(score);if(r.best)BagAudio.play('best');hide('titleScreen',true);hide('hud',true);hide('resultScreen',false);$('resultScore').textContent=score;$('resultBest').textContent=r.data.best;$('resultTitle').textContent=award(score);$('resultPlayer').textContent=r.data.name;hide('newBest',!r.best);renderRanks(r.data.ranks);syncBest()}
});new BagInput($('game'),game);
function start(){BagAudio.unlock();BagAudio.play('click');hide('resultScreen',true);hide('titleScreen',true);hide('hud',false);hide('banner',true);game.start()}
$('startBtn').addEventListener('click',start);$('retryBtn').addEventListener('click',start);$('homeBtn').addEventListener('click',()=>{BagAudio.stopMusic();game.state='title';game.physics.clear();game.effects.reset();hide('titleScreen',false);hide('resultScreen',true);hide('hud',true);hide('banner',true);syncBest()});
function soundToggle(){profile=BagStorage.get();const next=!profile.sound;BagAudio.setEnabled(next);BagStorage.setSound(next);if(next){BagAudio.unlock();if(game.state==='play')BagAudio.startMusic();BagAudio.play('click')}else BagAudio.stopMusic();syncSound()}
$('titleSound').addEventListener('click',soundToggle);$('soundHud').addEventListener('click',soundToggle);
function modal(show){hide('nameModal',!show);if(show){$('playerName').value=BagStorage.get().name;$('playerName').focus()}}
$('nameBtn').addEventListener('click',()=>modal(true));$('cancelName').addEventListener('click',()=>modal(false));$('saveName').addEventListener('click',()=>{BagStorage.setName($('playerName').value);modal(false)});$('playerName').addEventListener('keydown',e=>{if(e.key==='Enter'){BagStorage.setName(e.target.value);modal(false)}});syncSound();syncBest();renderRanks(profile.ranks);})();
