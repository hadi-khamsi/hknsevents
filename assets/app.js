/* HKNS Events site script. */
"use strict";
document.documentElement.classList.add("js");
const YT_ID = "oF0B0heofI0";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 900px)").matches;

/* camera views: p position, l look-at, x/y lens shift (m* = phone versions) */
const SR = [-80, 172];   /* the showroom sits across the map from the venue */
const VIEWS = {
  hero:   { p:[0,5.4,35],          l:[0,4.2,-20],        x:-.1,  y:-.14, mp:[0,5.4,40],           ml:[0,3.4,-20],        mx:0, my:-.44 },
  rise:   { p:[24,31,50],          l:[3,1,-5],           x:-.16, y:-.1,  mp:[14,72,72],           ml:[-5,0,-4],          mx:0, my:-.34 },
  map:    { p:[-84,253,293],       l:[-40,0,86],         x:-.26, y:-.12, mp:[-73,344,242],        ml:[-40,0,86],         mx:0, my:-.32 },
  show:   { p:[SR[0]+1.5,3.8,SR[1]+13.2], l:[SR[0]-1,2.4,SR[1]-12], x:-.12, y:-.1, mp:[SR[0],4.4,SR[1]+19.5], ml:[SR[0],2.8,SR[1]-10], mx:0, my:-.3 },
  arrive: { p:[11,11,23],          l:[-2,1.5,-12],       x:-.12, y:-.1,  mp:[8,15,34],            ml:[-1,1.5,-12],       mx:0, my:-.3 },
  stage:  { p:[-10,5.2,-7],        l:[-.5,4,-25.6],      x:-.12, y:-.08, mp:[-7,5.4,-4],          ml:[-.5,4.2,-25.6],    mx:0, my:-.3 }
};

/* ---------- 3D venue ---------- */
const venue = (function(){
  const canvas = document.getElementById("venue");
  if (!window.THREE) return null;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, powerPreference:"high-performance"}); }
  catch(e){ return null; }
  renderer.setClearColor(0xF3EEE6, 1);
  const PR = Math.min(window.devicePixelRatio || 1, mobile ? 1.6 : 1.75);
  renderer.setPixelRatio(PR);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(mobile ? 64 : 50, 1, .5, 3200);
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
              pink:[.8,.34,.55], teal:[.36,.62,.6], orange:[.87,.49,.2], yellow:[.9,.7,.25], sage:[.68,.72,.56], olive:[.56,.6,.42] };
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


  /* materials: ink lines and watercolor dabs multiply onto the paper, so nothing glows.
     Three groups draw themselves in and out on their own: the venue, the showroom and the map between them. */
  const U = { uTime:{value:0}, uPR:{value:PR}, uFogN:{value:10}, uFogR:{value:62} };
  const group = p=>({ u:{ uProgress:{value:p}, uAlpha:{value:1} }, meshes:[] });
  const G = { venue:group(reduce?1:0), show:group(0), map:group(0) };
  const add = (g,o)=>{ g.meshes.push(o); scene.add(o); };   /* groups hide their meshes when there is nothing to draw */
  const MULT = { transparent:true, depthWrite:false, depthTest:false, blending:THREE.CustomBlending, blendEquation:THREE.AddEquation, blendSrc:THREE.ZeroFactor, blendDst:THREE.SrcColorFactor };
  const ARCH = [.3,.23,.19,.62], GILT = [.6,.45,.24,.86];
  const inkByDelay = D=>{ const K = []; for (let i=0;i<D.length;i++) K.push(...(D[i] > .35 ? GILT : ARCH)); return K; };
  function inkLines(P, D, K, g){
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(P,3));
    geo.setAttribute("aDelay", new THREE.Float32BufferAttribute(D,1));
    geo.setAttribute("aInk", new THREE.Float32BufferAttribute(K,4));
    add(g, new THREE.LineSegments(geo, new THREE.ShaderMaterial(Object.assign({
      uniforms: Object.assign({}, U, g.u),
      vertexShader:`attribute float aDelay;attribute vec4 aInk;uniform float uProgress;uniform float uAlpha;uniform float uFogN;uniform float uFogR;varying float vA;varying vec3 vC;
        void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float on=smoothstep(aDelay,aDelay+.012,uProgress);
        float fog=clamp(1.-(-mv.z-uFogN)/uFogR,.26,1.);vC=aInk.rgb;vA=on*fog*aInk.a*uAlpha;gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`varying float vA;varying vec3 vC;void main(){gl_FragColor=vec4(mix(vec3(1.),vC,vA),1.);}`
    }, MULT))));
  }
  function inkDabs(P, D, S, Cc, Seed, g){
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(P,3));
    geo.setAttribute("aDelay", new THREE.Float32BufferAttribute(D,1));
    geo.setAttribute("aSize", new THREE.Float32BufferAttribute(S,1));
    geo.setAttribute("aColor", new THREE.Float32BufferAttribute(Cc,3));
    geo.setAttribute("aSeed", new THREE.Float32BufferAttribute(Seed,1));
    add(g, new THREE.Points(geo, new THREE.ShaderMaterial(Object.assign({
      uniforms: Object.assign({}, U, g.u),
      vertexShader:`attribute float aDelay;attribute float aSize;attribute vec3 aColor;attribute float aSeed;
        uniform float uProgress;uniform float uAlpha;uniform float uPR;uniform float uFogN;uniform float uFogR;varying float vA;varying vec3 vC;varying float vS;
        void main(){vec4 mv=modelViewMatrix*vec4(position,1.);float on=smoothstep(aDelay,aDelay+.05,uProgress);
        float fog=clamp(1.-(-mv.z-uFogN)/uFogR,.34,1.);vA=on*fog*uAlpha;vC=aColor;vS=aSeed;
        gl_PointSize=max(1.,aSize*uPR*1.2*(24./-mv.z));gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`varying float vA;varying vec3 vC;varying float vS;
        void main(){vec2 q=gl_PointCoord-.5;float an=atan(q.y,q.x);float r=length(q)*2.;
        float e=.82+.1*sin(an*3.+vS*40.)+.06*sin(an*5.+vS*17.);
        float cov=smoothstep(e,e-.42,r);float rim=smoothstep(e-.32,e-.06,r)*cov;
        float a=clamp(cov*.58+rim*.42,0.,1.)*vA;if(a<.01)discard;gl_FragColor=vec4(mix(vec3(1.),vC,a),1.);}`
    }, MULT))));
  }
  /* watercolor washes that bloom in once a sketch is drawn; ribbons (the river) fade only at their sides */
  const WASH_VS = `varying vec2 vUv;varying vec2 vW;void main(){vUv=uv;vec4 wp=modelMatrix*vec4(position,1.);vW=wp.xz;gl_Position=projectionMatrix*viewMatrix*wp;}`;
  const WASH_FS = `uniform vec3 uColor;uniform float uMax;uniform float uSeed;uniform float uProgress;uniform float uAlpha;uniform float uRib;uniform vec4 uFade;varying vec2 vUv;varying vec2 vW;
    float h(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031+uSeed*.0137);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
    void main(){vec2 c=vUv-.5;float g=n(vUv*5.)*.55+n(vUv*13.)*.3+n(vUv*31.)*.15;
      float d=uRib>.5?abs(c.y)*2.:max(abs(c.x),abs(c.y))*2.;float edge=smoothstep(1.,.78,d+(g-.5)*.4);
      float t=smoothstep(.62,1.,uProgress);float bloom=smoothstep(0.,1.,t*1.35-(1.-edge)*.3-g*.3);
      float rim=smoothstep(.74,.95,d+(g-.5)*.4)*edge*.45;
      float rf=1.-smoothstep(uFade.z,uFade.w,length(vW-uFade.xy));
      float a=clamp((edge*(.55+.45*g)+rim)*uMax*bloom,0.,1.)*uAlpha*rf;gl_FragColor=vec4(mix(vec3(1.),uColor,a),1.);}`;
  const washMat = (hex,max,g,rib,fade)=>new THREE.ShaderMaterial(Object.assign({
    uniforms:{ uColor:{value:new THREE.Color(hex)}, uMax:{value:max}, uSeed:{value:Math.random()*100}, uProgress:g.u.uProgress, uAlpha:g.u.uAlpha,
      uRib:{value:rib?1:0}, uFade:{value:new THREE.Vector4(...(fade || [0,0,1e6,2e6]))} },
    vertexShader:WASH_VS, fragmentShader:WASH_FS, side:THREE.DoubleSide }, MULT));
  const wash = (w,h,pos,rot,hex,max,g,fade)=>{
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w,h), washMat(hex,max,g||G.venue,false,fade));
    mesh.position.set(pos[0],pos[1],pos[2]); mesh.rotation.set(rot[0],rot[1],rot[2]); add(g||G.venue, mesh);
  };

  /* the venue */
  inkLines(LP, LD, inkByDelay(LD), G.venue);
  inkDabs(PP, PD, PS, PC, PSeed, G.venue);
  wash(34,12,[0,6,-27.6],[0,0,0],"#E7C3BC",.42);
  wash(10.4,8.8,[0,5.4,-25.7],[0,0,0],"#E9D9C2",.5);
  wash(2.6,31,[0,.05,6.75],[-Math.PI/2,0,0],"#E4D3BC",.6);
  wash(12.5,11.5,[0,.05,-14],[-Math.PI/2,0,0],"#E8DCCB",.4);
  wash(6,6,[0,.47,-14],[-Math.PI/2,0,0],"#C4838A",.34);
  for (const sx of [-1,1]) wash(46,1.1,[sx*13.5,6.5,-1],[0,Math.PI/2,0],"#C98B8E",.3);
  const reset = ()=>{ for (const a of [LP,LD,PP,PD,PS,PC,PSeed]) a.length = 0; };

  /* ---------- the HKNS showroom in Wood Dale: displays to see and touch ---------- */
  reset();
  const sh = 6.4, X = x=>SR[0]+x, Z = z=>SR[1]+z;
  const CANOPY = [["ivory",.62],["blush",.13],["sage",.25]];
  /* floor, walls, storefront */
  for (let x=-12; x<=12.01; x+=3){ const d=.02+Math.abs(x)/12*.04; path([[X(x),0,Z(14)],[X(x),0,Z(-14)]], d, d+.08, .6); }
  for (let z=14; z>=-14.01; z-=3){ const d=.03+(14-z)/28*.06; path([[X(-12),0,Z(z)],[X(12),0,Z(z)]], d, d+.05, .6); }
  rectZ(X(-12),X(12),0,sh,Z(-14),.08,.18);
  for (const sx of [-12,12]) path([[X(sx),0,Z(14)],[X(sx),0,Z(-14)],[X(sx),sh,Z(-14)],[X(sx),sh,Z(14)],[X(sx),0,Z(14)]],.08,.2,.5);
  path([[X(-12),sh,Z(14)],[X(12),sh,Z(14)]],.12,.18,.5);
  path([[X(-12),5,Z(14)],[X(12),5,Z(14)]],.13,.19,.5);
  for (let x=-9; x<=9.01; x+=3){ if (!x) continue; path([[X(x),0,Z(14)],[X(x),5,Z(14)]],.14,.2); }
  for (const s of [-1,1]){ const hx=s*1.8, a=.95, ex=hx-s*Math.cos(a)*1.8, ez=14-Math.sin(a)*1.8;
    path([[X(hx),0,Z(14)],[X(hx),4.4,Z(14)]],.16,.2);
    path([[X(hx),0,Z(14)],[X(ex),0,Z(ez)],[X(ex),4.4,Z(ez)],[X(hx),4.4,Z(14)]],.18,.22);
    const qx=hx+(ex-hx)*.82, qz=14+(ez-14)*.82; path([[X(qx),1.9,Z(qz)],[X(qx),2.8,Z(qz)]],.22,.24); }
  path([[X(-1.8),4.4,Z(14)],[X(1.8),4.4,Z(14)]],.16,.2);
  curve(t=>[X(Math.cos(t*TAU)*.5), 5.7+Math.sin(t*TAU)*.5, Z(14.04)], 32, .2, .24, .1);
  for (const sx of [-.2,.2]) path([[X(sx),5.45,Z(14.04)],[X(sx),5.95,Z(14.04)]],.24,.25);
  path([[X(-.2),5.7,Z(14.04)],[X(.2),5.7,Z(14.04)]],.25,.26);
  /* track lights */
  for (const sx of [-5,5]){ path([[X(sx),sh,Z(-12)],[X(sx),sh,Z(12)]],.22,.28,.6);
    for (let z=-10; z<=10.01; z+=5){ const tx=sx-Math.sign(sx)*.35; path([[X(sx),sh,Z(z)],[X(tx),sh-.55,Z(z-.2)]],.28,.3); ring(X(tx),sh-.6,Z(z-.2),.12,.29,.31,8); } }

  /* back wall: a sample stage, a floral canopy over three panels, a curved sofa, gold candle stands and glass cylinders */
  box(X(-5.2),X(5.2),0,.55,Z(-13.8),Z(-10.4),.3,.36);
  box(X(-.9),X(.9),0,.28,Z(-10.4),Z(-9.5),.32,.36);
  const fz=-13.5, PT=4.5;
  for (const [a,b] of [[-3.8,-1.75],[1.75,3.8]]){
    rectZ(X(a),X(b),.55,PT,Z(fz),.38,.44);
    for (let cx=a+.26; cx<b-.1; cx+=.41) for (let cy=.85; cy<PT-.15; cy+=.5){
      if (mobile && Math.random()<.3) continue;
      const d=.44+(cy/PT)*.08;
      path([[X(cx),cy-.2,Z(fz+.02)],[X(cx+.17),cy,Z(fz+.02)],[X(cx),cy+.2,Z(fz+.02)],[X(cx-.17),cy,Z(fz+.02)],[X(cx),cy-.2,Z(fz+.02)]],d,d+.03,.2);
    }
  }
  rectZ(X(-1.75),X(1.75),.55,PT,Z(fz-.05),.38,.44);
  for (const [cx,cy,sc] of [[0,3.55,1],[-.62,2.75,.8],[.62,2.75,.8],[0,1.95,.9]]){
    curve(t=>{ const a=t*TAU; return [X(cx+Math.sin(a)*.2*sc), cy+Math.cos(a)*.34*sc, Z(fz+.03)]; },28,.5,.54,.06);
    for (const sx of [-1,1]) curve(t=>[X(cx+sx*(.2+t*.22)*sc), cy+(Math.sin(t*Math.PI)*.18-.05)*sc, Z(fz+.03)],10,.52,.55,.05);
    pt([X(cx),cy,Z(fz+.05)],.6,3.4,C.warm);
  }
  for (let k=0;k<=56;k++){ const t=k/56, x=-4.3+8.6*t, y=PT+.22+Math.sin(t*Math.PI*3)*.1+Math.sin(t*Math.PI)*.18, d=.62+Math.abs(t-.5)*.3;
    cluster(X(x), y, Z(fz+.4), .5,.34,.4, 9, d, d+.04, CANOPY, 2, 3.4); }
  for (const sx of [-1,1]) for (let k=0;k<12;k++) cluster(X(sx*(4.2-k*.03)), PT-.1-k*.24, Z(fz+.45), .26,.16,.22, 6, .78+k*.008, .8+k*.008, CANOPY, 1.8, 3);
  const lz=-12;
  curve(t=>[X(-2.1+t*4.2), 1.3+Math.sin(t*Math.PI)*.45, Z(lz-.4+Math.sin(t*Math.PI)*.12)],40,.46,.52,.12);
  path([[X(-2.1),1.05,Z(lz)],[X(2.1),1.05,Z(lz)]],.47,.52);
  for (const sx of [-2.1,2.1]) path([[X(sx),.55,Z(lz)],[X(sx),1.05,Z(lz)],[X(sx),1.5,Z(lz-.35)]],.5,.53,.15);
  for (const sx of [-2.75,2.75]) cluster(X(sx),.9,Z(-11.7),.55,.38,.45,60,.72,.8,CANOPY,2,3.2);
  for (const sx of [-4.5,4.5]){
    box(X(sx-.35),X(sx+.35),.55,1.5,Z(-11.95),Z(-11.25),.42,.46);
    [[0,2.5],[-.16,1.9],[.16,2.1],[-.3,1.5],[.3,1.6],[-.08,1.2],[.1,1.35]].forEach(([o,h],i)=>{ const x=X(sx+o), z=Z(-11.6+((i%3)-1)*.1);
      path([[x,1.5,z],[x,1.5+h,z]],.46+i*.005,.5+i*.005); pt([x,1.5+h+.08,z],.74+i*.01,3.2,C.flame); });
  }
  for (const sx of [-1,1]) [[3.6,.8],[4.15,1.3],[4.7,.65]].forEach(([ax,h],i)=>{ const x=X(sx*ax), z=Z(-10.85), r=.13;
    ring(x,.55,z,r,.46,.48,10); ring(x,.55+h,z,r,.47,.49,10);
    path([[x-r,.55,z],[x-r,.55+h,z]],.46,.49); path([[x+r,.55,z],[x+r,.55+h,z]],.46,.49);
    pt([x,.55+h*.55,z],.76+i*.01,3.6,C.flame); });

  /* a monogram dance floor in front of the stage */
  box(X(-3),X(3),0,.03,Z(-9.3),Z(-3.5),.38,.42);
  for (let x=-1.5; x<=1.51; x+=1.5) path([[X(x),.03,Z(-9.3)],[X(x),.03,Z(-3.5)]],.4,.42,.5);
  for (let z=-7.85; z<=-4.9; z+=1.45) path([[X(-3),.03,Z(z)],[X(3),.03,Z(z)]],.4,.42,.5);
  ring(X(0),.04,Z(-6.4),1.7,.5,.56,48); ring(X(0),.04,Z(-6.4),1.52,.51,.57,48);
  curve(t=>{ const a=t*Math.PI*1.6-2.4; return [X(-.25+Math.cos(a)*.62), .04, Z(-6.4+Math.sin(a)*.8)]; },26,.56,.6,.08);
  curve(t=>{ const a=-t*Math.PI*1.6+.75; return [X(.3+Math.cos(a)*.6), .04, Z(-6.4+Math.sin(a)*.8)]; },26,.57,.61,.08);
  for (const a of [.6,2.6,3.9,5.6]) cluster(X(Math.cos(a)*1.62), .06, Z(-6.4+Math.sin(a)*1.62), .32,.04,.32, 12, .66,.7, [["blush",.5],["warm",.5]], 1.6, 2.6);

  /* left wall: fabric swatches on a rail, to compare side by side */
  path([[X(-11.7),5.3,Z(-9.6)],[X(-11.7),5.3,Z(3.6)]],.36,.4);
  ["#E3BDB5","#E6D3B3","#C99199","#8F3E4B","#BCC2A3","#D7B57F","#AEB8C6"].forEach((hex,i)=>{ const zc=-8.6+i*1.75, d=.42+i*.02;
    for (const o of [-.72,-.24,.24,.72]) curve(t=>[X(-11.62+Math.sin(t*9+o*4+i)*.05), 5.3-t*4.4, Z(zc+o+Math.sin(t*5+i)*.04)], 18, d+.02, d+.06, .2);
    wash(1.46,4.4,[X(-11.58),3.1,Z(zc)],[0,Math.PI/2,0],hex,.62,G.show);
  });

  /* right: sample tables with HKNS centerpieces */
  const crystalTower=(x,z,d,D)=>{
    for (let k=0;k<4;k++){ const a=k/4*TAU+.4; path([[x+Math.cos(a)*.28,Y0,z+Math.sin(a)*.28],[x+Math.cos(a)*.28,Y0+3.1,z+Math.sin(a)*.28]],d,d+.05); }
    ring(x,Y0+.02,z,.4,d,d+.02,18);
    [[1.25,.6],[1.75,.46],[2.25,.72],[2.7,.42],[3.15,.66]].forEach(([h,r],i)=>{ const dd=d+.03+i*.012;
      ring(x,Y0+h,z,r,dd,dd+.02,26); ring(x,Y0+h-.3,z,r,dd+.01,dd+.03,26);
      for (let j=0;j<20;j++){ const a=j/20*TAU, px=x+Math.cos(a)*r, pz=z+Math.sin(a)*r; path([[px,Y0+h,pz],[px,Y0+h-.3,pz]],dd+.01,dd+.03,.4); if (j%2===0) pt([px,Y0+h-.15,pz],D+i*.02,1.3,C.crystal); } });
    cluster(x,Y0+.4,z,.4,.32,.4,70,D+.06,D+.1,FLORAL,2,3.2);
  };
  const bougainvillea=(x,z,d,D)=>{
    ring(x,Y0+.02,z,.34,d,d+.02,16); ring(x,Y0+.32,z,.36,d+.01,d+.03,16);
    cluster(x,Y0+.18,z,.36,.16,.36,24,D,D+.03,[["blush",.5],["ivory",.5]],2,3);
    const tx0=x+.05, ty0=Y0+1.9;
    curve(t=>[x+Math.sin(t*2.2)*.08, Y0+.3+t*1.6, z+Math.sin(t*1.7)*.05],12,d+.02,d+.05);
    [[-.9,3.1,.2],[-.5,3.5,-.35],[.1,3.7,.3],[.6,3.4,-.2],[.95,2.9,.25],[-.2,2.8,.55],[.35,2.7,-.6]].forEach(([bx,by,bz],i)=>{
      const tx=x+bx, ty=Y0+by, tz=z+bz;
      curve(t=>[tx0+(tx-tx0)*t, ty0+(ty-ty0)*Math.sin(t*Math.PI/2), z+(tz-z)*t],12,d+.04+i*.01,d+.08+i*.01);
      cluster(tx,ty,tz,.42,.32,.42,34,D+.04+i*.01,D+.08+i*.01,[["pink",.72],["wine",.1],["olive",.18]],2,3.4);
      if (i%2===0) for (let s=0;s<6;s++) pt([tx+rnd(-.2,.2), ty-.3-s*.14, tz+rnd(-.2,.2)], D+.1, rnd(2,3), C.pink);
    });
  };
  const hurricanes=(x,z,d,D)=>{
    box(x-.42,x+.42,Y0,Y0+.84,z-.42,z+.42,d,d+.03);
    const y0=Y0+.84, RY=y0+2.6, R=.62;
    ring(x,y0+.02,z,.26,d+.02,d+.04,16);
    path([[x,y0,z],[x,RY,z]],d+.03,d+.06);
    ring(x,RY,z,R,d+.05,d+.07,32); ring(x,RY-.08,z,R*.92,d+.05,d+.07,32);
    for (let k=0;k<4;k++){ const a=k/4*TAU+.4; path([[x,RY-.5,z],[x+Math.cos(a)*R,RY,z+Math.sin(a)*R]],d+.05,d+.07); }
    for (let k=0;k<9;k++){ const a=k/9*TAU, hx=x+Math.cos(a)*R*.82, hz=z+Math.sin(a)*R*.82, h=.55+(k%3)*.18, r=.09;
      ring(hx,RY,hz,r,d+.06,d+.08,10); ring(hx,RY+h,hz,r,d+.07,d+.09,10);
      path([[hx-r,RY,hz],[hx-r,RY+h,hz]],d+.06,d+.08); path([[hx+r,RY,hz],[hx+r,RY+h,hz]],d+.06,d+.08);
      path([[hx,RY,hz],[hx,RY+h*.7,hz]],D,D+.02);
      pt([hx,RY+h*.7+.06,hz],D+.06,3.4,C.flame); }
    for (let j=0;j<26;j++){ const a=j/26*TAU, px=x+Math.cos(a)*R, pz=z+Math.sin(a)*R, L=.2+((j*7)%5)*.08; path([[px,RY-.08,pz],[px,RY-.08-L,pz]],d+.08,d+.1,.3); pt([px,RY-.08-L,pz],D+.08,1.3,C.crystal); }
    for (const [ox,oz] of [[-.7,.35],[.75,-.3],[.2,.75]]){ pt([x+ox,Y0+.12,z+oz],D+.1,4.4,C.warm); ring(x+ox,Y0+.02,z+oz,.12,d+.08,d+.1,10); }
    for (const [ox,oz] of [[-.55,-.6],[.65,.55]]){ path([[x+ox,Y0,z+oz],[x+ox,Y0+.45,z+oz]],d+.08,d+.1); cluster(x+ox,Y0+.55,z+oz,.14,.12,.14,8,D+.1,D+.12,FLORAL,1.6,2.4); }
  };
  table(X(7.4),Z(-6.4),.4,true); crystalTower(X(7.4),Z(-6.4),.46,.72);
  table(X(7.4),Z(1.4),.42,true); bougainvillea(X(7.4),Z(1.4),.48,.74);
  table(X(4.6),Z(6.6),.43,true); hurricanes(X(4.6),Z(6.6),.5,.76);

  /* right wall: shelves of vases, candleholders and florals */
  for (const y of [.12,1.35,2.6,3.85]) path([[X(11.8),y,Z(5.6)],[X(10.95),y,Z(5.6)],[X(10.95),y,Z(12.2)],[X(11.8),y,Z(12.2)]],.24,.3);
  for (const z of [5.6,8.9,12.2]) path([[X(10.95),0,Z(z)],[X(10.95),3.85,Z(z)]],.25,.3);
  [1.35,2.6,3.85].forEach((y,r)=>{ for (let k=0;k<4;k++){ const z=6.4+k*1.6, x=11.38, d=.5+r*.02, kind=(k+r)%3;
    if (kind===0){ ring(X(x),y+.05,Z(z),.18,d,d+.02,12); ring(X(x),y+.55,Z(z),.1,d+.01,d+.03,10);
      for (const o of [-1,1]) path([[X(x+o*.18),y+.05,Z(z)],[X(x+o*.1),y+.55,Z(z)]],d,d+.02);
      cluster(X(x),y+.8,Z(z),.22,.2,.22,18,.74,.8,FLORAL_B,1.6,2.6); }
    else if (kind===1){ for (const o of [-.22,0,.22]){ const hh=.35+Math.abs(o)*.6; path([[X(x),y,Z(z+o)],[X(x),y+hh,Z(z+o)]],d,d+.02); pt([X(x),y+hh+.1,Z(z+o)],.76+r*.01,3.2,C.flame); } }
    else { ring(X(x),y+.02,Z(z),.26,d,d+.02,14); cluster(X(x),y+.2,Z(z),.26,.14,.26,22,.75,.8,ROSES,1.8,2.8); }
  } });

  /* front left: the consultation table with sketches and samples, and an easel */
  box(X(-9.6),X(-4.8),.74,.8,Z(6.2),Z(8.8),.22,.28);
  for (const [lx,lz2] of [[-9.4,6.4],[-5,6.4],[-9.4,8.6],[-5,8.6]]) path([[X(lx),0,Z(lz2)],[X(lx),.74,Z(lz2)]],.24,.28);
  const seat = (x,z,f,d)=>{ const s=.25, bz=z-f*s;
    path([[x-s,.48,z-s],[x+s,.48,z-s],[x+s,.48,z+s],[x-s,.48,z+s],[x-s,.48,z-s]],d,d+.02);
    for (const [ox,oz] of [[-s,-s],[s,-s],[s,s],[-s,s]]) path([[x+ox,0,z+oz],[x+ox,.48,z+oz]],d+.01,d+.03);
    path([[x-s,.48,bz],[x-s,1.2,bz],[x+s,1.2,bz],[x+s,.48,bz]],d+.02,d+.04); };
  for (const x of [-8.4,-6]){ seat(X(x),Z(5.5),1,.26); seat(X(x),Z(9.5),-1,.27); }
  path([[X(-8.6),.81,Z(7)],[X(-7.3),.81,Z(7)],[X(-7.3),.81,Z(7.9)],[X(-8.6),.81,Z(7.9)],[X(-8.6),.81,Z(7)]],.5,.53);
  curve(t=>[X(-8.4+t*.9), .81, Z(7.75-Math.sin(t*Math.PI)*.5)],12,.53,.55,.08);
  [[-6.2,7.3,C.blush],[-5.8,7.6,C.wine],[-6.5,7.8,C.warm]].forEach(([x,z,c],i)=>pt([X(x),.82,Z(z)],.56+i*.01,5,c));
  const ex=-3.4, ez=9.2;
  for (const o of [-.55,.55]) path([[X(ex+o),0,Z(ez+.3)],[X(ex),3.1,Z(ez)]],.26,.3);
  path([[X(ex),0,Z(ez-.6)],[X(ex),2.9,Z(ez-.05)]],.26,.3);
  rectZ(X(ex-.8),X(ex+.8),1.35,2.75,Z(ez+.12),.48,.52);
  curve(t=>{ const x=-.45+t*.9; return [X(ex+x), 1.75+Math.sqrt(Math.max(0,.2025-x*x))*1.2, Z(ez+.13)]; },20,.52,.55,.06);
  path([[X(ex-.6),1.6,Z(ez+.13)],[X(ex+.6),1.6,Z(ez+.13)]],.53,.55);

  /* left: a long table with a floral runner, tall acrylic stands, taper candles in glass and chiavari chairs */
  const LX0=-7.2, LX1=-5.6, LZ0=-8.6, LZ1=-1.4, LY=.78, LC=(LX0+LX1)/2;
  box(X(LX0),X(LX1),LY-.04,LY,Z(LZ0),Z(LZ1),.4,.44);
  for (const [lx,lz2] of [[LX0+.1,LZ0+.1],[LX1-.1,LZ0+.1],[LX0+.1,LZ1-.1],[LX1-.1,LZ1-.1]]) path([[X(lx),0,Z(lz2)],[X(lx),LY-.04,Z(lz2)]],.41,.44);
  const seatX = (x,z,f,d)=>{ const s=.24, bx=x-f*s;
    path([[x-s,.48,z-s],[x+s,.48,z-s],[x+s,.48,z+s],[x-s,.48,z+s],[x-s,.48,z-s]],d,d+.02);
    for (const [ox,oz] of [[-s,-s],[s,-s],[s,s],[-s,s]]) path([[x+ox,0,z+oz],[x+ox,.48,z+oz]],d+.01,d+.03);
    path([[bx,.48,z-s],[bx,1.2,z-s],[bx,1.2,z+s],[bx,.48,z+s]],d+.02,d+.04);
    for (const o of [-.08,.08]) path([[bx,.55,z+o],[bx,1.15,z+o]],d+.03,d+.04); };
  for (let z=LZ0+.6; z<LZ1-.2; z+=1.2){ seatX(X(LX0-.5),Z(z),1,.42); seatX(X(LX1+.5),Z(z),-1,.43); }
  for (const zc of [-7.4,-5,-2.6]){ const w=.2;
    for (const [ox,oz] of [[-w,-w],[w,-w],[w,w],[-w,w]]) path([[X(LC+ox),LY,Z(zc+oz)],[X(LC+ox),LY+2.3,Z(zc+oz)]],.46,.5);
    path([[X(LC-w),LY+2.3,Z(zc-w)],[X(LC+w),LY+2.3,Z(zc-w)],[X(LC+w),LY+2.3,Z(zc+w)],[X(LC-w),LY+2.3,Z(zc+w)],[X(LC-w),LY+2.3,Z(zc-w)]],.48,.5);
    cluster(X(LC),LY+2.75,Z(zc),.6,.45,.6,80,.7,.78,[["blush",.45],["ivory",.25],["pink",.15],["blue",.15]],2,3.4);
    cluster(X(LC),LY+.2,Z(zc),.32,.18,.32,26,.74,.8,ROSES,1.8,3); }
  for (const zc of [-6.2,-3.8]){ const r=.1;
    ring(X(LC),LY,Z(zc),r,.47,.49,10); ring(X(LC),LY+1.1,Z(zc),r,.48,.5,10);
    path([[X(LC-r),LY,Z(zc)],[X(LC-r),LY+1.1,Z(zc)]],.47,.5); path([[X(LC+r),LY,Z(zc)],[X(LC+r),LY+1.1,Z(zc)]],.47,.5);
    path([[X(LC),LY,Z(zc)],[X(LC),LY+.85,Z(zc)]],.6,.62); pt([X(LC),LY+.93,Z(zc)],.78,3.2,C.flame); }
  for (let k=0;k<44;k++) pt([X(LC+rnd(-.45,.45)), LY+.02, Z(rnd(LZ0+.4,LZ1-.4))], .8, rnd(1.8,2.6), Math.random()<.7?C.red:C.wine);

  /* crystal chandeliers and entrance florals */
  [[0,-4,1.3],[0,6,1]].forEach(([x,z,R])=>{ path([[X(x),sh,Z(z)],[X(x),sh-.5,Z(z)]],.4,.42);
    for (let k=0;k<3;k++){ const y=sh-.62-k*.36, r=R*(1-k/4)+.1, n=Math.round(r*(mobile?18:26)), d=.42+k*.01;
      ring(X(x),y,Z(z),r,d,d+.03,26);
      for (let j=0;j<n;j++){ const a=j/n*TAU; pt([X(x+Math.cos(a)*r), y-.05, Z(z+Math.sin(a)*r)], .64+k*.012, rnd(1,1.5), C.crystal);
        if (j%2===0) pt([X(x+Math.cos(a)*r), y-.22, Z(z+Math.sin(a)*r)], .66+k*.012, 1.1, C.crystal); } }
    for (let s=0;s<8;s++) pt([X(x),sh-1.6-s*.1,Z(z)],.7,1.5,C.warm);
  });
  for (const sx of [-3,3]){ path([[X(sx),0,Z(12.4)],[X(sx),1.1,Z(12.4)]],.44,.48); ring(X(sx),1.1,Z(12.4),.3,.46,.48,14); cluster(X(sx),1.55,Z(12.4),.6,.5,.55,90,.72,.8,FLORAL,2,3.3); }

  wash(11,5.8,[X(0),3.2,Z(-13.9)],[0,0,0],"#E7C3BC",.3,G.show);
  for (const sx of [-1,1]) wash(2.05,3.95,[X(sx*2.775),2.525,Z(fz-.02)],[0,0,0],"#E2CDA8",.5,G.show);
  wash(3.5,3.95,[X(0),2.525,Z(fz-.07)],[0,0,0],"#A89282",.42,G.show);
  wash(10.4,3.4,[X(0),.58,Z(-12.1)],[-Math.PI/2,0,0],"#E8D5C9",.4,G.show);
  wash(6,5.8,[X(0),.02,Z(-6.4)],[-Math.PI/2,0,0],"#EFE7DB",.35,G.show);
  wash(1.6,7.2,[X(LC),LY+.01,Z((LZ0+LZ1)/2)],[-Math.PI/2,0,0],"#EFD2D3",.5,G.show);
  wash(6.4,4.4,[X(-7.2),.03,Z(7.5)],[-Math.PI/2,0,0],"#E4D3BC",.5,G.show);
  inkLines(LP, LD, inkByDelay(LD), G.show);
  inkDabs(PP, PD, PS, PC, PSeed, G.show);

  /* ---------- the map between them: a street grid, an expressway, the river, the rail line, parks, and the route ---------- */
  const ML=[], MD=[], MK=[], MP=[], MPD=[], MPS=[], MPC=[], MPSeed=[];
  const MC=[-40,86], RIN=300, ROUT=560, FADE=[MC[0],MC[1],RIN,ROUT];
  const smooth=(a,b,x)=>{ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); };
  const radial=(x,z)=>1-smooth(RIN,ROUT,Math.hypot(x-MC[0],z-MC[1]));
  const delayAt=(x,z)=>.02+.9*Math.min(1,Math.hypot(x,z+1)/600);   /* the city draws outward from the venue */
  const SITES=[[0,-1,17,27],[SR[0],SR[1],12,14]];
  const clear=(x,z,pad)=>SITES.every(([cx,cz,hx,hz])=>Math.abs(x-cx)>hx+pad || Math.abs(z-cz)>hz+pad);
  function seg(x0,z0,x1,z1,ink,pad){
    if (!clear((x0+x1)/2,(z0+z1)/2,pad==null?3:pad)) return;
    const f0=radial(x0,z0), f1=radial(x1,z1); if (f0<.01 && f1<.01) return;
    ML.push(x0,.02,z0,x1,.02,z1); MD.push(delayAt(x0,z0),delayAt(x1,z1));
    MK.push(ink[0],ink[1],ink[2],ink[3]*f0,ink[0],ink[1],ink[2],ink[3]*f1);
  }
  function line(pts,ink,step,pad){
    for (let i=1;i<pts.length;i++){ const a=pts[i-1], b=pts[i], n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/(step||8)));
      for (let k=0;k<n;k++) seg(a[0]+(b[0]-a[0])*k/n, a[1]+(b[1]-a[1])*k/n, a[0]+(b[0]-a[0])*(k+1)/n, a[1]+(b[1]-a[1])*(k+1)/n, ink, pad); }
  }
  const offset=(pts,o)=>pts.map((p,i)=>{ const a=pts[Math.max(0,i-1)], b=pts[Math.min(pts.length-1,i+1)], tx=b[0]-a[0], tz=b[1]-a[1], l=Math.hypot(tx,tz)||1; return [p[0]-tz/l*o, p[1]+tx/l*o]; });
  const road=(pts,w,ink,step)=>{ line(offset(pts,w/2),ink,step); line(offset(pts,-w/2),ink,step); };
  const INK={ street:[.36,.3,.25,.24], avenue:[.3,.24,.2,.46], expressway:[.6,.45,.24,.72], rail:[.3,.25,.22,.42], bank:[.36,.43,.47,.46], building:[.34,.28,.24,.3], route:[.36,.1,.15,.85], ring:[.36,.1,.15,.5] };
  const hash=(i,j)=>{ const s=Math.sin(i*127.1+j*311.7)*43758.5453; return s-Math.floor(s); };

  /* a mile grid of avenues; side streets and building footprints inside each square */
  for (let v=-624; v<=528; v+=96) road([[v,-540],[v,700]],3.6,INK.avenue,8);
  for (let v=-528; v<=720; v+=96) road([[-640,v],[540,v]],3.6,INK.avenue,8);
  const parks=[];
  for (let i=-7;i<6;i++) for (let j=-6;j<7;j++){
    const x0=48+i*96, z0=48+j*96;
    if (radial(x0+48,z0+48)<.02) continue;
    const home=(i===-1&&j===-1)||(i===-2&&j===1), r=hash(i,j);
    if (!home && r<.1){ parks.push([x0+48,z0+48]); continue; }
    const sp=home ? (i===-1 ? 24 : 48) : r<.45 ? 24 : r<.8 ? 32 : 48;
    for (let o=sp; o<96; o+=sp){ line([[x0+o,z0+3],[x0+o,z0+93]],INK.street,8); line([[x0+3,z0+o],[x0+93,z0+o]],INK.street,8); }
    for (let bx=0; bx<96; bx+=sp) for (let bz=0; bz<96; bz+=sp){
      const ax=x0+bx+3, az=z0+bz+3, bw=sp-6, mx=ax+bw/2, mz=az+bw/2;
      if (Math.min(Math.hypot(mx,mz+1), Math.hypot(mx-SR[0],mz-SR[1])) > 170 || !clear(mx,mz,bw/2+2)) continue;
      for (let q=1+Math.floor(hash(bx+i*7,bz+j*13)*3); q>0; q--){ const w=rnd(.25,.55)*bw, d=rnd(.25,.55)*bw, px=ax+rnd(0,bw-w), pz=az+rnd(0,bw-d);
        line([[px,pz],[px+w,pz],[px+w,pz+d],[px,pz+d],[px,pz]],INK.building,40,0); }
    }
  }
  /* the showroom lot */
  { const x0=SR[0]+15, x1=SR[0]+30, z0=SR[1]-12, z1=SR[1]+14;
    line([[x0,z0],[x1,z0],[x1,z1],[x0,z1],[x0,z0]],INK.street,6,0);
    for (let z=z0+2.6; z<z1-1; z+=2.6){ seg(x0,z,x0+5,z,INK.building,0); seg(x1-5,z,x1,z,INK.building,0); } }

  /* an expressway with a median, curving between the two */
  const ew=[]; for (let x=-660; x<=560; x+=12) ew.push([x, 100+40*Math.sin((x+80)/170)]);
  road(ew,7,INK.expressway,12); line(ew,[.6,.45,.24,.3],12);
  /* the river: banks in ink, water in wash */
  const rv=[]; for (let z=-560; z<=760; z+=10) rv.push([150+34*Math.sin(z/90)+14*Math.sin(z/37), z]);
  line(offset(rv,5.5),INK.bank,10); line(offset(rv,-5.5),INK.bank,10);
  { const pos=[], uv=[], idx=[]; let cum=0; const W=11;
    rv.forEach((p,i)=>{ const a=rv[Math.max(0,i-1)], b=rv[Math.min(rv.length-1,i+1)], tx=b[0]-a[0], tz=b[1]-a[1], l=Math.hypot(tx,tz)||1, nx=-tz/l*W/2, nz=tx/l*W/2;
      if (i) cum+=Math.hypot(p[0]-rv[i-1][0], p[1]-rv[i-1][1]);
      pos.push(p[0]+nx,.03,p[1]+nz, p[0]-nx,.03,p[1]-nz); uv.push(cum/W,0, cum/W,1);
      if (i){ const k=i*2; idx.push(k-2,k-1,k, k-1,k+1,k); } });
    const geo=new THREE.BufferGeometry(); geo.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2)); geo.setIndex(idx);
    add(G.map, new THREE.Mesh(geo, washMat("#AFBCC0",.6,G.map,true,FADE))); }
  /* the rail line and its ties */
  { const ra=[-660,135+.6*(-660+80)], rb=[560,135+.6*(560+80)], rl=Math.hypot(rb[0]-ra[0],rb[1]-ra[1]), ux=(rb[0]-ra[0])/rl, uz=(rb[1]-ra[1])/rl;
    line([ra,rb],INK.rail,8);
    for (let s=0;s<rl;s+=3.2){ const x=ra[0]+ux*s, z=ra[1]+uz*s; seg(x-uz*1.1,z+ux*1.1,x+uz*1.1,z-ux*1.1,INK.rail); } }
  /* parks: a wash, a winding path and watercolor trees */
  parks.forEach(([cx,cz])=>{
    wash(86,86,[cx,.02,cz],[-Math.PI/2,0,0],"#C2C8A4",.4,G.map,FADE);
    const pp=[]; for (let t=0;t<=1.001;t+=.05) pp.push([cx-40+80*t, cz+Math.sin(t*5+cx*.1)*16]); line(pp,INK.street,6);
    for (let k=0;k<(mobile?24:40);k++){ const a=rnd(0,TAU), rr=rnd(8,40), x=cx+Math.cos(a)*rr, z=cz+Math.sin(a)*rr;
      if (radial(x,z)<.05) continue;
      MP.push(x,.6,z); MPD.push(Math.min(.98,delayAt(x,z)+.04)); MPS.push(rnd(26,40)); MPC.push(...(Math.random()<.5?C.sage:C.olive)); MPSeed.push(Math.random()); }
  });
  /* the route from your venue to the showroom, and a dashed ring around each */
  { const RD=Math.hypot(SR[0],SR[1]+1), P=t=>[SR[0]*t, Math.sin(t*Math.PI)*RD*.16+.4, -1+(SR[1]+1)*t];
    for (let k=0;k<64;k++){ const t0=k/64, t1=(k+.55)/64; ML.push(...P(t0),...P(t1)); MD.push(.5+t0*.4,.5+t1*.4); MK.push(...INK.route,...INK.route); }
    for (const [cx,cz,R] of [[0,-1,40],[SR[0],SR[1],24]]){ const n=Math.round(R*1.6);
      for (let k=0;k<n;k+=2){ const a0=k/n*TAU, a1=(k+1)/n*TAU; ML.push(cx+Math.cos(a0)*R,.05,cz+Math.sin(a0)*R, cx+Math.cos(a1)*R,.05,cz+Math.sin(a1)*R); MD.push(.42,.42); MK.push(...INK.ring,...INK.ring); } } }
  inkLines(ML, MD, MK, G.map);
  inkDabs(MP, MPD, MPS, MPC, MPSeed, G.map);

  /* map pins */
  const pinLayer = document.getElementById("hotspots");
  const pins = !pinLayer ? [] : [[[SR[0],8,SR[1]],"HKNS Showroom","",""],[[0,13,-1],"Your venue","","v"]].map(([p,t,s,c])=>{
    const el = document.createElement("div"); el.className = ("hs " + c).trim(); el.innerHTML = `<i></i><span><b>${t}</b>${s}</span>`; pinLayer.appendChild(el);
    return { el, v:new THREE.Vector3(p[0],p[1],p[2]), shown:false };
  });

  let W0=0, H0=0;
  function resize(){
    const w=canvas.clientWidth, h=canvas.clientHeight;
    if (Math.abs(w-W0)<2 && Math.abs(h-H0)<120) return;
    W0=w; H0=h; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix();
  }
  resize(); addEventListener("resize", resize);
  return { renderer, scene, camera, U, G, pins };
})();


/* ---------- camera choreography ----------
   Outside the walk the camera follows the scroll between keyframes. Inside it, each step flies to its own view:
   out to the map, down into the showroom, across the map into your venue, then up to the main stage. */
(function choreo(){
  const view = k=>{ const v = VIEWS[k]; return mobile ? { p:v.mp||v.p, l:v.ml||v.l, x:v.mx, y:v.my } : { p:v.p, l:v.l, x:v.x, y:v.y }; };
  const beats = [...document.querySelectorAll("#beats .beat")], ticks = [...document.querySelectorAll(".ticks i")];
  const BEAT_VIEW = ["map","show","arrive","stage"];
  let keys = [], walkTop = 0, walkSpan = 1, walkEnd = 1;
  function measure(){
    const ih = innerHeight, list = [];
    document.querySelectorAll("[data-cam],[data-from],[data-walk]").forEach(el=>{
      const top = el.getBoundingClientRect().top + scrollY;
      if (el.hasAttribute("data-walk")){
        walkTop = top; walkSpan = Math.max(1, el.offsetHeight - ih); walkEnd = walkTop + walkSpan;
        list.push({ y: walkTop, k: "rise" }, { y: walkEnd, k: "stage" });
        return;
      }
      if (el.dataset.from) list.push({ y: top, k: el.dataset.from });
      if (el.dataset.cam) list.push({ y: el.dataset.from ? top + ih*.5 : top, k: el.dataset.cam });
    });
    keys = list.sort((a,b)=>a.y-b.y);
  }
  measure(); addEventListener("resize", measure); addEventListener("load", measure); setTimeout(measure, 1500);
  if (window.ResizeObserver) new ResizeObserver(measure).observe(document.querySelector("main"));

  /* render only while a sketch chapter is on screen */
  const onScreen = new Set([document.getElementById("hero")]);
  const cio = new IntersectionObserver(es=>es.forEach(e=> e.isIntersecting ? onScreen.add(e.target) : onScreen.delete(e.target)), { rootMargin:"80px 0px" });
  document.querySelectorAll(".chapter").forEach(c=>cio.observe(c));

  /* the step changes at these points of the walk, and only once the scroll is clearly past one,
     so small scrolls back and forth around an edge don't send the camera flying both ways */
  const EDGES = [.2, .47, .74], HYST = .03;
  let curBeat = 0;
  function beatAt(c){
    let b = 0; while (b < 3 && c >= EDGES[b]) b++;
    if (b > curBeat && c < EDGES[b-1] + HYST) b--;
    else if (b < curBeat && c > EDGES[b] - HYST) b++;
    return b;
  }
  function setBeat(b){
    curBeat = b;
    beats.forEach(el=>el.classList.toggle("on", +el.dataset.b === b));
    ticks.forEach((t,i)=>t.classList.toggle("on", i < b));
  }

  const clamp = v=>Math.min(1, Math.max(0, v)), lerp = (a,b,t)=>a+(b-a)*t, ease = t=>t*t*(3-2*t);
  const sm = (a,b,x)=>ease(clamp((x-a)/(b-a)));
  const inout = t=>t < .5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;
  const mixView = (a,b,t)=>({ p:a.p.map((v,j)=>lerp(v,b.p[j],t)), l:a.l.map((v,j)=>lerp(v,b.l[j],t)), x:lerp(a.x,b.x,t), y:lerp(a.y,b.y,t) });
  function scrollGoal(s){
    let i = 0; while (i < keys.length-1 && s >= keys[i+1].y) i++;
    const A = keys[i] || { y:0, k:"hero" }, B = keys[Math.min(i+1, keys.length-1)] || A;
    const raw = clamp((s - A.y) / Math.max(1, B.y - A.y));
    return mixView(view(A.k), view(B.k), B === A ? 0 : reduce ? (raw < .5 ? 0 : 1) : ease(raw));
  }

  /* a flight zooms out, travels and zooms back in along the van Wijk and Nuij curve, the path map apps use */
  function orbit(v){ const dx=v.p[0]-v.l[0], dy=v.p[1]-v.l[1], dz=v.p[2]-v.l[2], r=Math.hypot(dx,dy,dz)||1; return { r, e:Math.asin(dy/r), a:Math.atan2(dx,dz) }; }
  function flight(A, B, wk){
    const oa = orbit(A), ob = orbit(B), rho = 1.42, r2 = rho*rho, r4 = r2*r2;
    const w0 = oa.r*wk, w1 = ob.r*wk, dx = B.l[0]-A.l[0], dz = B.l[2]-A.l[2], d2 = dx*dx + dz*dz;
    let S, path;
    if (d2 < 1e-4){ S = Math.log(w1/w0)/rho; path = t=>[t, w0*Math.exp(rho*t*S)]; }
    else {
      const d1 = Math.sqrt(d2), b0 = (w1*w1 - w0*w0 + r4*d2)/(2*w0*r2*d1), b1 = (w1*w1 - w0*w0 - r4*d2)/(2*w1*r2*d1);
      const q0 = Math.log(Math.sqrt(b0*b0 + 1) - b0), q1 = Math.log(Math.sqrt(b1*b1 + 1) - b1);
      S = (q1 - q0)/rho;
      path = t=>{ const s = rho*t*S + q0; return [w0/(r2*d1)*(Math.cosh(q0)*Math.tanh(s) - Math.sinh(q0)), w0*Math.cosh(q0)/Math.cosh(s)]; };
    }
    let da = ob.a - oa.a; da = Math.atan2(Math.sin(da), Math.cos(da));
    const rTop = Math.max(oa.r, ob.r);
    return { t:0, dur: Math.min(1.7, Math.max(.9, Math.abs(S)*.52)), at(t){
      const [u, w] = path(t), r = w/wk, f = clamp(u), lift = sm(1, 2.4, r/rTop);
      const e = lerp(lerp(oa.e, ob.e, f), 1.05, lift), a = oa.a + da*f, c = Math.cos(e)*r;
      const T = [A.l[0] + dx*u, lerp(A.l[1], B.l[1], f), A.l[2] + dz*u];
      return { p:[T[0] + c*Math.sin(a), T[1] + r*Math.sin(e), T[2] + c*Math.cos(a)], l:T, x:lerp(A.x, B.x, f), y:lerp(A.y, B.y, f) };
    } };
  }

  const cur = { p:[0,5.4,mobile?40:35], l:[0,4,-20], x:0, y:mobile?-.44:-.14 };
  const mouse = { x:0, y:0, tx:0, ty:0 };
  if (!reduce && !mobile) addEventListener("pointermove", e=>{ mouse.tx=e.clientX/innerWidth-.5; mouse.ty=e.clientY/innerHeight-.5; });
  let intro = reduce ? 1 : 0, introDone = reduce, introT = 0;
  let goal = view("hero"), fl = null, flKey = null, wasIn = false, vb = 1, sb = 0, mb = 0, last = performance.now();
  const tmp = venue ? new THREE.Vector3() : null;

  function frame(now){
    requestAnimationFrame(frame);
    const dt = Math.min(.2,(now-last)/1000); last = now;
    const s = scrollY, ih = innerHeight;
    const wp = (s - walkTop) / walkSpan;
    if (wp > -.5 && wp < 1.3){ const b = beatAt(clamp(wp)); if (b !== curBeat) setBeat(b); }
    if (!venue) return;
    const { camera, renderer, U, G, pins } = venue;

    /* where the camera is headed. Once inside the walk, a little scroll past either end keeps you in it;
       leaving it flies the camera home instead of sliding it across the map */
    const pad = ih*.2, wk = 2*Math.tan(camera.fov*Math.PI/360)*camera.aspect;
    const inWalk = wasIn ? (s >= walkTop - pad && s <= walkEnd + pad) : (s >= walkTop && s <= walkEnd);
    if (inWalk){
      const key = BEAT_VIEW[curBeat];
      if (!wasIn || key !== flKey){ flKey = key; if (reduce){ fl = null; goal = view(key); } else fl = flight(goal, view(key), wk); }
    } else {
      if (wasIn) fl = reduce ? null : flight(goal, scrollGoal(s), wk);
      flKey = null;
    }
    if (fl){ fl.t = Math.min(1, fl.t + dt/fl.dur); goal = fl.at(inout(fl.t)); if (!inWalk && fl.t >= 1) fl = null; }
    else if (!inWalk) goal = scrollGoal(s);
    wasIn = inWalk;

    /* what is drawn: the city sketches outward as you rise, the showroom fills in as you land in it, the venue waits
       bare while you are away, its décor is drawn in when you arrive, and the color goes on at the main stage */
    const fp = fl ? fl.t : 1;
    let vT = 1, sT = 0, mT = 0;
    if (inWalk){
      mT = 1;
      if (curBeat === 0) sT = .36;
      else if (curBeat === 1){ vT = .45; sT = fp > .5 ? 1 : .36; }
      else if (curBeat === 2){ vT = fp > .6 ? .82 : .45; sT = 1; }
      else sT = 1;
    } else if (s < walkTop) mT = .22*clamp((s - walkTop + ih)/ih);
    else sT = 1;
    const kr = r=>reduce ? 1 : 1 - Math.exp(-dt*r);
    vb += (vT - vb)*kr(1.6); sb += (sT - sb)*kr(1.8); mb += (mT - mb)*kr(1.4);
    if (!introDone){ introT = Math.min(1, introT + dt/6); intro = introT < .5 ? 2*introT*introT : 1 - Math.pow(-2*introT + 2, 2)/2; if (introT >= 1) introDone = true; }
    G.venue.u.uProgress.value = introDone ? vb : Math.min(intro, vb);
    G.show.u.uProgress.value = sb; G.map.u.uProgress.value = mb;

    const k = reduce ? 1 : 1 - Math.exp(-dt*(inWalk || fl ? 7.5 : 3.4));
    for (let j=0;j<3;j++){ cur.p[j] += (goal.p[j]-cur.p[j])*k; cur.l[j] += (goal.l[j]-cur.l[j])*k; }
    cur.x += (goal.x-cur.x)*k; cur.y += (goal.y-cur.y)*k;
    const km = 1 - Math.exp(-dt*2.4); mouse.x += (mouse.tx-mouse.x)*km; mouse.y += (mouse.ty-mouse.y)*km;
    U.uTime.value += dt;

    /* each place shows when the camera is near it or high above; the map only from the air */
    const cy = cur.p[1], hi = sm(14, 48, cy), near = (x,z)=>1 - sm(80, 140, Math.hypot(cur.p[0]-x, cur.p[2]-z));
    G.venue.u.uAlpha.value = Math.max(hi, near(0,-1));
    G.show.u.uAlpha.value = Math.max(hi, near(SR[0], SR[1]));
    G.map.u.uAlpha.value = sm(8, 36, cy);
    for (const g of [G.venue, G.show, G.map]){ const on = g.u.uAlpha.value > .003 && g.u.uProgress.value > .003; if (g.meshes[0].visible !== on) g.meshes.forEach(o=>o.visible = on); }
    U.uFogN.value = Math.max(10, cy - 6);
    U.uFogR.value = 62 + Math.max(0, cy - 10)*2.4;

    const pinOn = inWalk && cy > 40 && mb > .7;
    if (!onScreen.size){ pins.forEach(P=>{ if (P.shown){ P.el.style.opacity = 0; P.shown = false; } }); return; }
    const sway = reduce ? 0 : Math.sin(U.uTime.value*.15)*.22;
    camera.position.set(cur.p[0] + mouse.x*1.2 + sway, cur.p[1] - mouse.y*.5, cur.p[2]);
    camera.lookAt(cur.l[0], cur.l[1], cur.l[2]);
    camera.updateMatrixWorld();
    camera.projectionMatrix.elements[8] = cur.x;
    camera.projectionMatrix.elements[9] = cur.y;

    /* pins for the showroom and your venue while the map is in view */
    const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
    pins.forEach(P=>{
      let on = false;
      if (pinOn){
        tmp.copy(P.v).project(camera);
        on = tmp.z < 1 && Math.abs(tmp.x) < .94 && tmp.y < .84 && tmp.y > -.9;
        if (on){ const px = (tmp.x+1)/2*w, py = (1-tmp.y)/2*h; P.el.style.transform = `translate(${px.toFixed(1)}px,${py.toFixed(1)}px)`; P.el.classList.toggle("flip", px > w - 230); }
      }
      if (on !== P.shown){ P.el.style.opacity = on ? 1 : 0; P.shown = on; }
    });
    renderer.render(venue.scene, camera);
  }
  requestAnimationFrame(frame);
})();

/* ---------- open at the top, not wherever the browser last left the page ---------- */
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
if (!location.hash) scrollTo(0, 0);

/* ---------- smooth scroll and in-page links ---------- */
let lenis = null;
if (window.Lenis && !reduce && !mobile){
  lenis = new Lenis({ duration:1.15, smoothWheel:true });
  const raf = t=>{ lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
/* a jump that would pass through the 3D walk goes straight there, so the camera isn't dragged through every step */
function goTo(id){
  const el = id === "#hero" ? null : document.querySelector(id);
  if (id !== "#hero" && !el) return false;
  const walk = document.getElementById("process");
  const to = el ? el.getBoundingClientRect().top + scrollY : 0;
  const w0 = walk ? walk.offsetTop : 0, w1 = walk ? w0 + walk.offsetHeight - innerHeight : 0;
  const instant = reduce || (walk && Math.min(scrollY, to) < w1 && Math.max(scrollY, to) > w0);
  if (lenis) lenis.scrollTo(el || 0, { offset: el ? -64 : 0, immediate: instant });
  else window.scrollTo({ top: el ? to - 64 : 0, behavior: instant ? "instant" : "smooth" });
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
      if (it.classList.contains("on")){ it.classList.remove("on"); it.querySelector(".svc-btn").setAttribute("aria-expanded","false"); }
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
  const quotes = [...document.querySelectorAll(".quote")], box = document.getElementById("quotes");
  let qi = 0, timer = null, paused = false;
  const q = i=>{ quotes[qi].classList.remove("on"); qi = (i + quotes.length) % quotes.length; quotes[qi].classList.add("on"); };
  const auto = ()=>{ clearInterval(timer); if (!reduce) timer = setInterval(()=>{ if (!paused) q(qi+1); }, 8000); };
  document.getElementById("qPrev").addEventListener("click", ()=>{ q(qi-1); auto(); });
  document.getElementById("qNext").addEventListener("click", ()=>{ q(qi+1); auto(); });
  box.addEventListener("mouseenter", ()=>paused = true); box.addEventListener("mouseleave", ()=>paused = false);
  auto();
})();

/* ---------- copy email ---------- */
document.querySelectorAll(".copy-btn").forEach(b=>b.addEventListener("click", ()=>{
  const done = ()=>{ b.textContent = "Copied"; setTimeout(()=>b.textContent = "Copy", 1600); };
  const select = ()=>{ const r = document.createRange(); r.selectNodeContents(b.previousElementSibling); getSelection().removeAllRanges(); getSelection().addRange(r); };
  if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy).then(done, select); else select();
}));

/* ---------- grand opening: hides itself after the event; delete the marked blocks to remove it ---------- */
if (Date.now() > Date.parse("2026-11-16T01:00:00Z")) document.querySelectorAll("[data-grand-opening]").forEach(el=>el.remove());
(function notice(){
  const n = document.getElementById("notice");
  if (!n) return;
  const KEY = "hkns-grand-opening-dismissed";
  let gone = false;
  try { gone = localStorage.getItem(KEY) === "1"; } catch(e){}
  if (gone) return;
  const hide = remember=>{ n.classList.remove("in"); setTimeout(()=>n.hidden = true, 600); if (remember){ try { localStorage.setItem(KEY, "1"); } catch(e){} } };
  setTimeout(()=>{ n.hidden = false; requestAnimationFrame(()=>requestAnimationFrame(()=>n.classList.add("in"))); }, 1800);
  document.getElementById("noticeX").addEventListener("click", ()=>hide(true));
  n.querySelector(".notice-go").addEventListener("click", ()=>hide(true));
})();

/* ---------- the 3D walk. With a mouse or trackpad it moves one step per scroll gesture, so momentum can't
   carry you past a step, and a gesture past the first or last step lets you out. On phones scrolling stays
   native and only eases onto a step when you stop close to one (CSS scroll snapping eats taps on iOS) ---------- */
(function walkSteps(){
  const walk = document.getElementById("process"), next = document.getElementById("showroom");
  if (!walk || !next || reduce) return;
  const STOPS = [.08, .335, .605, .87];
  if (!lenis){
    /* phones: your finger moves the page freely, but a fling's glide stops at the next step,
       so a hard swipe moves one step and four or five swipes take you through */
    const g0 = ()=>{ const top = walk.offsetTop, span = Math.max(1, walk.offsetHeight - innerHeight); return { top, span, end: top + span, at: b=>top + span*STOPS[b] }; };
    const root = document.documentElement;
    let touching = false, startY = 0, cap = null, dir = 0, t = 0;
    let holding = false;
    const hold = y=>{
      cap = null; holding = true;
      root.style.overflow = "hidden"; document.body.style.overflow = "hidden";   /* ends the glide */
      window.scrollTo({ top: y, behavior: "instant" });
      setTimeout(()=>{ root.style.overflow = ""; document.body.style.overflow = ""; holding = false; window.scrollTo({ top: y, behavior: "instant" }); }, 140);
    };
    /* the next step past where you let go, in the direction you were moving (null = free to leave the walk) */
    const nextStop = (y, d)=>{
      const g = g0();
      if (d > 0){ for (let b=0;b<4;b++) if (g.at(b) > y + 8) return y < g.end + 8 ? g.at(b) : null; return null; }
      for (let b=3;b>=0;b--) if (g.at(b) < y - 8) return y > g.top - 8 ? g.at(b) : null; return null;
    };
    const settle = ()=>{ clearTimeout(t); t = setTimeout(()=>{
      const g = g0(), y = scrollY;
      if (touching || y < g.top || y > g.end) return;
      let best = 0; for (let b=1;b<4;b++) if (Math.abs(y - g.at(b)) < Math.abs(y - g.at(best))) best = b;
      const d = Math.abs(y - g.at(best));
      if (d > 6 && d < g.span*.14) window.scrollTo({ top: g.at(best), behavior: "smooth" });
    }, 300); };
    addEventListener("touchstart", ()=>{ touching = true; cap = null; clearTimeout(t); startY = scrollY; }, { passive: true });
    addEventListener("touchend", ()=>{
      touching = false;
      const moved = scrollY - startY;
      dir = Math.abs(moved) > 6 ? Math.sign(moved) : 0;
      if (dir){
        const g = g0(), y = scrollY;
        /* only when the glide could run through the walk: above it going down, inside it, or below it going up */
        if ((dir > 0 && y < g.end + 8 && y > g.top - innerHeight*1.5) || (dir < 0 && y > g.top - 8 && y < g.end + innerHeight*1.5)) cap = nextStop(y, dir);
      }
      settle();
    }, { passive: true });
    addEventListener("scroll", ()=>{
      if (holding) return;
      if (!touching && cap != null && ((dir > 0 && scrollY > cap + 2) || (dir < 0 && scrollY < cap - 2))) hold(cap);
      if (!touching) settle();
    }, { passive: true });
    return;
  }
  const geo = ()=>{ const top = walk.offsetTop, span = Math.max(1, walk.offsetHeight - innerHeight); return { top, end: top + span, at: b=>top + span*STOPS[b] }; };
  const beatNow = ()=>{ const el = walk.querySelector(".beat.on"); return el ? +el.dataset.b : 0; };
  const inside = ()=>{ const g = geo(); return scrollY > g.top - 2 && scrollY < g.end + 2; };
  const blocked = t=>!drawer.hidden || !lb.hidden || (t && t.closest && t.closest(".drawer,.lightbox"));
  /* aim is the step being moved to (-1 = leaving up to the hero, 4 = leaving down to the showroom).
     A new gesture during a move goes on from there right away instead of waiting for the move to end. */
  let busy = false, prevY = scrollY, last = 0, aim = 0, run = 0, lastStep = 0;
  const recent = [];
  function go(y, dur, to){
    busy = true; aim = to; const id = ++run;
    lenis.scrollTo(y, { duration: dur || .65, lock: true, force: true, onComplete: ()=>{ if (id !== run) return; busy = false; prevY = scrollY; settleSoon(); } });
  }
  function step(dir){
    const now = performance.now();
    if (now - lastStep < 240) return;
    const base = busy ? aim : beatNow(), to = base + dir;
    if (to === base || base < 0 || base > 3) return;
    lastStep = now;
    const g = geo();
    if (to > 3) go(next.offsetTop, .75, 4);
    else if (to < 0) go(0, .75, -1);
    else go(g.at(to), .65, to);
  }
  /* a new gesture is a wheel event after a pause, or one clearly stronger than the momentum before it */
  addEventListener("wheel", e=>{
    const now = performance.now(), a = Math.abs(e.deltaY), quiet = now - last > 220;
    const avg = recent.length ? recent.reduce((x,y)=>x+y, 0)/recent.length : 0;
    const rising = !quiet && recent.length >= 2 && a > avg*1.8 && a > 14;
    last = now; if (quiet) recent.length = 0; recent.push(a); if (recent.length > 4) recent.shift();
    if (!inside() || blocked(e.target)) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (a < 2 || !(quiet || rising)) return;
    step(e.deltaY > 0 ? 1 : -1);
  }, { capture: true, passive: false });
  /* arriving from above or below settles on the first or last step; anything that comes to rest
     between steps (a phone fling, a dragged scrollbar) settles on the nearest one */
  let settle = 0;
  function settleSoon(){
    clearTimeout(settle);
    settle = setTimeout(()=>{
      if (busy || !inside()) return;
      const g = geo(); let best = 0;
      for (let b=1;b<4;b++) if (Math.abs(scrollY - g.at(b)) < Math.abs(scrollY - g.at(best))) best = b;
      if (Math.abs(scrollY - g.at(best)) > 6) go(g.at(best), .5, best);
    }, 160);
  }
  addEventListener("scroll", ()=>{
    const y = scrollY, g = geo();
    if (!busy){
      if (prevY < g.top - 2 && y >= g.top - 2 && y < g.end) go(g.at(0), .6, 0);
      else if (prevY > g.end + 2 && y <= g.end + 2 && y > g.top) go(g.at(3), .6, 3);
    }
    prevY = y;
    settleSoon();
  }, { passive: true });
  addEventListener("keydown", e=>{
    if (!inside() || blocked(e.target) || (e.target.closest && e.target.closest("input,textarea,select"))) return;
    const k = e.key, down = k === "ArrowDown" || k === "PageDown" || (k === " " && !e.shiftKey), up = k === "ArrowUp" || k === "PageUp" || (k === " " && e.shiftKey);
    if (!down && !up) return;
    e.preventDefault(); step(down ? 1 : -1);
  });
})();
