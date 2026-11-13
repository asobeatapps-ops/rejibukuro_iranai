(()=>{'use strict';
// Canvas-only 2D illustration. Geometry stays in world units; no image downloads,
// WebGL, whole-screen blur, or visual position correction of physics bodies.
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function round(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function ellipse(ctx,x,y,rx,ry,fill){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fillStyle=fill;ctx.fill()}
function path(ctx,points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.stroke()}}
function gradient(ctx,x0,y0,x1,y1,stops){const g=ctx.createLinearGradient(x0,y0,x1,y1);stops.forEach(([at,c])=>g.addColorStop(at,c));return g}
function line(ctx,points,color,width){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.stroke()}
function drawItem(ctx,b,cam){
 const spec=b.spec,pos=cam.toScreen(b.x,b.y),w=b.w*cam.scale,h=b.h*cam.scale;
 ctx.save();ctx.translate(pos.x,pos.y);ctx.rotate(b.angle);
 const outline=()=>{ctx.beginPath();b.shape.forEach((v,i)=>i?ctx.lineTo(v.x*cam.scale,v.y*cam.scale):ctx.moveTo(v.x*cam.scale,v.y*cam.scale));ctx.closePath()};
 outline();ctx.shadowColor='#10283145';ctx.shadowBlur=Math.min(8,cam.scale*.09);ctx.shadowOffsetY=Math.max(1,cam.scale*.025);ctx.fillStyle=spec.color;ctx.fill();ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetY=0;
 ctx.save();outline();ctx.clip();
 ctx.fillStyle=gradient(ctx,-w*.5,-h*.45,w*.5,h*.48,[[0,'#ffffff62'],[.32,'#ffffff0a'],[.67,'#102b3608'],[1,'#142a365d']]);ctx.fillRect(-w/2,-h/2,w,h);
 const edge=Math.max(1,Math.min(w,h)*.05);ctx.lineWidth=edge;ctx.strokeStyle='#ffffff62';ctx.beginPath();ctx.moveTo(-w*.43,h*.32);ctx.lineTo(-w*.43,-h*.38);ctx.lineTo(w*.32,-h*.38);ctx.stroke();
 if(spec.tag==='MELON'){
  const light=ctx.createRadialGradient(-w*.19,-h*.23,1,0,0,Math.max(w,h)*.6);light.addColorStop(0,'#d1e18c99');light.addColorStop(.55,'#8eae4840');light.addColorStop(1,'#123d3766');ctx.fillStyle=light;ctx.fillRect(-w/2,-h/2,w,h);
  ctx.lineWidth=Math.max(1,w*.045);ctx.strokeStyle='#255642c9';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(w*i*.13,-h*.48);ctx.bezierCurveTo(w*(i*.18-.08),-h*.2,w*(i*.18+.08),h*.2,w*i*.13,h*.48);ctx.stroke()}
  ellipse(ctx,-w*.19,-h*.22,w*.10,h*.045,'#f2f5b65e');
 }else if(spec.tag==='CAN'||spec.tag==='ROLL'){
  if(spec.tag==='CAN'){ctx.fillStyle='#dce8d3';ctx.fillRect(-w*.45,-h*.13,w*.9,h*.38);line(ctx,[[-w*.4,-h*.17],[w*.4,-h*.17]],'#607f7d',Math.max(1,h*.025));}
  ctx.lineWidth=Math.max(1,w*.035);ctx.strokeStyle='#ffffffb0';ctx.beginPath();ctx.ellipse(0,0,w*.37,h*.37,0,0,TAU);ctx.stroke();ctx.strokeStyle='#48606b66';ctx.beginPath();ctx.ellipse(w*.025,h*.025,w*.29,h*.29,0,0,TAU);ctx.stroke();
  if(spec.tag==='ROLL'){ellipse(ctx,0,0,w*.13,h*.13,'#a68873');ellipse(ctx,-w*.015,-h*.015,w*.08,h*.08,'#5a625e');}
 }else if(spec.tag==='MILK'){
  path(ctx,[[-w*.5,-h*.5],[0,-h*.32],[w*.5,-h*.5]],'#ffffffb0');line(ctx,[[0,-h*.32],[0,-h*.49]],'#7eaaa5',Math.max(1,w*.025));
  round(ctx,-w*.35,-h*.19,w*.7,h*.49,Math.max(1,w*.035),'#4e9fbc');path(ctx,[[0,-h*.14],[-w*.13,h*.06],[0,h*.14],[w*.13,h*.06]],'#effaf7');
 }else if(spec.tag==='BREAD'){
  round(ctx,-w*.42,-h*.31,w*.84,h*.63,Math.max(2,h*.12),'#f9e7bb');
  for(let i=0;i<3;i++){round(ctx,-w*.34+i*w*.22,-h*.24,w*.24,h*.51,Math.max(2,h*.09),'#d99d57');round(ctx,-w*.31+i*w*.22,-h*.20,w*.18,h*.42,Math.max(1,h*.08),'#ffe6b1');}
  line(ctx,[[-w*.44,-h*.43],[w*.44,-h*.43]],'#ffffffbd',Math.max(1,h*.035));
 }else if(spec.tag==='SWEET'){
  round(ctx,-w*.4,-h*.31,w*.8,h*.58,Math.max(1,w*.04),'#c85955');ellipse(ctx,-w*.12,-h*.04,w*.14,h*.16,'#fbd796');ellipse(ctx,w*.14,h*.07,w*.13,h*.14,'#f9cd82');
  line(ctx,[[-w*.45,-h*.43],[w*.45,-h*.43]],'#fff3cc',Math.max(1,h*.045));
 }else if(spec.tag==='SOAP'){
  round(ctx,-w*.30,-h*.11,w*.60,h*.46,Math.max(1,w*.08),'#f5f6d9');ellipse(ctx,0,h*.08,w*.14,h*.12,'#6caea8');round(ctx,-w*.25,-h*.48,w*.50,h*.13,Math.max(1,h*.03),'#54939d');
 }else if(spec.tag==='TV'){
  round(ctx,-w*.43,-h*.38,w*.86,h*.76,Math.max(1,w*.04),'#233b48');round(ctx,-w*.35,-h*.29,w*.70,h*.53,Math.max(1,w*.025),gradient(ctx,-w*.3,-h*.2,w*.3,h*.25,[[0,'#a7d7d4'],[.5,'#4d8fa3'],[1,'#3a597a']]));
  path(ctx,[[-w*.31,-h*.25],[-w*.02,-h*.25],[-w*.21,h*.20],[-w*.31,h*.20]],'#e7ffff47');ellipse(ctx,w*.29,h*.30,Math.max(1,w*.015),Math.max(1,w*.015),'#9cd9b2');
 }else if(spec.tag==='CAR'){
  round(ctx,-w*.42,-h*.12,w*.84,h*.36,Math.max(2,h*.12),gradient(ctx,0,-h*.1,0,h*.24,[[0,'#f7c8a0'],[1,'#b7674d']]));path(ctx,[[-w*.27,-h*.1],[-w*.16,-h*.33],[w*.18,-h*.33],[w*.30,-h*.1]],'#b8dedb');line(ctx,[[0,-h*.30],[0,-h*.1]],'#4f737e',Math.max(1,w*.02));
  for(const x of[-w*.27,w*.27]){ellipse(ctx,x,h*.23,w*.10,h*.13,'#263740');ellipse(ctx,x,h*.23,w*.05,h*.07,'#a1b2b5');}
 }else if(['RICE','BASKET','SOFA'].includes(spec.tag)){
  round(ctx,-w*.33,-h*.25,w*.66,h*.5,Math.max(1,w*.06),spec.tag==='RICE'?'#f6efd7':spec.tag==='SOFA'?'#af746f':'#a9d4d0');
  if(spec.tag==='BASKET'){for(let i=0;i<4;i++)round(ctx,-w*.27+i*w*.15,-h*.14,w*.08,h*.30,1,'#4d8e95');}
  else{line(ctx,[[-w*.4,-h*.28],[-w*.25,-h*.37],[w*.25,-h*.37],[w*.40,-h*.28]],'#fff5',Math.max(1,w*.02));line(ctx,[[-w*.36,h*.27],[0,h*.34],[w*.36,h*.27]],'#826b6b77',Math.max(1,w*.02));}
 }else{
  ctx.fillStyle='#fff1c72e';ctx.fillRect(-w*.12,-h*.5,w*.24,h);
  line(ctx,[[-w*.48,-h*.27],[w*.48,-h*.27]],'#694f4670',Math.max(1,h*.025));line(ctx,[[-w*.27,-h*.46],[-w*.27,h*.46]],'#fff4',Math.max(1,w*.025));
  if(spec.tag==='FREEZER'){round(ctx,-w*.35,-h*.35,w*.7,h*.70,Math.max(1,w*.025),'#e5eeeb88');round(ctx,w*.19,-h*.10,w*.04,h*.21,1,'#7c9c9c');}
  if(spec.tag==='BED'){round(ctx,-w*.37,-h*.30,w*.74,h*.58,2,'#d9e6cbaa');round(ctx,-w*.30,-h*.23,w*.24,h*.46,2,'#fff4d8');}
 }
 ctx.restore();outline();ctx.strokeStyle='#213a4b99';ctx.lineWidth=Math.max(1,cam.scale*.014);ctx.stroke();
 if(w>28&&h>22){const font=clamp(Math.min(h*.20,w*.16),7,15);ctx.font=`800 ${font}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=Math.max(2,font*.24);ctx.strokeStyle='#17323e9c';ctx.strokeText(spec.tag,0,h*.17);ctx.fillStyle='#fff9ec';ctx.fillText(spec.tag,0,h*.17);}
 ctx.restore();
}
// Eyes, hair, and clothes are layered paths, not fonts or external sprites.
function face(ctx,cx,cy,scale,{clerk=false}={}){
 ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);ctx.lineWidth=.025;ctx.lineJoin='round';
 const skin=gradient(ctx,-.17,-.20,.18,.21,[[0,'#ffe3c9'],[.55,'#f3c2a2'],[1,'#ce907f']]);
 ellipse(ctx,0,-.04,.19,.25,clerk?'#4f3c3a':'#263444');
 for(const x of[-.165,.165]){ellipse(ctx,x,.015,.032,.060,'#e8ac91');line(ctx,[[x,.005],[x*.98,.036]],'#bd7f73',.009);}
 ctx.beginPath();ctx.moveTo(-.157,-.12);ctx.bezierCurveTo(-.18,.04,-.13,.20,-.025,.232);ctx.quadraticCurveTo(0,.245,.025,.232);ctx.bezierCurveTo(.13,.20,.18,.04,.157,-.12);ctx.closePath();ctx.fillStyle=skin;ctx.fill();ctx.strokeStyle='#946c6a';ctx.lineWidth=.009;ctx.stroke();
 // Soft cheek shading and a small nose bridge avoid a flat round face.
 ellipse(ctx,-.105,.10,.038,.018,'#d88c8255');ellipse(ctx,.105,.10,.038,.018,'#d88c8255');line(ctx,[[.012,.025],[.021,.086],[.004,.093]],'#c48a7a',.009);
 for(const x of[-.074,.074]){
  ctx.beginPath();ctx.moveTo(x-.040,.024);ctx.quadraticCurveTo(x,.002,x+.040,.028);ctx.quadraticCurveTo(x,.064,x-.040,.024);ctx.fillStyle='#fff8ed';ctx.fill();ctx.strokeStyle='#45404a';ctx.lineWidth=.010;ctx.stroke();
  ellipse(ctx,x+.004,.030,.018,.027,clerk?'#647b65':'#547f85');ellipse(ctx,x+.005,.034,.008,.017,'#273a45');ellipse(ctx,x-.002,.020,.006,.009,'#ffffff');line(ctx,[[x-.035,-.016],[x+.030,-.020]],'#4b4145',.012);
 }
 ctx.beginPath();ctx.moveTo(-.038,.143);ctx.quadraticCurveTo(0,.174,.040,.143);ctx.strokeStyle='#a26362';ctx.lineWidth=.012;ctx.stroke();line(ctx,[[-.014,.190],[.020,.190]],'#fff1dc77',.006);
 const hair=gradient(ctx,-.18,-.28,.16,.02,[[0,clerk?'#745149':'#45505d'],[.46,clerk?'#4f3735':'#263440'],[1,clerk?'#342b32':'#182834']]);
 ctx.beginPath();ctx.moveTo(-.18,.02);ctx.bezierCurveTo(-.235,-.26,-.10,-.34,.075,-.27);ctx.bezierCurveTo(.23,-.26,.23,-.08,.17,.06);ctx.lineTo(.145,-.085);ctx.lineTo(.10,-.145);ctx.quadraticCurveTo(-.005,-.07,-.11,-.075);ctx.lineTo(-.060,-.16);ctx.quadraticCurveTo(-.12,-.10,-.15,.04);ctx.closePath();ctx.fillStyle=hair;ctx.fill();
 line(ctx,[[-.13,-.20],[-.035,-.245],[.065,-.23]],clerk?'#b18a6b66':'#a4adb260',.018);
 if(clerk){path(ctx,[[.09,-.16],[.15,-.18],[.16,-.15],[.10,-.13]],'#eac681');}
 ctx.restore();
}
function drawClerk(ctx,x,y,scale){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
 ellipse(ctx,2,88,37,6,'#1f4b4328');
 round(ctx,-18,57,15,33,3,'#3e5360');round(ctx,4,57,15,33,3,'#334653');
 const shirt=gradient(ctx,-30,5,30,70,[[0,'#fff4da'],[.45,'#e1e9d8'],[1,'#a9c5b7']]);
 ctx.lineWidth=1.2;path(ctx,[[-9,0],[-28,10],[-36,32],[-26,40],[-20,28],[-22,73],[23,73],[21,28],[28,40],[36,32],[27,10],[9,0]],shirt,'#527b75');
 round(ctx,-6,-3,12,17,3,'#eab79a');path(ctx,[[-11,0],[0,15],[-12,21],[-18,7]],'#fff8e6','#a4bcad');path(ctx,[[11,0],[0,15],[12,21],[18,7]],'#f2f0d8','#a4bcad');
 // Apron straps, name badge, pocket, and seams make the staff role explicit.
 const apron=gradient(ctx,-22,17,24,78,[[0,'#76b1a0'],[.5,'#448c7d'],[1,'#2f6d68']]);
 path(ctx,[[-15,17],[15,17],[24,75],[-24,75]],apron,'#2c6963');line(ctx,[[-14,17],[-19,5]],'#3d8075',5);line(ctx,[[14,17],[19,5]],'#3d8075',5);
 round(ctx,-13,40,26,15,2,'#5fa294','#93c3ab');line(ctx,[[-12,57],[13,57]],'#285f5d55',1);line(ctx,[[-18,64],[-13,71]],'#b2d5b152',1.4);
 round(ctx,6,22,17,10,1.4,'#fff4d6','#7c9c8b');ctx.fillStyle='#447d6a';ctx.font='bold 4.5px system-ui';ctx.textAlign='center';ctx.fillText('STAFF',14.5,29);
 // Resting hands visible above the checkout counter.
 round(ctx,-34,29,9,24,4,'#e5b292');round(ctx,25,29,9,24,4,'#efc2a0');ellipse(ctx,-26,51,9,5,'#f5c7a4');ellipse(ctx,27,51,9,5,'#f5c7a4');
 face(ctx,0,-20,89,{clerk:true});ctx.restore();
}
function drawPlayer(ctx,cam,x){
 const floor=cam.toScreen(x,0),s=cam.scale,H=BagPhysics.HOLDER;
 ctx.save();ctx.translate(floor.x,floor.y);ctx.scale(s,s);ctx.lineWidth=.014;
 ellipse(ctx,.035,.018,.38,.064,'#294a3a28');
 const denim=gradient(ctx,-.23,-.77,.20,-.02,[[0,'#455975'],[.5,'#34445d'],[1,'#24354b']]);
 path(ctx,[[-.23,-.77],[.19,-.77],[.17,-.035],[.045,-.035],[-.015,-.47],[-.055,-.035],[-.20,-.035]],denim,'#203348');
 line(ctx,[[-.15,-.63],[-.14,-.13]],'#8194a94a',.018);line(ctx,[[.09,-.61],[.11,-.13]],'#8194a94a',.018);
 round(ctx,-.26,-.075,.24,.085,.025,'#263a4a','#192f39');round(ctx,.025,-.075,.25,.085,.025,'#283b49','#192f39');line(ctx,[[-.24,-.025],[-.04,-.025]],'#bdd1cf',.014);line(ctx,[[.05,-.025],[.25,-.025]],'#bdd1cf',.014);
 // The shopper leans slightly beside the load: the basket is at chest height,
 // rather than a detached tray floating above a small character's head.
 const coat=gradient(ctx,-.31,-1.40,.27,-.69,[[0,'#efa879'],[.5,'#d88260'],[1,'#ae6557']]);
 ctx.beginPath();ctx.moveTo(-.17,-1.43);ctx.quadraticCurveTo(-.31,-1.42,-.32,-1.28);ctx.lineTo(-.27,-.73);ctx.quadraticCurveTo(-.01,-.66,.23,-.73);ctx.lineTo(.25,-1.29);ctx.quadraticCurveTo(.19,-1.41,-.04,-1.43);ctx.closePath();ctx.fillStyle=coat;ctx.fill();ctx.strokeStyle='#8d665e';ctx.stroke();
 path(ctx,[[-.18,-1.43],[-.015,-1.43],[.10,-.73],[-.14,-.73]],'#f2e6d0');line(ctx,[[-.20,-1.35],[-.23,-.93],[-.18,-.73]],'#bd7a64',.018);line(ctx,[[-.02,-1.35],[.12,-.97],[.13,-.74]],'#e8b391',.018);
 line(ctx,[[-.25,-.87],[-.14,-.88]],'#e8b391',.014);round(ctx,-.225,-1.51,.10,.13,.025,'#e6b595');face(ctx,-.22,-1.635,.72);
 // Raised forearms make the sides. The rolled shirt fold makes the bottom;
 // no plastic bag, extra rigid handle, or invisible lid is drawn.
 for(const side of[-1,1]){
  const shoulder=[side<0?-.28:.20,-1.32],elbow=[side*.43,-1.29],wrist=[side*.45,-1.43];
  line(ctx,[shoulder,elbow,wrist],'#88665f',.142);
  line(ctx,[shoulder,elbow,wrist],gradient(ctx,side*.2,-1.45,side*.5,-1.18,[[0,'#eaa879'],[1,'#c77959']]),.113);
  line(ctx,[[side*.35,-1.29],[side*.43,-1.32]],'#ffe0b18c',.015);
  const part=H.sideX*side;ctx.save();ctx.translate(part,H.y+H.sideY);ctx.rotate(side*H.sideAngle);
  const skin=gradient(ctx,-H.sideWidth/2,0,H.sideWidth/2,0,[[0,'#f9d4b1'],[.4,'#edbd99'],[1,'#c58e79']]);
  round(ctx,-H.sideWidth/2,-H.sideHeight/2,H.sideWidth,H.sideHeight,.035,skin,'#956d60');
  line(ctx,[[-H.sideWidth*.22,-H.sideHeight*.36],[-H.sideWidth*.22,H.sideHeight*.28]],'#ffe6c16e',.012);
  // Three softly separated fingertips follow the physical side's open rim.
  for(let i=0;i<3;i++)line(ctx,[[side*.010,-H.sideHeight*.42+i*.035],[side*.033,-H.sideHeight*.43+i*.035]],'#b9836d',.008);
  ctx.restore();
 }
 // Stretched shirt fabric forms the bottom, not a plastic shopping bag.
 round(ctx,-H.width/2,H.y-H.thickness/2,H.width,H.thickness,.035,gradient(ctx,0,H.y-.07,0,H.y+.07,[[0,'#f3b28c'],[.35,'#d88868'],[1,'#ad6357']]),'#8a5c55');
 line(ctx,[[-.35,H.y+.025],[-.18,H.y+.045],[0,H.y+.028],[.18,H.y+.045],[.35,H.y+.025]],'#f6c2a5',.012);
 ctx.restore();
}
function drawHolderFront(ctx,cam,x,glow=0){
 const H=BagPhysics.HOLDER,p=cam.toScreen(x,0);ctx.save();ctx.translate(p.x,p.y);ctx.scale(cam.scale,cam.scale);
 // A narrow lip and edge highlights sit in front of the load; never hide its body.
 line(ctx,[[-.39,H.y+.04],[0,H.y+.055],[.39,H.y+.04]],'#a96454',.034);
 line(ctx,[[-.36,H.y-.051],[.36,H.y-.051]],'#ffe0b6',.012);
 if(glow>0){ctx.globalAlpha=glow*.75;line(ctx,[[-.39,H.y-.07],[.39,H.y-.07]],'#fff7c9',.026);}
 ctx.restore();
}
function drawShop(ctx,w,h,cam,time){
 const floor=cam.toScreen(0,0).y;
 ctx.fillStyle=gradient(ctx,0,0,w,h,[[0,'#dde9df'],[.52,'#f3f0df'],[1,'#d6e1cd']]);ctx.fillRect(0,0,w,h);
 const horizon=clamp(cam.toScreen(0,-3.3).y,55,h*.60);
 // Receding wall panels and a lit ceiling give depth without a 3D renderer.
 path(ctx,[[0,0],[w,0],[w*.85,horizon],[w*.12,horizon]],'#edf1e3');
 line(ctx,[[0,horizon],[w,horizon]],'#bfcec0',2);line(ctx,[[w*.12,0],[w*.28,horizon]],'#d5dfcf',1);line(ctx,[[w*.88,0],[w*.72,horizon]],'#d5dfcf',1);
 const shelfY=Math.max(58,cam.toScreen(0,-3.65).y),shelfH=clamp(cam.scale*2.5,85,210),shelfW=w*.23;
 for(const side of[-1,1]){
  const sx=side<0?8:w-shelfW-8;ctx.globalAlpha=.73;
  round(ctx,sx,shelfY,shelfW,shelfH,3,gradient(ctx,sx,0,sx+shelfW,0,[[0,'#a2baad'],[1,'#79978b']]));
  for(let row=0;row<3;row++){
   const sy=shelfY+shelfH*(row+1)/3-6;
   for(let k=0;k<4;k++){const px=sx+7+k*(shelfW-10)/4,pw=Math.max(6,(shelfW-20)/4);round(ctx,px,sy-27,pw,25,2,['#d7a26a','#91bcb0','#debd8a','#c99079'][(row+k)%4]);line(ctx,[[px+2,sy-23],[px+pw-3,sy-23]],'#fff6',1);}
   path(ctx,[[sx,sy],[sx+shelfW,sy],[sx+shelfW-5,sy+7],[sx+3,sy+7]],'#dce0c9');ctx.fillStyle='#6f8b7c';ctx.fillRect(sx,sy+7,shelfW,3);
  }
 }
 ctx.globalAlpha=1;
 // Register and clerk remain in world coordinates, as in the original camera.
 const clerk=cam.toScreen(-1.72,-1.88);
 if(clerk.y>-170&&clerk.y<h+110){
  drawClerk(ctx,clerk.x,clerk.y,clamp(cam.scale*.012,.35,1.15));
  const cy=cam.toScreen(0,-.87).y,cw=w*.22,ch=Math.max(22,cam.scale*.40);
  path(ctx,[[0,cy-11],[cw-8,cy-16],[cw+8,cy-1],[0,cy+6]],'#c5d7c4','#8ea995');
  path(ctx,[[0,cy+6],[cw+8,cy-1],[cw+8,cy+ch],[0,cy+ch+4]],gradient(ctx,0,cy,cw,cy+ch,[[0,'#7ba294'],[1,'#456f68']]),'#54786e');
  const rx=cw*.30,ry=cy-14;round(ctx,rx,ry-27,Math.max(22,cw*.40),25,3,'#355b5e','#6d918b');round(ctx,rx+4,ry-23,Math.max(14,cw*.40-8),15,2,'#b9d9b0');line(ctx,[[rx+7,ry-14],[rx+17,ry-14]],'#608f7d',1);round(ctx,rx+8,ry-2,18,5,1,'#536e6d');
 }
 const top=Math.max(0,floor);if(top<h){
  ctx.fillStyle=gradient(ctx,0,top,0,h,[[0,'#eee5d0'],[1,'#d7c9ac']]);ctx.fillRect(0,top,w,h-top);
  ctx.strokeStyle='#b7ad914a';ctx.lineWidth=1;for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(w*.5+i*w*.12,top);ctx.lineTo(w*.5+i*w*.31,h);ctx.stroke()}
  for(let i=0;i<5;i++){const y=top+(h-top)*(i/5)**1.35;line(ctx,[[0,y],[w,y]],'#b8b2965c',1);}
 }
 ctx.fillStyle=gradient(ctx,0,floor-6,0,floor+5,[[0,'#a6af94'],[1,'#778b79']]);ctx.fillRect(0,floor-4,w,Math.max(4,cam.scale*.07));
 const signH=Math.max(40,Math.min(85,h*.10));ctx.fillStyle=gradient(ctx,0,0,0,signH,[[0,'#285d5c'],[1,'#4b8176']]);ctx.fillRect(0,0,w,signH);line(ctx,[[0,signH-2],[w,signH-2]],'#c6ddb06e',2);
 ctx.fillStyle='#e7eedc';ctx.font=`800 ${Math.min(12,w*.028)}px system-ui`;ctx.textAlign='center';ctx.fillText('FRESH MART',w/2,signH*.58);
}
window.BagArt={drawItem,drawPlayer,drawHolderFront,drawClerk,drawShop};
})();
