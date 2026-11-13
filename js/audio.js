(()=>{'use strict';let ctx=null,enabled=true,musicTimer=0,musicStart=0,musicWanted=false,nextBeat=0;const Audio=window.BagAudio={};Audio.setEnabled=on=>{enabled=!!on;if(!enabled)Audio.stopMusic()};Audio.unlock=()=>{if(!enabled)return Promise.resolve();try{ctx=ctx||new(window.AudioContext||window.webkitAudioContext)();const ready=ctx.state==='running'?Promise.resolve():ctx.resume();return ready.then(()=>{if(musicWanted)beginMusic()}).catch(()=>{})}catch(e){return Promise.resolve()}};function tone(freq,when,dur=.11,type='sine',gain=.05,endFreq){if(!enabled||!ctx)return;try{const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,when);if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),when+dur);g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.001,gain),when+.012);g.gain.exponentialRampToValueAtTime(.0001,when+dur);o.connect(g);g.connect(ctx.destination);o.start(when);o.stop(when+dur+.015)}catch(e){}}Audio.play=(name,strength=1)=>{if(!enabled||!ctx)return;const now=ctx.currentTime;switch(name){case 'talk':tone(420,now,.08,'square',.012);tone(510,now+.11,.065,'square',.01);break;case 'throw':tone(490,now,.18,'triangle',.055,210);break;case 'hit':tone(130+strength*25,now,.10,'triangle',Math.min(.13,.03+strength*.025),60);break;case 'catch':tone(540,now,.07,'sine',.055);tone(815,now+.085,.17,'sine',.055);break;case 'fail':tone(350,now,.23,'sawtooth',.07,110);tone(170,now+.19,.32,'triangle',.06,55);break;case 'best':[650,820,1030].forEach((f,i)=>tone(f,now+i*.12,.24,'triangle',.058));break;case 'click':tone(720,now,.06,'sine',.04);break}};// 132 BPM pop loop: audible melody, bass, soft offbeats and a light kick.
// Schedule slightly ahead after the context resumes (especially on iOS Safari).
const beat=60/132/2;
const melody=[72,76,79,76,81,79,76,74,69,72,76,72,77,76,72,69,65,69,72,76,77,76,72,69,67,71,74,79,77,74,71,74];
const roots=[48,45,41,43],hz=m=>440*2**((m-69)/12);
function beginMusic(){
 if(!enabled||!musicWanted||!ctx||ctx.state!=='running'||musicTimer)return;
 musicStart=0;nextBeat=ctx.currentTime+.04;
 function tick(){
  if(!enabled||!musicWanted||ctx.state!=='running')return;
  if(nextBeat<ctx.currentTime-.1)nextBeat=ctx.currentTime+.04;
  while(nextBeat<ctx.currentTime+.22){
   const i=musicStart++,t=nextBeat,root=roots[Math.floor(i/8)%roots.length];
   tone(hz(melody[i%melody.length]),t,beat*.78,'triangle',.060);
   if(i%2===0){tone(hz(root+(i%4===2?7:0)),t,beat*1.4,'triangle',.072);tone(110,t,.09,'sine',.060,42)}
   else tone(1800,t,.035,'square',.005,900);
   if(i%4===2)for(const offset of[12,16,19])tone(hz(root+offset),t,.12,'sine',.015);
   nextBeat+=beat;
  }
 }
 tick();musicTimer=setInterval(tick,100);
}
Audio.startMusic=()=>{if(!enabled)return;musicWanted=true;Audio.unlock()};
Audio.stopMusic=()=>{musicWanted=false;if(musicTimer){clearInterval(musicTimer);musicTimer=0}};
})();
