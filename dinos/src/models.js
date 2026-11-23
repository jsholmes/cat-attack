/* ========================= 3D model building =========================
   Every dinosaur is built from code: smooth "lofted" tubes (body, tail, neck, legs, skull, jaw)
   plus horns, teeth, claws, plates, sails and frills. All parts are skinned to a small skeleton
   so the tail swings, the legs walk and the jaw opens. Units match the old 2D drawings:
   a dinosaur is about 100 units long (L/100), feet on y=0, facing +x, z is its left side. */
const V3=THREE.Vector3, Z3=new V3(0,0,1);
const col3=h=>new THREE.Color(h);
const mixC=(a,b,t)=>a.clone().lerp(b,clamp(t,0,1));

// Catmull-Rom through control points [x,y,z,w,h]
function catmull(pts,sub){
  const out=[],n=pts.length;
  for(let i=0;i<n-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(n-1,i+2)];
    for(let s=0;s<sub;s++){const t=s/sub,t2=t*t,t3=t2*t,r=[];
      for(let k=0;k<5;k++)r.push(.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3));
      out.push(r)}}
  out.push(pts[n-1].slice());return out}

// a bucket collects geometry for one material, then becomes one (skinned) mesh
class Bk{
  constructor(){this.p=[];this.n=[];this.u=[];this.c=[];this.si=[];this.sw=[];this.i=[]}
  add(g,bone,col){
    if(!g.attributes.normal)g.computeVertexNormals();
    const base=this.p.length/3,P=g.attributes.position,N=g.attributes.normal,U=g.attributes.uv,C=g.attributes.color,S=g.userData.skin;
    for(let v=0;v<P.count;v++){this.p.push(P.getX(v),P.getY(v),P.getZ(v));this.n.push(N.getX(v),N.getY(v),N.getZ(v));
      this.u.push(U?U.getX(v):0,U?U.getY(v):0);
      if(C)this.c.push(C.getX(v),C.getY(v),C.getZ(v));else this.c.push(col.r,col.g,col.b);
      if(S){const s=S[v];this.si.push(s[0],s[1],0,0);this.sw.push(1-s[2],s[2],0,0)}else{this.si.push(bone||0,0,0,0);this.sw.push(1,0,0,0)}}
    if(g.index)for(let k=0;k<g.index.count;k++)this.i.push(base+g.index.getX(k));else for(let k=0;k<P.count;k++)this.i.push(base+k);
  }
  geo(skinned){
    if(!this.p.length)return null;const g=new THREE.BufferGeometry();
    g.setAttribute("position",new THREE.Float32BufferAttribute(this.p,3));g.setAttribute("normal",new THREE.Float32BufferAttribute(this.n,3));
    g.setAttribute("uv",new THREE.Float32BufferAttribute(this.u,2));g.setAttribute("color",new THREE.Float32BufferAttribute(this.c,3));
    if(skinned){g.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(this.si,4));g.setAttribute("skinWeight",new THREE.Float32BufferAttribute(this.sw,4))}
    g.setIndex(this.i);g.computeBoundingBox();g.computeBoundingSphere();return g}
}

// a smooth tube through control points; o.color(oy,p,s,th) colours each vertex, o.skin(s,p) gives [boneA,boneB,t]
function loftGeo(ctrl,o){
  const sub=o.sub||3,RS=o.rs||12,P=catmull(ctrl,sub),N=P.length,R1=RS+1;
  const S=[0];for(let i=1;i<N;i++)S.push(S[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1],P[i][2]-P[i-1][2]));
  const pos=[],uv=[],col=[],skin=[],idx=[],t=new V3(),n=new V3(),b=new V3(),q=new V3();
  for(let i=0;i<N;i++){
    const p=P[i],pa=P[Math.max(0,i-1)],pb=P[Math.min(N-1,i+1)];
    t.set(pb[0]-pa[0],pb[1]-pa[1],pb[2]-pa[2]).normalize();
    n.crossVectors(Z3,t);if(n.lengthSq()<1e-6)n.set(0,1,0);n.normalize();b.crossVectors(t,n).normalize();
    const w=Math.max(.12,p[3]),h=Math.max(.12,p[4]),sk=o.skin?o.skin(S[i],p):null;
    for(let j=0;j<=RS;j++){const th=j/RS*TAU,c=Math.cos(th),s=Math.sin(th);
      q.copy(n).multiplyScalar(c*h).addScaledVector(b,s*w);
      pos.push(p[0]+q.x,p[1]+q.y,p[2]+q.z);uv.push(S[i]/(o.uvs||14),j/RS*(o.uvr||2));
      const cc=o.color(q.y/(q.length()||1),p,S[i],th);col.push(cc.r,cc.g,cc.b);if(o.skin)skin.push(sk)}
  }
  for(let i=0;i<N-1;i++)for(let j=0;j<RS;j++){const a=i*R1+j,b2=a+1,c=a+R1,d=c+1;idx.push(a,b2,c,b2,d,c)}
  for(const [ri,dir] of [[0,-1],[N-1,1]]){const p=P[ri],ci=pos.length/3,k=ri*R1;pos.push(p[0],p[1],p[2]);uv.push(0,0);col.push(col[k*3],col[k*3+1],col[k*3+2]);if(o.skin)skin.push(skin[k]);
    for(let j=0;j<RS;j++){const a=k+j,b2=a+1;if(dir<0)idx.push(ci,b2,a);else idx.push(ci,a,b2)}}
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setAttribute("color",new THREE.Float32BufferAttribute(col,3));
  g.setIndex(idx);g.computeVertexNormals();
  const nm=g.attributes.normal;for(let i=0;i<N;i++){const a=i*R1,z=a+RS;const x=nm.getX(a)+nm.getX(z),y=nm.getY(a)+nm.getY(z),zz=nm.getZ(a)+nm.getZ(z),l=Math.hypot(x,y,zz)||1;nm.setXYZ(a,x/l,y/l,zz/l);nm.setXYZ(z,x/l,y/l,zz/l)}
  if(o.skin)g.userData.skin=skin;
  return g;
}
// a thin double-sided sheet (sail, plates, crests): base(x)->[x,y,z], top(x)->[x,y,z]
function finGeo(x0,x1,n,base,top,color,skinFn,rows=3){
  const pos=[],col=[],uv=[],skin=[],idx=[];
  for(let k=0;k<=n;k++){const x=lerp(x0,x1,k/n),B=base(x),T=top(x);
    for(let r=0;r<rows;r++){const v=r/(rows-1);const p=[lerp(B[0],T[0],v),lerp(B[1],T[1],v),lerp(B[2],T[2],v)];pos.push(...p);uv.push(k/n,v);
      const c=color(v,k,x);col.push(c.r,c.g,c.b);if(skinFn)skin.push(skinFn(p[0]))}}
  for(let k=0;k<n;k++)for(let r=0;r<rows-1;r++){const a=k*rows+r,b=a+1,c=a+rows,d=c+1;idx.push(a,c,b,b,c,d)}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setAttribute("color",new THREE.Float32BufferAttribute(col,3));g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();if(skinFn)g.userData.skin=skin;return g}

function hashf(x,y,z){const s=Math.sin(x*12.9898+y*78.233+z*37.719)*43758.5453;return s-Math.floor(s)}

class MB{
  constructor(sp){
    this.sp=sp;this.bones=[];this.B={};this.k={skin:new Bk(),bone:new Bk(),eye:new Bk(),dark:new Bk(),acc:new Bk()};
    const c=SP[sp].col;this.c={dark:col3(c.dark),mid:col3(c.mid),belly:col3(c.belly)};this.cs=c;
    this.boneCol=col3("#e8dcbc");this.hornCol=col3(c.horn||"#e3d7bb");this.bounds=[];
  }
  bone(name,parent,x,y,z=0){this.B[name]=this.bones.length;this.bones.push({name,parent:parent==null?-1:this.B[parent],p:[x,y,z]});return this.B[name]}
  bi(b){return typeof b==="number"?b:this.B[b]}
  skinColor(stripe){const c=this.c;return(oy,p,s,th)=>{
    let cc=oy>0?mixC(c.mid,c.dark,oy*1.35):mixC(c.mid,c.belly,-oy*1.5);
    if(stripe&&oy>-.15){const st=Math.sin(p[0]*.42+Math.sin(p[2]*.3+th)*.6);if(st>.45)cc.lerp(c.dark,.55).multiplyScalar(.8)}
    const m=.88+.22*hashf(Math.round(p[0]*.6),Math.round(th*3),this.sp.length);return cc.multiplyScalar(m)}}
  // chained skinning by arc length (for one continuous tube spanning several bones)
  chainSkin(ctrl,sub,chain,blend){
    const P=catmull(ctrl,sub),S=[0];for(let i=1;i<P.length;i++)S.push(S[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1],P[i][2]-P[i-1][2]));
    const bd=chain.map(([ci,a,b])=>({s:S[Math.min(P.length-1,ci*sub)],a:this.bi(a),b:this.bi(b)}));
    return s=>{for(const d of bd)if(Math.abs(s-d.s)<blend){return[d.a,d.b,smooth(d.s-blend,d.s+blend,s)]}
      let ow=bd[0].a;for(const d of bd)if(s>=d.s)ow=d.b;return[ow,ow,0]}}
  loft(bucket,ctrl,o={}){
    const sub=o.sub||3;let skin=null;
    if(o.chain)skin=this.chainSkin(ctrl,sub,o.chain,o.blend||4);else{const b=this.bi(o.bone||0);skin=()=>[b,b,0]}
    const g=loftGeo(ctrl,{sub,rs:o.rs,skin,color:o.color||this.skinColor(o.stripe),uvs:o.uvs});
    this.k[bucket].add(g);return g}
  // main body: tail tip -> head pivot, skinned along tail, torso and neck bones
  body(ctrl,chain,stripe){
    const sub=3;this.bodyCtrl=ctrl;
    const P=catmull(ctrl,sub);this.bounds=chain.map(([ci,a,b])=>({x:P[Math.min(P.length-1,ci*sub)][0],a:this.bi(a),b:this.bi(b)}));
    this.loft("skin",ctrl,{chain,blend:5,rs:16,stripe,sub});
  }
  skinX(x,blend=5){const bd=this.bounds;for(const d of bd)if(Math.abs(x-d.x)<blend)return[d.a,d.b,smooth(d.x-blend,d.x+blend,x)];let ow=bd[0].a;for(const d of bd)if(x>=d.x)ow=d.b;return[ow,ow,0]}
  boneX(x){const s=this.skinX(x);return s[2]<.5?s[0]:s[1]}
  at(x){const b=this.bodyCtrl;if(x<=b[0][0])return{y:b[0][1],w:b[0][3],h:b[0][4]};
    for(let i=0;i<b.length-1;i++){const p=b[i],q=b[i+1];if(x<=q[0]){const t=(x-p[0])/(q[0]-p[0]||1);return{y:lerp(p[1],q[1],t),w:lerp(p[3],q[3],t),h:lerp(p[4],q[4],t)}}}
    const l=b[b.length-1];return{y:l[1],w:l[3],h:l[4]}}
  cone(bucket,bone,base,tip,r,col,seg=7){
    const a=new V3(...base),d=new V3(...tip).sub(a),L=d.length();const g=new THREE.ConeGeometry(r,L,seg,1,false);g.translate(0,L/2,0);
    g.applyMatrix4(new THREE.Matrix4().compose(a,new THREE.Quaternion().setFromUnitVectors(new V3(0,1,0),d.normalize()),new V3(1,1,1)));
    this.k[bucket].add(g,this.bi(bone),col)}
  ell(bucket,bone,c,r,col,rot,seg=14,colFn){
    const g=new THREE.SphereGeometry(1,seg,Math.max(6,seg*.7|0));
    if(colFn){const P=g.attributes.position,cs=[];for(let v=0;v<P.count;v++){const cc=colFn(P.getX(v),P.getY(v),P.getZ(v));cs.push(cc.r,cc.g,cc.b)}g.setAttribute("color",new THREE.Float32BufferAttribute(cs,3))}
    g.scale(r[0],r[1],r[2]);if(rot){g.rotateX(rot[0]||0);g.rotateY(rot[1]||0);g.rotateZ(rot[2]||0)}g.translate(c[0],c[1],c[2]);
    this.k[bucket].add(g,this.bi(bone),col)}
  fin(bucket,x0,x1,n,base,top,color,bone){
    const g=finGeo(x0,x1,n,base,top,color,bone==null?x=>this.skinX(x):null);this.k[bucket].add(g,bone==null?0:this.bi(bone))}
  // eye with slit pupil and an angry brow ridge
  eye(e){const [x,y,z,r]=e;for(const s of[1,-1]){
    this.ell("eye","head",[x,y,s*z],[r,r,r*.75],col3("#e0a030"),null,12);
    this.ell("dark","head",[x+r*.22,y,s*(z+r*.62)],[r*.2,r*.78,r*.16],col3("#050302"),null,8);
    this.ell("skin","head",[x-r*.25,y+r*1.05,s*(z-r*.05)],[r*2.1,r*.62,r*1.05],this.c.dark,[0,0,-.12],10)}}
  done(kind,extra){
    const geos={};for(const k in this.k)geos[k]=this.k[k].geo(true);
    return{sp:this.sp,kind,bones:this.bones,B:this.B,geos,...extra}}
}

/* ----- the two body plans ----- */
function headParts(m,P){
  const b=P.body,last=b[b.length-1];
  m.loft("skin",P.skull.map(p=>[p[0],p[1],0,p[2],p[3]]),{bone:"head",rs:14,stripe:false});
  m.loft("skin",P.jaw.pts.map(p=>[p[0],p[1],0,p[2],p[3]]),{bone:"jaw",rs:12});
  // inside of the mouth (seen when the jaw opens)
  const s0=P.skull[0],s1=P.skull[P.skull.length-1],jy=P.jaw.pts[1][1]+P.jaw.pts[1][3]*.6;
  m.ell("dark","head",[(P.jaw.h[0]+s1[0])/2,jy+.6,0],[(s1[0]-P.jaw.h[0])*.46,1.4,P.jaw.pts[1][2]*.75],col3("#5a0f0c"),null,10);
  m.ell("dark","jaw",[(P.jaw.h[0]+s1[0])/2,jy-.4,0],[(s1[0]-P.jaw.h[0])*.4,1.1,P.jaw.pts[1][2]*.6],col3("#7a1a14"),null,10);
  if(P.teeth){const T=P.teeth,n=Math.max(3,Math.round((T.x1-T.x0)/T.ts));
    for(let k=0;k<n;k++){const t=k/(n-1),x=lerp(T.x0,T.x1,t),z=lerp(T.z0,T.z1,t),ln=T.len*(.75+.35*Math.sin(t*Math.PI));
      for(const s of[1,-1]){m.cone("bone","head",[x,T.y+.8,s*z],[x+.35,T.y-ln,s*z*.96],T.len*.26,m.boneCol,5);
        if(k<n-1)m.cone("bone","jaw",[x+T.ts*.45,T.y-1,s*z*.86],[x+T.ts*.45+.3,T.y+ln*.75,s*z*.84],T.len*.22,m.boneCol,5)}}}
  // nostrils
  for(const s of[1,-1])m.ell("dark","head",[s1[0]-s1[2]*1.6,s1[1]+s1[3]*.4,s*s1[2]*.7],[.8,.45,.5],col3("#120a06"),null,6);
  m.eye(P.eye);
}
function biped(sp,P){
  const m=new MB(sp),b=P.body.map(p=>[p[0],p[1],0,p[2],p[3]]),last=b.length-1,Lg=P.leg;
  m.bone("root",null,0,0,0);m.bone("body","root",Lg.hip[0],Lg.hip[1]);
  m.bone("tail0","body",b[P.tail[0]][0],b[P.tail[0]][1]);m.bone("tail1","tail0",b[P.tail[1]][0],b[P.tail[1]][1]);m.bone("tail2","tail1",b[P.tail[2]][0],b[P.tail[2]][1]);
  m.bone("neck0","body",b[P.neck[0]][0],b[P.neck[0]][1]);m.bone("neck1","neck0",b[P.neck[1]][0],b[P.neck[1]][1]);
  m.bone("head","neck1",b[last][0],b[last][1]);m.bone("jaw","head",P.jaw.h[0],P.jaw.h[1]);
  for(const s of[1,-1]){const nm=s>0?"L":"R",z=Lg.hip[2]*s;
    m.bone("thigh"+nm,"body",Lg.hip[0],Lg.hip[1],z);m.bone("shin"+nm,"thigh"+nm,Lg.knee[0],Lg.knee[1],z);m.bone("foot"+nm,"shin"+nm,Lg.ankle[0],Lg.ankle[1],z);
    if(P.arm){const A=P.arm;m.bone("arm"+nm,"neck0",A.sh[0],A.sh[1],A.sh[2]*s)}}
  m.body(b,[[P.tail[2],"tail2","tail1"],[P.tail[1],"tail1","tail0"],[P.tail[0],"tail0","body"],[P.neck[0],"body","neck0"],[P.neck[1],"neck0","neck1"],[last,"neck1","head"]],P.stripe);
  headParts(m,P);
  for(const s of[1,-1]){const nm=s>0?"L":"R",z=Lg.hip[2]*s,[r0,r1,r2,r3]=Lg.r,h=Lg.hip,k=Lg.knee,a=Lg.ankle,f=Lg.ball;
    const pts=[[h[0]-r0*.2,h[1]+r0*.55,z*.75,r0*.75,r0*.85],[h[0]+r0*.1,h[1]-r0*.1,z,r0*1.0,r0*1.15],[lerp(h[0],k[0],.55)+r0*.2,lerp(h[1],k[1],.55),z,r0*.85,r0*.95],[k[0],k[1],z,r1,r1*1.05],
      [lerp(k[0],a[0],.5),lerp(k[1],a[1],.5),z,r1*.72,r1*.8],[a[0],a[1],z,r2,r2],[f[0],f[1]+r3*.5,z,r3,r3*.8]];
    m.loft("skin",pts,{chain:[[3,"thigh"+nm,"shin"+nm],[5,"shin"+nm,"foot"+nm]],blend:2.5,rs:12});
    const toe=Lg.toe||r3*3;
    for(const t of[-1,0,1]){const tz=z+t*r3*.8,tip=[f[0]+toe*(t?0.8:1),.4,z+t*r3*1.9];
      m.cone("skin","foot"+nm,[f[0]-r3*.3,f[1]+r3*.35,tz],tip,r3*.5,m.c.mid,6);
      m.cone("bone","foot"+nm,[tip[0]-r3*.4,tip[1]+.3,tip[2]],[tip[0]+r3*.7,0,tip[2]],r3*.3,Lg.claw?m.boneCol:col3("#3a3226"),5)}
    if(Lg.sickle)m.cone("bone","foot"+nm,[f[0]+r3*.3,f[1]+r3*.9,z+s*r3*.2],[f[0]+r3*2.2,f[1]+r3*3.2,z+s*r3*.3],r3*.45,m.boneCol,6);
    if(P.arm){const A=P.arm,sz=A.sh[2]*s,ez=sz*1.05,hz=sz*1.1;
      m.loft("skin",[[A.sh[0]-1,A.sh[1]+1,sz*.6,A.r[0]*1.1,A.r[0]*1.1],[A.sh[0],A.sh[1],sz,A.r[0],A.r[0]],[A.el[0],A.el[1],ez,A.r[0]*.8,A.r[0]*.8],[A.hand[0],A.hand[1],hz,A.r[1],A.r[1]]],{bone:"arm"+nm,rs:10});
      const nC=A.claws||2,cl=A.cl||A.r[1]*2.2;for(let i=0;i<nC;i++){const cz=hz+(i-(nC-1)/2)*A.r[1]*.9;
        if(A.big)m.loft("bone",[[A.hand[0],A.hand[1],cz,A.r[1]*.42,A.r[1]*.5],[A.hand[0]+cl*.45,A.hand[1]-cl*.25,cz,A.r[1]*.32,A.r[1]*.38],[A.hand[0]+cl*.55,A.hand[1]-cl*.75,cz,A.r[1]*.2,A.r[1]*.24],[A.hand[0]+cl*.35,A.hand[1]-cl,cz,.1,.1]],{bone:"arm"+nm,rs:6,sub:2,color:()=>col3(SP[sp].col.claw||"#e8dcc2")});
        else m.cone("bone","arm"+nm,[A.hand[0],A.hand[1],cz],[A.hand[0]+cl*.6,A.hand[1]-cl*.8,cz],A.r[1]*.32,m.boneCol,5)}}}
  if(P.extra)P.extra(m);
  return m.done("biped",{open:P.open||.55,hipY:Lg.hip[1]});
}
function quad(sp,P){
  const m=new MB(sp),b=P.body.map(p=>[p[0],p[1],0,p[2],p[3]]),last=b.length-1,Bk_=P.back,F=P.front;
  m.bone("root",null,0,0,0);m.bone("body","root",Bk_.hip[0],Bk_.hip[1]);
  m.bone("tail0","body",b[P.tail[0]][0],b[P.tail[0]][1]);m.bone("tail1","tail0",b[P.tail[1]][0],b[P.tail[1]][1]);m.bone("tail2","tail1",b[P.tail[2]][0],b[P.tail[2]][1]);
  m.bone("neck0","body",b[P.neck[0]][0],b[P.neck[0]][1]);m.bone("neck1","neck0",b[P.neck[1]][0],b[P.neck[1]][1]);
  m.bone("head","neck1",b[last][0],b[last][1]);m.bone("jaw","head",P.jaw.h[0],P.jaw.h[1]);
  for(const s of[1,-1]){const nm=s>0?"L":"R";
    m.bone("thigh"+nm,"body",Bk_.hip[0],Bk_.hip[1],Bk_.hip[2]*s);m.bone("shin"+nm,"thigh"+nm,Bk_.knee[0],Bk_.knee[1],Bk_.hip[2]*s);
    m.bone("fthigh"+nm,"body",F.hip[0],F.hip[1],F.hip[2]*s);m.bone("fshin"+nm,"fthigh"+nm,F.knee[0],F.knee[1],F.hip[2]*s)}
  m.body(b,[[P.tail[2],"tail2","tail1"],[P.tail[1],"tail1","tail0"],[P.tail[0],"tail0","body"],[P.neck[0],"body","neck0"],[P.neck[1],"neck0","neck1"],[last,"neck1","head"]],P.stripe);
  headParts(m,P);
  for(const s of[1,-1]){const nm=s>0?"L":"R";
    for(const [Lg,pre] of [[Bk_,""],[F,"f"]]){const z=Lg.hip[2]*s,[r0,r1,r2]=Lg.r,h=Lg.hip,k=Lg.knee,f=Lg.foot;
      const pts=[[h[0],h[1]+r0*.7,z*.7,r0*.8,r0*.9],[h[0],h[1],z,r0,r0*1.1],[lerp(h[0],k[0],.5),lerp(h[1],k[1],.5),z,r0*.85,r0*.9],[k[0],k[1],z,r1,r1],[lerp(k[0],f[0],.5),lerp(k[1],f[1],.5),z,r1*.85,r1*.85],[f[0],f[1]+r2*.6,z,r2,r2],[f[0]+.5,f[1]+.4,z,r2*1.08,r2*.9]];
      m.loft("skin",pts,{chain:[[3,pre+"thigh"+nm,pre+"shin"+nm]],blend:3,rs:12});
      for(let i=0;i<3;i++){const az=z+(i-1)*r2*.6;m.ell("bone",pre+"shin"+nm,[f[0]+r2*.85,r2*.28,az],[r2*.32,r2*.3,r2*.25],col3("#cdbf9e"),null,6)}}}
  if(P.extra)P.extra(m);
  return m.done("quad",{open:P.open||.3,hipY:Bk_.hip[1]});
}
const fsheet=(m,x0,x1,h,w,z,col0,col1,bone,lean=0)=>m.fin("acc",x0,x1,8,x=>[x,m.at(x).y+m.at(x).h*.7,z],x=>{const t=(x-x0)/(x1-x0),pk=Math.pow(Math.max(0,1-Math.abs(t*2-1)),.65);return[x+lean*pk,m.at(x).y+m.at(x).h*.7+h*pk,z]},v=>mixC(col0,col1,v),bone);

/* ----- extra species that only the 3D game has ----- */
Object.assign(SP,{
 giga:{name:"Giganoto\u00ADsaurus",meat:true,col:{dark:"#2f2a27",mid:"#5f544a",belly:"#ada08a",far:"#262220",stripe:"rgba(20,14,10,.5)",horn:"#3a2a1e"}},
 bary:{name:"Baryonyx",meat:true,col:{dark:"#2b3a32",mid:"#566b52",belly:"#bcb48e",far:"#232f28",stripe:"rgba(12,24,14,.5)",crest:"#7a4a2a",claw:"#e8dcc2"}},
 utah:{name:"Utahraptor",meat:true,col:{dark:"#2a2420",mid:"#62492f",belly:"#c0a378",far:"#201b18",stripe:"rgba(20,12,6,.6)",feather:"#1c1612"}},
 diplo:{name:"Diplodocus",meat:false,col:{dark:"#463e33",mid:"#7a6d57",belly:"#bcae8e",far:"#3a332a"}},
 styra:{name:"Styraco\u00ADsaurus",meat:false,col:{dark:"#3a3226",mid:"#6c5a40",belly:"#aa9a7c",far:"#2f281e",frill:"#7a3a24",frill2:"#d4904c",horn:"#ece2c8"}},
});
PLAYABLE.splice(PLAYABLE.indexOf("carno")+1,0,"giga","bary","utah");PLAYABLE.push("diplo","styra");
MEATS.push("giga","bary","utah");HERBS.push("diplo","styra","styra");

/* ----- the species ----- */
const SPEC={
 trex:()=>biped("trex",{stripe:true,open:.6,
  body:[[-70,54,.5,.5],[-56,54,3,3],[-40,54,6,6],[-25,52,10,9],[-12,50,14,13],[0,49,17,16.5],[12,49,15,15],[21,55,10.5,10.5],[28,60,8.5,9]],tail:[4,3,2],neck:[6,7],
  skull:[[24,63,7.5,8],[32,65,8.8,9],[42,64.5,8,8],[52,61.5,6.2,5.8],[59,59.5,4.4,4.2],[62.5,58.5,2,2]],jaw:{h:[29,56],pts:[[27,54.5,6.6,4],[38,52.2,6.2,3.5],[50,52.4,5,3],[58,54.2,3.6,2.2],[61,55.2,1.5,1]]},
  teeth:{x0:33,x1:59,y:56.5,z0:6.6,z1:3.2,len:4.2,ts:3.4},eye:[44,67,6.8,2.2],
  leg:{hip:[-2,44,10],knee:[8,27],ankle:[-3,12],ball:[3,1.5],r:[9.5,5.2,3.6,3],toe:8,claw:true},
  arm:{sh:[18,44,9],el:[22,37],hand:[26,37],r:[2.4,1.8],claws:2,cl:3}}),
 spino:()=>biped("spino",{stripe:true,open:.55,
  body:[[-78,50,.5,.5],[-64,50,3.5,4.5],[-48,49,6,7],[-31,47,9,9],[-15,47,12,11],[0,47,15,13],[12,49,13,12],[22,56,8,8],[31,62,6,6.5]],tail:[4,3,2],neck:[6,7],
  skull:[[28,63,5.5,6],[36,65,5,5.2],[48,63,3.6,3.6],[60,61.4,3,3],[67,61.4,3.4,2.7],[71,60.5,1.6,1.3]],jaw:{h:[32,59],pts:[[30,58.4,4.5,2.6],[44,57.2,3.2,2],[58,57.6,2.6,1.6],[67,58.2,2.6,1.5],[70,58.8,1,.8]]},
  teeth:{x0:38,x1:69,y:59.6,z0:3.4,z1:2.4,len:3.4,ts:3.2},eye:[39,66.5,4.4,2],
  leg:{hip:[-2,40,9],knee:[7,25],ankle:[-3,11],ball:[3,1.5],r:[8,4.6,3.2,2.7],toe:7,claw:true},
  arm:{sh:[16,44,8],el:[24,36],hand:[31,35],r:[3,2.1],claws:3,cl:4},
  extra:m=>{const c=m.cs,s0=col3(c.dark),s1=col3(c.sail),s2=col3(c.sail2);
   m.fin("acc",-30,26,18,x=>[x,m.at(x).y+m.at(x).h*.75,0],x=>{const t=(x+30)/56;return[x-4,m.at(x).y+m.at(x).h*.75+2+40*Math.pow(Math.sin(Math.PI*t),.85),0]},(v,k)=>{const c2=v<.5?mixC(s0,s1,v*2):mixC(s1,s2,(v-.5)*2);return k%2?c2.multiplyScalar(.72):c2})}}),
 raptor:()=>biped("raptor",{stripe:true,open:.65,
  body:[[-70,50,.4,.4],[-56,50,2,2.2],[-40,48,3.6,3.6],[-26,46,5.6,5.2],[-12,43,8,7.6],[0,40,10,10],[10,43,8,8],[18,52,4.6,5],[23,56,4,4.5]],tail:[4,3,2],neck:[6,7],
  skull:[[20,58,4,4.6],[27,60,4.3,4.6],[36,58,3,3.1],[43,56,1.8,1.7],[45.5,55.4,.8,.8]],jaw:{h:[23,55.4],pts:[[22,55,3.4,2],[32,53.6,2.8,1.6],[42,54.6,1.6,1],[44.5,55,.6,.5]]},
  teeth:{x0:28,x1:43,y:55.6,z0:2.7,z1:1.4,len:2.6,ts:2.6},eye:[30,60.4,3.4,1.8],
  leg:{hip:[0,36,7],knee:[7,23],ankle:[-2,10],ball:[3,1],r:[6,3.4,2.1,1.7],toe:5,claw:true,sickle:true},
  arm:{sh:[12,41,6],el:[19,35],hand:[26,35],r:[2.2,1.6],claws:3,cl:3.5},
  extra:m=>{const f=col3(SP.raptor.col.feather);for(let x=-66;x<20;x+=3.2){const a=m.at(x);m.cone("skin",m.boneX(x),[x,a.y+a.h*.75,0],[x-4,a.y+a.h+3.2,0],1.1,f,4)}
   for(const s of[1,-1])for(let i=0;i<4;i++)m.cone("skin","arm"+(s>0?"L":"R"),[14+i*3,38-i,s*6.6],[11+i*3,32-i,s*7.4],.9,f,4)}}),
 allo:()=>biped("allo",{stripe:true,open:.58,
  body:[[-72,50,.5,.5],[-58,50,3,3.6],[-42,50,6,6],[-25,48,9,8.6],[-11,46,12,11],[0,45,14,13],[12,47,12,12],[20,54,8,8.6],[27,57,7,7.5]],tail:[4,3,2],neck:[6,7],
  skull:[[23,58.5,6,7],[31,61,6.6,7],[42,60.4,5.6,5.6],[52,57.2,4,4],[57,55.4,2,2]],jaw:{h:[26,53.6],pts:[[25,53,5,3],[36,50.6,4.5,3],[48,51.2,3.6,2.4],[55,53.2,2,1.4],[56.5,54,.8,.6]]},
  teeth:{x0:31,x1:55,y:54.4,z0:5,z1:2.4,len:3.6,ts:3.1},eye:[38,61.4,5.4,2],
  leg:{hip:[-2,40,9],knee:[8,25],ankle:[-3,11],ball:[3,1.5],r:[8.4,4.6,3.1,2.6],toe:7,claw:true},
  arm:{sh:[16,41,8],el:[24,33],hand:[31,33],r:[3,2.2],claws:3,cl:4.2},
  extra:m=>{for(const s of[1,-1])m.cone("bone","head",[37,65.5,s*4.4],[36,70.5,s*4.6],2.2,col3(SP.allo.col.horn),6)}}),
 dilo:()=>biped("dilo",{stripe:true,open:.62,
  body:[[-72,48,.4,.4],[-56,49,2.6,2.6],[-40,48,4.6,4.6],[-24,46,7,6.6],[-10,44,9,8.6],[0,43,11,11],[10,46,9,9],[18,56,5.6,6],[25,61,5,5]],tail:[4,3,2],neck:[6,7],
  skull:[[23,63,4.6,5],[31,65,4.8,5],[40,63,3.6,3.6],[48,61,2.2,2],[50.5,60.4,1,1]],jaw:{h:[27,60],pts:[[26,60,4,2.2],[36,58.6,3.4,2],[46,59.6,2,1.3],[49.5,60.1,.8,.6]]},
  teeth:{x0:31,x1:49,y:60.6,z0:3.4,z1:1.6,len:2.8,ts:2.8},eye:[33,65.4,4.1,1.8],
  leg:{hip:[0,38,7],knee:[7,24],ankle:[-2,10],ball:[3,1],r:[6.6,3.7,2.4,2],toe:5.5,claw:true},
  arm:{sh:[12,41,6],el:[20,33],hand:[26,35],r:[2.4,1.7],claws:3,cl:3},
  extra:m=>{const c0=col3(SP.dilo.col.crest),c1=col3(SP.dilo.col.crest2);
   for(const s of[1,-1])m.fin("acc",27,47,8,x=>[x,62+3.6*Math.cos((x-36)/12),s*1.4],x=>{const t=(x-27)/20;return[x-2,66+14*Math.pow(Math.sin(Math.PI*Math.pow(t,.8)),.8),s*1.9]},(v,k)=>k%2?mixC(c0,c1,v).multiplyScalar(.78):mixC(c0,c1,v),"head")}}),
 carno:()=>biped("carno",{stripe:false,open:.6,
  body:[[-72,50,.5,.5],[-58,50,3,3.6],[-42,50,6,6],[-25,48,9,8.6],[-11,46,12,11],[0,45,14,13],[12,47,12,12],[20,54,8,8.6],[26,57,7,7.5]],tail:[4,3,2],neck:[6,7],
  skull:[[22,59,6.2,7.6],[30,62,6.6,7.2],[40,60.4,5.6,5.6],[46.5,57.2,4,4],[49,55.2,2,2]],jaw:{h:[25,54],pts:[[24,54,5,3.2],[34,51.6,4.5,3],[44,52.6,3.4,2.2],[48,54,1.4,1]]},
  teeth:{x0:30,x1:47.5,y:55,z0:5,z1:2.8,len:3.2,ts:2.9},eye:[34,62.6,5.4,1.9],
  leg:{hip:[-2,40,9],knee:[8,25],ankle:[-3,11],ball:[3,1.5],r:[8.6,4.8,3.1,2.6],toe:7,claw:true},
  arm:{sh:[16,42,8],el:[19,38],hand:[21,38],r:[2.4,2],claws:2,cl:1.8},
  extra:m=>{const hc=col3(SP.carno.col.horn);for(const s of[1,-1]){m.cone("bone","head",[30,67,s*4],[24,76,s*7.5],2.4,hc,7)}
   const os=m.c.dark.clone().multiplyScalar(.7);for(let i=0;i<9;i++)for(const s of[1,-1]){const x=-26+i*6,a=m.at(x);m.ell("skin",m.boneX(x),[x,a.y+a.h*.55,s*a.w*.75],[1.6,1.2,1.2],os,null,6)}}}),
 tri:()=>quad("tri",{open:.3,
  body:[[-60,30,.5,.5],[-48,34,4,4],[-33,38,9,8.4],[-18,40,16,15],[-2,41,20,19],[14,40,17,16],[24,38,12,12],[30,38,10,10]],tail:[3,2,1],neck:[5,6],
  skull:[[26,40,9,10],[36,38,8.6,9],[46,33.5,6,7],[53,28,3.6,4],[56.5,25,1.5,1.5]],jaw:{h:[32,30],pts:[[31,30,6,3],[42,26,4.5,3],[50,24,2.6,1.7],[53.5,24,1,1]]},eye:[37,42,7.4,1.8],
  back:{hip:[-16,32,12],knee:[-14,16],foot:[-17,0],r:[11,7,6]},front:{hip:[20,30,11],knee:[22,14],foot:[21,0],r:[9,6.5,5.5]},
  extra:m=>{const c=SP.tri.col,f0=col3(c.frill2),f1=col3(c.frill),hc=col3(c.horn);
   m.ell("acc","head",[22,51,0],[2.6,22,22],null,[0,0,.4],24,(x,y,z)=>{const r=Math.hypot(y,z);return mixC(f0,f1,r*1.1).multiplyScalar(x>0?1:.75)});
   for(let i=0;i<13;i++){const a=-1.35+i*(2.7/12),y=Math.cos(a)*21.5,z=Math.sin(a)*21.5;const px=22-Math.sin(.4)*y,py=51+Math.cos(.4)*y;m.cone("bone","head",[px+.5,py,z],[px-Math.sin(.4)*3.5,py+Math.cos(.4)*3.5,z*1.12],1.5,col3("#e7dcc0"),5)}
   for(const s of[1,-1])m.cone("bone","head",[36,46,s*5],[62,64,s*9],2.5,hc,8);
   m.cone("bone","head",[49,37,0],[52,46,0],1.7,hc,7);m.cone("bone","head",[53.5,30,0],[58,24,0],2.2,col3("#2b261d"),6)}}),
 anky:()=>quad("anky",{open:.3,
  body:[[-56,26,.5,.5],[-46,28,3.5,3],[-34,30,7,6],[-21,30,18,13],[-2,31,25,15],[18,30,20,13],[28,30,12,10],[32,30,10,8]],tail:[3,2,1],neck:[5,6],
  skull:[[30,30,10,8],[38,29,9.6,7],[44,27,7,5],[47.5,25,4,3]],jaw:{h:[34,24],pts:[[33,24,7,2.5],[44,22,4,2],[46.5,22.5,2,1]]},eye:[37,31.5,8.6,1.6],
  back:{hip:[-16,22,14],knee:[-14,11],foot:[-16,0],r:[8,6,5]},front:{hip:[18,22,13],knee:[20,11],foot:[20,0],r:[7,5.5,4.5]},
  extra:m=>{const c=SP.anky.col,ar=col3(c.armor),ah=col3(c.armorHi),hc=col3(c.horn);
   m.ell("acc","tail2",[-60,26,0],[9,6,9.5],null,null,14,(x,y,z)=>mixC(ar,ah,y*.6+.4));
   for(const s of[1,-1])m.ell("acc","tail2",[-60,26,s*7],[4,3.6,4],ar,null,8);
   for(let x=-30;x<=28;x+=6.2){const a=m.at(x),bn=m.boneX(x);for(const an of[0,.55,-.55,1.05,-1.05,1.45,-1.45]){const y=a.y+a.h*Math.cos(an),z=a.w*Math.sin(an),ny=Math.cos(an),nz=Math.sin(an),sz=Math.abs(an)>1.4?3.6:2.4;
     if(Math.abs(an)>1.4)m.cone("bone",bn,[x,y,z],[x-1,y+ny*5.5-1,z+nz*5.5],2,hc,6);else m.cone("acc",bn,[x,y-ny*.5,z-nz*.5],[x,y+ny*sz,z+nz*sz],2.6,mixC(ar,ah,.3+.3*Math.random()),6)}}
   for(const s of[1,-1]){m.cone("bone","head",[30,35,s*8],[23,40,s*12],2.2,hc,6);m.cone("bone","head",[38,32,s*9],[37,30,s*14],1.8,hc,6)}}}),
 stego:()=>quad("stego",{open:.3,
  body:[[-68,30,.5,.5],[-55,34,3,3],[-41,40,7,6],[-24,46,14,14],[-6,46,16,18],[12,40,13,13],[22,32,7,7],[30,27,5,5]],tail:[3,2,1],neck:[5,6],
  skull:[[28,28,4.6,4.6],[36,25,4,4],[44,23,2.5,2.6],[47.5,22,1,1]],jaw:{h:[31,23],pts:[[30,23,3.5,1.6],[42,21,2.2,1.2],[45.5,21.5,.8,.6]]},eye:[37,26.4,3.8,1.3],
  back:{hip:[-16,36,11],knee:[-12,18],foot:[-15,0],r:[11,7,5.5]},front:{hip:[18,26,10],knee:[20,12],foot:[20,0],r:[7,5,4.5]},
  extra:m=>{const c=SP.stego.col,p0=col3(c.plate),p1=col3(c.plate2),hc=col3(c.horn);
   for(let i=0;i<10;i++){const xc=-48+i*7,z=i%2?1.6:-1.6,h=7+16*Math.sin(Math.PI*(i+.6)/10.6),w=3.8+1.6*Math.sin(Math.PI*(i+.5)/10);fsheet(m,xc-w,xc+w,h,w,z,p0,p1,null,-1.5)}
   for(const s of[1,-1]){m.cone("bone","tail2",[-58,33,s*1.5],[-68,43,s*9],1.6,hc,6);m.cone("bone","tail2",[-63,32,s*1.4],[-72,38,s*10],1.5,hc,6)}}}),
 brachio:()=>quad("brachio",{open:.25,
  body:[[-66,44,.5,.5],[-53,48,3,3],[-39,54,7,7],[-22,58,15,14],[-6,62,17,17],[8,70,12,12],[16,84,7.5,7.5],[23,104,5.6,5.6],[29,122,4.6,4.6],[32,128,4,4]],tail:[3,2,1],neck:[5,7],
  skull:[[30,129,4.4,4.6],[36,131,5,5],[42,129,3.6,3.4],[45.5,127,2,2]],jaw:{h:[36,126],pts:[[35,126,3.4,1.5],[44,125.6,1.8,1]]},eye:[35.5,131.4,4.5,1.3],
  back:{hip:[-18,48,12],knee:[-16,24],foot:[-18,0],r:[12,8,6.6]},front:{hip:[16,58,11],knee:[18,30],foot:[18,0],r:[11,7.6,6.6]},
  extra:m=>{m.ell("skin","head",[33,134.5,0],[4.6,3.2,3.6],m.c.mid,null,10)}}),
 para:()=>biped("para",{stripe:false,open:.35,
  body:[[-70,46,.4,.4],[-55,48,3,3],[-39,47,6,6],[-22,46,10,10],[-8,45,13,13],[4,45,14,13],[14,50,9,9],[20,60,6,6],[24,66,5,5]],tail:[4,3,2],neck:[6,7],
  skull:[[22,67,4.6,5],[30,68,5,5],[38,64,4.4,3.6],[44,59.4,4,2.2],[45.6,58.4,2.4,1]],jaw:{h:[26,61],pts:[[25,61,4,2],[36,58,3.2,1.6],[42,57,2.8,1],[43.6,57,1.2,.5]]},eye:[27,66.4,4.5,1.6],
  leg:{hip:[-4,38,9],knee:[5,24],ankle:[-4,10],ball:[2,1],r:[9,5,3.3,2.8],toe:6,claw:false},
  arm:{sh:[14,43,7],el:[20,31],hand:[22,16],r:[3,2.4],claws:3,cl:2},
  extra:m=>{const c0=col3(SP.para.col.crest),c1=col3(SP.para.col.crest2);m.loft("acc",[[27,69,0,1.8,2.4],[20,74,0,2.6,3],[10,79,0,2.6,2.8],[0,83,0,2.2,2.2],[-4,84,0,.8,.8]],{bone:"head",rs:10,color:(oy,p)=>mixC(c0,c1,(27-p[0])/30)})}}),
 pachy:()=>biped("pachy",{stripe:false,open:.35,
  body:[[-64,44,.4,.4],[-51,46,3,3],[-37,46,5.6,5.6],[-22,44,8.6,8.6],[-8,43,11,11],[2,42,12,12.6],[12,46,8.6,8.6],[18,54,6,6],[22,56,5.6,5.6]],tail:[4,3,2],neck:[6,7],
  skull:[[20,54,5,5],[28,54,6,5.6],[36,52,4.6,4],[41,49,2.6,2.4],[43.4,48,1,1]],jaw:{h:[24,49],pts:[[23,49,4,2],[34,47,3,1.6],[40,47,1.6,1]]},eye:[32,55.6,5.2,1.6],
  leg:{hip:[-4,36,8],knee:[5,23],ankle:[-4,10],ball:[2,1],r:[8,4.6,3,2.5],toe:5,claw:false},
  arm:{sh:[12,41,6],el:[18,33],hand:[22,33],r:[2.4,1.8],claws:3,cl:1.6},
  extra:m=>{const c=SP.pachy.col,d0=col3(c.dome),d1=col3(c.dome2),hc=col3(c.horn);
   m.ell("acc","head",[28,57.5,0],[10,8.4,7.4],null,null,18,(x,y,z)=>mixC(d1,d0,y*.8+.3));
   for(let i=0;i<7;i++){const an=Math.PI*.95+i*.18;for(const s of[1,-1])m.cone("bone","head",[28+Math.cos(an)*9,56+Math.sin(an)*-6,s*5.5],[28+Math.cos(an)*12,56+Math.sin(an)*-6+1.5,s*7.4],1.1,hc,5)}
   for(const s of[1,-1])for(const [x,y] of [[38,52],[41,50]])m.cone("bone","head",[x,y,s*3.6],[x+.6,y+2.2,s*4.6],.9,hc,5)}}),
 igu:()=>biped("igu",{stripe:false,open:.35,
  body:[[-70,38,.4,.4],[-55,42,3,3],[-39,46,7,7],[-22,47,11,11],[-6,45,14,14],[8,43,13,13],[18,46,9,9],[26,50,7,7],[30,52,6,6]],tail:[4,3,2],neck:[6,7],
  skull:[[28,52,5.6,6],[36,53,5.6,5.6],[44,50,4,3.8],[50,47,3,2.4],[52.4,46,1.4,1]],jaw:{h:[31,46],pts:[[30,46,4.6,2],[42,44,3.4,1.6],[49,44.6,1.6,1]]},eye:[36,54.4,5.3,1.7],
  leg:{hip:[-6,36,10],knee:[4,22],ankle:[-6,10],ball:[1,1],r:[10,6,3.8,3.2],toe:6.5,claw:false},
  arm:{sh:[20,38,9],el:[25,20],hand:[28,3],r:[4.4,3.4],claws:3,cl:2},
  extra:m=>{for(const s of[1,-1])m.cone("bone","arm"+(s>0?"L":"R"),[27,9,s*10.6],[33,18,s*11.2],1.3,m.hornCol,6)}}),
 theri:()=>biped("theri",{stripe:false,open:.3,
  body:[[-48,40,.4,.4],[-37,42,3,3],[-25,40,7,7],[-12,42,14,14],[-2,46,17,18],[6,56,12,12],[12,72,7,7],[18,86,5,5],[24,92,4,4]],tail:[3,2,1],neck:[5,7],
  skull:[[22,93,3.8,4],[29,95,3.6,3.6],[35,92,2.4,2.2],[37.6,91,1,1]],jaw:{h:[25,89.6],pts:[[24,89.6,3,1.5],[34,90.2,1.6,.8]]},eye:[27,94.6,3.4,1.3],
  leg:{hip:[0,36,10],knee:[8,22],ankle:[-2,10],ball:[3,1],r:[10,5.6,3.4,3],toe:6,claw:false},
  arm:{sh:[8,58,10],el:[14,50],hand:[22,38],r:[4.6,3.6],claws:3,cl:18,big:true},
  extra:m=>{const f=col3(SP.theri.col.feather);for(let x=-44;x<12;x+=3.4){const a=m.at(x);for(const an of[0,.6,-.6,1.1,-1.1])m.cone("skin",m.boneX(x),[x,a.y+a.h*Math.cos(an)*.85,a.w*Math.sin(an)*.85],[x-4.5,a.y+a.h*Math.cos(an)+2,a.w*Math.sin(an)*1.15],1.5,f,4)}}}),
 galli:()=>biped("galli",{stripe:true,open:.3,
  body:[[-60,52,.4,.4],[-47,53,2.6,2.6],[-31,51,4.6,4.6],[-16,49,7,7],[-4,48,9.6,9.6],[6,49,8,8],[14,60,4,4],[20,76,3,3],[24,84,2.6,2.6]],tail:[4,3,2],neck:[6,7],
  skull:[[22,85,3,3.2],[28,86,3,3],[34,84,2,1.6],[39.4,82,1,.8]],jaw:{h:[25,82.6],pts:[[24,82.6,2.4,1.2],[37.6,81.8,1,.5]]},eye:[26,86.4,2.7,1.3],
  leg:{hip:[-2,44,6],knee:[6,30],ankle:[-3,14],ball:[3,1],r:[6.6,3.2,1.9,1.6],toe:5,claw:false},
  arm:{sh:[10,46,5],el:[15,40],hand:[19,40],r:[1.8,1.3],claws:3,cl:2.4},
  extra:m=>{const f=col3(SP.galli.col.feather);for(let x=-56;x<10;x+=3.6){const a=m.at(x);m.cone("skin",m.boneX(x),[x,a.y+a.h*.7,0],[x-4,a.y+a.h+2.4,0],1,f,4)}}}),
 giga:()=>biped("giga",{stripe:true,open:.62,
  body:[[-74,54,.5,.5],[-60,54,3,3],[-44,54,6,6],[-28,52,10,9],[-13,50,14,13],[0,49,16.5,16],[12,49,14.5,14.5],[21,55,10,10],[28,60,8,8.6]],tail:[4,3,2],neck:[6,7],
  skull:[[24,62,6.6,7.6],[34,64.5,7.6,8],[46,63.6,6.6,6.6],[56,60.6,5,4.6],[64,58.4,3.4,3.2],[67.5,57.6,1.6,1.6]],jaw:{h:[28,55.4],pts:[[27,54.6,5.8,3.6],[40,52.2,5.2,3.2],[54,52.8,4,2.4],[63,54.8,2.6,1.6],[66.5,55.6,1.2,.8]]},
  teeth:{x0:33,x1:64,y:56.4,z0:5.8,z1:2.6,len:4.4,ts:3.2},eye:[42,66.6,6.2,2],
  leg:{hip:[-2,44,10],knee:[8,27],ankle:[-3,12],ball:[3,1.5],r:[9.4,5.2,3.5,3],toe:8,claw:true},
  arm:{sh:[18,44,9],el:[24,36],hand:[30,35],r:[2.8,2],claws:3,cl:3.8},
  extra:m=>{const d=m.c.dark.clone().multiplyScalar(.8);for(let i=0;i<7;i++)for(const s of[1,-1])m.ell("skin","head",[30+i*4.4,70.6-i*.8-Math.max(0,i-3)*.9,s*4.4],[1.8,1.1,1.3],d,null,6);
   for(let x=-60;x<20;x+=4){const a=m.at(x);m.cone("skin",m.boneX(x),[x,a.y+a.h*.8,0],[x-1,a.y+a.h+2.2,0],1.6,d,5)}}}),
 bary:()=>biped("bary",{stripe:true,open:.55,
  body:[[-74,48,.5,.5],[-60,48,3,3.6],[-44,47,6,6.4],[-28,46,9,8.6],[-13,45,12,11],[0,45,14,12.6],[12,47,12,11.6],[22,54,7.6,7.6],[30,59,6,6.4]],tail:[4,3,2],neck:[6,7],
  skull:[[27,60,5.4,6],[35,62,4.8,5],[46,60.6,3.4,3.4],[56,59,2.8,2.8],[63,58.4,3,2.4],[66.5,57.6,1.4,1.2]],jaw:{h:[31,56],pts:[[29,55.6,4.4,2.4],[42,54.4,3,1.8],[55,54.8,2.4,1.5],[63,55.6,2.4,1.4],[66,56.2,1,.7]]},
  teeth:{x0:37,x1:64.5,y:57,z0:3.2,z1:2.2,len:3,ts:2.6},eye:[37,63.4,4.4,1.9],
  leg:{hip:[-2,40,9],knee:[7,25],ankle:[-3,11],ball:[3,1.5],r:[8,4.6,3.1,2.7],toe:7,claw:true},
  arm:{sh:[16,43,8],el:[23,34],hand:[29,32],r:[3.4,2.6],claws:2,cl:3},
  extra:m=>{m.ell("acc","head",[41,64.6,0],[5,2.2,1.1],col3(SP.bary.col.crest),null,10);
   for(const s of[1,-1])m.loft("bone",[[29,32,s*9,1.3,1.5],[34,31,s*9.6,1,1.1],[37,26,s*9.8,.6,.7],[35,22,s*9.8,.1,.1]],{bone:"arm"+(s>0?"L":"R"),rs:6,sub:2,color:()=>col3(SP.bary.col.claw)})}}),
 utah:()=>biped("utah",{stripe:true,open:.65,
  body:[[-70,50,.4,.4],[-56,50,2.4,2.6],[-40,48,4.4,4.4],[-26,46,7,6.4],[-12,43,10,9.4],[0,41,12.4,12],[10,44,10,10],[18,53,6,6.4],[23,57,5.2,5.6]],tail:[4,3,2],neck:[6,7],
  skull:[[20,59,5,5.6],[28,61,5.2,5.6],[37,59,3.8,3.8],[44,56.6,2.4,2.2],[47,56,1,1]],jaw:{h:[24,55.6],pts:[[23,55.4,4.2,2.4],[33,53.6,3.4,2],[43,54.8,2,1.2],[46,55.4,.8,.6]]},
  teeth:{x0:29,x1:45,y:56,z0:3.4,z1:1.6,len:3,ts:2.6},eye:[30,61.6,4.2,2],
  leg:{hip:[0,37,8],knee:[7,23],ankle:[-2,10],ball:[3,1],r:[7.4,4.2,2.6,2.2],toe:6,claw:true,sickle:true},
  arm:{sh:[12,42,7],el:[20,35],hand:[27,35],r:[2.8,2],claws:3,cl:4},
  extra:m=>{const f=col3(SP.utah.col.feather),f2=col3("#7a2c18");for(let x=-66;x<22;x+=2.8){const a=m.at(x);for(const an of[0,.5,-.5])m.cone("skin",m.boneX(x),[x,a.y+a.h*Math.cos(an)*.8,a.w*Math.sin(an)*.8],[x-4.6,a.y+a.h*Math.cos(an)+3,a.w*Math.sin(an)*1.2],1.2,x>8?f2:f,4)}
   for(const s of[1,-1])for(let i=0;i<6;i++)m.cone("skin","arm"+(s>0?"L":"R"),[13+i*2.6,40-i*.9,s*7.6],[10+i*2.6,31-i,s*8.6],1,f,4)}}),
 diplo:()=>quad("diplo",{open:.25,
  body:[[-84,38,.4,.4],[-70,42,2,2],[-54,48,5,5],[-34,55,11,11],[-15,59,16,16],[2,57,15,15],[14,56,10,10],[26,62,6.6,6.6],[38,70,5,5],[48,76,4,4],[54,78,3.6,3.6]],tail:[3,2,1],neck:[6,8],
  skull:[[52,78.4,3.2,3.4],[58,78.6,3.6,3.2],[64,77,2.6,2.2],[67.6,76,1.4,1.2]],jaw:{h:[56,75.6],pts:[[55,75.6,2.8,1.2],[65,75,1.4,.8]]},eye:[57,79.6,3.4,1],
  back:{hip:[-16,54,12],knee:[-14,27],foot:[-16,0],r:[12,8,6.4]},front:{hip:[10,49,10],knee:[12,25],foot:[12,0],r:[9,7,6]},
  extra:m=>{const d=m.c.dark;for(let x=-60;x<48;x+=3.4){const a=m.at(x);m.cone("skin",m.boneX(x),[x,a.y+a.h*.85,0],[x,a.y+a.h+1.8,0],1.4,d,4)}}}),
 styra:()=>quad("styra",{open:.3,
  body:[[-58,30,.5,.5],[-46,34,4,4],[-32,38,8.6,8],[-18,40,15,14],[-2,41,19,18],[14,40,16,15],[24,38,11.6,11.6],[30,38,9.6,9.6]],tail:[3,2,1],neck:[5,6],
  skull:[[26,40,8.6,9.6],[36,38,8.2,8.6],[46,33.5,5.8,6.6],[53,28,3.4,3.8],[56.5,25,1.4,1.4]],jaw:{h:[32,30],pts:[[31,30,5.8,3],[42,26,4.4,3],[50,24,2.6,1.7],[53.5,24,1,1]]},eye:[37,42,7,1.8],
  back:{hip:[-16,32,12],knee:[-14,16],foot:[-17,0],r:[10.6,7,6]},front:{hip:[20,30,11],knee:[22,14],foot:[21,0],r:[8.6,6.4,5.4]},
  extra:m=>{const c=SP.styra.col,f0=col3(c.frill2),f1=col3(c.frill),hc=col3(c.horn);
   m.ell("acc","head",[24,47,0],[2.2,15,17],null,[0,0,.45],22,(x,y,z)=>mixC(f0,f1,Math.hypot(y,z)*1.1).multiplyScalar(x>0?1:.75));
   for(let i=0;i<7;i++){const a=-1.15+i*(2.3/6),y=Math.cos(a)*14.4,z=Math.sin(a)*16.4,px=24-Math.sin(.45)*y,py=47+Math.cos(.45)*y,ln=i===0||i===6?13:20;
     m.cone("bone","head",[px+.4,py,z],[px-Math.sin(.45)*ln*.9-2,py+Math.cos(.45)*ln,z*1.25],1.9,hc,7)}
   m.cone("bone","head",[48,36,0],[54,60,0],2.8,hc,8);for(const s of[1,-1])m.cone("bone","head",[37,46,s*5],[38,49,s*6],1.4,hc,6);
   m.cone("bone","head",[53.5,30,0],[58,24,0],2.2,col3("#2b261d"),6)}}),
};
