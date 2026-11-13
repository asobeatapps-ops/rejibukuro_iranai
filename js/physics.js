(()=>{'use strict';
// Deterministic fixed-step impulse solver for convex 2D bodies. Units: meters, seconds.
const DT=1/120, GRAVITY=9.8, ITERS=10, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function makeShape(spec){const {kind,w,h}=spec;let pts;if(kind==='circle'){pts=Array.from({length:16},(_,i)=>{const a=i*Math.PI*2/16;return{x:Math.cos(a)*w/2,y:Math.sin(a)*h/2}})}else if(kind==='bottle'){pts=[[-.28,-.5],[.28,-.5],[.28,-.33],[.46,-.25],[.46,.48],[-.46,.48],[-.46,-.25],[-.28,-.33]].map(([x,y])=>({x:x*w,y:y*h}))}else if(kind==='bag'){pts=[[-.48,-.36],[-.3,-.49],[.32,-.49],[.48,-.34],[.5,.27],[.31,.49],[-.33,.49],[-.5,.28]].map(([x,y])=>({x:x*w,y:y*h}))}else if(kind==='chair'){pts=[[-.45,-.5],[-.1,-.5],[-.1,-.1],[.45,-.1],[.45,.48],[-.45,.48]].map(([x,y])=>({x:x*w,y:y*h}))}else{pts=[{x:-w/2,y:-h/2},{x:w/2,y:-h/2},{x:w/2,y:h/2},{x:-w/2,y:h/2}]};return pts}
const cross=(a,b)=>a.x*b.y-a.y*b.x;const dot=(a,b)=>a.x*b.x+a.y*b.y;const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});const norm=a=>{let l=Math.hypot(a.x,a.y)||1;return{x:a.x/l,y:a.y/l}};
function polygonWorld(b){const c=Math.cos(b.angle),s=Math.sin(b.angle);return b.shape.map(v=>({x:b.x+v.x*c-v.y*s,y:b.y+v.x*s+v.y*c}))}
function body(spec, x,y, mass, id){let shape=makeShape(spec),r=Math.max(spec.w,spec.h)*.55;return{id,x,y,vx:0,vy:0,angle:0,omega:0,shape,r,w:spec.w,h:spec.h,mass,invMass:1/mass, inertia:mass*(spec.w**2+spec.h**2)/12,invInertia:12/(mass*(spec.w**2+spec.h**2)),static:false,restitution:.05,friction:.7,startedSupport:-1,catchDone:false,supported:false,supportCount:0,kind:spec.kind,tag:spec.tag}}
function sat(a,b){const av=polygonWorld(a),bv=polygonWorld(b);let smallest=Infinity,best=null;for(const poly of [av,bv]){for(let i=0;i<poly.length;i++){let q=poly[i],p=poly[(i+1)%poly.length],n=norm({x:-(p.y-q.y),y:p.x-q.x});let amin=Infinity,amax=-Infinity,bmin=Infinity,bmax=-Infinity;for(const pt of av){let d=dot(pt,n);amin=Math.min(amin,d);amax=Math.max(amax,d)}for(const pt of bv){let d=dot(pt,n);bmin=Math.min(bmin,d);bmax=Math.max(bmax,d)}let overlap=Math.min(amax,bmax)-Math.max(amin,bmin);if(overlap<=0)return null;if(overlap<smallest){smallest=overlap;best=n}}}if(!best)return null;let ab=sub(b,a);if(dot(ab,best)<0)best={x:-best.x,y:-best.y};const extreme=(poly,max)=>{const values=poly.map(v=>dot(v,best)),edge=max?Math.max(...values):Math.min(...values);const near=poly.filter((v,i)=>Math.abs(values[i]-edge)<.006);return{x:near.reduce((n,v)=>n+v.x,0)/near.length,y:near.reduce((n,v)=>n+v.y,0)/near.length}};const ptA=extreme(av,true),ptB=extreme(bv,false);const point={x:(ptA.x+ptB.x)/2,y:(ptA.y+ptB.y)/2};return{a,b,n:best,penetration:smallest,point}}
function apply(b,ix,iy,rx,ry,sign){if(b.static)return;b.vx+=ix*b.invMass*sign;b.vy+=iy*b.invMass*sign;b.omega+=(rx*iy-ry*ix)*b.invInertia*sign}
function solveVelocity(c){const {a,b,n,point}=c,ra=sub(point,a),rb=sub(point,b);let avx=a.vx-a.omega*ra.y,avy=a.vy+a.omega*ra.x,bvx=b.vx-b.omega*rb.y,bvy=b.vy+b.omega*rb.x;let rvx=bvx-avx,rvy=bvy-avy,vel=rvx*n.x+rvy*n.y;if(vel>0)return;const raCross=cross(ra,n),rbCross=cross(rb,n);const denom=a.invMass+b.invMass+raCross**2*a.invInertia+rbCross**2*b.invInertia;if(denom<=0)return;const impulse=-(1+(Math.abs(vel)>1.1?.045:0))*vel/denom;const ix=n.x*impulse,iy=n.y*impulse;apply(a,ix,iy,ra.x,ra.y,-1);apply(b,ix,iy,rb.x,rb.y,1);
 avx=a.vx-a.omega*ra.y;avy=a.vy+a.omega*ra.x;bvx=b.vx-b.omega*rb.y;bvy=b.vy+b.omega*rb.x;rvx=bvx-avx;rvy=bvy-avy;const t=norm({x:rvx-(rvx*n.x+rvy*n.y)*n.x,y:rvy-(rvx*n.x+rvy*n.y)*n.y});const ts=rvx*t.x+rvy*t.y;if(Math.abs(ts)<.00001)return;const rta=cross(ra,t),rtb=cross(rb,t),d=a.invMass+b.invMass+rta*rta*a.invInertia+rtb*rtb*b.invInertia;const jt=clamp(-ts/d,-impulse*.65,impulse*.65);apply(a,t.x*jt,t.y*jt,ra.x,ra.y,-1);apply(b,t.x*jt,t.y*jt,rb.x,rb.y,1)}
// The original floor stays at the same height and width. Two real kinematic
// forearms make an open U; no force, velocity correction, or attachment is added.
const HOLDER=Object.freeze({y:-1.38,width:.8,thickness:.13,sideX:.45,sideY:-.26,sideHeight:.60,sideWidth:.105,sideAngle:.14});
function holderSide(side){return{id:side<0?'holder-left':'holder-right',x:side*HOLDER.sideX,y:HOLDER.y+HOLDER.sideY,angle:side*HOLDER.sideAngle,shape:makeShape({kind:'box',w:HOLDER.sideWidth,h:HOLDER.sideHeight}),w:HOLDER.sideWidth,h:HOLDER.sideHeight,static:true,isHolder:true,invMass:0,invInertia:0,vx:0,vy:0,omega:0,r:Math.hypot(HOLDER.sideWidth,HOLDER.sideHeight)/2,friction:.9,side}}
class Physics{constructor(){this.items=[];this.platform={id:'platform',x:0,y:HOLDER.y,angle:0,shape:makeShape({kind:'box',w:HOLDER.width,h:HOLDER.thickness}),w:HOLDER.width,h:HOLDER.thickness,static:true,isHolder:true,invMass:0,invInertia:0,vx:0,vy:0,omega:0,r:.5,friction:.9};this.holderParts=[this.platform,holderSide(-1),holderSide(1)];this.holderContacts=new Set();this.holderLastImpact=new Map();this.onHolderImpact=null;this.time=0;this.hitPower=0;this.floorHit=null;this.stepContacts=[];this.onImpact=null;this.targetX=0;this.maxSpeed=3.5;this.maxAcc=12;this.lastCollisionTime=0}
 clear(){this.items=[];this.time=0;this.platform.x=0;this.platform.vx=0;this.targetX=0;this.hitPower=0;this.floorHit=null;this.lastCollisionTime=0;this.holderContacts.clear();this.holderLastImpact.clear();this.syncHolder()}
 syncHolder(){for(const part of this.holderParts){if(part===this.platform)continue;part.x=this.platform.x+part.side*HOLDER.sideX;part.y=this.platform.y+HOLDER.sideY;part.vx=this.platform.vx;part.vy=this.platform.vy}}
 spawn(spec,x,y,mass){let b=body(spec,x,y,mass,'i'+this.items.length);this.items.push(b);return b}
 getTop(){let top=this.platform.y-.1;for(const b of this.items){const verts=polygonWorld(b);for(const p of verts)top=Math.min(top,p.y)}return top}
 update(){this.time+=DT;this.hitPower=0;this.stepContacts=[];let p=this.platform;const old=p.x,delta=this.targetX-p.x,desired=clamp(delta/DT,-this.maxSpeed,this.maxSpeed);p.vx=clamp(desired,p.vx-this.maxAcc*DT,p.vx+this.maxAcc*DT);p.x=clamp(p.x+p.vx*DT,-2.04,2.04);if(p.x===-2.04||p.x===2.04)p.vx=0;this.syncHolder();
 for(const b of this.items){b.supported=false;b.supportCount=0;b.vy+=GRAVITY*DT;b.vx*=.999;b.vy*=.9995;b.omega*=.998;b.x+=b.vx*DT;b.y+=b.vy*DT;b.angle+=b.omega*DT;if(!Number.isFinite(b.x+b.y+b.angle+b.vx+b.vy+b.omega)||Math.abs(b.x)>1e4||Math.abs(b.y)>1e4){this.floorHit={id:b.id,reason:'invalid'};return}const verts=polygonWorld(b);if(verts.some(v=>v.y>=-.005)){this.floorHit={id:b.id,reason:'ground'};return}}
 const all=[...this.holderParts,...this.items], contacts=[];for(let i=0;i<all.length;i++){for(let j=i+1;j<all.length;j++){const a=all[i],b=all[j];if(a.static&&b.static)continue;if(Math.abs(a.x-b.x)>a.r+b.r+.05||Math.abs(a.y-b.y)>a.r+b.r+.05)continue;const c=sat(a,b);if(c)contacts.push(c)}}
 const currentHolderContacts=new Set();
 for(const c of contacts){const {a,b,n}=c;if(n.y<-.26){b.supported=true;b.supportCount++;this.stepContacts.push({upper:b,lower:a})}else if(n.y>.26){a.supported=true;a.supportCount++;this.stepContacts.push({upper:a,lower:b})}
 const rel=Math.hypot(b.vx-a.vx,b.vy-a.vy);if(rel>.65&&this.time-this.lastCollisionTime>.065){this.hitPower=Math.max(this.hitPower,rel);this.lastCollisionTime=this.time;if(this.onImpact)this.onImpact(c.point,rel,{holder:!!(a.isHolder||b.isHolder)})}
 // Only a new, approaching physical contact emits a holder effect. Persistent
 // support and repeated solver iterations never create extra catches or sparks.
 const holder=a.isHolder?a:b.isHolder?b:null;
 if(holder){
  const item=a===holder?b:a,key=item.id+':'+holder.id;currentHolderContacts.add(key);
  const ra=sub(c.point,a),rb=sub(c.point,b);
  const closing=-((b.vx-b.omega*rb.y-a.vx+a.omega*ra.y)*n.x+(b.vy+b.omega*rb.x-a.vy-a.omega*ra.x)*n.y);
  if(closing>.45&&!this.holderContacts.has(key)&&this.time-(this.holderLastImpact.get(item.id)??-Infinity)>.14){
   this.holderLastImpact.set(item.id,this.time);
   if(this.onHolderImpact)this.onHolderImpact(c.point,closing,item,holder);
  }
 }
 }
 this.holderContacts=currentHolderContacts;
 for(let k=0;k<ITERS;k++)for(const c of contacts)solveVelocity(c);
 for(const c of contacts){const {a,b,n}=c;const inv=a.invMass+b.invMass;if(!inv)continue;const correction=Math.max(c.penetration-.002,0)*.52/inv;if(!a.static){a.x-=n.x*correction*a.invMass;a.y-=n.y*correction*a.invMass}if(!b.static){b.x+=n.x*correction*b.invMass;b.y+=n.y*correction*b.invMass}}
 }
}
window.BagPhysics={Physics,DT,polygonWorld,HOLDER};})();
