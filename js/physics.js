(()=>{'use strict';
// Deterministic fixed-step impulse solver for convex 2D bodies. Units: meters, seconds.
const DT=1/120, GRAVITY=9.8, GOODS_INITIAL_GRAVITY_SCALE=.4, GOODS_INITIAL_MAX_SPEED=2.8, BOMB_SPEED_MULTIPLIER=1.3, BOMB_GRAVITY_SCALE=.35*BOMB_SPEED_MULTIPLIER**2, BOMB_MAX_FALL_SPEED=2.6*BOMB_SPEED_MULTIPLIER, ITERS=12, SUBSTEPS=3, POSITION_ITERS=6, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function makeShape(spec){const {kind,w,h}=spec;let pts;if(kind==='circle'){pts=Array.from({length:16},(_,i)=>{const a=i*Math.PI*2/16;return{x:Math.cos(a)*w/2,y:Math.sin(a)*h/2}})}else if(kind==='bottle'){pts=[[-.28,-.5],[.28,-.5],[.28,-.33],[.46,-.25],[.46,.48],[-.46,.48],[-.46,-.25],[-.28,-.33]].map(([x,y])=>({x:x*w,y:y*h}))}else if(kind==='bag'){pts=[[-.48,-.36],[-.3,-.49],[.32,-.49],[.48,-.34],[.5,.27],[.31,.49],[-.33,.49],[-.5,.28]].map(([x,y])=>({x:x*w,y:y*h}))}else if(kind==='chair'){pts=[[-.45,-.5],[-.1,-.5],[-.1,-.1],[.45,-.1],[.45,.48],[-.45,.48]].map(([x,y])=>({x:x*w,y:y*h}))}else{pts=[{x:-w/2,y:-h/2},{x:w/2,y:-h/2},{x:w/2,y:h/2},{x:-w/2,y:h/2}]};return pts}
const cross=(a,b)=>a.x*b.y-a.y*b.x;const dot=(a,b)=>a.x*b.x+a.y*b.y;const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});const norm=a=>{let l=Math.hypot(a.x,a.y)||1;return{x:a.x/l,y:a.y/l}};
function polygonWorld(b){const c=Math.cos(b.angle),s=Math.sin(b.angle);return b.shape.map(v=>({x:b.x+v.x*c-v.y*s,y:b.y+v.x*s+v.y*c}))}
function body(spec, x,y, mass, id){let shape=makeShape(spec),r=Math.hypot(spec.w,spec.h)/2;return{id,x,y,vx:0,vy:0,angle:0,omega:0,shape,r,w:spec.w,h:spec.h,mass,invMass:1/mass, inertia:mass*(spec.w**2+spec.h**2)/12,invInertia:12/(mass*(spec.w**2+spec.h**2)),static:false,restitution:0,friction:1.8,startedSupport:-1,catchDone:false,supported:false,supportCount:0,hasTouchedHolder:false,kind:spec.kind,tag:spec.tag}}
function sat(a,b){
 const av=polygonWorld(a),bv=polygonWorld(b);let smallest=Infinity,best;
 for(const poly of[av,bv])for(let i=0;i<poly.length;i++){
  const q=poly[i],p=poly[(i+1)%poly.length],n=norm({x:q.y-p.y,y:p.x-q.x});
  const aa=av.map(v=>dot(v,n)),bb=bv.map(v=>dot(v,n));
  const amin=Math.min(...aa),amax=Math.max(...aa),bmin=Math.min(...bb),bmax=Math.max(...bb);
  if(amax<=bmin||bmax<=amin)return null;
  const overlap=Math.min(amax-bmin,bmax-amin);
  if(overlap<smallest){smallest=overlap;best=n}
 }
 if(dot(sub(b,a),best)<0)best={x:-best.x,y:-best.y};
 const n=best,t={x:-n.y,y:n.x},amax=Math.max(...av.map(v=>dot(v,n))),bmin=Math.min(...bv.map(v=>dot(v,n)));
 const ae=av.filter(v=>amax-dot(v,n)<.005),be=bv.filter(v=>dot(v,n)-bmin<.005);
 const at=ae.map(v=>dot(v,t)),bt=be.map(v=>dot(v,t));
 let lo=Math.max(Math.min(...at),Math.min(...bt)),hi=Math.min(Math.max(...at),Math.max(...bt));
 if(lo>hi)lo=hi=(lo+hi)/2;
 const mid=(amax+bmin)/2,toPoint=k=>({x:n.x*mid+t.x*k,y:n.y*mid+t.y*k});
 const points=[toPoint(lo)];if(hi-lo>.015)points.push(toPoint(hi));
 return{a,b,n,penetration:smallest,points,point:toPoint((lo+hi)/2),normal:points.map(()=>0),tangent:points.map(()=>0)};
}
function apply(b,ix,iy,rx,ry,sign){if(b.static)return;b.vx+=ix*b.invMass*sign;b.vy+=iy*b.invMass*sign;b.omega+=(rx*iy-ry*ix)*b.invInertia*sign}
function solveVelocity(c){
 const{a,b,n}=c,t={x:-n.y,y:n.x};
 for(let i=0;i<c.points.length;i++){
  const point=c.points[i],ra=sub(point,a),rb=sub(point,b);
  const relative=()=>({x:b.vx-b.omega*rb.y-a.vx+a.omega*ra.y,y:b.vy+b.omega*rb.x-a.vy-a.omega*ra.x});
  const effective=axis=>a.invMass+b.invMass+cross(ra,axis)**2*a.invInertia+cross(rb,axis)**2*b.invInertia;
  const mass=effective(n);if(mass<=0)continue;
  const before=c.normal[i];c.normal[i]=Math.max(0,before-dot(relative(),n)/mass);
  const impulse=c.normal[i]-before;apply(a,n.x*impulse,n.y*impulse,ra.x,ra.y,-1);apply(b,n.x*impulse,n.y*impulse,rb.x,rb.y,1);
  const friction=Math.sqrt(a.friction*b.friction),max=friction*c.normal[i],old=c.tangent[i];
  c.tangent[i]=clamp(old-dot(relative(),t)/effective(t),-max,max);
  const jt=c.tangent[i]-old;apply(a,t.x*jt,t.y*jt,ra.x,ra.y,-1);apply(b,t.x*jt,t.y*jt,rb.x,rb.y,1);
 }
}
// Contact with held goods also counts as reaching the holder, so upper layers
// do not remain in the slow initial-fall mode. This flag never awards a score.
function markHolderContact(contacts){
 let changed;
 do{changed=false;for(const{a,b}of contacts){
  if(a.isBomb||b.isBomb)continue;
  if((a.isHolder||a.hasTouchedHolder)&&!b.static&&!b.hasTouchedHolder){b.hasTouchedHolder=true;changed=true}
  if((b.isHolder||b.hasTouchedHolder)&&!a.static&&!a.hasTouchedHolder){a.hasTouchedHolder=true;changed=true}
 }}while(changed);
}
function contactsFor(parts){
 const contacts=[];for(let i=0;i<parts.length;i++)for(let j=i+1;j<parts.length;j++){
  const a=parts[i],b=parts[j];if(a.static&&b.static)continue;
  if(Math.abs(a.x-b.x)>a.r+b.r+.01||Math.abs(a.y-b.y)>a.r+b.r+.01)continue;
  const c=sat(a,b);if(c)contacts.push(c);
 }return contacts;
}
// Correct item/item compression first, then holder constraints. Rebuilding the
// contacts each pass prevents stale penetration from pushing lower goods through.
function solvePositions(parts){
 for(let k=0;k<POSITION_ITERS;k++){
  const priority=c=>c.a.id==='platform'||c.b.id==='platform'?2:(c.a.isHolder||c.b.isHolder?1:0);
  const contacts=contactsFor(parts).sort((a,b)=>priority(a)-priority(b));
  for(const previous of contacts){
   const c=sat(previous.a,previous.b);if(!c)continue;
   const{a,b,n}=c,inv=a.invMass+b.invMass;if(!inv)continue;
   const correction=Math.min(.045,Math.max(c.penetration-.0008,0)*(a.static||b.static ? .98 : .8))/inv;
   if(!a.static){a.x-=n.x*correction*a.invMass;a.y-=n.y*correction*a.invMass}
   if(!b.static){b.x+=n.x*correction*b.invMass;b.y+=n.y*correction*b.invMass}
  }
 }
 // A last compression can create a new floor contact after the candidate list
 // was built. Detect it afresh instead of leaving the lower item inside the floor.
 const floor=parts.find(b=>b.id==='platform');
 if(floor)for(const b of parts){
  if(b.static||Math.abs(b.x-floor.x)>b.r+floor.r+.01||Math.abs(b.y-floor.y)>b.r+floor.r+.01)continue;
  const c=sat(floor,b);if(!c)continue;
  const correction=Math.max(c.penetration-.0008,0)*.98;
  b.x+=c.n.x*correction;b.y+=c.n.y*correction;
 }
}
// Wider open arm holder. Items retain the same free rigid-body physics.
// Only the kinematic holder follows input directly, without acceleration or coasting.
const HOLDER=Object.freeze({y:-1.38,width:1.30,thickness:.17,sideX:.70,sideY:-.36,sideHeight:.80,sideWidth:.105,sideAngle:.14});
function holderSide(side){return{id:side<0?'holder-left':'holder-right',x:side*HOLDER.sideX,y:HOLDER.y+HOLDER.sideY,angle:side*HOLDER.sideAngle,shape:makeShape({kind:'box',w:HOLDER.sideWidth,h:HOLDER.sideHeight}),w:HOLDER.sideWidth,h:HOLDER.sideHeight,static:true,isHolder:true,invMass:0,invInertia:0,vx:0,vy:0,omega:0,r:Math.hypot(HOLDER.sideWidth,HOLDER.sideHeight)/2,friction:1.6,side}}
class Physics{constructor(){this.items=[];this.bombs=[];this.bombId=0;this.onExplosion=null;this.platform={id:'platform',x:0,y:HOLDER.y,angle:0,shape:makeShape({kind:'box',w:HOLDER.width,h:HOLDER.thickness}),w:HOLDER.width,h:HOLDER.thickness,static:true,isHolder:true,invMass:0,invInertia:0,vx:0,vy:0,omega:0,r:Math.hypot(HOLDER.width,HOLDER.thickness)/2,friction:1.6};this.holderScale=1;this.groundY=0;this.movementLimit=2.04;this.holderParts=[this.platform,holderSide(-1),holderSide(1)];this.holderContacts=new Set();this.holderLastImpact=new Map();this.onHolderImpact=null;this.time=0;this.hitPower=0;this.floorHit=null;this.stepContacts=[];this.onImpact=null;this.targetX=0;this.lastCollisionTime=0}
 clear(){this.items=[];this.bombs=[];this.bombId=0;this.time=0;this.platform.x=0;this.platform.vx=0;this.targetX=0;this.hitPower=0;this.floorHit=null;this.lastCollisionTime=0;this.holderContacts.clear();this.holderLastImpact.clear();this.setViewScale(1,0);this.syncHolder()}
 // Convert the fixed on-screen holder into the goods camera's world units.
 // The upper surface stays at its world height, so zoom never lifts the load.
 setViewScale(scale,groundY){
  this.holderScale=scale;this.groundY=groundY;this.movementLimit=2.04;
  const p=this.platform;p.y=HOLDER.y+HOLDER.thickness*.5*(scale-1);
  for(const part of this.holderParts){
   part.w=(part===p?HOLDER.width:HOLDER.sideWidth)*scale;
   part.h=(part===p?HOLDER.thickness:HOLDER.sideHeight)*scale;
   part.shape=makeShape({kind:'box',w:part.w,h:part.h});part.r=Math.hypot(part.w,part.h)/2;
  }
  this.syncHolder();
 }
 syncHolder(){for(const part of this.holderParts){if(part===this.platform)continue;part.x=this.platform.x+part.side*HOLDER.sideX*this.holderScale;part.y=this.platform.y+HOLDER.sideY*this.holderScale;part.vx=this.platform.vx;part.vy=this.platform.vy}}
 spawn(spec,x,y,mass){let b=body(spec,x,y,mass,'i'+this.items.length);this.items.push(b);return b}
 getTop(){let top=this.platform.y-.1*this.holderScale;for(const b of this.items){const verts=polygonWorld(b);for(const p of verts)top=Math.min(top,p.y)}return top}
 spawnBomb(x,y){const b=body({kind:'circle',w:.24,h:.24,tag:'BOMB'},x,y,1.2,'bomb'+this.bombId++);b.isBomb=true;b.friction=1.1;b.fuseAt=null;this.bombs.push(b);return b}
 armBomb(b){if(b.fuseAt===null)b.fuseAt=this.time+1}
 explode(b){
  // Blast reach is one holder width from the bomb center.
  const radius=this.platform.w;
  for(const item of this.items){
   const d=sub(item,b),distance=Math.hypot(d.x,d.y);if(distance>radius+item.r)continue;
   const falloff=Math.max(.15,1-distance/(radius+item.r));
   const length=distance||1,dx=distance?d.x/length:(item.id.charCodeAt(item.id.length-1)%2?1:-1);
   // An impulse, not a position jump. Heavier goods react less strongly.
   const speed=(5+6*falloff)/Math.sqrt(Math.max(.5,item.mass));
   item.vx+=dx*speed;item.vy-=Math.max(.45,Math.abs(d.y)/length)*speed+2*falloff;
   item.omega+=(dx>=0?1:-1)*(5+falloff*5)/Math.sqrt(Math.max(.5,item.mass));
   item.lastSupportTime=-Infinity;
  }
  if(this.onExplosion)this.onExplosion({x:b.x,y:b.y,radius});
 }
 update(){
  const p=this.platform,start=p.x,end=clamp(this.targetX,-this.movementLimit,this.movementLimit),h=DT/SUBSTEPS;
  this.hitPower=0;this.stepContacts=[];
  for(const item of this.items){item.supported=false;item.supportCount=0}
  const seen=new Set();
  for(let step=0;step<SUBSTEPS;step++){
   this.time+=h;p.x=start+(end-start)*(step+1)/SUBSTEPS;p.vx=(end-start)/DT;this.syncHolder();
   for(const b of[...this.items,...this.bombs]){
    const gravityScale=b.isBomb?BOMB_GRAVITY_SCALE:(b.hasTouchedHolder?2:GOODS_INITIAL_GRAVITY_SCALE);
    b.vy+=GRAVITY*h*gravityScale;
    if(b.isBomb)b.vy=Math.min(b.vy,BOMB_MAX_FALL_SPEED);else if(!b.hasTouchedHolder)b.vy=Math.min(b.vy,GOODS_INITIAL_MAX_SPEED);b.vx*=Math.pow(.999,h/DT);b.vy*=Math.pow(.9995,h/DT);b.omega*=Math.pow(.996,h/DT);
    b.x+=b.vx*h;b.y+=b.vy*h;b.angle+=b.omega*h;
    if(!Number.isFinite(b.x+b.y+b.angle+b.vx+b.vy+b.omega)||Math.abs(b.x)>1e4||Math.abs(b.y)>1e4){if(b.isBomb){b.fuseAt=this.time;continue}this.floorHit={id:b.id,reason:'invalid'};return}
    const bottom=Math.max(...polygonWorld(b).map(v=>v.y));
    if(bottom>=this.groundY-.005){
     if(b.isBomb){b.y-=bottom-this.groundY+.006;b.vy=0;b.vx*=.9;b.omega*=.8;this.armBomb(b)}
     else this.floorHit=this.floorHit||{id:b.id,reason:'ground'};
    }
   }
   const all=[...this.holderParts,...this.items,...this.bombs],contacts=contactsFor(all);
   markHolderContact(contacts);
   for(const c of contacts){
    const{a,b,n}=c;
    for(const bomb of[a,b])if(bomb.isBomb)this.armBomb(bomb);
    if(!a.isBomb&&!b.isBomb){if(n.y<-.26&&!b.static){b.supported=true;b.supportCount++;this.stepContacts.push({upper:b,lower:a})}else if(n.y>.26&&!a.static){a.supported=true;a.supportCount++;this.stepContacts.push({upper:a,lower:b})}}
    const holder=a.isHolder?a:b.isHolder?b:null;
    const rel=Math.hypot(b.vx-a.vx,b.vy-a.vy);
    if(rel>.65&&this.time-this.lastCollisionTime>.065){this.hitPower=Math.max(this.hitPower,rel);this.lastCollisionTime=this.time;if(this.onImpact)this.onImpact(c.point,rel,{holder:!!holder})}
    if(holder){const item=a===holder?b:a,key=item.id+':'+holder.id;seen.add(key);
     const closing=-dot({x:b.vx-a.vx,y:b.vy-a.vy},n);
     if(closing>.45&&!this.holderContacts.has(key)&&!seen.has(key+':hit')&&this.time-(this.holderLastImpact.get(item.id)??-Infinity)>.14){seen.add(key+':hit');this.holderLastImpact.set(item.id,this.time);if(this.onHolderImpact)this.onHolderImpact(c.point,closing,item,holder)}
    }
   }
   for(let k=0;k<ITERS;k++)for(const c of contacts)solveVelocity(c);
   solvePositions(all);
   for(const bomb of this.bombs)if(bomb.fuseAt!==null&&this.time+1e-9>=bomb.fuseAt){bomb.exploded=true;this.explode(bomb)}
   this.bombs=this.bombs.filter(b=>!b.exploded);
  }
  p.x=end;this.syncHolder();this.holderContacts=new Set([...seen].filter(key=>!key.endsWith(':hit')));
 }
}
window.BagPhysics={Physics,DT,polygonWorld,HOLDER};})();
