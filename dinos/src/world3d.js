/* ========================= textures ========================= */
function canvasTex(sz,draw,srgb){const c=document.createElement("canvas");c.width=c.height=sz;draw(c.getContext("2d"),sz);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(srgb)t.colorSpace=THREE.SRGBColorSpace;return t}
// scales: small round scales with a few big bumpy ones and skin folds. The same pattern is drawn twice:
// as a bump map (height) and as a colour map (dark cracks between the scales), so they line up.
function scaleSheet(bump){return canvasTex(512,(g,S)=>{const R=mulberry(99);g.fillStyle=bump?"#3c3c3c":"#9a9a9a";g.fillRect(0,0,S,S);
  const rows=26,cw=S/rows,sc=(x,y,r)=>{const gr=g.createRadialGradient(x-r*.3,y-r*.35,r*.1,x,y,r);
    if(bump){gr.addColorStop(0,"#e4e4e4");gr.addColorStop(.7,"#9a9a9a");gr.addColorStop(1,"#3c3c3c")}else{gr.addColorStop(0,"#ffffff");gr.addColorStop(.65,"#ebebeb");gr.addColorStop(1,"#9a9a9a")}
    g.fillStyle=gr;for(const ox of[-S,0,S])for(const oy of[-S,0,S]){g.beginPath();g.ellipse(x+ox,y+oy,r,r*.88,0,0,TAU);g.fill()}};
  for(let row=0;row<rows;row++)for(let c=0;c<rows;c++)sc((c+(row%2?.5:0))*cw+R()*cw*.18,(row+.5)*cw+R()*cw*.18,cw*(.5+R()*.1));
  for(let k=0;k<26;k++)sc(R()*S,R()*S,cw*(.9+R()*.5));
  g.lineCap="round";for(let k=0;k<34;k++){let x=R()*S,y=R()*S;g.strokeStyle=bump?"rgba(20,20,20,.55)":"rgba(60,60,60,.35)";g.lineWidth=1.2+R()*1.6;g.beginPath();g.moveTo(x,y);
    for(let s=0;s<6;s++){x+=R()*8-4;y+=8+R()*8;g.lineTo(x,y)}g.stroke()}
  for(let k=0;k<1400;k++){g.fillStyle=`rgba(0,0,0,${R()*.18})`;g.beginPath();g.arc(R()*S,R()*S,R()*1.4+.3,0,TAU);g.fill()}})}
const scaleTex=scaleSheet(true),scaleCol=scaleSheet(false);
// a soft sky-and-ground picture the dinosaurs reflect, so their skin catches light like real skin
const envTex=canvasTex(256,(g,S)=>{const gr=g.createLinearGradient(0,0,0,S);gr.addColorStop(0,"#9cc4ef");gr.addColorStop(.42,"#e8e4d6");gr.addColorStop(.5,"#c8b896");gr.addColorStop(.58,"#6e5c40");gr.addColorStop(1,"#2e281c");g.fillStyle=gr;g.fillRect(0,0,S,S);
  const s=g.createRadialGradient(S*.3,S*.22,2,S*.3,S*.22,S*.16);s.addColorStop(0,"rgba(255,250,230,1)");s.addColorStop(1,"rgba(255,250,230,0)");g.fillStyle=s;g.fillRect(0,0,S,S)},true);
envTex.mapping=THREE.EquirectangularReflectionMapping;envTex.wrapT=THREE.ClampToEdgeWrapping;
// fine ground grain (multiplies the ground colour)
const grainTex=canvasTex(256,(g,S)=>{g.fillStyle="#fff";g.fillRect(0,0,S,S);const R=mulberry(42);
  for(let k=0;k<5200;k++){const x=R()*S,y=R()*S,r=R()*1.8+.4;g.fillStyle=R()<.5?`rgba(255,250,235,${R()*.6})`:`rgba(0,0,0,${R()*.22})`;g.beginPath();g.arc(x,y,r,0,TAU);g.fill()}
  for(let k=0;k<500;k++){const x=R()*S,y=R()*S;g.strokeStyle=`rgba(20,30,10,${R()*.25})`;g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+R()*5-2.5,y-3-R()*5);g.stroke()}});
const glowTex=canvasTex(128,(g,S)=>{const gr=g.createRadialGradient(S/2,S/2,1,S/2,S/2,S/2);gr.addColorStop(0,"rgba(140,210,255,1)");gr.addColorStop(.35,"rgba(90,170,255,.45)");gr.addColorStop(1,"rgba(90,170,255,0)");g.fillStyle=gr;g.fillRect(0,0,S,S)},true);

/* ========================= renderer, scene, camera ========================= */
const glc=$("gl");
const renderer=new THREE.WebGLRenderer({canvas:glc,antialias:true,powerPreference:"high-performance"});
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const FOG=new THREE.Color("#8e9688");scene.background=FOG.clone();scene.fog=new THREE.Fog(FOG,1000,3000);
const camera=new THREE.PerspectiveCamera(40,1,1,10000);
const hemi=new THREE.HemisphereLight(0xcfe0f0,0x4a3c26,1.5);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,2.9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;scene.add(sun);scene.add(sun.target);
const SUN=new THREE.Vector3(-.45,1,.38).normalize();
const camT=new THREE.Vector3();let camL=len(1),camH=0;
const EL=44*Math.PI/180;

// trees and big plants turn see-through where they would hide your dinosaur
const xray={uCam:{value:new THREE.Vector3()},uTgt:{value:new THREE.Vector3()},uR:{value:50}};
function addXray(m){m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,xray);
  sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vXW;").replace("#include <project_vertex>",
    "#include <project_vertex>\n{vec4 xw=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nxw=instanceMatrix*xw;\n#endif\nvXW=(modelMatrix*xw).xyz;}");
  sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nvarying vec3 vXW;uniform vec3 uCam;uniform vec3 uTgt;uniform float uR;").replace("#include <clipping_planes_fragment>",
    "#include <clipping_planes_fragment>\n{vec3 d=uTgt-uCam;float t=clamp(dot(vXW-uCam,d)/dot(d,d),0.0,1.0);float rr=uR*(0.4+0.6*t);float r=length(vXW-(uCam+d*t));\nif(t<0.96&&r<rr){float n=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);if(n<1.0-smoothstep(rr*0.55,rr,r))discard;}}");};
  m.customProgramCacheKey=()=>"xray"+(m.vertexColors?1:0)+(m.flatShading?1:0);return m}

/* ========================= ground ========================= */
// gentle hills, carved down where the lakes and rivers are (water surface is y=0)
function heightAt(x,y){x=wrap(x);y=wrap(y);
  const hill=6+130*smooth(.38,.9,fbm(x,y,4096,61))+90*smooth(.55,.95,rocky(x,y))+10*vnoise(x,y,512,63);
  const w=waterAmt(x,y);return lerp(hill,-26,smooth(.36,.56,w))}
const groundY=(x,y,L)=>Math.max(heightAt(x,y),-L*.16);
const LODS=[512,1024,2048],SEG=[32,48,48];
const lodFor=s=>s<=3?0:s<=6?1:2;
const terrMat=new THREE.MeshStandardMaterial({vertexColors:true,map:grainTex,roughness:.96,metalness:0});
// ripples: a tiling normal map made from overlapping waves, scrolled over time so the water moves
const waterNorm=(()=>{const S=256,c=document.createElement("canvas");c.width=c.height=S;const g=c.getContext("2d"),im=g.createImageData(S,S),R=mulberry(7),W=[];
  for(let k=0;k<9;k++)W.push([Math.round(1+R()*5)*(R()<.5?-1:1),Math.round(1+R()*5)*(R()<.5?-1:1),R()*TAU,.5+R()]);
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){let dx=0,dy=0;for(const [a,b,p,amp] of W){const ph=TAU*(a*x+b*y)/S+p,c2=Math.cos(ph)*amp;dx+=c2*a;dy+=c2*b}
    const i=(y*S+x)*4;im.data[i]=128+dx*2.2;im.data[i+1]=128+dy*2.2;im.data[i+2]=255;im.data[i+3]=255}
  g.putImageData(im,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);return t})();
const waterMat=new THREE.MeshStandardMaterial({color:0x245c68,transparent:true,opacity:.72,roughness:.12,metalness:.1,depthWrite:false,normalMap:waterNorm,normalScale:new THREE.Vector2(.35,.35),envMap:envTex,envMapIntensity:.9});
const treeTrunkMat=addXray(new THREE.MeshStandardMaterial({color:0x4a3826,roughness:.95}));
const treeLeafMat=addXray(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.9}));
const rockMat=addXray(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.92,flatShading:true}));
const grassMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.95,side:THREE.DoubleSide});
const boneMat=new THREE.MeshStandardMaterial({color:0xd8cdb2,roughness:.7});
const lilyMat=new THREE.MeshStandardMaterial({color:0x3f7a3a,roughness:.6});
const sRGB=c=>Math.pow(c/255,2.2);
// unit deco geometry
const DG=(()=>{
  const conif=new Bk();const tr=(g,col)=>conif.add(g,0,col);
  {const R=mulberry(11);for(let k=0;k<8;k++){const r=.27-k*.031,g=new THREE.ConeGeometry(r,.2,11,2);const P=g.attributes.position;
    for(let v=0;v<P.count;v++){const x=P.getX(v),y=P.getY(v),z=P.getZ(v),e=Math.hypot(x,z)/r;if(e>.5){const j=1+(hashf(Math.round(x*400),k,Math.round(z*400))-.5)*.35;P.setXYZ(v,x*j,y-.035*e,z*j)}}
    g.rotateY(R()*TAU);g.translate(0,.34+k*.085,0);g.computeVertexNormals();tr(g,col3(["#1d3614","#264519","#2f5220","#22401a"][k%4]).multiplyScalar(.85+.3*R()))}}
  const trunk=new THREE.CylinderGeometry(.018,.032,.8,7);trunk.translate(0,.4,0);
  const rock=new THREE.DodecahedronGeometry(1,1);{const P=rock.attributes.position,R=mulberry(5),cs=[];for(let v=0;v<P.count;v++){const x=P.getX(v),y=P.getY(v),z=P.getZ(v),hh=hashf(Math.round(x*50),Math.round(y*50),Math.round(z*50)),k=.82+hh*.36;P.setXYZ(v,x*k,y*k*.7,z*k);const c=.85+hh*.3;cs.push((.13+.03*Math.max(0,y-.3))*c*(y<-.2?.75:1),(.12+.03*Math.max(0,y-.3))*c*(y<-.2?.75:1),.1*c*(y<-.2?.75:1))}rock.setAttribute("color",new THREE.Float32BufferAttribute(cs,3));rock.computeVertexNormals();rock.translate(0,.25,0)}
  const tuft=new THREE.BufferGeometry();{const p=[];for(let k=0;k<5;k++){const a=k*1.26,c=Math.cos(a),s=Math.sin(a),lx=c*.35,lz=s*.35;p.push(-s*.08,0,c*.08, s*.08,0,-c*.08, lx,1,lz)}tuft.setAttribute("position",new THREE.Float32BufferAttribute(p,3));tuft.computeVertexNormals()}
  const log=new THREE.CylinderGeometry(.09,.1,1,9);log.rotateZ(Math.PI/2);log.translate(0,.09,0);
  const reed=new THREE.CylinderGeometry(.03,.04,1,5);reed.translate(0,.5,0);
  const lily=new THREE.CircleGeometry(.5,10,.3,TAU-.5);lily.rotateX(-Math.PI/2);
  const bones=new THREE.TorusGeometry(.3,.04,5,10,Math.PI);bones.rotateY(Math.PI/2);
  return{crown:conif.geo(false),trunk,rock,tuft,log,reed,lily,bones}})();
function decoFor512(i,j){ // same layout as the 2D version
  const R=mulberry(i*7919+j*104729+17),deco=[];const bm=biome(wrap(i*CH+CH/2),wrap(j*CH+CH/2));
  const add=(type,n,smin,smax)=>{for(let k=0;k<n;k++){const x=R()*CH,y=R()*CH,s=smin+R()*(smax-smin),f=R()<.5?-1:1,v=R()*1000|0;const w=waterAmt(wrap(i*CH+x),wrap(j*CH+y));if(w>.4)continue;deco.push({type,x,y,s,f,v})}};
  for(let k=0;k<18;k++){const x=R()*CH,y=R()*CH;const w=waterAmt(wrap(i*CH+x),wrap(j*CH+y));
    if(w>.6){if(R()<.25&&bm==="swamp")deco.push({type:"lily",x,y,s:8+R()*18,f:1,v:R()*1000|0})}else if(w>.42&&w<.5&&R()<.5)deco.push({type:"reed",x,y,s:14+R()*12,f:1,v:R()*1000|0})}
  if(bm==="meadow"){add("tuft",52,8,18);add("fern",6,14,26);add("rock",2,8,16)}
  else if(bm==="forest"){add("tuft",24,8,15);add("fern",10,16,30);add("log",2,60,110);add("tree",3,520,820)}
  else if(bm==="swamp"){add("reed",22,14,26);add("tuft",10,8,14);add("tree",1,420,600)}
  else if(bm==="dry"){add("dtuft",24,7,13);add("rock",4,8,22);add("bones",R()<.25?1:0,30,46)}
  else if(bm==="desert"){add("rock",6,8,26);add("bones",R()<.4?1:0,30,50);add("dtuft",6,6,10)}
  else{add("rock",10,10,30);add("boulder",3,90,180);add("dtuft",8,6,10)}
  return deco}
const chunks3=new Map();
function genChunk3(lod,i,j){
  const CS=LODS[lod],n=SEG[lod],X0=i*CS,Y0=j*CS,st=CS/n,R1=n+1;
  const pos=new Float32Array(R1*R1*3),col=new Float32Array(R1*R1*3),uv=new Float32Array(R1*R1*2),idx=[];let wet=false;
  for(let b=0;b<=n;b++)for(let a=0;a<=n;a++){const v=b*R1+a,x=a*st,y=b*st,wx=wrap(X0+x),wy=wrap(Y0+y);
    const h=heightAt(wx,wy);if(h<2)wet=true;pos[v*3]=x;pos[v*3+1]=h;pos[v*3+2]=y;
    const c=groundRGB(wx,wy),nz=(hash2(a+i*97,b+j*89,3)-.5)*8,pt=.86+.2*vnoise(wx,wy,220,77)+.08*vnoise(wx,wy,60,78);col[v*3]=sRGB((c[0]+nz)*pt);col[v*3+1]=sRGB((c[1]+nz)*(pt+.02));col[v*3+2]=sRGB((c[2]+nz)*pt);
    uv[v*2]=(X0+x)/160;uv[v*2+1]=(Y0+y)/160}
  for(let b=0;b<n;b++)for(let a=0;a<n;a++){const p=b*R1+a,q=p+R1;if(Math.abs(pos[p*3+1]-pos[(q+1)*3+1])<Math.abs(pos[(p+1)*3+1]-pos[q*3+1]))idx.push(p,q,q+1,p,q+1,p+1);else idx.push(p,q,p+1,p+1,q,q+1)}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));g.setAttribute("color",new THREE.BufferAttribute(col,3));g.setAttribute("uv",new THREE.BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();
  const grp=new THREE.Group();const mesh=new THREE.Mesh(g,terrMat);mesh.receiveShadow=true;grp.add(mesh);
  if(wet){const wg=new THREE.PlaneGeometry(CS,CS);wg.rotateX(-Math.PI/2);wg.translate(CS/2,0,CS/2);const wm=new THREE.Mesh(wg,waterMat);wm.renderOrder=2;grp.add(wm);grp.userData.wg=wg}
  // decorations, instanced per type
  const minS=lod?CS*.022:0,per=CS/CH,lists={};
  for(let b=0;b<per;b++)for(let a=0;a<per;a++){const si=i*per+a,sj=j*per+b;for(const d of decoFor512(((si%NC)+NC)%NC,((sj%NC)+NC)%NC)){
    if(d.s<minS&&d.type!=="tree")continue;(lists[d.type]||(lists[d.type]=[])).push({...d,x:d.x+a*CH,y:d.y+b*CH})}}
  const M=new THREE.Matrix4(),Q=new THREE.Quaternion(),Sc=new THREE.Vector3(),Ps=new THREE.Vector3(),E=new THREE.Euler(),Cc=new THREE.Color();
  const inst=(geo,mat,arr,fn,shadow)=>{if(!arr||!arr.length)return;const im=new THREE.InstancedMesh(geo,mat,arr.length);
    arr.forEach((d,k)=>{const hx=heightAt(wrap(X0+d.x),wrap(Y0+d.y));fn(d,hx);M.compose(Ps,Q,Sc);im.setMatrixAt(k,M);if(im.userData.col)im.setColorAt(k,Cc)});
    im.castShadow=!!shadow;im.receiveShadow=true;grp.add(im);return im};
  const R=mulberry(i*31+j*17+lod);
  const base=(d,h,s,yo=0)=>{Ps.set(d.x,h+yo,d.y);E.set(0,R()*TAU,0);Q.setFromEuler(E);Sc.set(s,s,s)};
  inst(DG.trunk,treeTrunkMat,lists.tree,(d,h)=>{base(d,h-4,d.s*.42)},true);
  inst(DG.crown,treeLeafMat,lists.tree,(d,h)=>{base(d,h-4,d.s*.42)},true);
  inst(DG.rock,rockMat,lists.boulder,(d,h)=>{base(d,h-d.s*.08,d.s*.42)},true);
  inst(DG.rock,rockMat,lists.rock,(d,h)=>{base(d,h-d.s*.05,d.s*.45)},lod===0);
  inst(DG.log,treeTrunkMat,lists.log,(d,h)=>{base(d,h-1,d.s)},true);
  inst(DG.bones,boneMat,lists.bones,(d,h)=>{base(d,h,d.s*.6)},false);
  inst(DG.lily,lilyMat,lists.lily,(d,h)=>{base(d,0,d.s);Ps.y=.6},false);
  const g2=[...(lists.tuft||[]).map(d=>({...d,c:d.v%2?"#5f8a34":"#3f6a24"})),...(lists.dtuft||[]).map(d=>({...d,c:d.v%2?"#a99a5c":"#857645"})),...(lists.fern||[]).map(d=>({...d,c:"#3a6624",s:d.s*.8})),...(lists.reed||[]).map(d=>({...d,c:"#6f7a3c"}))];
  if(g2.length){const im=new THREE.InstancedMesh(DG.tuft,grassMat,g2.length);g2.forEach((d,k)=>{const h=heightAt(wrap(X0+d.x),wrap(Y0+d.y));base(d,h,1);Sc.set(d.s*.9,d.s,d.s*.9);M.compose(Ps,Q,Sc);im.setMatrixAt(k,M);Cc.set(d.c);im.setColorAt(k,Cc)});grp.add(im)}
  const ch3={grp,g,lod,i,j};chunks3.set(lod+":"+i+":"+j,ch3);
  if(chunks3.size>260){for(const [k,c] of chunks3){if(c.used)continue;dropChunk(k,c);if(chunks3.size<=220)break}}
  return ch3}
function dropChunk(k,c){scene.remove(c.grp);c.g.dispose();if(c.grp.userData.wg)c.grp.userData.wg.dispose();c.grp.traverse(o=>{if(o.isInstancedMesh)o.dispose()});chunks3.delete(k)}
let lastLod=0;
function updateTerrain(D){
  const lod=lodFor(me.size),CS=LODS[lod],NCl=W/CS;
  const x0=-1.9*D,x1=1.9*D,z0=-2.4*D,z1=1.05*D;
  const i0=Math.floor((cam.x+x0)/CS),i1=Math.floor((cam.x+x1)/CS),j0=Math.floor((cam.y+z0)/CS),j1=Math.floor((cam.y+z1)/CS);
  for(const c of chunks3.values())c.used=false;
  let budget=game.state==="play"?3:1,missing=0;const want=[];
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++)want.push([i,j,Math.hypot((i+.5)*CS-cam.x,(j+.5)*CS-cam.y)]);
  want.sort((a,b)=>a[2]-b[2]);
  for(const [i,j] of want){const im=((i%NCl)+NCl)%NCl,jm=((j%NCl)+NCl)%NCl;let c=chunks3.get(lod+":"+im+":"+jm);
    if(!c){if(budget-->0)c=genChunk3(lod,im,jm);else{missing++;continue}}
    c.used=true;if(!c.grp.parent)scene.add(c.grp);c.grp.position.set(i*CS-cam.x,0,j*CS-cam.y)}
  // while the new detail level is still loading, keep showing the old one
  if(missing&&lastLod!==lod){const PS=LODS[lastLod],NP=W/PS;
    for(let j=Math.floor((cam.y+z0)/PS);j<=Math.floor((cam.y+z1)/PS);j++)for(let i=Math.floor((cam.x+x0)/PS);i<=Math.floor((cam.x+x1)/PS);i++){
      const c=chunks3.get(lastLod+":"+(((i%NP)+NP)%NP)+":"+(((j%NP)+NP)%NP));if(c){c.used=true;if(!c.grp.parent)scene.add(c.grp);c.grp.position.set(i*PS-cam.x,-.5,j*PS-cam.y)}}}
  else lastLod=lod;
  for(const c of chunks3.values())if(!c.used&&c.grp.parent)scene.remove(c.grp);
}

/* ========================= dinosaur instances ========================= */
const TPL={};
function tpl(sp){if(TPL[sp])return TPL[sp];const T=SPEC[sp]();
  const bump=.9;
  T.mats={skin:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:0,map:scaleCol,bumpMap:scaleTex,bumpScale:bump,envMap:envTex,envMapIntensity:.55}),
    bone:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,envMap:envTex,envMapIntensity:.6}),
    eye:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.08,envMap:envTex,envMapIntensity:1.2,emissive:new THREE.Color(0xff9a20),emissiveIntensity:.55}),
    dark:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35}),
    acc:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,side:THREE.DoubleSide,map:scaleCol,bumpMap:scaleTex,bumpScale:bump*.5,envMap:envTex,envMapIntensity:.45})};
  T.inv=T.bones.map(b=>new THREE.Matrix4().makeTranslation(-b.p[0],-b.p[1],-b.p[2]));
  T.fly=!!SP[sp].fly;const bb=T.geos.skin.boundingBox;T.top=bb.max.y+(T.fly?55:0);T.box=bb;
  return TPL[sp]=T}
const pools={},liveInst=new Set();let stamp=0;
const ringGeo=(()=>{const g=new THREE.RingGeometry(.86,1,48);g.rotateX(-Math.PI/2);return g})();
const diskGeo=(()=>{const g=new THREE.CircleGeometry(1,40);g.rotateX(-Math.PI/2);return g})();
const windMat=new THREE.MeshBasicMaterial({color:0xdc1e0a,transparent:true,opacity:.35,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
function makeInst(sp){
  const T=tpl(sp),g=new THREE.Group(),inner=new THREE.Group();g.add(inner);
  const bones=T.bones.map(()=>new THREE.Bone());
  T.bones.forEach((b,i)=>{const o=bones[i];o.name=b.name;if(b.parent<0){o.position.set(...b.p);inner.add(o)}else{const pp=T.bones[b.parent].p;o.position.set(b.p[0]-pp[0],b.p[1]-pp[1],b.p[2]-pp[2]);bones[b.parent].add(o)}});
  const skel=new THREE.Skeleton(bones,T.inv);const mats={},meshes=[];
  for(const k in T.geos){if(!T.geos[k])continue;const m=T.mats[k].clone();mats[k]=m;const mesh=new THREE.SkinnedMesh(T.geos[k],m);mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;mesh.bind(skel,new THREE.Matrix4());inner.add(mesh);meshes.push(mesh)}
  const disk=new THREE.Mesh(diskGeo,windMat);disk.visible=false;disk.position.y=.6;disk.scale.set(62,1,62);g.add(disk);
  const bn={};for(const b of T.bones)bn[b.name]=bones[T.B[b.name]];
  const rest={};for(const k in bn)rest[k]=bn[k].position.clone();
  return{sp,T,g,inner,bn,rest,mats,meshes,disk,owner:null,fade:1,op:1}}
function getInst(sp,owner){const p=pools[sp]||(pools[sp]=[]);const I=p.pop()||makeInst(sp);I.owner=owner;I.stamp=stamp;I.fade=0;scene.add(I.g);liveInst.add(I);I.g.visible=true;return I}
function relInst(I){scene.remove(I.g);liveInst.delete(I);if(I.owner&&I.owner._i===I)I.owner._i=null;I.owner=null;(pools[I.sp]||(pools[I.sp]=[])).push(I)}
function setOpacity(I,a){if(Math.abs(I.op-a)<.01)return;const tr=a<.999;for(const k in I.mats){const m=I.mats[k];if(m.transparent!==tr){m.transparent=tr;m.needsUpdate=true}m.opacity=a;m.depthWrite=!tr||k!=="acc"}I.op=a}
const angTo=(a,b,k)=>{let d=((b-a+Math.PI*3)%TAU)-Math.PI;return a+d*clamp(k,0,1)};
// put a dinosaur in its pose for this frame. a = {ph,mv,jaw,atk,angry}
function pose(I,a,t){
  const B=I.bn,R=I.rest,T=I.T,ph=a.ph,mv=a.mv;
  B.body.position.y=R.body.y+(T.kind==="biped"?Math.abs(Math.sin(ph))*1.6:Math.abs(Math.sin(ph))*.8)*mv+Math.sin(t*1.7)*.35;
  B.body.rotation.z=Math.sin(ph*2)*.015*mv;B.body.rotation.x=Math.sin(ph)*.03*mv;
  for(let k=0;k<3;k++){const tb=B["tail"+k];tb.rotation.y=Math.sin(t*1.5+ph*.5-k*.8)*(.06+.07*mv)*(1+k*.4)+(MOVES[I.sp]&&MOVES[I.sp].tail?Math.sin(a.atk*Math.PI)*(.5+k*.3):0);tb.rotation.z=Math.sin(ph*2-k)*.03*mv-.015}
  const look=a.angry?-.1:0;
  B.neck0.rotation.z=Math.sin(ph*2)*.03*mv+Math.sin(t*1.1)*.02+look*.6-a.atk*.22;B.neck1.rotation.z=look*.4-a.atk*.1;
  B.neck0.rotation.y=Math.sin(t*.6+I.g.id)*.06*(1-mv);
  B.head.rotation.z=look*.5+(a.angry?Math.sin(t*9)*.015:0);
  B.jaw.rotation.z=-a.jaw*T.open;
  if(T.fly){ // flapping wings, legs tucked back
    const fs=a.mv>.1?9:6,fl=Math.sin(t*fs+I.g.id);
    B.wingL.rotation.x=fl*.5+.08;B.wingR.rotation.x=-fl*.5-.08;B.body.position.y=R.body.y-fl*2.2;
    for(const nm of["L","R"]){B["thigh"+nm].rotation.z=-.5;B["shin"+nm].rotation.z=.2;B["foot"+nm].rotation.z=.3}
  }else if(T.kind==="biped"){
    for(const [s,nm] of [[0,"L"],[Math.PI,"R"]]){const p=ph+s,sw=Math.sin(p)*.6*mv,lift=Math.max(0,Math.cos(p))*mv;
      B["thigh"+nm].rotation.z=sw+lift*.3;B["shin"+nm].rotation.z=-lift*.85;B["foot"+nm].rotation.z=-(sw+lift*.3-lift*.85)-lift*.35;
      if(B["arm"+nm])B["arm"+nm].rotation.z=Math.sin(p)*.12*mv+a.atk*.7+(a.angry?.15:0)}
  }else{
    for(const [s,nm] of [[0,"L"],[Math.PI,"R"]]){const pb=ph+s,pf=ph+s+Math.PI;
      B["thigh"+nm].rotation.z=Math.sin(pb)*.42*mv;B["shin"+nm].rotation.z=-Math.max(0,Math.cos(pb))*.6*mv;
      B["fthigh"+nm].rotation.z=Math.sin(pf)*.38*mv;B["fshin"+nm].rotation.z=-Math.max(0,Math.cos(pf))*.55*mv}}
}
// place an instance in the world: x,y world spot, L body length, yaw heading
function place(I,x,y,L,yaw,lift){const X=wd(x-cam.x),Z=wd(y-cam.y);I.g.position.set(X,groundY(x,y,L)+(lift||0)+(I.T.fly?L*.55:0),Z);I.g.scale.setScalar(L/100);I.g.rotation.y=-yaw}

/* ========================= plants, fish, egg (static models) ========================= */
const plantGeo=(()=>{
  const frond=(bk,x0,y0,ang,len,droop,w,c0,c1)=>{const pts=[];for(let k=0;k<=4;k++){const t=k/4;pts.push([t*len,y0+Math.sin(t*Math.PI*.9)*len*.25-droop*t*t*len,0,w*(1-t*.85),.5])}
    const g=loftGeo(pts,{rs:4,sub:2,color:(oy,p)=>mixC(c0,c1,p[0]/len)});g.rotateY(ang);g.translate(x0,0,0);bk.add(g)};
  const T=[];const L0=col3("#4f7a2c"),L1=col3("#6d9a3a"),Br=col3("#5a4630"),Dk=col3("#2c4d1f");
  {const b=new Bk();for(let i=0;i<9;i++)frond(b,0,2,i*.7+.2,60+(i%3)*10,-.2,6,L0,L1);T.push(b.geo(false))} // fern clump
  {const b=new Bk();
    const tr=new THREE.CylinderGeometry(6.5,8,34,9);tr.translate(0,17,0);b.add(tr,0,Br);
    for(let i=0;i<11;i++){const g=loftGeo([[0,34,0,1,.5],[18,44,0,6,.5],[38,40,0,5,.5],[52,28,0,1,.5]],{rs:4,sub:2,color:(oy,p)=>mixC(L0,L1,p[0]/52)});g.rotateY(i*.58);b.add(g)}T.push(b.geo(false))} // cycad
  {const b=new Bk();const tr=new THREE.CylinderGeometry(3.5,5,76,8);tr.translate(0,38,0);b.add(tr,0,col3("#4a3a28"));
    for(let i=0;i<12;i++){const g=loftGeo([[0,74,0,1,.5],[20,90,0,6,.5],[42,84,0,5,.5],[56,66,0,1,.5]],{rs:4,sub:2,color:(oy,p)=>mixC(L0,L1,p[0]/56)});g.rotateY(i*.53);b.add(g)}T.push(b.geo(false))} // tree fern
  {const b=new Bk();const tr=new THREE.CylinderGeometry(4,6,60,8);tr.translate(0,30,0);b.add(tr,0,col3("#3e2f20"));
    for(const [x,y,z,r,c] of [[-14,64,6,22,"#2f5420"],[16,66,-6,22,"#2f5420"],[0,80,0,26,"#4f7a2c"],[-10,88,-10,16,"#5c8b36"],[12,86,10,17,"#5c8b36"],[2,70,18,18,"#3f6a26"]]){const g=new THREE.IcosahedronGeometry(r,1);g.translate(x,y,z);b.add(g,0,col3(c))}
    for(let i=0;i<10;i++){const g=new THREE.SphereGeometry(2.2,5,4);const a=i*2.4;g.translate(Math.cos(a)*22,74+((i*37)%20),Math.sin(a)*22);b.add(g,0,col3("#e9d6e8"))}T.push(b.geo(false))} // broadleaf
  {const b=new Bk();const tr=new THREE.CylinderGeometry(3,5,94,8);tr.translate(0,47,0);b.add(tr,0,col3("#3a2a1a"));
    for(let k=0;k<5;k++){const g=new THREE.ConeGeometry(34-k*6,20,10);g.translate(0,44+k*15,0);b.add(g,0,col3(k%2?"#2c4d1f":"#4f7a2c"))}const g=new THREE.SphereGeometry(14,8,6);g.scale(1,.7,1);g.translate(0,118,0);b.add(g,0,Dk);T.push(b.geo(false))} // conifer
  return T})();
const plantMats=["#ffffff","#d8e8c8","#f0f6d8","#c8d8b8"].map(c=>addXray(new THREE.MeshStandardMaterial({color:c,vertexColors:true,roughness:.85,side:THREE.DoubleSide})));
const plantKind=s=>s<=2?0:s<=4?1:s<=6?2:s<=8?3:4;
const fishGeos=[["#8aa6a8","#d8e4e0"],["#6f7f5a","#c8c89a"],["#7a6a8a","#d8cce0"],["#5a7a8a","#c0dce4"]].map(([a,b])=>{const ca=col3(a),cb=col3(b),bk=new Bk();
  bk.add(loftGeo([[-40,0,0,1,1],[-30,0,0,4,6],[-10,0,0,9,14],[10,0,0,9,15],[30,-1,0,6,9],[40,-1,0,1.5,2]],{rs:10,color:oy=>mixC(cb,ca,oy*.5+.5)}));
  bk.add(finGeo(-56,-36,4,x=>[x,0,0],x=>[x-4,(x+36)*-.9,0],v=>ca),0);bk.add(finGeo(-56,-36,4,x=>[x,0,0],x=>[x-4,(x+36)*.9,0],v=>ca),0);
  bk.add(finGeo(-10,12,4,x=>[x,12,0],x=>[x-4,12+8*Math.sin((x+10)/22*Math.PI),0],v=>ca),0);
  const e=new THREE.SphereGeometry(2.6,8,6);e.translate(28,2,5.5);bk.add(e,0,col3("#0c0c0c"));const e2=e.clone();e2.translate(0,0,-11);bk.add(e2,0,col3("#0c0c0c"));return bk.geo(false)});
const fishMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.2,side:THREE.DoubleSide});
const eggMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.35,emissive:0x2266cc,emissiveIntensity:.45});
const eggGeo=(()=>{const g=new THREE.SphereGeometry(1,24,18);g.scale(.46,.62,.46);g.translate(0,.62,0);const P=g.attributes.position,cs=[];const R=mulberry(8);
  for(let v=0;v<P.count;v++){const y=P.getY(v);let c=mixC(col3("#1d5fae"),col3("#bfe6ff"),y/1.24);if(R()<.06)c=col3("#143d7a");cs.push(c.r,c.g,c.b)}g.setAttribute("color",new THREE.Float32BufferAttribute(cs,3));return g})();
const eggMesh=new THREE.Mesh(eggGeo,eggMat);eggMesh.castShadow=true;eggMesh.visible=false;scene.add(eggMesh);
const eggGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));eggGlow.visible=false;scene.add(eggGlow);
const meRing=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0x78c8ff,transparent:true,opacity:.6,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));scene.add(meRing);
const tgtRing=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:0xffd278,transparent:true,opacity:.85,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));scene.add(tgtRing);
const statics=new Map(); // entity -> mesh for plants and fish
function staticFor(o,make){let m=o._s;if(!m){m=make();o._s=m;scene.add(m);statics.set(o,m)}m.userData.stamp=stamp;return m}

/* ========================= solid rocks and tree trunks =========================
   Boulders, rocks and tree trunks are solid: a dinosaur that walks into one slides around it.
   A rock too small to see at your size (or lower than your knee) can be stepped over. */
const obsCache=new Map();
function obstacles512(i,j){i=((i%NC)+NC)%NC;j=((j%NC)+NC)%NC;const key=i*NC+j;let L=obsCache.get(key);if(L)return L;
  L=[];for(const d of decoFor512(i,j)){const r=d.type==="boulder"?d.s*.42*.95:d.type==="rock"?d.s*.45*.9:d.type==="tree"?d.s*.42*.04:0;if(r)L.push({x:i*CH+d.x,y:j*CH+d.y,r,s:d.s,type:d.type})}
  obsCache.set(key,L);if(obsCache.size>3000)obsCache.delete(obsCache.keys().next().value);return L}
function collide(o,L){
  if(o.sp&&SP[o.sp].fly)return; // flyers go over rocks and trees
  const br=L*.32,lod=lodFor(me.size),minS=lod?LODS[lod]*.022:0,ci=Math.floor(o.x/CH),cj=Math.floor(o.y/CH);
  for(let j=cj-1;j<=cj+1;j++)for(let i=ci-1;i<=ci+1;i++)for(const ob of obstacles512(i,j)){
    // big dinosaurs step right over rocks and boulders that are small next to them (lower than about knee height)
    if(ob.type==="rock"&&ob.s<minS||ob.type!=="tree"&&ob.r<L*.14)continue;
    const dx=wd(o.x-ob.x),dy=wd(o.y-ob.y),m=ob.r+br;if(Math.abs(dx)>m||Math.abs(dy)>m)continue;const d=Math.hypot(dx,dy);if(d>=m)continue;
    const nx=d>.001?dx/d:1,ny=d>.001?dy/d:0;o.x=wrap(o.x+nx*(m-d));o.y=wrap(o.y+ny*(m-d));
    // stop pushing into the rock, keep sliding along it
    if(o.vx!==undefined){const vn=o.vx*nx+o.vy*ny;if(vn<0){o.vx-=vn*nx;o.vy-=vn*ny}}}
}
