import * as THREE from 'three';
import { RoundedBoxGeometry } from './vendor/RoundedBoxGeometry.js';

// Cal Poly housing references are recorded in README.md. This is an illustrative
// room model; university-provided furniture is never added to the purchasable kit.
const textures = new Map();
function texture(kind) {
  if (textures.has(kind)) return textures.get(kind);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
  const ctx = canvas.getContext('2d');
  let seed = 719;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  ctx.fillStyle = kind === 'wood' ? '#e7d8bc' : '#d4d0c7'; ctx.fillRect(0,0,256,256);
  if(kind === 'wood') {
    for(let y=0;y<256;y++){ const a=.035+random()*.1;ctx.strokeStyle=`rgba(83,57,28,${a})`;ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<=256;x+=16)ctx.lineTo(x,y+Math.sin(x/40+y/22)*1.6);ctx.stroke(); }
    for(let i=0;i<9;i++){ctx.strokeStyle='rgba(107,75,36,.08)';ctx.beginPath();ctx.ellipse(random()*256,random()*256,30+random()*40,2,0,0,Math.PI*2);ctx.stroke();}
  } else {
    for(let i=0;i<24000;i++){const v=Math.floor(110+random()*130);ctx.fillStyle=`rgba(${v},${v},${v},${kind==='carpet'?.3:.12})`;ctx.fillRect(random()*256,random()*256,1+random(),1+random());}
    if(kind==='fabric'){ctx.strokeStyle='rgba(255,255,255,.1)';for(let i=0;i<256;i+=3){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,256);ctx.moveTo(0,i);ctx.lineTo(256,i);ctx.stroke();}}
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(kind==='carpet'?8:kind==='fabric'?3:1,kind==='carpet'?8:kind==='fabric'?3:1);
  textures.set(kind,map);return map;
}

export function makeRoomModel({kind,color,vectorMode}) {
  const dorm=kind==='dorm';
  const root=new THREE.Group(),backWall=new THREE.Group(),leftWall=new THREE.Group();
  const groups={},accentMaterials=[],materialCache=new Map();
  const W=dorm?4.85:2.95,D=dorm?4.45:3.60,H=2.74,hw=W/2,hd=D/2;
  const wood='#bb8c55', woodLight='#c69b66', woodDark='#90683f', metal='#525653', wall='#edeae2';
  const layout=dorm?{bedX:-1.84,bedZ:-.73,deskX:-1.66,deskZ:1.63,wardrobeX:-.85,wardrobeZ:-1.9}: {bedX:-.87,bedZ:-.61,deskX:.60,deskZ:-1.37,wardrobeX:.95,wardrobeZ:.46};
  const {bedX:bx,bedZ:bz,deskX:dx,deskZ:dz}=layout;
  function material(c,kind='plain') {
    const key=c+kind;if(materialCache.has(key))return materialCache.get(key);
    const m=new THREE.MeshStandardMaterial({color:c,roughness:kind==='fabric'||kind==='carpet'?.97:.72,metalness:0});
    if(kind!=='plain'&&!vectorMode){m.map=texture(kind);if(kind==='carpet'){m.bumpMap=m.map;m.bumpScale=.014;}}
    materialCache.set(key,m);return m;
  }
  function box(p,w,h,d,x,y,z,c=wood,kind='plain',radius=0) {
    const geo=radius?new RoundedBoxGeometry(w,h,d,vectorMode?1:3,Math.min(radius,w/3,h/3,d/3)):new THREE.BoxGeometry(w,h,d);
    const m=new THREE.Mesh(geo,material(c,kind));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;
  }
  function cyl(p,r1,r2,h,x,y,z,c,segments=16){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
  function sphere(p,x,y,z,sx,sy,sz,c){const m=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),material(c,'fabric'));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;p.add(m);return m;}
  function line(p,pts,c='#7d6b55',opacity=1){const m=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts.map(v=>new THREE.Vector3(...v))),new THREE.LineBasicMaterial({color:c,transparent:opacity<1,opacity}));p.add(m);return m;}
  function tube(p,a,b,r,c){const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),delta=vb.clone().sub(va);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),material(c));m.position.copy(va.clone().add(vb).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());m.castShadow=true;p.add(m);return m;}
  function torus(p,r,t,x,y,z,c,flat=false){const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,6,32),material(c));m.position.set(x,y,z);if(flat)m.rotation.x=-Math.PI/2;m.castShadow=true;p.add(m);return m;}
  function accent(m){m.material=m.material.clone();accentMaterials.push(m.material);return m;}
  function addon(id){const p=new THREE.Group();p.userData.item=id;root.add(p);groups[id]=p;return p;}
  function shadow(x,z,w,d){if(!vectorMode)return;for(let i=0;i<3;i++){const m=new THREE.Mesh(new THREE.CircleGeometry(1,28),new THREE.MeshBasicMaterial({color:'#302b24',transparent:true,opacity:.027}));m.rotation.x=-Math.PI/2;m.scale.set(w*(1+i*.12),d*(1+i*.12),1);m.position.set(x,.016+i*.001,z);m.renderOrder=-25;root.add(m);}}
  function grain(p,x,y,z,w,h){if(!vectorMode)return;for(let i=1;i<9;i++){line(p,[[x-w*.46,y-h/2+i*h/9,z],[x+w*.46,y-h/2+i*h/9+.008,z]],'#694a2d',.11);}}
  function drawer(p,x,y,z,w,h,d){box(p,w,h,d,x,y,z,woodLight,'wood',.008);box(p,w-.035,h-.027,.028,x,y,z+d/2+.012,wood,'wood',.005);tube(p,[x-.06,y,z+d/2+.036],[x+.06,y,z+d/2+.036],.009,metal);grain(p,x,y,z+d/2+.03,w,h);}
  function dresser(p,x,z,width=.7,height=.48,depth=.49){box(p,width,height,depth,x,height/2,z,woodDark,'wood');for(let i=0;i<2;i++)drawer(p,x,.035+(i+.5)*(height-.05)/2,z+.008,width-.035,(height-.06)/2-.014,depth);}
  function chair(p,x,z,faceBack=false){const g=new THREE.Group();g.position.set(x,0,z);if(faceBack)g.rotation.y=Math.PI;p.add(g);box(g,.43,.045,.44,0,.45,0,woodLight,'wood',.014);for(const xx of[-.18,.18])for(const zz of[-.17,.17])tube(g,[xx,.02,zz],[xx,.44,zz],.014,metal);for(const xx of[-.18,.18])tube(g,[xx,.4,.18],[xx,.93,.22],.014,metal);box(g,.43,.24,.045,0,.80,.21,wood,'wood',.018);}
  function desk(p,x,z,reverse=false){const g=new THREE.Group();g.position.set(x,0,z);if(reverse)g.rotation.y=Math.PI;p.add(g);box(g,1.22,.048,.655,0,.758,0,woodLight,'wood',.009);for(const xx of[-.56,.56])for(const zz of[-.27,.27])box(g,.045,.73,.045,xx,.365,zz,woodDark,'wood',.005);box(g,1.10,.12,.035,0,.66,-.28,woodDark,'wood');for(let i=0;i<3;i++)drawer(g,.39,.14+i*.17,.025,.31,.15,.53);box(g,.29,.025,.54,.39,.64,.025,woodDark,'wood');shadow(x,z,.6,.36);}
  function bedFrame(p,x,z,y=.57,posts=1.13){const g=new THREE.Group();g.position.set(x,0,z);p.add(g);for(const xx of[-.49,.49])for(const zz of[-1.045,1.045])box(g,.07,posts,.07,xx,posts/2,zz,woodDark,'wood',.006);const platform=box(g,1.055,.13,2.17,0,y-.08,0,wood,'wood',.008);if(vectorMode)platform.renderOrder=-3;for(const zz of[-1.04,1.04]){box(g,.95,.10,.055,0,posts-.05,zz,wood,'wood');box(g,.95,.12,.04,0,y+.18,zz,woodLight,'wood');for(const xx of[-.3,-.1,.1,.3])box(g,.038,.26,.035,xx,y+.36,zz,wood,'wood');}for(const xx of[-.49,.49])for(let yy=.2;yy<posts-.15;yy+=.13)box(g,.014,.027,.005,xx+.001,yy,1.082,woodDark);const mattress=box(g,.97,.17,2.032,0,y+.085,0,'#eee9df','fabric',.028);if(vectorMode)mattress.renderOrder=-2;shadow(x,z,.56,1.08);return y+.17;}
  function bedding(p,x,z,top,c,custom=false){const make=m=>custom?accent(m):m;make(box(p,1.005,.12,1.57,x,top+.049,z+.24,c,'fabric',.055));make(box(p,.05,.20,1.54,x-.495,top-.015,z+.24,c,'fabric',.018));box(p,.97,.047,.22,x,top+.13,z-.44,'#f5f1e7','fabric',.018);box(p,.65,.135,.36,x,top+.105,z-.78,'#fffcf2','fabric',.06);line(p,[[x-.30,top+.14,z-.60],[x+.30,top+.14,z-.60]],'#c7c2b4',.5);for(let zi=-.2;zi<.95;zi+=.27)line(p,[[x-.47,top+.113,z+zi],[x+.47,top+.113,z+zi]],'#f3f2dc',.18);for(let xi=-.22;xi<.45;xi+=.22)line(p,[[x+xi,top+.113,z-.38],[x+xi,top+.113,z+.94]],'#f3f2dc',.09);}
  function wardrobe(x,z,w=.86,own=false){const p=new THREE.Group();p.position.set(x,0,z);root.add(p);const d=.59,h=1.91;
    box(p,w,h,.035,0,h/2,-d/2,woodDark,'wood');for(const xx of[-w/2,w/2])box(p,.035,h,d,xx,h/2,0,wood,'wood');box(p,w,.05,d,0,h-.025,0,woodLight,'wood');box(p,w,.07,d,0,.055,0,woodDark,'wood');
    const leftDoor=new THREE.Group();leftDoor.position.set(-w/2,.96,d/2);p.add(leftDoor);
    box(leftDoor,w/2-.02,h-.1,.035,w/4,0,0,wood,'wood',.008);tube(leftDoor,[w/2-.035,-.05,.035],[w/2-.035,.08,.035],.012,metal);grain(leftDoor,w/4,0,.023,w/2,h-.1);
    let rightDoor;
    if(own){const door=new THREE.Group();rightDoor=door;door.position.set(w/2,.96,d/2);door.rotation.y=.72;p.add(door);box(door,w/2-.02,h-.1,.035,-w/4,0,0,woodLight,'wood',.008);tube(door,[-w/2+.06,-.06,.034],[-w/2+.06,.07,.034],.012,metal);tube(p,[-w*.4,1.64,0],[w*.4,1.64,0],.012,metal);box(p,w-.06,.03,d-.05,0,1.77,0,woodDark,'wood');leftDoor.name='own-wardrobe-left-door';door.name='own-wardrobe-right-door';}
    else{box(p,w/2-.02,h-.1,.035,w/4,.96,d/2,wood,'wood',.008);tube(p,[.035,.91,d/2+.035],[.035,1.04,d/2+.035],.012,metal);grain(p,w/4,.96,d/2+.023,w/2,h-.1);}
    shadow(x,z,w*.55,.35);return {x,z,w,leftDoor,rightDoor};
  }
  function windowUnit(p,x,z,width=1.45,side=false){const g=new THREE.Group();g.userData.window=true;g.position.set(x,0,z);if(side)g.rotation.y=Math.PI/2;p.add(g);box(g,width+.13,1.40,.04,0,1.78,0,'#f7f5eb');box(g,width,1.25,.04,0,1.78,.024,'#b9ced1');box(g,width,.4,.035,0,1.40,.045,'#a4b698');box(g,width,.13,.035,0,1.32,.05,'#bbc1a5');box(g,.033,1.28,.05,0,1.78,.065,'#e8e7df');box(g,width,.033,.05,0,1.75,.065,'#e8e7df');box(g,width+.2,.045,.22,0,1.07,.06,'#f7f5ee');box(g,width+.16,.09,.10,0,2.49,.08,'#e9e5d9');
    for(let i=0;i<9;i++){const slat=box(g,width+.07,.043,.035,0,2.40-i*.053,.10,'#deded3');slat.rotation.x=-.35;}
    line(g,[[width/2-.07,2.42,.135],[width/2-.07,1.40,.135]],'#c6bfae');cyl(g,.009,.009,.07,width/2-.07,1.38,.135,'#ded8c9',8);return g;
  }
  function wallBits(p,x,z,side=false){const g=new THREE.Group();g.position.set(x,0,z);if(side)g.rotation.y=Math.PI/2;p.add(g);box(g,.085,.13,.015,0,.32,0,'#f8f6ed','plain',.006);for(const yy of[.30,.35])for(const xx of[-.018,.018])box(g,.006,.021,.004,xx,yy,.01,'#8a8980');}

  // Carpet, cream painted walls, window mini-blinds, and campus furniture scale.
  const floor=box(root,W,.12,D,0,-.06,0,'#999589','carpet');floor.renderOrder=-30;
  if(vectorMode){let seed=47;for(let i=0;i<420;i++){seed=(seed*16807)%2147483647;const x=(seed/2147483647-.5)*(W-.06);seed=(seed*16807)%2147483647;const z=(seed/2147483647-.5)*(D-.06);const l=line(root,[[x,.006,z],[x+.012,.006,z+.006]],i%2?'#e0d9cc':'#4e4b44',.12);l.renderOrder=-28;}}
  root.add(backWall,leftWall);box(backWall,W+.10,H,.10,0,H/2,-hd,wall);box(leftWall,.1,H,D,-hw,H/2,0,'#e4e1d8');
  box(backWall,W,.105,.032,0,.055,-hd+.068,'#cfc8b8');box(leftWall,.032,.105,D,-hw+.068,.055,0,'#c6bead');
  box(backWall,W+.07,.035,.12,0,H-.012,-hd,'#faf7ed');box(leftWall,.12,.035,D,-hw,H-.012,0,'#f5f1e6');
  if(dorm)windowUnit(leftWall,-hw+.062,-.55,1.52,true);else windowUnit(backWall,.52,-hd+.064,1.45);
  // Door, casing, handle, and light switch are context, not kit items.
  const doorZ=dorm?1.42:1.25;
  const doorCase=box(leftWall,.045,2.15,.87,-hw+.065,1.075,doorZ,'#bdb3a1');const doorLeaf=box(leftWall,.028,2.06,.77,-hw+.093,1.03,doorZ,woodLight,'wood');
  tube(leftWall,[-hw+.13,.98,doorZ+.26],[-hw+.13,.98,doorZ+.15],.017,metal);
  box(leftWall,.018,.12,.075,-hw+.125,1.12,doorZ-.56,'#f8f5eb','plain',.004);box(leftWall,.025,.055,.026,-hw+.138,1.12,doorZ-.56,'#dedbd0');
  wallBits(backWall,dx,-hd+.066);if(!dorm)wallBits(leftWall,-hw+.065,-.60,true);
  if(vectorMode){backWall.traverse(o=>{o.renderOrder=-14;});leftWall.traverse(o=>{o.renderOrder=-14;});backWall.children[0].renderOrder=-22;leftWall.children[0].renderOrder=-22;doorCase.renderOrder=-17;doorLeaf.renderOrder=-16;for(const wallGroup of[backWall,leftWall])wallGroup.traverse(o=>{if(o.userData.window)o.children.forEach((m,index)=>{m.renderOrder=-21+index*.1;});});}
  const top=bedFrame(root,bx,bz,.57,1.12);dresser(root,bx,bz+.50,.69,.47,.48);
  desk(root,dx,dz,dorm);chair(root,dx,dorm?dz-.77:dz+.76,dorm);
  const ownWardrobe=wardrobe(layout.wardrobeX,layout.wardrobeZ,dorm?.78:.86,true);
  if(dorm){
    // Representative hall triple: one standard bed and two bunked beds.
    const otherX=1.84,otherZ=-.73;
    const bottom=bedFrame(root,otherX,otherZ,.57,2.20);bedding(root,otherX,otherZ,bottom,'#9ca9ad');
    const upperPlatform=box(root,1.055,.13,2.17,otherX,1.64,otherZ,wood,'wood',.008);if(vectorMode)upperPlatform.renderOrder=-3;const upperMattress=box(root,.97,.17,2.032,otherX,1.805,otherZ,'#eee9df','fabric',.028);if(vectorMode)upperMattress.renderOrder=-2;bedding(root,otherX,otherZ,1.89,'#b1a58e');
    for(const xx of[otherX-.48,otherX+.48]){tube(root,[xx,2.10,otherZ-.95],[xx,2.10,otherZ+.94],.021,woodDark);tube(root,[xx,1.98,otherZ-.95],[xx,1.98,otherZ+.94],.018,woodDark);}
    for(const xx of[otherX-.25,otherX+.25])tube(root,[xx,.07,otherZ+1.12],[xx,1.92,otherZ+1.12],.027,woodDark);
    for(let y=.24;y<1.9;y+=.23)tube(root,[otherX-.25,y,otherZ+1.12],[otherX+.25,y,otherZ+1.12],.021,woodDark);
    dresser(root,otherX,otherZ+.50,.69,.47,.48);
    desk(root,0,dz,true);chair(root,0,dz-.77,true);desk(root,1.66,dz,true);chair(root,1.66,dz-.77,true);
    wardrobe(0,-1.9,.78);wardrobe(.85,-1.9,.78);
    // The supplied fridge belongs to the shared room, not the selected kit.
    box(root,.47,.84,.49,.79,.42,.88,'#b9b9b2','plain',.025);box(root,.43,.22,.018,.79,.70,1.136,'#c9c9c3','plain',.012);box(root,.43,.52,.018,.79,.29,1.136,'#c9c9c3','plain',.012);box(root,.035,.14,.028,.96,.59,1.157,'#686b66');
  }
  // A pinboard provides a familiar student-room detail without adding a product.
  const board=dorm?backWall:leftWall;
  const frame=new THREE.Group();frame.position.set(dorm?-1.85:-hw+.06,1.72,dorm?-hd+.07:-.38);if(!dorm)frame.rotation.y=Math.PI/2;board.add(frame);
  box(frame,.70,.47,.025,0,0,0,woodDark);box(frame,.66,.43,.012,0,0,.019,'#bb9e72');
  for(let i=0;i<3;i++){const paper=box(frame,.15,.19,.005,-.21+i*.20,.02+(i%2?.06:-.03),.03,i===1?'#e4e5db':'#f7f4e9');paper.rotation.z=(i-1)*.09;cyl(frame,.012,.012,.008,-.21+i*.20,.12+(i%2?.06:-.03),.037,'#55715c',8).rotation.x=Math.PI/2;}
  if(vectorMode)frame.children.forEach((o,index)=>{o.renderOrder=-13+index*.05;});
  const wasteX=dorm?dx+.50:1.1,wasteZ=dorm?dz-.48:-.85;
  cyl(root,.12,.10,.28,wasteX,.14,wasteZ,'#606961');

  const bedSet=addon('bedding');bedding(bedSet,bx,bz,top,color,true);
  const towels=addon('towels');box(towels,.44,.065,.30,bx+.12,top+.16,bz+.65,'#f7f0dd','fabric',.018);accent(box(towels,.41,.045,.27,bx+.12,top+.213,bz+.65,color,'fabric',.015));box(towels,.29,.045,.23,bx+.14,top+.255,bz+.65,'#fff9e9','fabric',.012);

  const surface=.788;
  const toiletries=addon('toiletries');
  cyl(toiletries,.04,.045,.23,dx+.20,surface+.115,dz+.08,'#ede3cc');cyl(toiletries,.023,.023,.035,dx+.20,surface+.245,dz+.08,'#bb985a');box(toiletries,.10,.18,.067,dx+.35,surface+.09,dz+.07,'#e9e7d9','plain',.01);cyl(toiletries,.035,.035,.08,dx+.48,surface+.04,dz+.08,'#cdc1a1');tube(toiletries,[dx+.48,surface+.02,dz+.08],[dx+.48,surface+.24,dz+.08],.009,'#46664f');
  const charging=addon('charging');box(charging,.10,.055,.075,dx+.28,surface+.03,dz+.23,'#f8f7ef','plain',.009);torus(charging,.07,.008,dx+.10,surface+.01,dz+.23,'#656b63',true);line(charging,[[dx+.17,surface+.01,dz+.23],[dx+.25,surface+.01,dz+.23]],'#646963');
  const shower=addon('shower'),cx=dorm?-.93:-.22,cz=dorm?.65:.83;
  box(shower,.32,.25,.24,cx,.145,cz,'#607f69','plain',.02);torus(shower,.10,.012,cx,.33,cz,'#3f654b');for(let i=0;i<5;i++)box(shower,.012,.12,.006,cx-.11+i*.055,.18,cz+.123,'#8fa58d');box(shower,.07,.18,.07,cx-.06,.31,cz,'#e9ddc1','plain',.01);box(shower,.06,.15,.06,cx+.06,.30,cz,'#d1d8c1','plain',.01);
  for(const xx of[cx+.27,cx+.40]){sphere(shower,xx,.035,cz+.03,.049,.018,.125,'#42644c');tube(shower,[xx-.03,.045,cz-.015],[xx,.072,cz+.06],.008,'#9aac94');tube(shower,[xx+.03,.045,cz-.015],[xx,.072,cz+.06],.008,'#9aac94');}
  const lamp=addon('lamp'),lx=dx-.38,lz=dz-.04;
  cyl(lamp,.11,.13,.025,lx,surface+.016,lz,'#3e614d');tube(lamp,[lx,surface+.03,lz],[lx,surface+.43,lz],.018,'#486854');tube(lamp,[lx,surface+.43,lz],[lx+.19,surface+.56,lz],.018,'#486854');const shade=cyl(lamp,.045,.13,.11,lx+.20,surface+.53,lz,'#31563f');shade.rotation.z=-.35;
  const laundry=addon('laundry'),laundryX=dorm?-1.12:-1.15,laundryZ=dorm?.55:1.26;
  cyl(laundry,.19,.16,.42,laundryX,.22,laundryZ,'#c8b793');torus(laundry,.19,.014,laundryX,.44,laundryZ,'#9e987d',true);for(let i=0;i<14;i++){const a=i*Math.PI/7;tube(laundry,[laundryX+.16*Math.cos(a),.03,laundryZ+.16*Math.sin(a)],[laundryX+.19*Math.cos(a),.43,laundryZ+.19*Math.sin(a)],.005,'#968869');}sphere(laundry,laundryX,.42,laundryZ,.14,.04,.11,'#ede8db');
  const hangers=addon('hangers');
  for(let i=0;i<5;i++){const x=ownWardrobe.x+.09+i*.045,z=ownWardrobe.z+.07+i*.025;line(hangers,[[x,1.58,z],[x,1.64,z],[x+.025,1.66,z],[x+.05,1.64,z],[x+.03,1.59,z]],'#777b70');tube(hangers,[x+.03,1.59,z],[x-.12,1.47,z],.01,woodLight);tube(hangers,[x-.12,1.47,z],[x+.18,1.47,z],.01,woodLight);tube(hangers,[x+.18,1.47,z],[x+.03,1.59,z],.01,woodLight);}
  const bottle=addon('bottle');cyl(bottle,.048,.052,.25,dx-.09,surface+.13,dz+.12,'#355e49');cyl(bottle,.043,.043,.037,dx-.09,surface+.272,dz+.12,'#b99a5b');
  const fan=addon('fan'),fx=dx+.48,fz=dz-.17;
  cyl(fan,.095,.11,.025,fx,surface+.015,fz,'#596f5a');tube(fan,[fx,surface+.03,fz],[fx,surface+.27,fz],.019,'#596f5a');const drum=cyl(fan,.158,.158,.055,fx,surface+.39,fz,'#46634d');drum.rotation.x=Math.PI/2;torus(fan,.15,.009,fx,surface+.39,fz+.035,'#bbc5ad');for(let i=0;i<12;i++){const a=i*Math.PI/6;line(fan,[[fx+.03*Math.cos(a),surface+.39+.03*Math.sin(a),fz+.042],[fx+.15*Math.cos(a),surface+.39+.15*Math.sin(a),fz+.042]],'#b6c1ad',.8);}sphere(fan,fx,surface+.39,fz+.045,.035,.035,.016,'#c0c9b5');
  const rug=addon('rug'),rx=dorm?-.25:.05,rz=dorm?.25:.54,rw=dorm?1.45:.78,rd=dorm?2.1:1.44;
  box(rug,rw,.015,rd,rx,.025,rz,'#b7ba9d','fabric',.003);for(let i=0;i<8;i++){line(rug,[[rx-rw/2+.05,.034,rz-rd/2+.14+i*(rd-.28)/7],[rx+rw/2-.05,.034,rz-rd/2+.14+i*(rd-.28)/7]],'#e7e3d2',.6);}for(let x=rx-rw/2+.04;x<rx+rw/2;x+=.055)for(const edge of[-1,1])tube(rug,[x,.022,rz+edge*rd/2],[x,.022,rz+edge*(rd/2+.04)],.003,'#d7d0bc');
  const storage=addon('storage');box(storage,.60,.22,.42,bx+.44,.13,bz+.05,'#a6af96','fabric',.013);box(storage,.62,.032,.44,bx+.44,.255,bz+.05,'#70826b','plain',.01);box(storage,.14,.032,.008,bx+.44,.145,bz+.265,'#deded0','plain',.008);
  const shoeRack=addon('shoe-rack'),rackX=dorm?ownWardrobe.x:.94,rackZ=dorm?-1.06:1.37;
  for(const xx of[-.36,.36])for(const zz of[-.12,.12])box(shoeRack,.035,.43,.035,rackX+xx,.225,rackZ+zz,'#bd9b6f','wood',.007);
  for(const y of[.105,.355]){
    for(const xx of[-.365,.365])box(shoeRack,.03,.032,.29,rackX+xx,y,rackZ,'#cbb18b','wood',.004);
    for(let i=0;i<5;i++)box(shoeRack,.74,.022,.041,rackX,y,rackZ-.108+i*.054,'#d3bc96','wood',.004);
  }
  for(const [y,c,x] of[[.147,'#efede2',rackX-.19],[.397,'#70846b',rackX+.12]])for(const side of[-1,1]){
    const sx=x+side*.067;
    box(shoeRack,.108,.025,.235,sx,y,rackZ,'#d6d1bf','plain',.009);
    sphere(shoeRack,sx,y+.025,rackZ-.02,.051,.034,.088,c);
    box(shoeRack,.088,.018,.055,sx,y+.060,rackZ+.034,c,'fabric',.007);
  }
  shadow(rackX,rackZ,.42,.18);
  const organizer=addon('closet-organizer'),ox=ownWardrobe.x-ownWardrobe.w*.22,oz=ownWardrobe.z+.035,ow=.31,od=.35,ob=.27,ot=1.56;
  for(const side of[-1,1])box(organizer,.012,ot-ob,od,ox+side*ow/2,(ot+ob)/2,oz,'#e6dfcc','fabric',.003);
  box(organizer,ow,ot-ob,.012,ox,(ot+ob)/2,oz-od/2,'#d4cbb6','fabric',.003);
  for(let i=0;i<=6;i++){
    const y=ob+i*(ot-ob)/6;
    box(organizer,ow,.014,od,ox,y,oz,'#cfc5ae','fabric',.003);
    box(organizer,ow+.009,.018,.015,ox,y,oz+od/2,'#b8aa90','fabric',.003);
  }
  for(const side of[-1,1])box(organizer,.035,.09,.03,ox+side*.09,1.605,oz,'#b8ab90','fabric',.004);
  for(const [level,c] of[[0,'#ede7d8'],[2,'#8c9c7e'],[4,'#e2d8c1']]){
    const y=ob+level*(ot-ob)/6+.047;
    box(organizer,.235,.062,.25,ox,y,oz+.015,c,'fabric',.014);
    box(organizer,.22,.031,.23,ox+.009,y+.045,oz+.018,level===2?'#bcc4ad':'#f2ecdf','fabric',.008);
  }
  function setSelection(items){
    const open=items.includes('closet-organizer');
    ownWardrobe.leftDoor.rotation.y=open?-1.9:0;
    ownWardrobe.rightDoor.rotation.y=open?1.9:.72;
  }
  // Room's source dimensions vary. Camera frames the two different footprints.
  const views=dorm?{room:{pos:[6.0,5.0,6.8],target:[0,.83,0]},bed:{pos:[2.2,3.0,4.6],target:[-1.0,.85,-.2]},top:{pos:[0,10.7,.04],target:[0,.05,0]}}:{room:{pos:[-3.0,3.9,5.7],target:[0,.8,-.02]},bed:{pos:[2.4,2.7,3.6],target:[-.55,.8,-.4]},top:{pos:[0,7.9,.04],target:[0,.05,0]}};
  views.closet=dorm?{pos:[.4,2.9,1.65],target:[-.70,.95,-1.55]}:{pos:[-.70,2.7,3.25],target:[.88,.95,.50]};
  return {root,groups,accentMaterials,backWall,leftWall,views,setSelection,minDistance:dorm?4.1:3.0,maxDistance:dorm?12:9};
}
