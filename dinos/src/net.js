/* ========================= multiplayer ========================= */
// Everyone plays in one shared world on the Dino Attack server (dino-server/ in the repo: a Cloudflare Durable Object).
// Your iPad moves your own dinosaur. Each wild dinosaur, plant and fish is run by the nearest player's iPad (its "owner"),
// and everyone else sees a copy that glides smoothly to where the owner says it is. Attacking or eating something takes it over.
// ?solo plays offline, ?room=name plays in a private world, ?server=wss://... uses another server.
const NET_SERVER="wss://dino-attack-server.REPLACE_ME.workers.dev";
const net=(()=>{
  const Q=new URLSearchParams(location.search);
  const url=Q.get("server")||(NET_SERVER.includes("REPLACE_ME")?"":NET_SERVER);
  const room=(Q.get("room")||"world").toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,24)||"world";
  const off=Q.has("solo")||!url;
  let ws=null,pid=0,ready=false,tries=0,pT=0,eT=0,uiT=0,hadPid=false;
  const players=new Map();   // pid -> {pid,name,s,obj,kids:[],deadLife}
  const ents=new Map();      // id -> world object we got from the server
  const sent=new Set();      // ids of my own wild things the server knows
  const pv={dmg:0,t:0};      // hits other players landed on me
  let lb={n:0,top:[]},clockOff=0;
  const ST=["wander","hunt","wind","rest","flee","dead"];
  const r0=v=>Math.round(v),r2=v=>Math.round(v*100)/100;
  const myName=()=>{try{return localStorage.getItem("dinoName")||""}catch(e){return""}};

  /* ---------- connection ---------- */
  function connect(){
    if(off||ws)return;
    try{ws=new WebSocket(url.replace(/\/$/,"")+"/room/"+room)}catch(e){ws=null;return later()}
    ws.onopen=()=>{tries=0;ws.send(JSON.stringify({t:"hi",name:myName()||"Dino"}))};
    ws.onmessage=ev=>{let m;try{m=JSON.parse(ev.data)}catch(e){return}onMsg(m)};
    ws.onclose=()=>{ws=null;ready=false;later()};
    ws.onerror=()=>{try{ws&&ws.close()}catch(e){}};
  }
  function later(){if(off)return;tries++;if(pickLine&&tries>2)pickLine.textContent="Can't reach the world right now. You can still play alone.";setTimeout(connect,Math.min(10000,800*tries))}
  function send(o){if(ws&&ws.readyState===1)ws.send(JSON.stringify(o))}
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&!ws)connect()});

  /* ---------- turning my things into messages ---------- */
  function serD(e){return[e.id,"d",r0(e.x),r0(e.y),e.sp,e.size,r2(e.yaw),r0(e.vx),r0(e.vy),r2(e.mv),r2(e.jaw),ST.indexOf(e.state),r2(e.dying),r2(e.hurt),e.dmg,e.meal?1:0,
    r2(Math.max(0,e.angry)),r2(Math.max(0,e.scared)),r2(Math.max(0,e.stun)),r2(e.wind),r2(e.rest),r2(e.huntT),r2(e.huntCd),r2(e.head),r2(e.wt),e.graze?1:0,r0(e.kx),r0(e.ky)]}
  function serF(f){return[f.id,"f",r0(f.x),r0(f.y),f.size,r2(f.ang),r0(f.sp),r2(f.dead),r2(Math.max(0,f.jump)),f.v,r2(f.hurt),f.meal?1:0]}
  function serP(p){return[p.id,"p",r0(p.x),r0(p.y),p.size,p.v,p.f,r2(p.rot),r2(p.eaten),p.meal?1:0]}
  // what others can see change (timers left out, so a dino standing still costs nothing to send)
  const keyD=a=>a.slice(2,16).join(),keyF=a=>a.slice(2,12).join(),keyP=a=>a.slice(2).join();

  function sendMine(){
    const u=[],g=[],cur=new Set();
    const each=(arr,ser,key)=>{for(const o of arr){if(o.remote)continue;cur.add(o.id);const a=ser(o),k=key(a);if(k!==o._ns){o._ns=k;u.push(a)}}};
    each(world.dinos,serD,keyD);each(world.fish,serF,keyF);each(world.plants,serP,keyP);
    for(const id of sent)if(!cur.has(id)){g.push(id);sent.delete(id)}
    for(const id of cur)sent.add(id);
    if(u.length||g.length)send({t:"e",u,g});
  }
  function sendMe(){
    if(!me)return;
    const playing=game.state==="play"?1:game.state==="paused"||game.state==="dead"?2:0;
    const kids=[];for(const k of me.kids){if(k.born<.4)continue;kids.push(r0(k.x),r0(k.y),r2(k.yaw),r0(kidLen(k)))}
    const R=viewR()*2.3*1.15;
    send({t:"p",s:[r0(me.x),r0(me.y),r0(R),me.dead?2:playing,r2(me.yaw),me.sp,me.size,r2(me.mv),r2(me.jaw),r2(me.atk),me.dead?1:0,r2(me.hurt),game.run||0,r0(me.vx),r0(me.vy),kids]});
  }

  /* ---------- turning messages into world objects ---------- */
  const arrOf=k=>k==="d"?"dinos":k==="f"?"fish":"plants";
  function applyD(o,a,fresh){
    o.sp=a[4];o.size=a[5];o._yaw=a[6];o.vx=a[7];o.vy=a[8];o.mv=a[9];o.jaw=a[10];o.state=ST[a[11]]||"wander";o.dying=a[12];o.hurt=a[13];o.dmg=a[14];o.meal=!!a[15];
    if(fresh){o.yaw=o._yaw;o.face=Math.cos(o.yaw)>=0?1:-1}
    if(a.length<17)return;
    o.angry=a[16];o.scared=a[17];o.stun=a[18];o.wind=a[19];o.rest=a[20];o.huntT=a[21];o.huntCd=a[22];o.head=a[23];o.wt=a[24];o.graze=!!a[25];o.kx=a[26];o.ky=a[27];
  }
  function applyF(o,a,fresh){o.size=a[4];o._ang=a[5];o.sp=a[6];o.dead=a[7];o.jump=a[8];o.v=a[9];o.hurt=a[10];o.meal=!!a[11];if(fresh){o.ang=o._ang;o.t=rnd(3)}}
  function applyP(o,a){o.size=a[4];o.v=a[5];o.f=a[6];o.rot=a[7];o.eaten=a[8];o.meal=!!a[9]}
  function gotEnt(a){
    const [id,owner,k,x,y]=a,arr=arrOf(k);let o=ents.get(id);
    if(!o&&owner!==pid){o=world[arr].find(q=>q.id===id&&!q.remote);if(o){ents.set(id,o);o._tx=o.x;o._ty=o.y;o._age=0}} // one of mine that someone took
    const data=[id,k,x,y,...a.slice(5)];
    if(o&&!world[arr].includes(o)){return}            // already gone here (eaten, rotted away): ignore late news
    if(!o){
      if(owner===pid)return;                          // our own echo
      o={id,x,y,_tx:x,_ty:y,_age:0,vx:0,vy:0,ph:rnd(TAU),remote:true,face:1,angry:0,scared:0,stun:0,wind:0,rest:0,huntT:0,huntCd:2,head:0,wt:0,graze:false,kx:0,ky:0};
      if(k==="d")applyD(o,data,true);else if(k==="f")applyF(o,data,true);else applyP(o,data);
      ents.set(id,o);world[arr].push(o);return;
    }
    if(owner===pid){
      if(!o.remote)return;                            // we own it already (we claimed it): our copy is newer
      // the server handed it to us because we are nearest: run it from now on
      if(k==="d")applyD(o,data);else if(k==="f")applyF(o,data);else applyP(o,data);
      o.remote=false;o._ns=undefined;o.yaw=o._yaw??o.yaw;if(o._ang!==undefined)o.ang=o._ang;
      if(o.meal){o.meal=false;if(k==="d"&&!o.dying)o.dying=.6;if(k==="f")o.dead=.5;if(k==="p")o.eaten=.6}
      return;
    }
    if(!o.remote){                                    // someone else took it (they attacked it, or are nearer)
      o.remote=true;sent.delete(id);
      if(world.meals.includes(o))world.meals=world.meals.filter(m=>m!==o);
      for(const kd of me?me.kids:[])if(kd.meal===o)kd.meal=null;
    }
    o._tx=x;o._ty=y;o._age=0;
    if(k==="d")applyD(o,data);else if(k==="f")applyF(o,data);else{applyP(o,data);o.x=x;o.y=y}
  }
  function goneEnt(id){const o=ents.get(id);ents.delete(id);if(!o||!o.remote)return;
    for(const k of["dinos","fish","plants"])if(world[k].includes(o))world[k]=world[k].filter(q=>q!==o)}

  function gotPlayer(a){
    const [qid,name,x,y,R,playing,yaw,sp,size,mv,jaw,atk,dead,hurt,life,vx,vy,kids]=a;
    let P=players.get(qid);if(!P){P={pid:qid,name:"Dino",kids:[]};players.set(qid,P)}
    if(name)P.name=name;P.s={x,y,R,playing,dead,life,sp,size};
    let o=P.obj;
    if(o&&(o.life!==life||o.sp!==sp||!world.dinos.includes(o))){if(world.dinos.includes(o)&&o.life!==life)world.dinos=world.dinos.filter(q=>q!==o);o=P.obj=null}
    if(!o){
      if(playing===0||dead||P.deadLife===life)return;
      o=P.obj={id:9e8+qid,player:qid,remote:true,name:P.name,life,sp,size,x,y,_tx:x,_ty:y,_age:0,yaw,_yaw:yaw,face:1,vx,vy,ph:rnd(TAU),mv,jaw,atk:0,
        state:"wander",dying:0,hurt:0,dmg:0,stun:0,angry:0,kx:0,ky:0,meal:false};
      world.dinos.push(o);
    }
    o.name=P.name;o.size=size;o._tx=x;o._ty=y;o._age=0;o._yaw=yaw;o.vx=vx;o.vy=vy;o.mv=mv;o.jaw=jaw;o.atk=atk;o.hurt=Math.max(o.hurt,hurt);
    if(dead&&o.state!=="dead"){o.state="dead";o.dying=1.4;P.deadLife=life}
    if(playing===0&&!dead){world.dinos=world.dinos.filter(q=>q!==o);P.obj=null}
    // babies following them
    const n=(kids||[]).length/4;P.kids.length=Math.min(P.kids.length,n);
    for(let i=0;i<n;i++){const kx=kids[i*4],ky=kids[i*4+1],kyaw=kids[i*4+2],kl=kids[i*4+3];let K=P.kids[i];
      if(!K)K=P.kids[i]={x:kx,y:ky,yaw:kyaw,ph:0,mv:0};K._tx=kx;K._ty=ky;K._yaw=kyaw;K.L=kl}
  }
  function gonePlayer(qid){const P=players.get(qid);if(!P)return;players.delete(qid);
    if(P.obj&&world.dinos.includes(P.obj))world.dinos=world.dinos.filter(q=>q!==P.obj);for(const K of P.kids)if(K._i)relInst(K._i)}

  function onMsg(m){
    if(m.t==="welcome"){
      if(m.pid===pid)return;
      if(m.now)clockOff=m.now-Date.now();
      pid=m.pid;ready=true;
      // start fresh with the server: drop copies from before, renumber my own things into my id range
      for(const id of [...ents.keys()])goneEnt(id);ents.clear();
      for(const q of [...players.keys()])gonePlayer(q);
      if(hadPid)for(const k of["dinos","fish","plants"])world[k]=world[k].filter(o=>!sent.has(o.id));
      sent.clear();hadPid=true;
      world.uid=Math.max(world.uid,m.base);
      for(const k of["dinos","fish","plants"])for(const o of world[k])if(!o.remote&&o.id<m.base){o.id=++world.uid;o._ns=undefined}
      return;
    }
    if(m.t==="s"){
      if(m.pg)for(const q of m.pg)gonePlayer(q);
      if(m.p)for(const a of m.p)gotPlayer(a);
      if(m.g)for(const id of m.g)goneEnt(id);
      if(m.e)for(const a of m.e)gotEnt(a);
      return;
    }
    if(m.t==="lb"){lb=m;return}
    if(m.t==="h")return gotHit(m);
    if(m.t==="k")return gotKill(m);
  }

  /* ---------- fighting other players ---------- */
  function gotHit(m){
    if(!me||me.dead||game.state!=="play")return;
    const P=players.get(m.from),who=P?P.name:"Someone",o=P&&P.obj;
    const now=performance.now();if(now-pv.t>10000)pv.dmg=0;pv.t=now;pv.dmg+=m.dmg||1;
    const need=Math.max(1,me.size-m.size);
    fx.push({k:"slash",x:me.x,y:me.y,h:len(me.size)*.45,t:.3,s:len(m.size)*.6,f:o?-o.face:1});
    if(pv.dmg>=need){
      pv.dmg=0;die({sp:m.sp,size:m.size});send({t:"k",by:m.from,sp:me.sp,size:me.size});
      setTimeout(()=>{if(me.dead)$("deadText").textContent=`${who} got you! (a size ${m.size} ${SP[m.sp].name.replace(/­/g,"")}) You were size ${me.size}. Start over as a baby!`},1760);
      return;
    }
    sfx.ouch();me.hurt=.5;
    if(o){const dx=wd(me.x-o.x),dy=wd(me.y-o.y),d=Math.hypot(dx,dy)||1,k=len(m.size)*3;me.kx=dx/d*k;me.ky=dy/d*k}
    say(me.x,me.y,`${who} bit you! ${need-pv.dmg} more and you're out`,"#ff8a6a",len(me.size)*1.2);
  }
  function gotKill(m){
    if(!me)return;const P=players.get(m.from),who=P?P.name:"them";
    let o=P&&P.obj;
    if(!o||o.state==="dead"&&o.dying<1){o={id:9e8+m.from,player:m.from,remote:true,sp:m.sp,size:m.size,x:me.x,y:me.y,state:"wander",dying:0}}
    kill(o);if(P&&P.obj===o)P.deadLife=o.life;
    banner("YOU BEAT "+who.toUpperCase()+"!","",2);
  }
  // called by attack(): true means it was another player (handled here)
  // dmg: 2 for special moves; teen: your teenager did it
  function attack(e,dmg,teen){
    if(!e.player){claim(e);return false}
    dmg=dmg||1;
    const now=performance.now();if(now-(e._dmgT||0)>10000)e.dmg=0;e._dmgT=now;
    e.dmg+=dmg;e.hurt=.25;sfx.hit();
    if(!teen)fx.push({k:"slash",x:e.x,y:e.y,h:len(e.size)*.45,t:.25,s:len(e.size)*.55,f:me.face});
    burst(e.x,e.y,"#8b1a10",8,len(e.size)*.02,len(e.size)*.35);
    send({t:"h",to:e.player,sp:me.sp,size:me.size,dmg});
    const left=needed(e)-e.dmg;if(left>0)say(e.x,e.y,teen?"TEEN ATTACK!":`${left} more!`,teen?"#ffb0c8":"#ffd27a",len(e.size)*1.1);else e.dmg=needed(e);
    return true;
  }
  function claim(o){if(!o||!o.remote||o.player)return;o.remote=false;o._ns=undefined;o._yaw!==undefined&&(o.yaw=o._yaw);send({t:"c",id:o.id})}
  // should populate() keep this even though it's far from me? (someone else has it, or a friend can see it)
  function keep(o){if(o.remote)return true;if(!ready)return false;
    for(const P of players.values()){const s=P.s;if(!s||s.playing!==1)continue;if(Math.hypot(wd(o.x-s.x),wd(o.y-s.y))<s.R)return true}return false}
  function reset(){ // a new game started: let go of everything
    send({t:"hi",name:myName()||"Dino"});send({t:"reset"});
    ents.clear();sent.clear();for(const P of players.values()){P.obj=null}
  }

  /* ---------- every frame: glide copies toward where they really are ---------- */
  function glide(o,dt,L){
    if(o._age<.35){o._tx+=o.vx*dt;o._ty+=o.vy*dt}o._age+=dt;
    const dx=wd(o._tx-o.x),dy=wd(o._ty-o.y);
    if(Math.abs(dx)>L*12||Math.abs(dy)>L*12){o.x=wrap(o._tx);o.y=wrap(o._ty)}
    else{const k=Math.min(1,dt*10);o.x=wrap(o.x+dx*k);o.y=wrap(o.y+dy*k)}
  }
  function tick(dt){
    if(off)return;if(!ws)connect();
    const now=performance.now();
    for(const e of world.dinos){if(!e.remote)continue;const L=len(e.size);glide(e,dt,L);
      e.yaw=angTo(e.yaw,e._yaw,dt*12);if(Math.abs(e.vx)>L*.05)e.face=e.vx>0?1:-1;e.ph+=dt*Math.hypot(e.vx,e.vy)/L*5.5;
      if(e.player){e.hurt=Math.max(0,e.hurt-dt);if(e.state==="dead"&&!e.meal)e.dying-=dt}}
    for(const f of world.fish){if(!f.remote)continue;glide(f,dt,fishLen(f.size));f.ang=angTo(f.ang,f._ang,dt*8);if(f.jump>0)f.jump-=dt}
    for(const P of players.values())for(const K of P.kids){if(K._tx===undefined)continue;const ox=K.x,oy=K.y,k=Math.min(1,dt*8);
      K.x=wrap(K.x+wd(K._tx-K.x)*k);K.y=wrap(K.y+wd(K._ty-K.y)*k);K.yaw=angTo(K.yaw,K._yaw,dt*8);
      const v=Math.hypot(wd(K.x-ox),wd(K.y-oy))/Math.max(dt,.001);K.mv=clamp(v/(K.L*2),0,1);K.ph+=dt*v/K.L*5.5}
    if(!ready){if(panel)panel.hidden=true;return}
    if(now-pT>50){pT=now;sendMe()}
    if(now-eT>100&&me){eT=now;sendMine()}
    if(now-uiT>500){uiT=now;ui()}
  }

  /* ---------- drawing: other players' babies, names, who's online ---------- */
  function render(t){
    for(const P of players.values()){if(!P.obj||P.obj.state==="dead"){for(const K of P.kids)if(K._i)relInst(K._i);continue}
      for(const K of P.kids){let I=K._i;if(!I||I.owner!==K||I.sp!==P.obj.sp){if(I)relInst(I);I=K._i=getInst(P.obj.sp,K);I.fade=1}I.stamp=stamp;
        place(I,K.x,K.y,K.L,K.yaw);pose(I,{ph:K.ph,mv:K.mv,jaw:0,atk:0,angry:false},t+3);setOpacity(I,1)}}
  }
  function overlay(c){
    if(!ready||!me)return;
    c.textAlign="center";c.textBaseline="middle";c.font=`800 ${Math.round(clamp(cw/50,14,19))}px "Baloo 2",system-ui,sans-serif`;
    for(const P of players.values()){const o=P.obj;if(!o||o.state==="dead")continue;const L=len(o.size),p=toScr(o.x,o.y,groundY(o.x,o.y,L)+tpl(o.sp).top/100*L*1.02);
      if(p.behind||p.x<-60||p.x>cw+60||p.y<-60||p.y>ch+60)continue;
      c.lineWidth=4;c.strokeStyle="rgba(0,0,0,.8)";c.strokeText(P.name,p.x,p.y-36);c.fillStyle="#9fe6ff";c.fillText(P.name,p.x,p.y-36)}
  }
  let panel=null,pickLine=null;
  function ui(){
    if(!panel){
      panel=document.createElement("div");panel.id="netPanel";
      panel.style.cssText="position:fixed;top:calc(10px + env(safe-area-inset-top,0px));right:calc(max(12px,env(safe-area-inset-right,0px)) + 58px);background:var(--panel);border:1px solid var(--edge);border-radius:14px;padding:6px 12px 7px;pointer-events:none;font-size:14px;line-height:1.25;color:var(--dim);font-weight:600;min-width:120px";
      document.body.append(panel);
    }
    panel.hidden=$("hud").hidden;
    const rows=lb.top.map(([n,s,sp])=>`<div style="display:flex;justify-content:space-between;gap:10px;color:${n===(myName()||"Dino")&&me&&s===me.size?"var(--amber)":"var(--ink)"}"><span>${esc(n)}</span><span>${s}</span></div>`).join("");
    panel.innerHTML=`<div style="color:#9fe6ff">${lb.n} playing</div>${rows}`;
    if(pickLine)pickLine.textContent=`Online: ${lb.n} ${lb.n===1?"player":"players"} in the world`;
  }
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  // name box on the pick screen
  if(!off){
    const box=document.createElement("div");box.style.cssText="display:flex;flex-direction:column;align-items:center;gap:4px";
    box.innerHTML='<label style="font-weight:800;font-size:18px;color:var(--ink);display:flex;gap:10px;align-items:center">Your name <input id="netName" maxlength="14" autocomplete="off" autocapitalize="words" spellcheck="false" style="font:inherit;font-size:20px;width:11em;padding:4px 10px;border-radius:10px;border:2px solid var(--edge);background:#17130d;color:var(--ink);-webkit-user-select:text;user-select:text;touch-action:manipulation"></label><span id="netLine" style="font-size:15px;color:#9fe6ff">Connecting to the world…</span>';
    $("pickTitle").after(box);
    const inp=$("netName");inp.value=myName();pickLine=$("netLine");
    inp.addEventListener("keydown",e=>{e.stopPropagation();if(e.key==="Enter")inp.blur()});
    inp.addEventListener("input",()=>{const v=inp.value.replace(/[^\p{L}\p{N} '\-!]/gu,"").slice(0,14);try{localStorage.setItem("dinoName",v.trim())}catch(e){}});
  }
  if(!off)connect();
  // seconds on a clock every player shares (for day and night)
  const clock=()=>ready?(Date.now()+clockOff)/1000:game.t;
  return{tick,render,overlay,attack,claim,keep,reset,clock,get on(){return ready},get pid(){return pid},players,ents,get lb(){return lb}};
})();
window.DINO&&(window.DINO.net=net);
