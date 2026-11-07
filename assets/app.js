/* HKNS Events site script. */
"use strict";
document.documentElement.classList.add("js");
/* Inquiries are delivered to this inbox by FormSubmit (formsubmit.co). The first submission sends a one-time activation email there. */
const FORM_ENDPOINT = "https://formsubmit.co/ajax/hknsevents@gmail.com";
const YT_ID = "oF0B0heofI0";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 900px)").matches;

/* camera keyframes: p position, l look-at, x/y lens shift (m* = phone versions) */
const KEYS = {
  hero: { p:[0,5.4,35],    l:[0,4.2,-20],  x:-.1, y:-.14, mp:[0,5.4,40],    ml:[0,3.4,-20],  mx:0, my:-.44 },
  w0:   { p:[0,4.8,29],    l:[0,3.6,-20],  x:-.1, y:-.12, mp:[0,5,34],      ml:[0,3.4,-20],  mx:0, my:-.4 },
  w1:   { p:[-2.6,3.4,19], l:[2.6,1.8,2],  x:-.1, y:-.1,  mp:[-1.6,3.6,22], ml:[3,1.6,3],    mx:0, my:-.38 },
  w2:   { p:[2.6,3.6,4],   l:[-1,2.4,-14], x:-.1, y:-.1,  mp:[1.6,3.8,7],   ml:[-.4,2.6,-14],mx:0, my:-.38 },
  w3:   { p:[0,4,-6],      l:[0,4.8,-26],  x:-.1, y:-.08, mp:[0,4.4,-1],    ml:[0,4.8,-26],  mx:0, my:-.36 },
  plan: { p:[0,47,5],      l:[0,0,-1.2],   x:-.14,y:-.04, mp:[0,68,9],      ml:[0,0,-1],     mx:0, my:-.3 }
};
const CATS = [
  { key:"stages",  name:"Stages & backdrops", sub:"Sofas, frames, lattice",     p:[0,4.2,-9],     l:[0,4.6,-25],    mp:[0,4.6,-3.5] },
  { key:"mandap",  name:"Mandaps",            sub:"Ceremony structures",        p:[7.5,4,-2.5],     l:[0,2.4,-14],    mp:[3,3.8,-3],   ml:[0,2.6,-14] },
  { key:"floral",  name:"Floral walls",       sub:"Installations & arches",     p:[-2.5,5.2,-14], l:[0,5.4,-25.5],  mp:[-1,5.4,-10] },
  { key:"aisle",   name:"Aisles",             sub:"Runners, candles, florals",  p:[0,2.2,24],     l:[0,1,-4],       mp:[0,2.6,27] },
  { key:"tables",  name:"Tablescapes",        sub:"Centerpieces & linens",      p:[-3,5.4,24],    l:[6.5,1,4],      mp:[4,4,21.5],   ml:[8.6,.8,5] },
  { key:"draping", name:"Draping & lighting", sub:"Chandeliers & uplighting",   p:[0,3.6,8],      l:[0,10.5,-6],    mp:[0,3.4,10],   ml:[0,10,-4] },
  { key:"mehndi",  name:"Mehndi & sangeet",   sub:"Color, cushions, parasols",  p:[5,3,26],       l:[11.5,1,18.5],  mp:[7.2,3.2,27], ml:[11.5,.8,18.5] }
].map(c=>Object.assign({ x:-.38, y:-.04, mx:0, my:-.22 }, c));
let activeCat = 0, catTouched = false, buildTarget = 1;

/* ---------- 3D venue ---------- */
const venue = (function(){
  const canvas = document.getElementById("venue");
  if (!window.THREE) return null;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:"high-performance"}); }
  catch(e){ return null; }
  renderer.setClearColor(0xF2EADF, 1);
  const PR = Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 1.75);
  renderer.setPixelRatio(PR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(mobile ? 64 : 50, 1, .1, 260);
  const TAU = Math.PI*2, rnd = (a,b)=>a+Math.random()*(b-a);

  const LP = [], LD = [];
  const lerp3 = (a,b,t)=>[a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t];
  function path(pts, d0, d1, step){
    step = step || .35;
    const lens = []; let total = 0;
    for (let i=1;i<pts.length;i++){ const a=pts[i-1], b=pts[i]; const l=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]); lens.push(l); total+=l; }
    if (!total) return;
    let acc = 0;
    for (let i=1;i<pts.length;i++){
      const l = lens[i-1], n = Math.max(1, Math.ceil(l/step));
      for (let k=0;k<n;k++){
        const a = lerp3(pts[i-1],pts[i],k/n), b = lerp3(pts[i-1],pts[i],(k+1)/n), d = d0+(d1-d0)*((acc+l*(k+1)/n)/total);
        LP.push(...a, ...b); LD.push(d, d);
      }
      acc += l;
    }
  }
  const curve = (fn,n,d0,d1,step)=>{ const p=[]; for (let i=0;i<=n;i++) p.push(fn(i/n)); path(p,d0,d1,step||.18); };
  const rectZ = (x0,x1,y0,y1,z,d0,d1)=>path([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],[x0,y0,z]],d0,d1);
  const rectX = (x,z0,z1,y0,y1,d0,d1)=>path([[x,y0,z0],[x,y0,z1],[x,y1,z1],[x,y1,z0],[x,y0,z0]],d0,d1);
  function box(x0,x1,y0,y1,z0,z1,d0,d1){
    const m=(d0+d1)/2;
    path([[x0,y0,z1],[x1,y0,z1],[x1,y0,z0],[x0,y0,z0],[x0,y0,z1]],d0,m);
    path([[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[x0,y1,z1]],m,d1);
    [[x0,z1],[x1,z1],[x1,z0],[x0,z0]].forEach(c=>path([[c[0],y0,c[1]],[c[0],y1,c[1]]],d0,m));
  }
  const ring = (cx,cy,cz,r,d0,d1,n)=>curve(t=>[cx+Math.cos(t*TAU)*r, cy, cz+Math.sin(t*TAU)*r], n||36, d0, d1, .25);
  const helix = (cx,cz,y0,y1,r,turns,d0,d1,ph)=>curve(t=>{ const a=t*turns*TAU+(ph||0); return [cx+Math.cos(a)*r, y0+(y1-y0)*t, cz+Math.sin(a)*r]; }, Math.round(turns*30), d0, d1);

  const PP=[], PD=[], PS=[], PC=[], PSeed=[];
  const C = { ivory:[.87,.79,.69], blush:[.89,.69,.66], red:[.68,.21,.25], wine:[.5,.15,.2], crystal:[.74,.7,.64], warm:[.8,.65,.42], flame:[.88,.63,.29], blue:[.66,.72,.8], dust:[.8,.75,.7], glow:[.8,.7,.55],
              pink:[.8,.34,.55], teal:[.36,.62,.6], orange:[.87,.49,.2], yellow:[.9,.7,.25] };
  const pick = pal=>{ const r=Math.random(); let s=0; for (const [c,w] of pal){ s+=w; if (r<=s) return C[c]; } return C[pal[0][0]]; };
  const pt = (p,d,s,c)=>{ PP.push(...p); PD.push(d); PS.push(s); PC.push(...c); PSeed.push(Math.random()); };
  function cluster(cx,cy,cz,rx,ry,rz,n,d0,d1,pal,s0,s1){
    if (mobile) n = Math.ceil(n*.75);
    for (let k=0;k<n;k++){ const u=rnd(0,TAU), v=Math.acos(rnd(-1,1)), r=Math.cbrt(Math.random());
      pt([cx+Math.sin(v)*Math.cos(u)*rx*r, cy+Math.cos(v)*ry*r, cz+Math.sin(v)*Math.sin(u)*rz*r], rnd(d0,d1), rnd(s0||2,s1||3.4), pick(pal)); }
  }
  const FLORAL = [["ivory",.62],["blush",.38]], FLORAL_B = [["ivory",.5],["blush",.35],["blue",.15]], ROSES = [["red",.6],["wine",.3],["blush",.1]];

  const W=17, ZF=26, ZB=-28, H=12;
  const hotspots = [];
  const spot = (cat,p,t)=>hotspots.push({cat,p,t});

  /* room shell */
  for (let x=-W; x<=W+.01; x+=3){ const d=Math.abs(x)/W*.08; path([[x,0,ZF],[x,0,ZB]], d, d+.12, .5); }
  for (let z=ZF; z>=ZB; z-=3){ const d=.02+(ZF-z)/(ZF-ZB)*.1; path([[0,0,z],[W,0,z]], d, d+.06, .5); path([[0,0,z],[-W,0,z]], d, d+.06, .5); }
  rectZ(-W,W,0,H,ZB,.08,.2);
  for (const sx of [-W,W]) path([[sx,0,ZF],[sx,0,ZB],[sx,H,ZB],[sx,H,ZF],[sx,0,ZF]],.08,.22,.5);
  /* front wall with a grand doorway and open doors */
  const doorY = x=>{ const h=4.5, ax=Math.abs(x); return ax>=h ? 7.5 : 7.5+Math.sqrt(h*h-ax*ax)*.3; };
  path([[-W,0,ZF],[-4.5,0,ZF],[-4.5,7.5,ZF]],.06,.12); path([[W,0,ZF],[4.5,0,ZF],[4.5,7.5,ZF]],.06,.12);
  curve(t=>{ const x=-4.5+t*9; return [x, doorY(x), ZF]; },40,.1,.14);
  path([[-W,H,ZF],[W,H,ZF]],.12,.18,.5);
  for (const s of [-1,1]){ const a=1.25, hx=s*4.5, ex=hx-s*Math.cos(a)*4.5, ez=ZF+Math.sin(a)*4.5;
    path([[hx,0,ZF],[ex,0,ez],[ex,7.4,ez],[hx,7.4,ZF]],.1,.16);
    const q=(t,y)=>[hx+(ex-hx)*t, y, ZF+(ez-ZF)*t];
    path([q(.15,.6),q(.85,.6),q(.85,3.4),q(.15,3.4),q(.15,.6)],.14,.18); path([q(.15,4),q(.85,4),q(.85,6.8),q(.15,6.8),q(.15,4)],.14,.18); }
  box(-6,6,-.3,0,ZF,ZF+1.4,.04,.08); box(-6.8,6.8,-.6,-.3,ZF+1.4,ZF+2.8,.02,.06);
  for (const sx of [-6.4,6.4]){ path([[sx,0,ZF+.8],[sx,1.5,ZF+.8]],.1,.14); ring(sx,1.5,ZF+.8,.35,.12,.15,18); cluster(sx,2.2,ZF+.8,.75,.7,.75,150,.6,.7,FLORAL); }

  /* colonnade, arches, balcony, railing, swags, upper windows */
  const colZ = []; for (let z=20; z>=-21; z-=6.5) colZ.push(z);
  for (const sx of [-13.5,13.5]){
    colZ.forEach((z,i)=>{ const d=.12+i*.015;
      ring(sx,0,z,.55,d,d+.03,18); ring(sx,.35,z,.45,d,d+.03,18); ring(sx,5.5,z,.45,d+.05,d+.08,18); ring(sx,6,z,.6,d+.06,d+.09,18);
      for (let k=0;k<6;k++){ const a=k/6*TAU; path([[sx+Math.cos(a)*.45,.35,z+Math.sin(a)*.45],[sx+Math.cos(a)*.45,5.5,z+Math.sin(a)*.45]],d,d+.08,.5); }
      path([[sx,6,z],[sx,H,z]],d+.1,d+.16,.5);
      if (i<colZ.length-1){ const z1=colZ[i+1], wx = sx>0?W:-W;
        curve(t=>[sx, 4.4+Math.sin(t*Math.PI)*1.3, z-.5+(z1-z+1)*t],24,d+.08,d+.12);
        curve(t=>[sx, 6-Math.sin(t*Math.PI)*.7, z+(z1-z)*t],20,d+.2,d+.24);
        curve(t=>[sx, 6-Math.sin(t*Math.PI)*.45, z+(z1-z)*t],20,d+.21,d+.25);
        rectX(wx, z-1.6, z1+1.6, 7.6, 10, d+.18, d+.24);
        const m=(z+z1)/2, hw=(z-z1-3.2)/2;
        curve(t=>{ const zz=m-hw+2*hw*t; return [wx, 10+Math.sqrt(Math.max(0,hw*hw-(zz-m)*(zz-m)))*.45, zz]; },24,d+.22,d+.26);
      }
    });
    path([[sx,6,22],[sx,6,-24]],.18,.26,.5); path([[sx,7,22],[sx,7,-24]],.2,.28,.5);
    for (let z=22; z>=-24; z-=.9) path([[sx,6,z],[sx,7,z]],.22,.28);
  }
  /* coffered ceiling */
  for (let x=-12; x<=12; x+=4) path([[x,H,22],[x,H,-24]],.24,.34,.6);
  for (let z=22; z>=-24; z-=4) path([[-12,H,z],[12,H,z]],.26,.36,.6);
  /* grand chandeliers */
  [[10,2.4],[-1,2.8],[-12,2.4]].forEach(([z,R],ci)=>{ const d0=.62+ci*.03;
    path([[0,H,z],[0,H-.9,z]],.4,.44);
    for (let k=0;k<6;k++){ const y=H-1-k*.5, r=R*(1-k/7)+.15, n=Math.round(r*(mobile?22:30));
      ring(0,y,z,r,.42+k*.01,.46+k*.01,28);
      for (let j=0;j<n;j++){ const a=j/n*TAU; pt([Math.cos(a)*r, y-.05, z+Math.sin(a)*r], d0+k*.012, rnd(1,1.6), C.crystal);
        if (j%2===0) for (let s=1;s<4;s++) pt([Math.cos(a)*r, y-.05-s*.14, z+Math.sin(a)*r], d0+k*.012+.02, 1.1, C.crystal); }
    }
    for (let s=0;s<14;s++) pt([0,H-4.2-s*.12,z],d0+.1,1.6,C.warm);
  });
  spot("draping",[0,8.2,-1],"Grand crystal chandeliers"); spot("draping",[-12.8,5.4,7],"Balcony draping"); spot("draping",[13,1.2,4],"Warm uplighting");
  /* back draping */
  for (let x=-16.4; x<=16.4; x+=.75){ if (Math.abs(x)<5.3) continue;
    const p=[]; for (let y=0;y<=H;y+=.4) p.push([x+Math.sin(y*1.2+x)*.07, y, ZB+.4+Math.sin(x*3.1)*.12]);
    const d=.24+Math.abs(x)/16*.1; path(p,d,d+.08,.4); }

  /* stage */
  const SZ=-25.6;
  box(-8,8,0,1.2,-26.6,-21.4,.28,.4);
  box(-2,2,0,.6,-21.4,-20.3,.32,.38);
  const archY = x=>{ const h=1.7, ax=Math.abs(x); if (ax>=h) return 1.2; return 4 + Math.sqrt(h*h-ax*ax)*1.3; };
  rectZ(-5,5,1.2,9.6,SZ,.36,.48);
  curve(t=>{ const x=-1.7+t*3.4; return [x, archY(x), SZ+.05]; },60,.42,.49,.12);
  path([[-1.7,1.2,SZ+.05],[-1.7,4,SZ+.05]],.4,.43); path([[1.7,1.2,SZ+.05],[1.7,4,SZ+.05]],.4,.43);
  curve(t=>[-2.6+t*5.2, 1.9+Math.sin(t*Math.PI)*.45+Math.pow(Math.abs(t-.5)*2,6)*.55, -23.8+Math.sin(t*Math.PI)*.3],50,.46,.52,.12);
  path([[-2.5,1.7,-23.5],[2.5,1.7,-23.5]],.47,.52);
  for (const sx of [-2.5,2.5]) path([[sx,1.2,-23.3],[sx,1.7,-23.5],[sx,2.3,-23.8]],.5,.53,.15);
  for (const sx of [-3.9,3.9]){ curve(t=>[sx-.5+t, 1.75+Math.sin(t*Math.PI)*.38, -23.4+Math.sin(t*Math.PI)*.15],20,.5,.54,.12); path([[sx-.5,1.6,-23.1],[sx+.5,1.6,-23.1]],.5,.54); }
  for (const [x,y,big] of [[-2.9,6,0],[2.9,6,0],[0,8.4,1]]){
    path([[x,9.6,SZ+.3],[x,y+.4,SZ+.3]],.5,.54);
    for (let k=0;k<5;k++){ const r=(big?.8:.55)*(1-k/6)+.08, n=Math.round(r*30); for (let j=0;j<n;j++){ const a=j/n*TAU; pt([x+Math.cos(a)*r, y-k*.22, SZ+.4+Math.sin(a)*r*.6], .62+k*.01, 1.7, C.warm); } }
  }
  [[-7.2,4.8,0],[-6,6.4,1],[6,6.4,2],[7.2,4.8,3]].forEach(([x0,h,i])=>{
    const cx=t=>x0+Math.sin(t*Math.PI*1.6+i)*.42;
    curve(t=>[cx(t), 1.2+t*h, SZ+.5],40,.44+i*.01,.5+i*.01);
    for (let s=0;s<=60;s++){ const t=s/60; cluster(cx(t), 1.2+t*h, SZ+.6, .38,.13,.28, 7, .7+t*.12, .74+t*.12, FLORAL_B, 1.8, 3.2); }
  });
  for (const sx of [-1,1]){ const x0=sx*9, x1=sx*11.6, z=SZ, top=5.6;
    rectZ(Math.min(x0,x1),Math.max(x0,x1),0,top,z,.36,.46);
    for (let c=1;c<4;c++){ const x=x0+(x1-x0)*c/4; path([[x,0,z],[x,top,z]],.4,.46); }
    for (let r=1;r<9;r++){ const y=top*r/9; path([[x0,y,z],[x1,y,z]],.42,.47); }
    for (let c=0;c<4;c++) for (let r=0;r<9;r++) if (Math.random()<.72) pt([x0+(x1-x0)*(c+.5)/4, top*r/9+.2, z+.05], .72+r*.01, 2.8, C.flame);
  }
  for (const sx of [-4.9,4.9]) cluster(sx,1.8,-23.6,.8,.55,.55,120,.72,.8,FLORAL,2,3.2);
  for (let x=-4.85; x<=4.85; x+=.38) for (let y=1.35; y<=9.45; y+=.38){
    const jx=x+rnd(-.1,.1), jy=y+rnd(-.1,.1);
    if (Math.abs(jx)<1.85 && jy<archY(jx)+.15) continue;
    if (mobile && Math.random()<.2) continue;
    const d=.56+Math.hypot(jx, jy-4.5)/8*.26, c=Math.random()<.18?C.blush:C.ivory, r=rnd(.08,.13);
    pt([jx,jy,SZ+.1],d,4.6,c); for (let k=0;k<7;k++){ const a=k/7*TAU+rnd(0,.5); pt([jx+Math.cos(a)*r, jy+Math.sin(a)*r, SZ+.1+rnd(-.03,.03)], d+rnd(0,.02), rnd(2.6,3.6), c); }
  }
  spot("stages",[-3.5,7.4,SZ],"Floral wall stage"); spot("stages",[6.6,6.2,SZ+.5],"Cascading floral columns"); spot("stages",[-10.3,6.4,SZ],"Gold lattice candle panels"); spot("stages",[2.6,2.6,-23.6],"Curved sofa & accent chairs");
  spot("floral",[2.4,8.6,SZ],"Ivory floral wall"); spot("floral",[0,4.6,SZ],"Arched entry"); spot("floral",[-6.3,7.4,SZ+.5],"Floral columns");

  /* dance floor and mandap */
  box(-6,6,0,.04,-19.5,-8.5,.26,.34);
  for (let x=-4.5; x<=4.5; x+=1.5) path([[x,.04,-19.5],[x,.04,-8.5]],.3,.34,.5);
  for (let z=-18; z<=-9.5; z+=1.5) path([[-6,.04,z],[6,.04,z]],.3,.34,.5);
  box(-2.8,2.8,0,.45,-16.8,-11.2,.32,.38);
  const mz=-14;
  for (const [cx,cz] of [[-2.3,mz-2.3],[2.3,mz-2.3],[-2.3,mz+2.3],[2.3,mz+2.3]]){
    path([[cx,.45,cz],[cx,4.3,cz]],.36,.42); helix(cx,cz,.45,4.3,.26,3,.38,.46,0); helix(cx,cz,.45,4.3,.26,3,.38,.46,Math.PI);
    cluster(cx,4.5,cz,.55,.45,.55,90,.74,.82,ROSES,2,3.4); cluster(cx,.8,cz,.5,.35,.5,60,.76,.84,ROSES,2,3.2);
  }
  for (const y of [4.3,4.8]) path([[-2.3,y,mz-2.3],[2.3,y,mz-2.3],[2.3,y,mz+2.3],[-2.3,y,mz+2.3],[-2.3,y,mz-2.3]],.42,.48);
  for (const [a,b] of [[[-2.3,mz-2.3],[2.3,mz-2.3]],[[2.3,mz-2.3],[2.3,mz+2.3]],[[2.3,mz+2.3],[-2.3,mz+2.3]],[[-2.3,mz+2.3],[-2.3,mz-2.3]]])
    curve(t=>[a[0]+(b[0]-a[0])*t, 4.55+Math.sin(t*TAU*4)*.18, a[1]+(b[1]-a[1])*t],60,.44,.5,.1);
  path([[-1.5,.46,mz-1.2],[1.5,.46,mz-1.2],[1.5,.46,mz+1.2],[-1.5,.46,mz+1.2],[-1.5,.46,mz-1.2]],.4,.44);
  for (const sx of [-.6,.6]) box(sx-.3,sx+.3,.45,1.9,mz-1.3,mz-.8,.44,.48);
  spot("mandap",[0,5.3,mz],"Carved gold mandap"); spot("mandap",[2.4,1.1,mz+2.3],"Red rose florals"); spot("stages",[0,.6,-9.4],"Dance floor");

  /* aisle */
  box(-1.2,1.2,0,.03,-8.5,22,.28,.42);
  for (let z=-7.5; z<22; z+=2.6){ const d=.36+(z+7.5)/30*.1, h=[1.4,2.3,.9][Math.round((z+7.5)/2.6)%3];
    for (const sx of [-1.55,1.55]){ path([[sx,0,z],[sx,h,z]],d,d+.04); ring(sx,h,z,.1,d+.03,d+.05,10); pt([sx,h+.15,z],.7+(z+7.5)/30*.1,3.8,C.flame); pt([sx*1.12,.12,z+1.3],.72+(z+7.5)/30*.1,2.4,C.flame); } }
  for (const sx of [-2,2]) cluster(sx,.32,22.4,.8,.48,.6,200,.74,.84,ROSES,2.2,3.6);
  for (const sx of [-3.4,3.4]){ ring(sx,0,23.2,.48,.44,.47,24); ring(sx,1.8,23.2,.48,.5,.53,24); helix(sx,23.2,0,1.8,.42,2.2,.44,.54,0); helix(sx,23.2,0,1.8,.42,2.2,.44,.54,Math.PI); cluster(sx,2.05,23.2,.4,.18,.4,40,.8,.86,[["red",.6],["flame",.4]],2,3); }
  spot("aisle",[1.8,2.6,12],"Candlelit aisle"); spot("aisle",[-2.2,1.5,22.4],"Red rose mounds"); spot("aisle",[3.6,2.6,23.2],"Gold spiral pedestals");

  /* guest tables, each with a different HKNS centerpiece */
  const Y0=.8;
  function table(x,z,d,chairs){
    ring(x,Y0,z,1.15,d,d+.05,40); ring(x,.04,z,1.25,d+.02,d+.06,40);
    for (let k=0;k<12;k++){ const a=k/12*TAU; path([[x+Math.cos(a)*1.15,Y0,z+Math.sin(a)*1.15],[x+Math.cos(a)*1.25,.04,z+Math.sin(a)*1.25]],d+.01,d+.05,.3); }
    if (chairs) for (let k=0;k<6;k++){ const a=k/6*TAU+.5, cx=x+Math.cos(a)*1.8, cz=z+Math.sin(a)*1.8, hx=-Math.sin(a), hz=Math.cos(a);
      curve(t=>{ const b=t*TAU; return [cx+hx*Math.cos(b)*.24, 1.12+Math.sin(b)*.3, cz+hz*Math.cos(b)*.24]; },16,d+.03,d+.07,.15);
      path([[cx,.82,cz],[cx,0,cz]],d+.03,d+.06,.4); }
  }
  const CP = {
    crystal(x,z,d,D){ path([[x,Y0,z],[x,Y0+2,z]],d,d+.04);
      [[.5,.55],[1.1,.45],[1.7,.35]].forEach(([h,r],i)=>{ ring(x,Y0+h,z,r,d+.02+i*.01,d+.05+i*.01,24);
        for (let j=0;j<16;j++){ const a=j/16*TAU; for (let s=0;s<3;s++) pt([x+Math.cos(a)*r, Y0+h-.1-s*.1, z+Math.sin(a)*r], D+i*.02, 1.3, C.crystal); } });
      cluster(x,Y0+2.15,z,.36,.3,.36,70,D+.06,D+.1,FLORAL); },
    tower(x,z,d,D){ for (let k=0;k<4;k++){ const a=k/4*TAU+.4; path([[x+Math.cos(a)*.12,Y0,z+Math.sin(a)*.12],[x+Math.cos(a)*.34,Y0+1.6,z+Math.sin(a)*.34]],d,d+.05); }
      ring(x,Y0+1.6,z,.34,d+.04,d+.06,20); cluster(x,Y0+2.15,z,.62,.5,.62,170,D,D+.08,FLORAL_B,2,3.4);
      for (let k=0;k<5;k++){ const a=k/5*TAU; for (let s=0;s<9;s++) pt([x+Math.cos(a)*(.55+s*.04), Y0+2-s*.12, z+Math.sin(a)*(.55+s*.04)], D+.08+s*.01, 1.6, C.ivory); } },
    floating(x,z,d,D){ [[0,0,1],[.36,.16,.72],[-.3,.22,.55],[.14,-.36,.86],[-.27,-.26,.46]].forEach(([ox,oz,h],i)=>{
        ring(x+ox,Y0,z+oz,.1,d+i*.01,d+.03+i*.01,10); ring(x+ox,Y0+h,z+oz,.1,d+.02+i*.01,d+.04+i*.01,10);
        path([[x+ox-.1,Y0,z+oz],[x+ox-.1,Y0+h,z+oz]],d,d+.03); path([[x+ox+.1,Y0,z+oz],[x+ox+.1,Y0+h,z+oz]],d,d+.03);
        pt([x+ox,Y0+h-.08,z+oz],D+i*.01,4.2,C.flame); });
      for (let k=0;k<40;k++){ const a=rnd(0,TAU), r=rnd(.45,.9); pt([x+Math.cos(a)*r,Y0+.03,z+Math.sin(a)*r],D+.05,rnd(1.6,2.4),Math.random()<.6?C.red:C.blush); } },
    candelabra(x,z,d,D){ ring(x,Y0,z,.22,d,d+.02,14); path([[x,Y0,z],[x,Y0+2.2,z]],d,d+.04); pt([x,Y0+2.32,z],D,4.2,C.flame);
      for (let k=0;k<4;k++){ const a=k/4*TAU+.78, ex=Math.cos(a)*.5, ez=Math.sin(a)*.5;
        curve(t=>[x+ex*t, Y0+1.35+Math.pow(t,1.6)*.55, z+ez*t],12,d+.03,d+.06,.1);
        ring(x+ex,Y0+1.9,z+ez,.06,d+.05,d+.07,8); pt([x+ex,Y0+2.02,z+ez],D+.02,3.8,C.flame);
        for (let s=0;s<4;s++) pt([x+ex*.6,Y0+1.4-s*.1,z+ez*.6],D+.04,1.2,C.crystal); }
      cluster(x,Y0+.2,z,.5,.16,.5,60,D+.04,D+.08,FLORAL,1.6,2.6); },
    roses(x,z,d,D){ ring(x,Y0+.02,z,.62,d,d+.03,24); cluster(x,Y0+.18,z,.58,.3,.58,190,D,D+.08,ROSES,2.2,3.6);
      for (let k=0;k<8;k++){ const a=k/8*TAU; ring(x+Math.cos(a)*.85,Y0,z+Math.sin(a)*.85,.06,d+.03,d+.05,8); pt([x+Math.cos(a)*.85,Y0+.12,z+Math.sin(a)*.85],D+.04,3.4,C.flame); } },
    tree(x,z,d,D){ curve(t=>[x, Y0+t*1.4, z],10,d,d+.03);
      curve(t=>[x-.9+t*1.8, Y0+1.4+Math.sin(t*Math.PI)*.9, z],30,d+.03,d+.07,.1);
      for (let s=0;s<=30;s++){ const t=s/30; cluster(x-.9+t*1.8, Y0+1.4+Math.sin(t*Math.PI)*.9, z, .26,.22,.26, 9, D+t*.06, D+.02+t*.06, FLORAL, 1.8, 3); }
      for (const e of [-.9,.9]) for (let s=0;s<9;s++) pt([x+e+rnd(-.05,.05), Y0+1.3-s*.12, z], D+.08+s*.01, 1.6, C.ivory); }
  };
  const LAB = { crystal:"Crystal tier centerpiece", tower:"Floral tower", floating:"Floating candles", candelabra:"Gold candelabra", roses:"Red rose mound", tree:"Floral arch centerpiece" };
  [[14,["crystal","tower"]],[7,["floating","candelabra"]],[0,["roses","tree"]]].forEach(([z,[left,right]],row)=>{
    [[-6.8,left],[-10.6,left],[6.8,right],[10.6,right]].forEach(([x,type])=>{
      const inner = Math.abs(x)<8, d=.36+row*.04+(inner?0:.04);
      table(x,z,d,inner); CP[type](x,z,d+.06,.7+row*.04);
      if (inner) spot("tables",[x,Y0+3.1,z],LAB[type]);
    });
  });

  /* mehndi lounge near the entrance */
  const MX=11.5, MZ=18.5;
  box(MX-2.2,MX+2.2,0,.25,MZ-1.6,MZ+1.6,.4,.46);
  box(MX-.6,MX+.6,.25,.6,MZ-.4,MZ+.4,.44,.48);
  [[MX-1.5,MZ-1],[MX+1.4,MZ-1.1],[MX-1.4,MZ+1],[MX+1.5,MZ+.9],[MX,MZ+1.25]].forEach(([x,z],i)=>cluster(x,.45,z,.38,.18,.38,60,.76+i*.01,.82+i*.01,[[["pink","teal","orange","yellow","pink"][i],.8],["ivory",.2]],2.2,3.2));
  for (const [x,z,c] of [[MX-1.9,MZ,"orange"],[MX+1.9,MZ+.2,"teal"]]){
    path([[x,0,z],[x,2.4,z]],.44,.48);
    for (let k=0;k<10;k++){ const a=k/10*TAU; path([[x,2.4,z],[x+Math.cos(a)*.9,1.85,z+Math.sin(a)*.9]],.46,.5,.2); }
    for (let k=0;k<70;k++){ const a=rnd(0,TAU), r=rnd(.1,.9); pt([x+Math.cos(a)*r, 2.4-r*.6, z+Math.sin(a)*r], .78, 1.8, C[k%3?c:"pink"]); }
  }
  for (let k=0;k<=40;k++){ const t=k/40; pt([MX-2.2+t*4.4, 3.2-Math.sin(t*Math.PI)*.6, MZ-1.6], .8+t*.04, 2.6, k%2?C.orange:C.yellow); }
  path([[MX-2.2,0,MZ-1.6],[MX-2.2,3.2,MZ-1.6]],.42,.46); path([[MX+2.2,0,MZ-1.6],[MX+2.2,3.2,MZ-1.6]],.42,.46);
  spot("mehndi",[MX,3.6,MZ-1.6],"Mehndi lounge"); spot("mehndi",[MX+1.9,2.8,MZ+.2],"Parasols & floor cushions");


  /* materials: ink lines and watercolor dabs multiply onto the paper, so nothing glows */
  const U = { uProgress:{value: reduce?1:0}, uTime:{value:0}, uPR:{value:PR}, uFogN:{value:10} };
  const MULT = { transparent:true, depthWrite:false, depthTest:false, blending:THREE.CustomBlending, blendEquation:THREE.AddEquation, blendSrc:THREE.ZeroFactor, blendDst:THREE.SrcColorFactor };
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(LP,3));
  lineGeo.setAttribute("aDelay", new THREE.Float32BufferAttribute(LD,1));
  scene.add(new THREE.LineSegments(lineGeo, new THREE.ShaderMaterial(Object.assign({
    uniforms: U,
    vertexShader:`attribute float aDelay;uniform float uProgress;uniform float uFogN;varying float vA;varying vec3 vC;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float on=smoothstep(aDelay,aDelay+.012,uProgress);
      float fog=clamp(1.-(-mv.z-uFogN)/62.,.26,1.);bool decor=aDelay>.35;
      vC=decor?vec3(.6,.45,.24):vec3(.3,.23,.19);vA=on*fog*(decor?.86:.62);gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying float vA;varying vec3 vC;void main(){gl_FragColor=vec4(mix(vec3(1.),vC,vA),1.);}`
  }, MULT))));
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute("position", new THREE.Float32BufferAttribute(PP,3));
  ptGeo.setAttribute("aDelay", new THREE.Float32BufferAttribute(PD,1));
  ptGeo.setAttribute("aSize", new THREE.Float32BufferAttribute(PS,1));
  ptGeo.setAttribute("aColor", new THREE.Float32BufferAttribute(PC,3));
  ptGeo.setAttribute("aSeed", new THREE.Float32BufferAttribute(PSeed,1));
  scene.add(new THREE.Points(ptGeo, new THREE.ShaderMaterial(Object.assign({
    uniforms: U,
    vertexShader:`attribute float aDelay;attribute float aSize;attribute vec3 aColor;attribute float aSeed;
      uniform float uProgress;uniform float uPR;uniform float uFogN;varying float vA;varying vec3 vC;varying float vS;
      void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float on=smoothstep(aDelay,aDelay+.05,uProgress);
      float fog=clamp(1.-(-mv.z-uFogN)/62.,.34,1.);vA=on*fog;vC=aColor;vS=aSeed;
      gl_PointSize=max(1.,aSize*uPR*1.2*(24./-mv.z));gl_Position=projectionMatrix*mv;}`,
    fragmentShader:`varying float vA;varying vec3 vC;varying float vS;
      void main(){vec2 q=gl_PointCoord-.5;float an=atan(q.y,q.x);float r=length(q)*2.;
      float e=.82+.1*sin(an*3.+vS*40.)+.06*sin(an*5.+vS*17.);
      float cov=smoothstep(e,e-.42,r);float rim=smoothstep(e-.32,e-.06,r)*cov;
      float a=clamp(cov*.58+rim*.42,0.,1.)*vA;if(a<.01)discard;gl_FragColor=vec4(mix(vec3(1.),vC,a),1.);}`
  }, MULT))));
  /* watercolor washes that bloom in once the sketch is drawn, for warmth and depth */
  const WASH_FS = `uniform vec3 uColor;uniform float uMax;uniform float uSeed;uniform float uProgress;varying vec2 vUv;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7))+uSeed)*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
    void main(){vec2 c=vUv-.5;float g=n(vUv*5.)*.55+n(vUv*13.)*.3+n(vUv*31.)*.15;
      float d=max(abs(c.x),abs(c.y))*2.;float edge=smoothstep(1.,.78,d+(g-.5)*.4);
      float t=smoothstep(.62,1.,uProgress);float bloom=smoothstep(0.,1.,t*1.35-(1.-edge)*.3-g*.3);
      float rim=smoothstep(.74,.95,d+(g-.5)*.4)*edge*.45;
      float a=clamp((edge*(.55+.45*g)+rim)*uMax*bloom,0.,1.);gl_FragColor=vec4(mix(vec3(1.),uColor,a),1.);}`;
  const wash = (w,h,pos,rot,hex,max)=>{
    const m = new THREE.ShaderMaterial(Object.assign({
      uniforms:{ uColor:{value:new THREE.Color(hex)}, uMax:{value:max}, uSeed:{value:Math.random()*100}, uProgress:U.uProgress },
      vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:WASH_FS, side:THREE.DoubleSide }, MULT));
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,h), m);
    mesh.position.set(pos[0],pos[1],pos[2]); mesh.rotation.set(rot[0],rot[1],rot[2]); scene.add(mesh);
  };
  wash(34,12,[0,6,-27.6],[0,0,0],"#E7C3BC",.42);
  wash(10.4,8.8,[0,5.4,-25.7],[0,0,0],"#E9D9C2",.5);
  wash(2.6,31,[0,.05,6.75],[-Math.PI/2,0,0],"#E4D3BC",.6);
  wash(12.5,11.5,[0,.05,-14],[-Math.PI/2,0,0],"#E8DCCB",.4);
  wash(6,6,[0,.47,-14],[-Math.PI/2,0,0],"#C4838A",.34);
  for (const sx of [-1,1]) wash(46,1.1,[sx*13.5,6.5,-1],[0,Math.PI/2,0],"#C98B8E",.3);

  const layer = document.getElementById("hotspots");
  const labels = hotspots.map(h=>{ const el=document.createElement("div"); el.className="hs"; el.innerHTML=`<i></i><span>${h.t}</span>`; layer.appendChild(el); return { el, cat:h.cat, v:new THREE.Vector3(...h.p), shown:false }; });

  let W0=0, H0=0;
  function resize(){
    const w=canvas.clientWidth, h=canvas.clientHeight;
    if (Math.abs(w-W0)<2 && Math.abs(h-H0)<120) return;
    W0=w; H0=h; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  resize(); addEventListener("resize", resize);
  return { renderer, scene, camera, U, labels };
})();

/* ---------- camera choreography ---------- */
(function choreo(){
  const kf = key=>{
    const k = key === "designs" ? CATS[activeCat] : KEYS[key];
    return mobile ? { p:k.mp||k.p, l:k.ml||k.l, x:k.mx, y:k.my } : { p:k.p, l:k.l, x:k.x, y:k.y };
  };
  const walk = document.getElementById("process"), beats = [...document.querySelectorAll("#beats .beat")], ticks = [...document.querySelectorAll(".ticks i")];
  const designsStage = document.getElementById("designsStage"), listEl = document.getElementById("svcList");
  let keys = [], walkTop = 0, walkSpan = 1;
  function measure(){
    const ih = innerHeight, list = [];
    document.querySelectorAll("[data-cam],[data-from],[data-walk]").forEach(el=>{
      const top = el.getBoundingClientRect().top + scrollY;
      if (el.hasAttribute("data-walk")){
        walkTop = top; walkSpan = Math.max(1, el.offsetHeight - ih);
        ["w0","w1","w2","w3"].forEach((k,i)=>list.push({ y: top + walkSpan*i/3, k }));
        return;
      }
      if (el.dataset.from) list.push({ y: top, k: el.dataset.from });
      if (el.dataset.cam) list.push({ y: el.dataset.from ? top + ih*.5 : top, k: el.dataset.cam });
    });
    keys = list.sort((a,b)=>a.y-b.y);
  }
  measure(); addEventListener("resize", measure); addEventListener("load", measure); setTimeout(measure, 1500);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(document.querySelector("main"));

  /* render only while a venue chapter is on screen */
  const onScreen = new Set([document.getElementById("hero")]);
  const cio = new IntersectionObserver(es=>es.forEach(e=> e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)), { rootMargin:"80px 0px" });
  document.querySelectorAll(".chapter").forEach(c=>cio.observe(c));

  let curBeat = 0;
  function setBeat(b){
    curBeat = b;
    beats.forEach(el=>el.classList.toggle("on", +el.dataset.b === b));
    ticks.forEach((t,i)=>t.classList.toggle("on", i < b));
  }

  const cur = { px:0, py:5.4, pz:mobile?40:35, lx:0, ly:4, lz:-20, x:0, y:mobile?-.44:-.14 };
  const mouse = { x:0, y:0, tx:0, ty:0 };
  if (!reduce && !mobile) addEventListener("pointermove", e=>{ mouse.tx=e.clientX/innerWidth-.5; mouse.ty=e.clientY/innerHeight-.5; });
  const ease = t=>t*t*(3-2*t), clamp = v=>Math.min(1, Math.max(0, v));
  let intro = reduce ? 1 : 0, introDone = reduce, introT = 0;
  let build = 1, last = performance.now();
  const tmp = venue ? new THREE.Vector3() : null;

  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.2,(now-last)/1000); last = now;
    const s = scrollY, ih = innerHeight;

    const wp = (s - walkTop) / walkSpan;
    let beat = -1;
    if (wp > -.5 && wp < 1.3){ const c = clamp(wp); beat = c < .16 ? 0 : c < .45 ? 1 : c < .74 ? 2 : 3; }
    if (beat >= 0 && beat !== curBeat) setBeat(beat);
    buildTarget = beat === 1 ? .45 : beat === 2 ? .82 : 1;

    let i = 0; while (i < keys.length-1 && s >= keys[i+1].y) i++;
    const A = keys[i] || { y:0, k:"hero" }, B = keys[Math.min(i+1, keys.length-1)] || A;
    const raw = clamp((s - A.y) / Math.max(1, B.y - A.y));
    const t = B === A ? 0 : reduce ? (raw < .5 ? 0 : 1) : ease(raw);
    const a = kf(A.k), b = kf(B.k), mix = (u,v)=>u+(v-u)*t;
    if (!venue) return;
    const { camera, renderer, U, labels } = venue;
    const k = reduce ? 1 : 1 - Math.exp(-dt*3.4);
    cur.px += (mix(a.p[0],b.p[0])-cur.px)*k; cur.py += (mix(a.p[1],b.p[1])-cur.py)*k; cur.pz += (mix(a.p[2],b.p[2])-cur.pz)*k;
    cur.lx += (mix(a.l[0],b.l[0])-cur.lx)*k; cur.ly += (mix(a.l[1],b.l[1])-cur.ly)*k; cur.lz += (mix(a.l[2],b.l[2])-cur.lz)*k;
    cur.x += (mix(a.x,b.x)-cur.x)*k; cur.y += (mix(a.y,b.y)-cur.y)*k;
    const km = 1 - Math.exp(-dt*2.4); mouse.x += (mouse.tx-mouse.x)*km; mouse.y += (mouse.ty-mouse.y)*km;
    U.uTime.value += dt;
    if (!introDone){ introT = Math.min(1, introT + dt/6); intro = introT < .5 ? 2*introT*introT : 1 - Math.pow(-2*introT + 2, 2)/2; if (introT >= 1) introDone = true; }
    build += (buildTarget - build) * (1 - Math.exp(-dt*2.4));
    U.uProgress.value = introDone ? build : Math.min(intro, build);
    U.uFogN.value = Math.max(10, cur.py - 6);
    if (!onScreen.size) return;

    const sway = reduce ? 0 : Math.sin(U.uTime.value*.15)*.22;
    camera.position.set(cur.px + mouse.x*1.2 + sway, cur.py - mouse.y*.5, cur.pz);
    camera.lookAt(cur.lx, cur.ly, cur.lz);
    camera.updateMatrixWorld();
    camera.projectionMatrix.elements[8] = cur.x;
    camera.projectionMatrix.elements[9] = cur.y;

    /* labels: active venue category only, once the camera has settled in the tour */
    const dr = designsStage.getBoundingClientRect();
    const inDesigns = dr.top < ih*.3 && dr.bottom > ih*.7;
    const tgt = kf("designs").p, settled = Math.hypot(cur.px-tgt[0], cur.py-tgt[1], cur.pz-tgt[2]) < 3;
    const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight, cat = CATS[activeCat].key;
    const minX = mobile ? 0 : listEl.getBoundingClientRect().right + 12;
    const placed = [];
    labels.forEach(L=>{
      let on = false;
      if (inDesigns && settled && L.cat === cat){
        tmp.copy(L.v).project(camera);
        on = tmp.z < 1 && Math.abs(tmp.x) < (mobile ? .84 : .92) && tmp.y < (mobile ? .5 : .74) && tmp.y > (mobile ? -.4 : -.8);
        if (on){
          const px=(tmp.x+1)/2*w; let py=(1-tmp.y)/2*h;
          if (px < minX) on = false;
          else {
            if (!L.sw) L.sw = L.el.querySelector("span").offsetWidth || 200;
            const flip = px + 16 + L.sw > w - 10 && px - 16 - L.sw > 10;
            const x0 = flip ? px - 16 - L.sw : px + 16, x1 = x0 + L.sw;
            placed.sort((u,v)=>u.y-v.y).forEach(o=>{ if (Math.abs(o.y-py) < 36 && x0 < o.x1 && x1 > o.x0) py = o.y + 38; });
            placed.push({ y:py, x0, x1 });
            L.el.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`;
            L.el.classList.toggle("flip", flip);
          }
        }
      }
      if (on !== L.shown){ L.el.style.opacity = on ? 1 : 0; L.shown = on; }
    });
    renderer.render(venue.scene, camera);
  }
  requestAnimationFrame(frame);
})();

/* ---------- venue categories: list on desktop, chips on phones ---------- */
(function cats(){
  const list = document.getElementById("svcList"), chips = document.getElementById("chips"), cap = document.getElementById("catCap");
  const btns = [], chipEls = [];
  CATS.forEach((c,i)=>{
    const b = document.createElement("button"); b.className = "tour-item"; b.type = "button"; b.innerHTML = `<b>${c.name}</b><span>${c.sub}</span>`;
    const pickIt = ()=>{ catTouched = true; set(i); };
    b.addEventListener("mouseenter", pickIt); b.addEventListener("focus", pickIt); b.addEventListener("click", pickIt);
    list.appendChild(b); btns.push(b);
    const ch = document.createElement("button"); ch.className = "chip"; ch.type = "button"; ch.textContent = c.name;
    ch.addEventListener("click", ()=>{ catTouched = true; set(i); });
    chips.appendChild(ch); chipEls.push(ch);
  });
  function set(i){
    activeCat = i;
    btns.forEach((b,k)=>b.classList.toggle("on", k===i));
    chipEls.forEach((b,k)=>b.classList.toggle("on", k===i));
    const ch = chipEls[i]; chips.scrollTo({ left: ch.offsetLeft - chips.clientWidth/2 + ch.clientWidth/2, behavior: reduce ? "auto" : "smooth" });
    cap.querySelector("b").textContent = CATS[i].name; cap.querySelector("span").textContent = CATS[i].sub;
  }
  set(0);
  const stage = document.getElementById("designsStage");
  setInterval(()=>{
    const r = stage.getBoundingClientRect();
    if (!catTouched && !reduce && r.top < innerHeight*.3 && r.bottom > innerHeight*.7) set((activeCat+1) % CATS.length);
  }, 6000);
})();


/* ---------- smooth scroll and in-page links ---------- */
let lenis = null;
if (window.Lenis && !reduce && !mobile){
  lenis = new Lenis({ duration:1.15, smoothWheel:true });
  const raf = t=>{ lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
function goTo(id){
  const el = id === "#hero" ? null : document.querySelector(id);
  if (id !== "#hero" && !el) return false;
  if (lenis) lenis.scrollTo(el || 0, { offset: el ? -64 : 0 });
  else if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  else window.scrollTo({ top:0, behavior: reduce ? "auto" : "smooth" });
  return true;
}
document.querySelectorAll('a[href^="#"]:not(.skip)').forEach(a=>a.addEventListener("click", e=>{
  const id = a.getAttribute("href");
  if (id.length < 2) return;
  if (goTo(id)){ e.preventDefault(); closeDrawer(); }
}));

/* ---------- photo reveals: a drape that opens from the centre ---------- */
(function reveals(){
  const els = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)){ els.forEach(el=>el.classList.add("in")); return; }
  const io = new IntersectionObserver(es=>es.forEach(e=>{ if (e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin:"0px 0px -10% 0px" });
  els.forEach(el=>io.observe(el));
})();

/* ---------- nav and menu ---------- */
const nav = document.getElementById("nav");
const onScroll = ()=> nav.classList.toggle("scrolled", scrollY > innerHeight*.5);
addEventListener("scroll", onScroll, { passive:true }); onScroll();
const drawer = document.getElementById("drawer"), menuBtn = document.getElementById("menuBtn");
function closeDrawer(){ if (drawer.hidden) return; drawer.hidden = true; menuBtn.setAttribute("aria-expanded","false"); lenis && lenis.start(); }
menuBtn.addEventListener("click", ()=>{ drawer.hidden = false; menuBtn.setAttribute("aria-expanded","true"); lenis && lenis.stop(); document.getElementById("menuClose").focus(); });
document.getElementById("menuClose").addEventListener("click", ()=>{ closeDrawer(); menuBtn.focus(); });
addEventListener("keydown", e=>{ if (e.key === "Escape" && !drawer.hidden){ closeDrawer(); menuBtn.focus(); } });

/* ---------- services: one open at a time; the frame follows on desktop ---------- */
(function services(){
  const items = [...document.querySelectorAll(".svc")], imgs = [...document.querySelectorAll(".svc-frame img")];
  const open = i=>{
    items.forEach((it,k)=>{ const on = k === i; it.classList.toggle("on", on); it.querySelector(".svc-btn").setAttribute("aria-expanded", on ? "true" : "false"); });
    imgs.forEach((im,k)=>im.classList.toggle("on", k === i));
  };
  items.forEach((it,i)=>{
    it.querySelector(".svc-btn").addEventListener("click", ()=>{
      if (it.classList.contains("on") && mobile){ it.classList.remove("on"); it.querySelector(".svc-btn").setAttribute("aria-expanded","false"); }
      else open(i);
    });
    if (!mobile) it.addEventListener("mouseenter", ()=>open(i));
  });
})();

/* ---------- film: reveal the video only once it has played long enough to sharpen ---------- */
(function film(){
  const sandboxed = /claude|anthropic/.test(location.hostname) || window.self !== window.top || location.protocol === "file:";
  if (sandboxed || reduce) return;
  const box = document.getElementById("yt");
  new IntersectionObserver((es,io)=>{
    if (!es[0].isIntersecting) return; io.disconnect();
    let shown = false;
    window.onYouTubeIframeAPIReady = ()=>{
      new YT.Player("ytp", { videoId:YT_ID, playerVars:{ autoplay:1, mute:1, loop:1, playlist:YT_ID, controls:0, playsinline:1, rel:0, modestbranding:1, iv_load_policy:3, disablekb:1 },
        events:{ onReady:e=>{ e.target.mute(); e.target.playVideo(); }, onStateChange:e=>{ if (e.data === 1 && !shown){ shown = true; setTimeout(()=>box.classList.add("ready"), 2600); } } } });
    };
    const s = document.createElement("script"); s.src = "https://www.youtube.com/iframe_api"; document.head.appendChild(s);
  }, { rootMargin:"400px" }).observe(box);
})();

/* ---------- gallery lightbox ---------- */
const tiles = [...document.querySelectorAll(".gallery .tile")];
const lb = document.getElementById("lightbox"), lbImg = document.getElementById("lbImg"), lbCap = document.getElementById("lbCap");
let li = 0, lastFocus = null;
function show(i){
  li = (i + tiles.length) % tiles.length;
  const img = tiles[li].querySelector("img");
  lbImg.src = img.dataset.full || img.currentSrc || img.src; lbImg.alt = img.alt;
  lbCap.textContent = tiles[li].querySelector("figcaption b").textContent;
}
tiles.forEach((t,i)=>t.querySelector(".tile-open").addEventListener("click", ()=>{ lastFocus = t.querySelector(".tile-open"); show(i); lb.hidden = false; lenis && lenis.stop(); document.getElementById("lbClose").focus(); }));
function closeLb(){ lb.hidden = true; lenis && lenis.start(); lastFocus && lastFocus.focus(); }
document.getElementById("lbClose").addEventListener("click", closeLb);
document.getElementById("lbPrev").addEventListener("click", ()=>show(li-1));
document.getElementById("lbNext").addEventListener("click", ()=>show(li+1));
lb.addEventListener("click", e=>{ if (e.target === lb) closeLb(); });
addEventListener("keydown", e=>{ if (lb.hidden) return; if (e.key === "Escape") closeLb(); if (e.key === "ArrowLeft") show(li-1); if (e.key === "ArrowRight") show(li+1); });

/* ---------- reviews ---------- */
(function reviews(){
  const quotes = [...document.querySelectorAll(".quote")], count = document.getElementById("qCount"), box = document.getElementById("quotes");
  let qi = 0, timer = null, paused = false;
  const q = i=>{ quotes[qi].classList.remove("on"); qi = (i + quotes.length) % quotes.length; quotes[qi].classList.add("on"); count.textContent = `${qi+1} / ${quotes.length}`; };
  const auto = ()=>{ clearInterval(timer); if (!reduce) timer = setInterval(()=>{ if (!paused) q(qi+1); }, 8000); };
  document.getElementById("qPrev").addEventListener("click", ()=>{ q(qi-1); auto(); });
  document.getElementById("qNext").addEventListener("click", ()=>{ q(qi+1); auto(); });
  box.addEventListener("mouseenter", ()=>paused = true); box.addEventListener("mouseleave", ()=>paused = false);
  count.textContent = `1 / ${quotes.length}`;
  auto();
})();

/* ---------- copy email ---------- */
document.querySelectorAll(".copy-btn").forEach(b=>b.addEventListener("click", ()=>{
  const done = ()=>{ b.textContent = "Copied"; setTimeout(()=>b.textContent = "Copy", 1600); };
  const select = ()=>{ const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); getSelection().removeAllRanges(); getSelection().addRange(r); };
  if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, select); else select();
}));

/* ---------- inquiry form: delivered to the studio inbox ---------- */
(function inquiry(){
  const form = document.getElementById("inquiry"), status = document.getElementById("status"), btn = form.querySelector('button[type="submit"]');
  const fallback = 'Your inquiry could not be sent just now. Please email <a href="mailto:hknsevents@gmail.com">hknsevents@gmail.com</a> or call <a href="tel:+16302291402">(630) 229-1402</a>.';
  form.addEventListener("submit", async e=>{
    e.preventDefault();
    const fd = new FormData(form);
    if (fd.get("_honey")) return;
    const name = (fd.get("name") || "").trim(), email = (fd.get("email") || "").trim();
    form.querySelectorAll(".field").forEach(f=>f.classList.remove("err"));
    if (!name || !/^\S+@\S+\.\S+$/.test(email)){
      if (!name) document.getElementById("f-name").closest(".field").classList.add("err");
      if (!/^\S+@\S+\.\S+$/.test(email)) document.getElementById("f-email").closest(".field").classList.add("err");
      status.textContent = "Please add your name and a valid email so we can reach you.";
      (name ? document.getElementById("f-email") : document.getElementById("f-name")).focus();
      return;
    }
    const data = {};
    fd.forEach((v,k)=>{ if (k !== "_honey" && String(v).trim()) data[k] = String(v).trim(); });
    data._subject = `Website inquiry from ${name}`;
    data._template = "table";
    data._captcha = "false";
    data._replyto = email;
    btn.disabled = true; status.textContent = "Sending your inquiry…";
    try {
      const r = await fetch(FORM_ENDPOINT, { method:"POST", headers:{ "Content-Type":"application/json", Accept:"application/json" }, body: JSON.stringify(data) });
      const j = await r.json().catch(()=>({}));
      if (r.ok && String(j.success) === "true"){ form.reset(); status.textContent = "Thank you. Your inquiry has been sent, and we will be in touch shortly."; }
      else { console.warn("Form service:", j.message || r.status); status.innerHTML = fallback; }
    } catch(err){ status.innerHTML = fallback; }
    finally { btn.disabled = false; }
  });
})();

/* ---------- grand opening: hides itself after the event; delete the marked blocks to remove it ---------- */
if (Date.now() > Date.parse("2026-11-16T01:00:00Z")) document.querySelectorAll("[data-grand-opening]").forEach(el=>el.remove());
