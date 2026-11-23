/* ========================= sound ========================= */
let AC=null,NB=null;
function audio(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1}catch(e){AC=null}}if(AC&&AC.state==="suspended")AC.resume()}
function env(g,t,peak,a,dur){g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+dur)}
function roarSfx(size,vol){if(!AC||vol<.03)return;const t=AC.currentTime,dur=.7+size*.05;
  const n=AC.createBufferSource();n.buffer=NB;const f=AC.createBiquadFilter();f.type="lowpass";f.frequency.setValueAtTime(1100-size*60,t);f.frequency.exponentialRampToValueAtTime(160,t+dur);
  const g=AC.createGain();env(g,t,.45*vol,.12,dur);n.connect(f).connect(g).connect(AC.destination);n.start(t);n.stop(t+dur);
  const o=AC.createOscillator();o.type="sawtooth";o.frequency.setValueAtTime(150-size*9,t);o.frequency.exponentialRampToValueAtTime(Math.max(28,60-size*3),t+dur);
  const og=AC.createGain();env(og,t,.22*vol,.1,dur);const of=AC.createBiquadFilter();of.type="lowpass";of.frequency.value=600;o.connect(of).connect(og).connect(AC.destination);o.start(t);o.stop(t+dur)}
function blip(type,freq,dur,vol,slide){if(!AC)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+dur);env(g,t,vol,.01,dur);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+dur+.02)}
function noiseSfx(dur,vol,ftype,freq){if(!AC)return;const t=AC.currentTime,n=AC.createBufferSource();n.buffer=NB;const f=AC.createBiquadFilter();f.type=ftype;f.frequency.value=freq;const g=AC.createGain();env(g,t,vol,.005,dur);n.connect(f).connect(g).connect(AC.destination);n.start(t);n.stop(t+dur)}
const sfx={
  slash(){noiseSfx(.16,.35,"highpass",2200)},
  hit(){noiseSfx(.12,.5,"lowpass",900);blip("square",120,.12,.2,60)},
  chomp(){noiseSfx(.1,.5,"bandpass",500);setTimeout(()=>noiseSfx(.12,.5,"bandpass",420),110);blip("sine",90,.2,.35,50)},
  munch(){for(let i=0;i<3;i++)setTimeout(()=>noiseSfx(.06,.25,"bandpass",1400+i*200),i*80)},
  star(){[523,659,784,1047].forEach((f,i)=>setTimeout(()=>blip("triangle",f,.25,.25),i*90))},
  ouch(){blip("square",300,.2,.2,120)},
  die(){blip("sawtooth",220,1.1,.3,40);noiseSfx(.6,.3,"lowpass",400)},
  whack(){noiseSfx(.25,.6,"lowpass",300);blip("sine",70,.3,.4,35)},
  honk(){blip("sawtooth",190,.35,.25,150);setTimeout(()=>blip("sawtooth",160,.5,.25,110),300)},
  egg(){[784,988,1175,1568,1976].forEach((f,i)=>setTimeout(()=>blip("sine",f,.4,.22),i*110))},
};

/* ========================= plant eater special moves ========================= */
const MOVES={
 quetz:{name:"FLY",tip:"You fly over rocks, trees and water. Swoop down on dinos your size!",fast:1.15},
 nemi:{name:"FLY",tip:"You fly over rocks, trees and water. Swoop down on dinos your size!",fast:1.15},
 anky:{name:"TAIL CLUB",tip:"Smack dinos with your tail club. Small biters just bounce off your armor!",dmg:2,tail:true,knock:2,armor:true},
 stego:{name:"SPIKY TAIL",tip:"Your tail spikes hit twice as hard, and dinos that bite you get stabbed!",dmg:2,tail:true,knock:1.6,spikes:true},
 tri:{name:"CHARGE",tip:"Tap a dino far away to charge it with your horns!",charge:true,knock:1.4},
 styra:{name:"CHARGE",tip:"Tap a dino far away to charge it with your spiky horns!",charge:true,knock:1.4},
 pachy:{name:"HEAD BUTT",tip:"Tap a dino far away to run and head-butt it!",charge:true,knock:1.8},
 brachio:{name:"STOMP",tip:"Your stomp hits every dino around you!",area:true,knock:1.6},
 diplo:{name:"TAIL WHIP",tip:"Your whip tail hits every dino around you!",area:true,tail:true,knock:1.6},
 apato:{name:"STOMP",tip:"Your stomp hits every dino around you!",area:true,knock:1.8},
 argent:{name:"EARTHQUAKE",tip:"The biggest dino ever! Your stomp shakes every dino around you!",area:true,knock:2.4,dmg:2},
 amarga:{name:"NECK SPIKES",tip:"Dinos that bite you get stabbed by your neck spikes!",spikes:true},
 theri:{name:"GIANT CLAWS",tip:"Your giant claws hit twice as hard!",dmg:2},
 igu:{name:"THUMB SPIKE",tip:"Your thumb spikes hit twice as hard!",dmg:2},
 para:{name:"HONK",tip:"Tap to HONK: dinos close to your size run away!",honk:true},
 galli:{name:"SPRINT",tip:"You are the fastest runner of all!",fast:1.3},
};
const moveLabel=sp=>MOVES[sp]?MOVES[sp].name.toLowerCase().replace(/(^|\s)./g,c=>c.toUpperCase()):"";

/* ========================= saved progress: unlocks and the dino book ========================= */
const SAVE_KEY="dinoAttack3d";
const save=(()=>{const z={grown:{},fish:0,unlocked:{},book:{}};try{return Object.assign(z,JSON.parse(localStorage.getItem(SAVE_KEY)||"{}"))}catch(e){return z}})();
let storeT=0;const store=()=>{clearTimeout(storeT);storeT=setTimeout(()=>{try{localStorage.setItem(SAVE_KEY,JSON.stringify(save))}catch(e){}},300)};
const bookOf=sp=>save.book[sp]||(save.book[sp]={played:0,beat:0,best:0});
const UNLOCK={
 giga:{need:"Grow a T-Rex to size 10",test:s=>s.grown.trex},
 quetz:{need:"Grow a Nemicolopterus to size 10",test:s=>s.grown.nemi},
 utah:{need:"Grow a Velociraptor to size 10",test:s=>s.grown.raptor},
 bary:{need:"Catch 10 fish",test:s=>s.fish>=10},
 diplo:{need:"Grow a Brachiosaurus to size 10",test:s=>s.grown.brachio},
 styra:{need:"Grow a Triceratops to size 10",test:s=>s.grown.tri},
 argent:{need:"Grow 3 different dinosaurs to size 10",test:s=>Object.keys(s.grown).length>=3},
};
const unlockAll=location.search.includes("unlockall");
const isLocked=sp=>!!UNLOCK[sp]&&!save.unlocked[sp]&&!unlockAll;
function checkUnlocks(){let got=null;for(const sp in UNLOCK)if(!save.unlocked[sp]&&UNLOCK[sp].test(save)){save.unlocked[sp]=true;got=sp}store();
  if(got){setTimeout(()=>{banner("NEW DINOSAUR UNLOCKED!",SP[got].name.replace(/­/g,"")+" is ready on the pick screen",4.5);sfx.egg()},2600)}refreshCards()}

/* ========================= world state ========================= */
// Everything that would be shared in multiplayer lives in `world`. `me` is the local player (one entry of world.players).
const world={dinos:[],plants:[],fish:[],meals:[],players:[],egg:null,uid:0};
let me=null;
const game={state:"pick",t:0,gen:0,lastSp:"trex",deadT:0,killer:null,popT:0};
const fx=[], texts=[];
const cam={x:0,y:0,z:1};
let cw=0,ch=0,dpr=1;
const cv=$("cv"),ctx=cv.getContext("2d");

function newPlayer(sp){return{local:true,kids:[],sp,size:1,food:0,x:rnd(W),y:rnd(W),vx:0,vy:0,face:1,yaw:0,ph:0,mv:0,cd:0,atk:0,jaw:0,dead:false,deadT:0,hurt:0,kx:0,ky:0,tooBigT:0}}
function spawnDino(sp,size,x,y){const e={id:++world.uid,sp,size,x:wrap(x),y:wrap(y),face:Math.random()<.5?-1:1,yaw:rnd(TAU),vx:0,vy:0,ph:rnd(TAU),mv:0,state:"wander",wt:0,head:rnd(TAU),graze:false,
  dmg:0,stun:0,kx:0,ky:0,wind:0,rest:0,huntT:0,huntCd:rnd(1,3),jaw:0,dying:0,angry:0,scared:0,hurt:0};world.dinos.push(e);return e}
const fishLen=s=>len(s)*.5;
function spawnFish(size,x,y){world.fish.push({id:++world.uid,size,x:wrap(x),y:wrap(y),ang:rnd(TAU),sp:0,t:rnd(3),dead:0,hurt:0,v:Math.random()*4|0,jump:0})}
function spawnPlant(size,x,y){for(let k=0;k<8&&isWater(x,y);k++){x+=rnd(-1,1)*len(size)*4;y+=rnd(-1,1)*len(size)*4}if(isWater(x,y))return;world.plants.push({id:++world.uid,size,x:wrap(x),y:wrap(y),v:Math.random()*8|0,f:Math.random()<.5?-1:1,rot:rnd(TAU),eaten:0})}

const zoomFor=s=>Math.min(cw,ch)/(len(s)*6.6);
const viewR=()=>Math.hypot(cw,ch)/2/zoomFor(me.size)*1.25;
function dist(a,b){return Math.hypot(wd(a.x-b.x),wd(a.y-b.y))}

/* how many of each kind to keep around the player */
function slots(){
  const s=me.size,meat=SP[me.sp].meat,L=[],top=Math.min(MAXS,s);
  L.push({k:"d",diet:"herb",lo:s,hi:s,n:meat?4:2});
  L.push({k:"d",diet:"any",lo:Math.max(1,s-3),hi:s-1,n:3});
  if(s<MAXS){L.push({k:"d",diet:"meat",lo:s+1,hi:Math.min(MAXS,s+3),n:2});L.push({k:"d",diet:"herb",lo:s+1,hi:Math.min(MAXS,s+4),n:2})}
  L.push({k:"d",diet:"meat",lo:top,hi:top,n:1});
  L.push({k:"p",lo:s,hi:s,n:meat?2:6});
  L.push({k:"p",lo:Math.max(1,s-3),hi:s-1,n:meat?2:3});
  if(s<MAXS)L.push({k:"p",lo:s+1,hi:Math.min(MAXS,s+3),n:2});
  return L.filter(q=>q.hi>=q.lo);
}
function populate(initial){
  const R0=viewR(),R1=R0*2.3,s=me.size;
  world.dinos=world.dinos.filter(e=>{const d=dist(e,me);return net.keep(e)||d<R1*1.5&&!(d>R0*1.1&&e.size<s-3)});
  world.plants=world.plants.filter(p=>{const d=dist(p,me);return net.keep(p)||d<R1*1.5&&!(d>R0*1.1&&p.size<s-3)});
  world.fish=world.fish.filter(f=>{const d=dist(f,me);return (net.keep(f)||d<R1*1.5&&!(d>R0*1.1&&f.size<s-3))&&!(f.dead&&f.dead<=0&&!f.meal)});
  {let have=0;for(const f of world.fish)if(!f.dead&&dist(f,me)<R1)have++;
    for(let tries=0;have<9&&tries<(initial?60:6);tries++){const an=rnd(TAU),rr=rnd(initial?len(s)*2:R0*1.05,R1),x=me.x+Math.cos(an)*rr,y=me.y+Math.sin(an)*rr;
      if(isWater(x,y)){const lo=Math.max(1,s-2),hi=Math.min(MAXS,s+1);spawnFish(lo+(Math.random()*(hi-lo+1)|0),x,y);have++}}}
  let budget=initial?999:3;
  for(const q of slots()){
    const pool=q.k==="d"?world.dinos:world.plants;
    let have=0;for(const e of pool){if(e.size<q.lo||e.size>q.hi||e.dying)continue;if(q.k==="d"&&q.diet!=="any"&&(SP[e.sp].meat?"meat":"herb")!==q.diet)continue;if(dist(e,me)<R1)have++}
    while(have<q.n&&budget>0){
      const size=q.lo+(Math.random()*(q.hi-q.lo+1)|0);const danger=q.k==="d"&&size>=s&&q.diet==="meat";
      const rmin=initial&&!danger?len(s)*3:R0*1.1, r=rnd(rmin,R1), an=rnd(TAU);
      const x=me.x+Math.cos(an)*r,y=me.y+Math.sin(an)*r;
      if(q.k==="d"){const sp=q.diet==="meat"?pick(MEATS):q.diet==="herb"?pick(HERBS):pick(Math.random()<.6?HERBS:MEATS);spawnDino(sp,size,x,y)}
      else spawnPlant(size,x,y);
      have++;budget--;
    }
  }
}

/* ========================= rules ========================= */
const needed=e=>Math.max(1,e.size-me.size);
const reachMe=e=>(len(e.size)+len(me.size))*.45+len(me.size)*.32;
const biteReach=e=>(len(e.size)+len(me.size))*.42+len(e.size)*.1;
const detect=e=>Math.max(len(me.size)*5.2,len(e.size)*2.6)*(game.night?1.3:1);
const reachFish=f=>len(me.size)*.75+fishLen(f.size)*.4;
const faceTo=(o)=>{me.yaw=Math.atan2(wd(o.y-me.y),wd(o.x-me.x));me.face=Math.cos(me.yaw)>=0?1:-1};
function target(){
  let best=null,bd=1e9;for(const e of world.dinos){if(e.dying)continue;const d=dist(e,me),r=reachMe(e);if(d<r&&d-r<bd){bd=d-r;best=e}}
  if(SP[me.sp].meat)for(const f of world.fish){if(f.dead)continue;const d=dist(f,me),r=reachFish(f);if(d<r&&d-r<bd){bd=d-r;best=f}}
  return best
}
function catchFish(f){
  if(f.remote)net.claim(f);
  save.fish=(save.fish||0)+1;checkUnlocks();
  f.dead=1;f.hurt=.3;sfx.chomp();burst(f.x,f.y,"#9fd0e0",14,fishLen(f.size)*.03,fishLen(f.size)*.2);
  if(me.kids.length){f.meal=true;f.dead=99;world.meals.push(f)}
  if(f.size>=me.size){say(f.x,f.y,"FISH! +1","#9fe6ff",fishLen(f.size));addFood()}else say(f.x,f.y,"Fish! (too small to count)","#d9cfb6",fishLen(f.size));
}
function attack(want){
  if(game.state!=="play"||me.dead||me.cd>0)return;
  audio();me.cd=.3;me.atk=1;me.jaw=1;
  if(MOVES[me.sp]&&MOVES[me.sp].honk)honk();
  if(want&&want.ang!==undefined&&!want.dead&&dist(want,me)<reachFish(want)){faceTo(want);catchFish(want);return}
  const e=want&&want.ang===undefined&&!want.dying&&world.dinos.includes(want)&&dist(want,me)<reachMe(want)?want:target();
  if(!e){sfx.slash();const L=len(me.size);fx.push({k:"slash",x:me.x+Math.cos(me.yaw)*L*.6,y:me.y+Math.sin(me.yaw)*L*.6,h:L*.4,t:.22,s:L*.5,f:me.face});
    if(!SP[me.sp].meat)eatPlantNear(true);return}
  faceTo(e);
  if(e.ang!==undefined){catchFish(e);return}
  const mv=MOVES[me.sp],charged=!!(mv&&mv.charge&&me.charging);me.charging=false;
  const dmg=charged?2:(mv&&mv.dmg)||1;
  if(mv&&(charged||mv.dmg||mv.area||mv.tail)){say(me.x,me.y,mv.name+"!","#ffe08a",len(me.size)*1.5);if(mv.tail||mv.area)sfx.whack()}
  if(mv&&mv.area)for(const o of [...world.dinos])if(o!==e&&!o.dying&&dist(o,me)<reachMe(o)*1.15)hitDino(o,1,mv.knock);
  hitDino(e,dmg,charged?3.4:(mv&&mv.knock)||1);
}
function hitDino(e,dmg,kn){
  if(e.remote&&net.attack(e,dmg))return;
  e.dmg+=dmg;e.hurt=.25;sfx.hit();
  fx.push({k:"slash",x:e.x,y:e.y,h:len(e.size)*.45,t:.25,s:len(e.size)*.55,f:me.face});
  burst(e.x,e.y,"#8b1a10",8*dmg,len(e.size)*.02,len(e.size)*.35);
  if(e.dmg>=needed(e)){kill(e);return}
  const dx=wd(e.x-me.x),dy=wd(e.y-me.y),d=Math.hypot(dx,dy)||1,k=len(me.size)*2.4*kn;
  e.kx=dx/d*k;e.ky=dy/d*k;e.stun=.5*Math.min(2,kn);e.wind=0;
  if(e.state==="wind")e.state="hunt";
  if(e.size>=me.size){e.angry=7;e.state="hunt";e.huntT=0}else e.scared=6;
  say(e.x,e.y,`${needed(e)-e.dmg} more!`,"#ffd27a",len(e.size)*1.1);
}
function honk(){
  const L=len(me.size);sfx.honk();fx.push({k:"honk",x:me.x,y:me.y,t:.8});say(me.x,me.y,"HONK!","#ffe08a",L*1.5);
  for(const e of world.dinos){if(e.dying||e.player||e.size>me.size+1||dist(e,me)>L*7)continue;if(e.remote)net.claim(e);e.state="flee";e.angry=0;e.huntCd=10;e.scared=8;e.jaw=0}
}
function kill(e){
  bookOf(e.sp).beat++;store();
  e.dying=1.4;e.state="dead";e.jaw=0;
  const counts=e.size>=me.size,H=len(e.size)*1.2;
  if(SP[me.sp].meat){
    sfx.chomp();burst(e.x,e.y,"#a01c10",18,len(e.size)*.03,len(e.size)*.3);
    if(me.kids.length){e.meal=true;e.dying=.7;world.meals.push(e);say(e.x,e.y,"Food for your babies!","#ff9ab2",H)}
    else if(counts){say(e.x,e.y,"CHOMP! +1","#ffcf6a",H);addFood()}
    else say(e.x,e.y,"Chomp! (too small to count)","#d9cfb6",H);
  }else{
    say(e.x,e.y,"Beat it! (you only eat plants)","#d9cfb6",H);
  }
}
function addFood(){me.food++;hud();if(me.size<MAXS&&me.food>=3)setTimeout(grow,350)}
function grow(){
  if(me.dead||me.size>=MAXS||me.food<3)return;
  me.size++;me.food=0;sfx.star();{const bk=bookOf(me.sp);bk.best=Math.max(bk.best,me.size);store()}
  for(let i=0;i<24;i++)fx.push({k:"star",x:me.x,y:me.y,h:len(me.size)*.5,g:groundY(me.x,me.y,len(me.size)),vx:rnd(-1,1)*len(me.size)*1.6,vy:rnd(-1,1)*len(me.size)*1.6,vh:rnd(.6,2)*len(me.size)*1.6,t:1.2});
  if(me.size===MAXS){banner("FULLY GROWN!","Follow the blue arrow to the egg to get your baby",4);placeEgg();save.grown[me.sp]=true;checkUnlocks()}
  else banner("★ SIZE "+me.size+" ★","You got a star and grew bigger!",2.2);
  hud();
}
function placeEgg(){let x,y;for(let k=0;k<30;k++){const an=rnd(TAU),r=len(MAXS)*26;x=wrap(me.x+Math.cos(an)*r);y=wrap(me.y+Math.sin(an)*r);if(!isWater(x,y))break}world.egg={x,y,t:0}}
function eatPlantNear(fromClaw){
  const L=len(me.size),mx=me.x+Math.cos(me.yaw)*L*.3,my=me.y+Math.sin(me.yaw)*L*.3;
  for(const p of world.plants){if(p.eaten)continue;const d=Math.hypot(wd(p.x-mx),wd(p.y-my));const r=L*.42+len(p.size)*.3*(fromClaw?1.4:1);if(d>r)continue;
    const H=plantH(p.size);
    if(p.size>me.size){if(me.tooBigT<=0){say(p.x,p.y,"Too big! Grow first","#ffb08a",H);me.tooBigT=2}continue}
    if(p.meal)continue;
    if(p.remote)net.claim(p);
    if(me.kids.length){p.meal=true;world.meals.push(p);me.jaw=1;sfx.munch();say(p.x,p.y,"Food for your babies!","#ff9ab2",H);return true}
    p.eaten=.6;me.jaw=1;sfx.munch();burst(p.x,p.y,"#5c9a32",14,len(p.size)*.02,H*.4);
    if(p.size===me.size){say(p.x,p.y,"MUNCH! +1","#bff08a",H);addFood()}else say(p.x,p.y,"munch (too small to count)","#d9cfb6",H);
    return true}
  return false;
}
function biteMe(e){
  if(me.dead)return;
  fx.push({k:"slash",x:me.x,y:me.y,h:len(me.size)*.45,t:.3,s:len(e.size)*.6,f:-e.face});
  const mv=MOVES[me.sp];
  if(mv&&mv.spikes&&e.size<=me.size+1){sfx.hit();e.dmg++;e.hurt=.4;say(e.x,e.y,"OW! SPIKES!","#ffd27a",len(e.size)*1.2);burst(e.x,e.y,"#8b1a10",10,len(e.size)*.02,len(e.size)*.4);
    if(e.dmg>=needed(e)){kill(e);return}const dx=wd(e.x-me.x),dy=wd(e.y-me.y),d=Math.hypot(dx,dy)||1,k=len(e.size)*3;e.kx=dx/d*k;e.ky=dy/d*k;e.stun=.8;e.state="flee";e.angry=0;e.huntCd=8;e.scared=6;return}
  if(mv&&mv.armor&&e.size<=me.size){sfx.whack();say(me.x,me.y,"CLANG! Armor!","#cfe0ff",len(me.size)*1.2);const dx=wd(e.x-me.x),dy=wd(e.y-me.y),d=Math.hypot(dx,dy)||1,k=len(e.size)*2.5;e.kx=dx/d*k;e.ky=dy/d*k;e.stun=.6;return}
  if(e.size>me.size){die(e);return}
  sfx.ouch();me.hurt=.5;const dx=wd(me.x-e.x),dy=wd(me.y-e.y),d=Math.hypot(dx,dy)||1,k=len(e.size)*3;me.kx=dx/d*k;me.ky=dy/d*k;
  if(me.food>0){me.food--;hud()}say(me.x,me.y,"OUCH!","#ff8a6a",len(me.size)*1.2);
}
function die(e){
  me.dead=true;me.deadT=0;game.killer=e;sfx.die();burst(me.x,me.y,"#9a1a10",26,len(me.size)*.03,len(me.size)*.3);
  setTimeout(()=>{if(!me.dead)return;game.state="dead";const s=SP[e.sp];
    $("deadTitle").innerHTML=s.meat?"YOU GOT <em>EATEN!</em>":"YOU GOT <em>BEATEN!</em>";
    $("deadText").textContent=`A size ${e.size} ${s.name} got you. You were size ${me.size}. Start over as a baby!`;
    show("dead")},1700);
}
function hatch(){const egg=world.egg;egg.hatching=1.6;egg.t=0;sfx.egg();banner("THE EGG IS HATCHING!","",1.8)}
function eggHatched(){
  const egg=world.egg;world.egg=null;
  me.kids.push({x:egg.x,y:egg.y,vx:0,vy:0,face:me.face,yaw:me.yaw,ph:0,mv:0,jaw:0,born:0});
  burst(egg.x,egg.y,"#8cc8ff",22,len(MAXS)*.02,len(MAXS)*.15);sfx.star();
  banner("IT'S YOUR BABY!","Your baby follows you everywhere. Another egg is out there!",3.2);hud();
  const run=game.run;setTimeout(()=>{if(game.run===run&&game.state!=="pick"&&!me.dead&&!world.egg)placeEgg()},12000);
}
const kidGrow=k=>k?(k.meals||0)+Math.floor((k.age||0)/45):0;
const isTeen=k=>kidGrow(k)>=3;
const kidLen=k=>len(MAXS)*(.34+.05*Math.min(8,kidGrow(k)));
function teenKill(e){e.dying=1.4;e.state="dead";e.jaw=0;bookOf(e.sp).beat++;store();const H=len(e.size)*1.2;burst(e.x,e.y,"#a01c10",14,len(e.size)*.03,len(e.size)*.3);
  if(SP[me.sp].meat){e.meal=true;e.dying=.7;world.meals.push(e);say(e.x,e.y,"Your teen got it!","#ff9ab2",H)}else say(e.x,e.y,"Your teen beat it!","#ff9ab2",H)}
function finishMeal(m){
  m.meal=false;world.meals=world.meals.filter(x=>x!==m);
  if(m.ang!==undefined)m.dead=.5;else if(m.sp)m.dying=.6;else m.eaten=.6;
}
function kidStep(dt){
  const L=len(me.size),hx=Math.cos(me.yaw),hy=Math.sin(me.yaw);
  me.kids.forEach((k,i)=>{
    const kL=kidLen(k);
    k.born+=dt;k.jaw=Math.max(0,k.jaw-dt*3);k.age=(k.age||0)+dt;k.cd=(k.cd||0)-dt;k.atk=Math.max(0,(k.atk||0)-dt*4);k.fight=false;
    if(isTeen(k)&&!k.teen){k.teen=true;banner("YOUR BABY IS A TEENAGER!","Teens are big enough to help you fight",3.2);sfx.star();hud()}
    // teens help you fight: they go after anything hunting you, or the dino you are attacking
    if(k.teen&&!me.dead){let foe=null,bd=1e9;
      for(const e of world.dinos){if(e.dying||e.state==="dead")continue;const dm=dist(e,me);if(dm>L*6)continue;
        if(!(e.state==="hunt"||e.state==="wind"||(me.goal&&me.goal.o===e)||(e.dmg>0&&e.angry>0)))continue;const d=dist(e,k);if(d<bd){bd=d;foe=e}}
      if(foe){const dx=wd(foe.x-k.x),dy=wd(foe.y-k.y),d=Math.hypot(dx,dy)||1,reach=kL*.5+len(foe.size)*.45;k.fight=true;
        if(d<reach){k.vx*=.5;k.vy*=.5;k.mv=0;k.yaw=angTo(k.yaw,Math.atan2(dy,dx),dt*10);
          if(k.cd<=0&&foe.remote&&net.attack(foe,1,true)){k.cd=.9;k.jaw=1;k.atk=1}
          else if(k.cd<=0){k.cd=.9;k.jaw=1;k.atk=1;sfx.hit();foe.dmg++;foe.hurt=.3;burst(foe.x,foe.y,"#8b1a10",8,len(foe.size)*.02,len(foe.size)*.35);say(foe.x,foe.y,"TEEN ATTACK!","#ffb0c8",len(foe.size)*1.1);
            if(foe.size<=me.size||foe.dmg>=needed(foe))teenKill(foe);else{foe.kx=dx/d*kL*2;foe.ky=dy/d*kL*2;foe.stun=.4}}}
        else{const sp=pspeed(me.size)*1.3,kk=Math.min(1,dt*6);k.vx=lerp(k.vx,dx/d*sp,kk);k.vy=lerp(k.vy,dy/d*sp,kk);k.x=wrap(k.x+k.vx*dt);k.y=wrap(k.y+k.vy*dt);collide(k,kL);
          k.yaw=angTo(k.yaw,Math.atan2(k.vy,k.vx),dt*8);k.mv=1;k.ph+=dt*Math.hypot(k.vx,k.vy)/kL*5.5}
        return}}
    if(!k.meal||!k.meal.meal){k.meal=null;k.eatT=0;let bd=L*9;for(const m of world.meals){if(me.kids.some(o=>o!==k&&o.meal===m))continue;const d=dist(m,k);if(d<bd){bd=d;k.meal=m}}}
    if(k.meal){const m=k.meal,dx=wd(m.x-k.x),dy=wd(m.y-k.y),d=Math.hypot(dx,dy);
      if(d<kL*.6){k.vx*=.5;k.vy*=.5;k.mv=0;k.yaw=Math.atan2(dy,dx);k.eatT=(k.eatT||0)+dt;if(Math.sin(k.eatT*14)>.3)k.jaw=1;
        if(Math.random()<dt*6)burst(m.x,m.y,m.sp||m.ang!==undefined?"#9a2014":"#5c9a32",2,kL*.012,kL*.1);
        if(k.eatT>1.4){finishMeal(m);k.meal=null;k.eatT=0;k.meals=(k.meals||0)+1;sfx.munch();say(k.x,k.y,"Yum! ♥","#ff9ab2",kL)}return}
      const sp=pspeed(me.size)*1.1,kk=Math.min(1,dt*6);k.vx=lerp(k.vx,dx/d*sp,kk);k.vy=lerp(k.vy,dy/d*sp,kk);
      k.x=wrap(k.x+k.vx*dt);k.y=wrap(k.y+k.vy*dt);collide(k,kL);k.yaw=angTo(k.yaw,Math.atan2(k.vy,k.vx),dt*8);k.mv=1;k.ph+=dt*Math.hypot(k.vx,k.vy)/kL*5.5;return}
    // line up behind the parent, a little to the side, one behind another
    const back=L*.55+kL*.6+i*kL*.85,side=(i%2?1:-1)*kL*.35;
    const tx=me.x-hx*back-hy*side,ty=me.y-hy*back+hx*side;
    const dx=wd(tx-k.x),dy=wd(ty-k.y),d=Math.hypot(dx,dy);
    if(d>L*14){k.x=wrap(tx);k.y=wrap(ty);return}
    const sp=d<kL*.25?0:Math.min(pspeed(me.size)*1.25,d*3);
    const kk=Math.min(1,dt*6);k.vx=lerp(k.vx,d?dx/d*sp:0,kk);k.vy=lerp(k.vy,d?dy/d*sp:0,kk);
    k.x=wrap(k.x+k.vx*dt);k.y=wrap(k.y+k.vy*dt);collide(k,kL);
    const v=Math.hypot(k.vx,k.vy);k.yaw=angTo(k.yaw,v>kL*.2?Math.atan2(k.vy,k.vx):me.yaw,dt*6);
    k.mv=clamp(v/(kL*2),0,1);k.ph+=dt*v/kL*5.5;
  });
}

/* ========================= fish ========================= */
function fishStep(dt){
  for(const f of world.fish){
    f.hurt=Math.max(0,f.hurt-dt);
    if(f.remote)continue;
    if(f.dead){if(!f.meal)f.dead-=dt;continue}
    const fl=fishLen(f.size);f.t-=dt;
    const dx=wd(f.x-me.x),dy=wd(f.y-me.y),d=Math.hypot(dx,dy)||1;
    let want=f.ang,spd=fl*.9;
    if(!me.dead&&d<len(me.size)*2.2){want=Math.atan2(dy,dx);spd=Math.min(fl*3,pspeed(me.size)*.5)}
    else if(f.t<=0){f.t=rnd(1.5,4);f.wantA=f.ang+rnd(-1.2,1.2)}
    if(f.wantA!==undefined&&!(d<len(me.size)*2.2))want=f.wantA;
    let da=((want-f.ang+Math.PI*3)%TAU)-Math.PI;f.ang+=clamp(da,-dt*4,dt*4);
    const nx=f.x+Math.cos(f.ang)*spd*dt,ny=f.y+Math.sin(f.ang)*spd*dt;
    if(isWater(nx+Math.cos(f.ang)*fl*.6,ny+Math.sin(f.ang)*fl*.6)){f.x=wrap(nx);f.y=wrap(ny);f.sp=spd}else{f.ang+=Math.PI*rnd(.6,1.4);f.wantA=f.ang;f.sp=0}
    if(f.jump>0){f.jump-=dt;if(f.jump<.12&&!f.splash){f.splash=1;burst(f.x,f.y,"#cfeef5",6,fl*.01,0)}}else if(Math.random()<dt*.05){f.jump=.9;f.splash=0}
  }
}

/* ========================= AI ========================= */
function aiStep(e,dt){
  e.hurt=Math.max(0,e.hurt-dt);
  if(e.dying>0){if(!e.meal)e.dying-=dt;return}
  const S=SP[e.sp],L=len(e.size),nat=L*2.3;
  const dx=wd(me.x-e.x),dy=wd(me.y-e.y),d=Math.hypot(dx,dy)||1;
  e.huntCd-=dt;e.scared-=dt;if(e.state!=="wind")e.jaw=Math.max(0,e.jaw-dt*3);
  if(e.stun>0){e.stun-=dt;e.x=wrap(e.x+e.kx*dt);e.y=wrap(e.y+e.ky*dt);collide(e,L);e.kx*=.88;e.ky*=.88;e.mv=0;return}
  const alive=!me.dead&&game.state==="play",threat=e.size>=me.size;
  let mx=0,my=0,spd=0;
  if(e.state==="wind"){
    e.wind-=dt;e.jaw=1;e.face=dx>=0?1:-1;e.yaw=angTo(e.yaw,Math.atan2(dy,dx),dt*10);
    if(e.wind<=0){if(alive&&d<biteReach(e)*1.3)biteMe(e);e.state="rest";e.rest=.9;e.jaw=.6}
  }else if(e.state==="rest"){
    e.rest-=dt;if(e.rest<=0)e.state=(alive&&threat&&(S.meat||e.angry>0))?"hunt":"wander";
  }else{
    if(alive&&threat&&e.state!=="hunt"&&((S.meat&&e.huntCd<=0&&d<detect(e))||e.angry>0)){
      e.state="hunt";e.huntT=0;const v=clamp(1-d/(viewR()*1.4),0,1);roarSfx(e.size,v*.9);e.jaw=1;
    }
    if(e.state==="wander"&&alive&&e.size<me.size&&d<len(me.size)*3.4&&(SP[me.sp].meat||e.scared>0))e.state="flee";
    if(e.state==="hunt"){
      e.huntT+=dt;if(e.angry>0)e.angry-=dt;
      if(!alive||!threat||(e.huntT>7&&e.angry<=0)||d>detect(e)*1.8){e.state="wander";e.huntCd=6;e.angry=0}
      else if(d<biteReach(e)){e.state="wind";e.wind=S.meat?.6:.7;e.face=dx>=0?1:-1}
      else{mx=dx/d;my=dy/d;spd=Math.min(nat*1.15,pspeed(me.size)*.84)}
    }
    if(e.state==="flee"){
      if(!alive||d>len(me.size)*7)e.state="wander";else{mx=-dx/d;my=-dy/d;spd=Math.min(nat*1.3,pspeed(me.size)*.8)}
    }
    if(e.state==="wander"){
      e.wt-=dt;if(e.wt<=0){e.wt=rnd(2,5);e.graze=Math.random()<(S.meat?.25:.5);e.head=rnd(TAU)}
      if(!e.graze){mx=Math.cos(e.head);my=Math.sin(e.head);spd=nat*.28}
    }
  }
  e.wet=isWater(e.x,e.y);if(e.wet)spd*=.6;
  const k=Math.min(1,dt*5);e.vx=lerp(e.vx,mx*spd,k);e.vy=lerp(e.vy,my*spd,k);
  e.x=wrap(e.x+e.vx*dt);e.y=wrap(e.y+e.vy*dt);collide(e,L);
  const v=Math.hypot(e.vx,e.vy);if(Math.abs(e.vx)>nat*.05&&e.state!=="wind")e.face=e.vx>0?1:-1;
  if(v>nat*.05&&e.state!=="wind")e.yaw=angTo(e.yaw,Math.atan2(e.vy,e.vx),dt*5);
  e.mv=clamp(v/(nat*.6),0,1);e.ph+=dt*v/L*5.5;
}

/* ========================= input ========================= */
const fingers=new Map();let keys={};
function scr(e){const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
function hitTest(pt){
  if(!me||me.dead)return null;let best=null,bd=1e9;
  const tryHit=(o,L,hh,kind)=>{const g=groundY(o.x,o.y,L),c=toScr(o.x,o.y,g+hh*.5);if(c.behind)return;const r=Math.max(hh*.6,L*.45)*c.ppu+24;const d=Math.hypot(pt.x-c.x,pt.y-c.y);if(d<r&&d/r<bd){bd=d/r;best={kind,o}}};
  for(const e of world.dinos){if(e.dying||e.state==="dead")continue;const L=len(e.size);tryHit(e,L,tpl(e.sp).top/100*L,"dino")}
  if(SP[me.sp].meat)for(const f of world.fish){if(f.dead)continue;tryHit(f,fishLen(f.size),fishLen(f.size)*.4,"fish")}
  if(best)return best;
  if(!SP[me.sp].meat)for(const p of world.plants){if(p.eaten)continue;const H=plantH(p.size);tryHit(p,H*.8,H,"plant")}
  return best;
}
const taps=new Map();
function doTap(h){if(game.state!=="play"||!me||me.dead)return;me.goal={...h,t:6};fx.push({k:"tap",o:h.o,t:.5});
  if(h.kind==="dino"&&dist(h.o,me)<reachMe(h.o)){attack(h.o);me.goal=null}
  if(h.kind==="fish"&&dist(h.o,me)<reachFish(h.o)){attack(h.o);me.goal=null}}
cv.addEventListener("pointerdown",e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}audio();
  const pt=scr(e);fingers.delete(e.pointerId);fingers.set(e.pointerId,pt);
  if(game.state==="play"){const h=hitTest(pt);if(h)taps.set(e.pointerId,{x:pt.x,y:pt.y,t:performance.now(),h})}});
cv.addEventListener("pointermove",e=>{if(!fingers.has(e.pointerId))return;const pt=scr(e);fingers.set(e.pointerId,pt);
  const tp=taps.get(e.pointerId);if(tp&&Math.hypot(pt.x-tp.x,pt.y-tp.y)>16)taps.delete(e.pointerId)});
cv.addEventListener("pointerup",e=>{const tp=taps.get(e.pointerId);taps.delete(e.pointerId);fingers.delete(e.pointerId);if(tp&&performance.now()-tp.t<450)doTap(tp.h)});
const lift=e=>{fingers.delete(e.pointerId);taps.delete(e.pointerId)};
cv.addEventListener("pointercancel",lift);cv.addEventListener("lostpointercapture",lift);
// leaving the game (switching apps, locking the iPad, another tab or window) pauses it, and in the shared world
// tells the others right away that you're away, before the browser goes to sleep
function autoPause(){fingers.clear();keys={};if(game.state==="play"){togglePause();try{net.sendNow()}catch(e){}}}
addEventListener("blur",autoPause);addEventListener("pagehide",autoPause);document.addEventListener("visibilitychange",()=>{if(document.hidden)autoPause()});
addEventListener("keydown",e=>{keys[e.key.toLowerCase()]=true;if(e.key===" "||e.code==="Space"){e.preventDefault();if(!e.repeat)attack()}if(e.key==="Escape")togglePause()});
addEventListener("keyup",e=>{keys[e.key.toLowerCase()]=false});
document.addEventListener("gesturestart",e=>e.preventDefault());
document.addEventListener("dblclick",e=>e.preventDefault());
// where on the ground (relative to me) is this screen point?
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),gplane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitP=new THREE.Vector3();
function groundPoint(p,y){ndc.set(p.x/cw*2-1,-(p.y/ch*2-1));ray.setFromCamera(ndc,camera);gplane.constant=-y;return ray.ray.intersectPlane(gplane,hitP)}

/* ========================= UI ========================= */
function show(id){for(const o of["pick","dead","paused"])$(o).hidden=o!==id;const playing=id===null;$("hud").hidden=!playing&&id!=="paused";$("menuBtn").hidden=!playing}
let bannerTimer=0;
function banner(big,small,secs){const b=$("banner");b.innerHTML="";b.append(big);if(small){const s=document.createElement("small");s.textContent=small;b.append(s)}b.classList.add("show");clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>b.classList.remove("show"),secs*1000)}
const LEAF='<svg viewBox="0 0 16 16"><path d="M3 13C3 6 8 3 14 2c-1 6-4 11-11 11z" fill="#8fd062"/></svg>';
const MEAT='<svg viewBox="0 0 16 16"><path d="M5 11c-3-2-2-7 2-8s7 2 6 5-5 5-8 3z" fill="#d8573c"/><path d="M5 11l-3 3" stroke="#eee" stroke-width="2.4" stroke-linecap="round"/></svg>';
function hud(){
  if(!me)return;const s=SP[me.sp];
  $("hName").textContent=s.name.replace(/\u00AD/g,"");$("hSize").textContent=me.size>=MAXS?"fully grown!":`size ${me.size} of ${MAXS}`;
  let st="";for(let i=1;i<=MAXS;i++)st+=i<=me.size?"<i>★</i>":"☆";$("hStars").innerHTML=st;
  const f=$("hFood");
  if(me.size>=MAXS){f.innerHTML=world.egg?'<span style="color:#8cc8ff">Find the blue egg!</span>':'<span style="color:#ff9ab2">♥ Your babies are with you</span>'}
  else{let h=`<span>${s.meat?"eat":"eat plants"}:</span>`;for(let i=0;i<3;i++)h+=`<span class="pip ${i<me.food?"on":""}">${s.meat?MEAT:LEAF}</span>`;f.innerHTML=h}
  const g=$("hGen"),nk=me.kids.length;g.hidden=nk<1;const nt=me.kids.filter(isTeen).length;g.textContent=nt?`Babies: ${nk-nt}   Teens: ${nt}`:`Babies following you: ${nk}`;
}
function openPick(hatchling){game.state="pick";$("pickTitle").textContent=hatchling?"The egg hatched! Pick your hatchling":"Pick your dinosaur";show("pick")}
function start(sp){
  audio();game.run=(game.run||0)+1;game.lastSp=sp;world.dinos=[];world.fish=[];world.meals=[];world.plants=[];world.egg=null;fx.length=0;texts.length=0;net.reset();
  me=newPlayer(sp);world.players=[me];for(let k=0;k<40&&isWater(me.x,me.y);k++){me.x=rnd(W);me.y=rnd(W)}
  resize();cam.x=me.x;cam.y=me.y;cam.z=zoomFor(1);camL=len(1);camH=groundY(me.x,me.y,camL);
  populate(true);game.state="play";show(null);hud();
  bookOf(sp).played++;bookOf(sp).best=Math.max(bookOf(sp).best,1);store();
  banner(SP[sp].name.replace(/\u00AD/g,"").toUpperCase(),MOVES[sp]?"Special move, "+MOVES[sp].name+": "+MOVES[sp].tip:SP[sp].meat?"Meat eater: tap dinos your size to attack and eat them":"Plant eater: eat plants your size, tap a dino to fight it",4);
}
function togglePause(){if(game.state==="play"){game.state="paused";fingers.clear();show("paused");$("pauseNote").textContent=net.on?"You are hidden from the other players while you are paused, so nobody can eat you. The world keeps going for them.":"Everything stops until you tap Keep playing."}else if(game.state==="paused"){game.state="play";show(null)}}
$("menuBtn").onclick=togglePause;$("resumeBtn").onclick=togglePause;$("quitBtn").onclick=()=>openPick(false);
$("againBtn").onclick=()=>start(game.lastSp);$("pickBtn").onclick=()=>openPick(false);

/* pick cards: each dinosaur rendered in 3D on a small second renderer */
const cardCvs=[];
for(const sp of PLAYABLE){
  const b=document.createElement("button");b.className="card";b.setAttribute("aria-label",SP[sp].name.replace(/\u00AD/g,""));
  const c=document.createElement("canvas");c.width=480;c.height=320;b.append(c);
  const n=document.createElement("b");n.textContent=SP[sp].name.replace(/\u00AD/g,"").replace(/(saurus|taurus|raptor|mimus|odon|ceratops|pterus|coatlus)$/,"\u00AD$1");b.append(n);
  const d=document.createElement("span");d.className=SP[sp].meat?"meat":"plant";d.textContent=SP[sp].meat?"Meat eater":"Plant eater";b.append(d);
  if(MOVES[sp]){const mv=document.createElement("em");mv.className="move";mv.textContent=moveLabel(sp);b.append(mv)}
  if(UNLOCK[sp]){const nd=document.createElement("small");nd.className="need";nd.textContent=UNLOCK[sp].need+" to unlock";b.append(nd)}
  b.onclick=()=>{if(isLocked(sp)){audio();sfx.ouch();lockedTap(b,sp);return}start(sp)};$("cards").append(b);cardCvs.push({c,sp,b,g:c.getContext("2d")});
}
let cardR=null,cardScene=null,cardCam=null,cardI={},cardN=0;
{const st=document.createElement("style");st.textContent=`.card .move{font-style:normal;font-size:13px;font-weight:800;color:#ffd27a;line-height:1}.card .need{display:none;font-size:12.5px;font-weight:800;color:#e7a43a;line-height:1.15}
.card.locked .need{display:block}.card.locked span,.card.locked .move{display:none}.card.locked b::before{content:"\\1F512  "}.card.locked{border-style:dashed}
.card.locked canvas{filter:saturate(.6) brightness(.85)}.card.shake{animation:cshake .45s}@keyframes cshake{20%,60%{transform:translateX(-7px)}40%,80%{transform:translateX(7px)}}
#toast{position:fixed;left:50%;bottom:max(24px,env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);z-index:60;max-width:min(92vw,560px);padding:14px 20px;border-radius:16px;background:#2b2418;border:2px solid var(--amber);color:var(--ink);font-weight:800;font-size:18px;text-align:center;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s;box-shadow:0 8px 30px rgba(0,0,0,.6)}
#toast.show{opacity:1;transform:translate(-50%,0)}#toast b{display:block;font-family:var(--display);font-weight:400;font-size:22px;color:var(--amber)}`;document.head.append(st);
 const t=document.createElement("div");t.id="toast";document.body.append(t)}
// a locked card can't start the game: shake it and say how to unlock it, above the pick screen
let toastT=0;function lockedTap(b,sp){b.classList.remove("shake");void b.offsetWidth;b.classList.add("shake");
  const t=$("toast");t.innerHTML="";const h=document.createElement("b");h.textContent="\u{1F512} "+SP[sp].name.replace(/\u00AD/g,"")+" is locked";t.append(h,UNLOCK[sp].need+" to unlock it!");
  t.classList.add("show");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("show"),3200)}
/* ---- the dino book: every dinosaur you have played as or beaten ---- */
const FACTS={trex:"The king of the dinosaurs. Its bite could crush bones.",spino:"The longest meat eater. It hunted fish in rivers.",raptor:"Small, fast and clever, with a big sickle claw on each foot.",
 allo:"A fast hunter with little horns above its eyes.",dilo:"Two thin crests on its head, like a fancy hat.",carno:"The bull-horned hunter. Super fast runner.",
 giga:"Even longer than a T-Rex! A giant southern hunter.",bary:"A fish-catching hunter with huge thumb claws.",utah:"The biggest raptor of all, covered in feathers.",
 ovi:"A beaked dino with a tall crest. It sat on its eggs like a bird.",tri:"Three horns and a big frill. Even T-Rex was careful around it.",
 anky:"Covered in armor, with a bone club on its tail.",para:"Its long crest made a loud HONK like a trumpet.",brachio:"Its front legs were longer, so it stood tall like a giraffe.",
 stego:"Plates on its back and four sharp spikes on its tail.",pachy:"A thick bone dome on its head for head-butting.",igu:"Thumb spikes like little daggers.",
 theri:"Claws as long as your arm! It used them to grab leaves.",galli:"Ran like an ostrich. One of the fastest dinos.",diplo:"A whip tail longer than its neck.",
 styra:"A frill covered in long spikes, and a giant nose horn.",apato:"A huge, heavy long-neck. Its name means 'tricky lizard'.",
 argent:"Maybe the biggest animal ever to walk on land!",amarga:"Two rows of tall spikes down its neck.",nemi:"Not a dinosaur but a flying reptile, as small as a sparrow!",quetz:"A flying reptile as tall as a giraffe, with wings as wide as a small plane!"};
{const st=document.createElement("style");st.textContent=`.bookBtn{background:#3a3226;box-shadow:0 4px 0 #17130d;font-size:19px;padding:9px 22px}
#book .bgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;width:min(1000px,100%)}
#book .bent{border:2px solid var(--edge);border-radius:16px;background:linear-gradient(#2b2418,#17130d);padding:8px;display:flex;flex-direction:column;gap:2px;align-items:center;text-align:center}
#book .bent canvas{width:100%;aspect-ratio:3/2}#book .bent b{font-family:var(--display);font-weight:400;font-size:16px}#book .bent.unk canvas{filter:brightness(0)}
#book .bent i{font-style:normal;font-size:13px;color:var(--dim);line-height:1.2}#book .bent .st{font-size:13px;font-weight:800;color:var(--amber)}`;document.head.append(st);
 const bt=document.createElement("button");bt.className="btn bookBtn";bt.textContent="\u{1F4D6} Dino Book";bt.onclick=()=>openBook();$("pick").insertBefore(bt,$("cards"));
 const ov=document.createElement("div");ov.className="overlay";ov.id="book";ov.hidden=true;ov.innerHTML=`<h1>DINO <em>BOOK</em></h1><h2 id="bookCount"></h2><div class="bgrid" id="bgrid"></div><div class="btns"><button class="btn" id="bookClose">Back</button></div>`;document.body.append(ov);
 $("bookClose").onclick=()=>{$("book").hidden=true}}
function openBook(){
  const gr=$("bgrid");gr.innerHTML="";let found=0;
  for(const q of cardCvs){const sp=q.sp,bk=save.book[sp]||{played:0,beat:0,best:0},known=bk.played>0||bk.beat>0;if(known)found++;
    const el=document.createElement("div");el.className="bent"+(known?"":" unk");const c=document.createElement("canvas");c.width=180;c.height=120;
    try{c.getContext("2d").drawImage(q.c,0,0,180,120)}catch(e){}el.append(c);
    const n=document.createElement("b");n.textContent=known?SP[sp].name.replace(/­/g,""):"???";el.append(n);
    const f=document.createElement("i");f.textContent=known?FACTS[sp]||"":"Play as it or beat one to find out!";el.append(f);
    if(known){const st=document.createElement("span");st.className="st";const bits=[];if(bk.played)bits.push(`Played ${bk.played}x, best size ${bk.best}`);if(bk.beat)bits.push(`Beaten ${bk.beat}x`);if(save.grown[sp])bits.push("⭐ Fully grown");st.textContent=bits.join(" · ");el.append(st)}
    gr.append(el)}
  $("bookCount").textContent=`You found ${found} of ${cardCvs.length} dinosaurs`;$("book").hidden=false;
}
function refreshCards(){for(const q of cardCvs){const L=isLocked(q.sp);if(q.b.classList.contains("locked")!==L){q.b.classList.toggle("locked",L);if(cardI[q.sp]){cardScene.remove(cardI[q.sp].g);delete cardI[q.sp]}}}}
refreshCards(); // mark locked cards as soon as the pick screen is built
function initCards(){
  const oc=document.createElement("canvas");oc.width=480;oc.height=320;
  cardR=new THREE.WebGLRenderer({canvas:oc,antialias:true,alpha:true,preserveDrawingBuffer:true});cardR.setSize(480,320,false);cardR.outputColorSpace=THREE.SRGBColorSpace;cardR.toneMapping=THREE.ACESFilmicToneMapping;
  cardR.shadowMap.enabled=true;
  cardScene=new THREE.Scene();cardScene.add(new THREE.HemisphereLight(0xe8f0ff,0x5a4630,1.4));
  const l=new THREE.DirectionalLight(0xfff0d8,2.8);l.position.set(-60,120,80);l.castShadow=true;l.shadow.camera.left=l.shadow.camera.bottom=-110;l.shadow.camera.right=l.shadow.camera.top=110;l.shadow.mapSize.set(512,512);cardScene.add(l);
  const rim=new THREE.DirectionalLight(0xff8a50,1.2);rim.position.set(60,40,-90);cardScene.add(rim);
  const gnd=new THREE.Mesh(new THREE.CircleGeometry(95,40).rotateX(-Math.PI/2),new THREE.ShadowMaterial({opacity:.45}));gnd.receiveShadow=true;cardScene.add(gnd);
  cardCam=new THREE.PerspectiveCamera(32,1.5,1,2000);
}
function drawCards(t){
  if(!cardR)initCards();
  const n=cardCvs.length,per=3; // a few cards per frame, so the page stays quick to tap while the models are built
  for(let q=0;q<per;q++){const k=cardN++%n,{c,sp,g}=cardCvs[k];
    for(const s in cardI)cardI[s].g.visible=false;
    let I=cardI[sp];if(!I){I=cardI[sp]=makeInst(sp);cardScene.add(I.g);}I.g.visible=true;
    const T=I.T,bb=T.box,cx=(bb.min.x+bb.max.x)/2,cy=(bb.max.y)/2,hgt=bb.max.y,wid=bb.max.x-bb.min.x;
    I.g.rotation.y=-.55+Math.sin(t*.5+k)*.35;
    pose(I,{ph:t*2.2,mv:.35,jaw:SP[sp].meat?(Math.sin(t*1.3+k)>.55?1:0):0,atk:0,angry:SP[sp].meat},t);
    const D=Math.max(wid*.62,hgt*1.05)/Math.tan(16*Math.PI/180)*.62;
    cardCam.position.set(cx+D*.15,cy+D*.28,D);cardCam.lookAt(cx*.2,cy*.92,0);
    cardR.render(cardScene,cardCam);g.clearRect(0,0,480,320);g.drawImage(cardR.domElement,0,0)}
}

/* ========================= effects ========================= */
function burst(x,y,col,n,sz,h){const g=groundY(x,y,len(me?me.size:1));for(let i=0;i<n;i++)fx.push({k:"p",x,y,h:h||0,g,vx:rnd(-1,1)*sz*60,vy:rnd(-1,1)*sz*60,vh:rnd(.3,1.6)*sz*60,t:rnd(.4,.9),r:sz*rnd(2,5),col})}
function say(x,y,text,col,h){texts.push({x,y,h:h||0,g:groundY(x,y,len(me.size)),text,col,t:1.4})}

/* ========================= loop ========================= */
function resize(){dpr=Math.min(2,window.devicePixelRatio||1);cw=innerWidth;ch=innerHeight;cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);
  renderer.setPixelRatio(Math.min(1.5,window.devicePixelRatio||1));renderer.setSize(cw,ch,false);camera.aspect=cw/ch;camera.updateProjectionMatrix()}
addEventListener("resize",resize);resize();

let last=performance.now(),popT=0;
function step(dt){
  game.t+=dt;
  me.cd-=dt;me.atk=Math.max(0,me.atk-dt*4);me.jaw=Math.max(0,me.jaw-dt*3);me.hurt=Math.max(0,me.hurt-dt);me.tooBigT-=dt;
  if(me.dead){me.deadT+=dt;return}
  let mx=0,my=0,f=0;
  const keyMove=keys["arrowright"]||keys["arrowleft"]||keys["arrowup"]||keys["arrowdown"]||keys.w||keys.a||keys.s||keys.d;
  if(me.goal){const g=me.goal,o=g.o;g.t-=dt;
    const gone=g.kind==="dino"?(o.dying||!world.dinos.includes(o)):g.kind==="fish"?(o.dead||!world.fish.includes(o)):(o.eaten||o.meal||!world.plants.includes(o));
    if(gone||g.t<=0||fingers.size||keyMove){me.goal=null;me.charging=false}
    else{const dx=wd(o.x-me.x),dy=wd(o.y-me.y),d=Math.hypot(dx,dy)||1;
      if(g.kind==="dino"&&d<reachMe(o)*.9){if(me.cd<=0){attack(o);me.goal=null}}
      else if(g.kind==="fish"&&d<reachFish(o)*.9){if(me.cd<=0){attack(o);me.goal=null}}
      else{mx=dx/d;my=dy/d;f=1;const mv=MOVES[me.sp];if(g.kind==="dino"&&mv&&mv.charge&&(me.charging||d>reachMe(o)*1.6)){f=1.7;if(!me.charging){me.charging=true;say(me.x,me.y,mv.name+"!","#ffe08a",len(me.size)*1.5);sfx.honk()}}}}}
  if(me.goal){}else if(fingers.size){const p=[...fingers.values()].pop();const L=len(me.size),gy=groundY(me.x,me.y,L);
    const c=toScr(me.x,me.y,gy+L*.3),sd=Math.hypot(p.x-c.x,p.y-c.y),gp=groundPoint(p,gy);
    if(sd>10&&gp){const dx=gp.x,dy=gp.z,d=Math.hypot(dx,dy);if(d>0){mx=dx/d;my=dy/d;f=clamp(sd/110,.3,1)}}}
  else{const kx=(keys["arrowright"]||keys.d?1:0)-(keys["arrowleft"]||keys.a?1:0),ky=(keys["arrowdown"]||keys.s?1:0)-(keys["arrowup"]||keys.w?1:0);if(kx||ky){const d=Math.hypot(kx,ky);mx=kx/d;my=ky/d;f=1}}
  me.wet=isWater(me.x,me.y);
  const sp=pspeed(me.size)*f*(me.wet&&!SP[me.sp].fly?.6:1)*((MOVES[me.sp]&&MOVES[me.sp].fast)||1),k=Math.min(1,dt*8);
  me.vx=lerp(me.vx,mx*sp,k);me.vy=lerp(me.vy,my*sp,k);
  me.x=wrap(me.x+(me.vx+me.kx)*dt);me.y=wrap(me.y+(me.vy+me.ky)*dt);me.kx*=.86;me.ky*=.86;collide(me,len(me.size));
  const v=Math.hypot(me.vx,me.vy);
  if(v>len(me.size)*.15&&me.atk<=0){me.yaw=angTo(me.yaw,Math.atan2(me.vy,me.vx),dt*9);me.face=Math.cos(me.yaw)>=0?1:-1}
  me.mv=clamp(v/(pspeed(me.size)*.5),0,1);me.ph+=dt*v/len(me.size)*5.5;
  if(!SP[me.sp].meat)eatPlantNear(false);
  for(const e of world.dinos)if(!e.remote)aiStep(e,dt);
  world.dinos=world.dinos.filter(e=>!(e.state==="dead"&&e.dying<=0));
  for(const p of world.plants)if(p.eaten>0){p.eaten-=dt;if(p.eaten<=0)p.gone=true}
  world.plants=world.plants.filter(p=>!p.gone);
  if(world.egg){const eg=world.egg;eg.t+=dt;
    if(eg.hatching){eg.hatching-=dt;if(eg.hatching<=0)eggHatched()}
    else if(dist(eg,me)<len(me.size)*.55+40)hatch()}
  fishStep(dt);
  kidStep(dt);
  popT-=dt;if(popT<=0){popT=.3;populate(false)}
}

let fpsT=0,fpsN=0,fps=0;
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  fpsN++;fpsT+=dt;if(fpsT>=1){fps=fpsN/fpsT;fpsN=0;fpsT=0}
  if(game.state==="play")step(dt);
  net.tick(dt);
  if(me&&game.state!=="pick"){
    for(let i=fx.length-1;i>=0;i--){const p=fx[i];p.t-=dt;if(p.vx!==undefined){p.x=wrap(p.x+p.vx*dt);p.y=wrap(p.y+p.vy*dt);p.h+=p.vh*dt;p.vh-=len(me.size)*4*dt;if(p.h<0){p.h=0;p.vh*=-.3;p.vx*=.6;p.vy*=.6}}if(p.t<=0)fx.splice(i,1)}
    for(let i=texts.length-1;i>=0;i--){texts[i].t-=dt;if(texts[i].t<=0)texts.splice(i,1)}
    cam.x=me.x;cam.y=me.y;cam.z=lerp(cam.z,zoomFor(me.size),Math.min(1,dt*2));
    camL=lerp(camL,len(me.size),Math.min(1,dt*2));camH=lerp(camH,groundY(me.x,me.y,len(me.size)),Math.min(1,dt*5));
    render3D(dt);overlay();
  }else{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height)}
  if(game.state==="pick")drawCards(now/1000);
  requestAnimationFrame(frame);
}

/* ========================= 3D frame ========================= */
const pv=new THREE.Vector3(),camFwd=new THREE.Vector3();
// world spot (x,y) at height h -> screen {x,y,ppu (pixels per world unit there), behind}
function toScr(x,y,h){pv.set(wd(x-cam.x),h,wd(y-cam.y));const dep=pv.clone().sub(camera.position).dot(camFwd);pv.project(camera);
  return{x:(pv.x+1)/2*cw,y:(1-pv.y)/2*ch,ppu:ch/(2*Math.tan(camera.fov*Math.PI/360)*Math.max(1,dep)),behind:dep<=0||pv.z>1}}
function animOf(e){return{ph:e.ph,mv:e.mv,jaw:e.jaw,atk:e.atk||0,angry:e.state==="hunt"||e.state==="wind"||(e.angry>0)}}
/* ========================= day and night ========================= */
const DAY=240;let dayL=1;
const DN={fogD:new THREE.Color("#8e9688"),fogN:new THREE.Color("#0e1522"),sunD:new THREE.Color(0xfff0d8),dusk:new THREE.Color(0xff9a50),moon:new THREE.Color(0x9ab4ff),skyD:new THREE.Color(0xcfe0f0),skyN:new THREE.Color(0x3a4a70),gD:new THREE.Color(0x4a3c26),gN:new THREE.Color(0x141820)};
const dayPhase=()=>((net.clock()+DAY*.05)%DAY)/DAY;   // online, everyone shares the same time of day
function daylight(){const p=dayPhase();if(p<.5)return 1;if(p<.6)return 1-(p-.5)/.1;if(p<.88)return 0;if(p<.98)return(p-.88)/.1;return 1}
function dayNight(){
  dayL=daylight();const d=dayL;
  sun.color.copy(d>.5?DN.dusk.clone().lerp(DN.sunD,(d-.5)*2):DN.moon.clone().lerp(DN.dusk,d*2));sun.intensity=lerp(1,2.9,d);
  hemi.color.copy(DN.skyN).lerp(DN.skyD,d);hemi.groundColor.copy(DN.gN).lerp(DN.gD,d);hemi.intensity=lerp(.75,1.5,d);
  scene.fog.color.copy(DN.fogN).lerp(DN.fogD,d);scene.background.copy(scene.fog.color);renderer.toneMappingExposure=lerp(1.2,1.3,d);
  const ek=.25+.75*d;for(const I of liveInst)for(const k in I.mats){const mt=I.mats[k];if(mt.envMap){if(mt.userData.e0===undefined)mt.userData.e0=mt.envMapIntensity;mt.envMapIntensity=mt.userData.e0*ek}}
  const night=d<.3;if(game.state==="play"&&night!==!!game.night){game.night=night;
    if(night)banner("NIGHT FALLS...","Hunters can find you from farther away. Watch for glowing eyes!",3.5);else banner("THE SUN IS UP!","",2)}
}
function render3D(dt){
  stamp++;dayNight();const L=camL,D=L*6.6;
  {const tw=performance.now()/1000;waterNorm.offset.set(tw*.011,tw*.007);waterMat.envMapIntensity=.9*(.25+.75*dayL)}
  camT.set(0,camH+L*.35,0);camera.position.set(0,camT.y+Math.sin(EL)*D,Math.cos(EL)*D);camera.lookAt(camT);
  camera.near=D*.04;camera.far=D*4.2;camera.updateProjectionMatrix();camera.getWorldDirection(camFwd);
  scene.fog.near=D*1.15;scene.fog.far=D*2.9;
  sun.position.copy(camT).addScaledVector(SUN,D*2.2);sun.target.position.copy(camT).add(pv.set(0,0,-D*.45));
  const sc=sun.shadow.camera,ext=D*1.45;if(Math.abs(sc.right-ext)>ext*.02){sc.left=-ext;sc.right=ext;sc.top=ext;sc.bottom=-ext;sc.near=D*.2;sc.far=D*5;sc.updateProjectionMatrix()}
  sun.shadow.normalBias=L*.012;
  xray.uCam.value.copy(camera.position);xray.uTgt.value.set(0,camH+L*.3,0);xray.uR.value=L*1.25;
  updateTerrain(D);
  const t=game.t,tgt=me.dead?null:target();
  const near=(x,y,r)=>{const dx=wd(x-cam.x),dy=wd(y-cam.y);return dx>-D*2.2-r&&dx<D*2.2+r&&dy>-D*2.8-r&&dy<D*1.2+r};
  // dinosaurs
  for(const e of world.dinos){const Ld=len(e.size);if(!near(e.x,e.y,Ld)){if(e._i)relInst(e._i);continue}
    let I=e._i;if(!I||I.owner!==e)I=e._i=getInst(e.sp,e);I.stamp=stamp;
    const fall=e.state==="dead"?clamp((1.4-e.dying)*3,0,1):0;
    place(I,e.x+(e.hurt>0?Math.sin(t*90)*Ld*.02:0),e.y,Ld,e.yaw);
    I.inner.rotation.x=fall*1.4;I.inner.position.y=-fall*6;
    pose(I,animOf(e),t+e.id);
    I.fade=Math.min(1,I.fade+dt*1.5);setOpacity(I,Math.min(I.fade,e.dying>0?clamp(e.dying/.6,0,1):1));
    const sk=I.mats.skin;sk.emissive.setRGB(e.hurt>0?.55:e.state==="wind"?.18:0,e.hurt>0?.06:0,0);sk.color.setScalar(e.meal?.55:1);if(I.mats.acc)I.mats.acc.emissive.copy(sk.emissive);
    const ang=animOf(e).angry;I.mats.eye.emissive.setHex(ang?0xff3a10:0xff9a20);I.mats.eye.emissiveIntensity=(ang?1.4:.55)*(1+(1-dayL)*1.8);
    I.disk.visible=e.state==="wind";if(I.disk.visible){windMat.opacity=.25+.2*Math.sin(t*30)}
  }
  // me
  {const Lm=len(me.size);let I=me._i;if(!I||I.owner!==me||I.sp!==me.sp){if(I)relInst(I);I=me._i=getInst(me.sp,me);I.fade=1}I.stamp=stamp;
    const f=me.dead?clamp(me.deadT*2,0,1):0;
    place(I,me.x+Math.cos(me.yaw)*me.atk*Lm*.08,me.y+Math.sin(me.yaw)*me.atk*Lm*.08,Lm,me.yaw);I.inner.rotation.x=f*1.4;I.inner.position.y=-f*6;
    pose(I,{ph:me.ph,mv:me.mv,jaw:me.jaw,atk:me.atk,angry:me.atk>0||!!me.charging},t);setOpacity(I,1);
    I.mats.skin.emissive.setRGB(me.hurt>0?.55:0,me.hurt>0?.06:0,0);if(I.mats.acc)I.mats.acc.emissive.copy(I.mats.skin.emissive);I.mats.eye.emissive.setHex(me.atk>0?0xff3a10:0xff9a20);
    meRing.position.set(0,groundY(me.x,me.y,Lm)+Lm*.02,0);meRing.scale.setScalar(Lm*.55);meRing.visible=!me.dead}
  // babies
  for(const k of me.kids){const Lk=kidLen(k)*clamp(k.born*2.5,0,1);if(Lk<1)continue;let I=k._i;if(!I||I.owner!==k||I.sp!==me.sp){if(I)relInst(I);I=k._i=getInst(me.sp,k);I.fade=1}I.stamp=stamp;
    place(I,k.x,k.y,Lk,k.yaw);pose(I,{ph:k.ph,mv:k.mv,jaw:k.jaw,atk:k.atk||0,angry:!!k.fight},t+3);setOpacity(I,1)}
  net.render(t);
  for(const I of [...liveInst])if(I.stamp!==stamp)relInst(I);
  // target ring
  if(tgt){const Lt=tgt.ang!==undefined?fishLen(tgt.size):len(tgt.size);tgtRing.visible=true;tgtRing.position.set(wd(tgt.x-cam.x),groundY(tgt.x,tgt.y,Lt)+Lt*.02,wd(tgt.y-cam.y));tgtRing.scale.setScalar(Lt*.6);tgtRing.material.opacity=.55+.3*Math.sin(t*8)}else tgtRing.visible=false;
  // plants
  for(const p of world.plants){const H=plantH(p.size);if(!near(p.x,p.y,H)){continue}
    const m=staticFor(p,()=>{const mm=new THREE.Mesh(plantGeo[plantKind(p.size)],plantMats[p.v%4]);mm.castShadow=true;mm.receiveShadow=true;return mm});
    const sc2=H/100*(p.eaten>0?p.eaten/.6:1)*(p.size<=2?.7:1);m.position.set(wd(p.x-cam.x),heightAt(p.x,p.y)-H*.02,wd(p.y-cam.y));m.scale.set(sc2*p.f,sc2,sc2);m.rotation.y=p.rot+Math.sin(t*.8+p.id)*.02;m.visible=sc2>.002}
  // fish
  for(const f of world.fish){const fl=fishLen(f.size);if(!near(f.x,f.y,fl))continue;
    const m=staticFor(f,()=>{const mm=new THREE.Mesh(fishGeos[f.v],fishMat);mm.castShadow=false;return mm});
    const jumpH=f.jump>0?Math.sin((1-f.jump/.9)*Math.PI)*fl*.9:0,sw=Math.sin(t*10+f.id)*.25*(f.sp?1:.3);
    m.position.set(wd(f.x-cam.x),f.dead?0:-fl*.16+jumpH,wd(f.y-cam.y));m.scale.setScalar(fl/100);
    m.rotation.set(f.dead?Math.PI:0,-f.ang+sw*.4,jumpH?Math.cos((1-f.jump/.9)*Math.PI)*.6:0);m.visible=!(f.dead&&!f.meal&&f.dead<=0)}
  for(const [o,m] of statics)if(m.userData.stamp!==stamp){scene.remove(m);statics.delete(o);o._s=null}
  // egg
  if(world.egg){const e=world.egg,s=len(MAXS)*.22,X=wd(e.x-cam.x),Z=wd(e.y-cam.y),gy=heightAt(e.x,e.y);eggMesh.visible=eggGlow.visible=true;
    eggMesh.position.set(X,gy,Z);eggMesh.scale.setScalar(s*1.3);eggMesh.rotation.z=e.hatching?Math.sin(e.t*28)*.12*Math.min(1,e.t):0;
    eggGlow.position.set(X,gy+s*.8,Z);eggGlow.scale.setScalar(s*4.5*(1+.08*Math.sin(t*4)))}else eggMesh.visible=eggGlow.visible=false;
  renderer.render(scene,camera);
}
function badge(sx,sy,txt,col,r){const c=ctx;c.fillStyle="rgba(0,0,0,.55)";c.beginPath();c.arc(sx,sy+1.5,r+2,0,TAU);c.fill();c.fillStyle=col;c.beginPath();c.arc(sx,sy,r,0,TAU);c.fill();
  c.fillStyle="#fff";c.font=`800 ${Math.round(r*1.25)}px "Baloo 2",system-ui,sans-serif`;c.textAlign="center";c.textBaseline="middle";c.fillText(txt,sx,sy+1)}
function overlay(){
  const c=ctx;c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,cw,ch);
  const on=p=>!p.behind&&p.x>-40&&p.x<cw+40&&p.y>-40&&p.y<ch+40;
  // size badges
  if(!me.dead){
    for(const e of world.dinos){if(e.state==="dead"||e.size<me.size-2)continue;const Ld=len(e.size),p=toScr(e.x,e.y,groundY(e.x,e.y,Ld)+tpl(e.sp).top/100*Ld*1.02);if(!on(p))continue;
      const col=e.size<me.size?"#3c9a3a":e.size===me.size?"#d39b18":"#c0392b";badge(p.x,p.y-14,e.size,col,11);
      if(e.dmg>0){const left=needed(e)-e.dmg;for(let k=0;k<needed(e);k++){c.fillStyle=k<left?"#ff4a2a":"rgba(255,255,255,.25)";c.beginPath();c.arc(p.x+(k-(needed(e)-1)/2)*10,p.y-32,3.5,0,TAU);c.fill()}}}
    if(SP[me.sp].meat)for(const f of world.fish){if(f.dead||f.size<me.size-1)continue;const fl=fishLen(f.size),p=toScr(f.x,f.y,fl*.3);if(!on(p))continue;badge(p.x,p.y-12,f.size,f.size<me.size?"#3c9a3a":f.size===me.size?"#d39b18":"#c0392b",9)}
    else for(const p0 of world.plants){if(p0.eaten||p0.size<me.size)continue;const H=plantH(p0.size)*(p0.size<=2?.55:1.15),p=toScr(p0.x,p0.y,heightAt(p0.x,p0.y)+H);if(!on(p))continue;badge(p.x,p.y-12,p0.size,p0.size===me.size?"#3c9a3a":"#c0392b",10)}
  }
  for(const k of me.kids){if(k.born<.4)continue;const Lk=kidLen(k),p=toScr(k.x,k.y,groundY(k.x,k.y,Lk)+tpl(me.sp).top/100*Lk);if(!on(p))continue;c.fillStyle=isTeen(k)?"#ffb03a":"#ff7a9a";c.font=`${Math.round(clamp(Lk*p.ppu*.22,12,22))}px sans-serif`;c.textAlign="center";c.fillText("♥",p.x,p.y-6)}
  // effects
  for(const q of fx){
    if(q.k==="p"){const p=toScr(q.x,q.y,q.g+q.h);if(p.behind)continue;c.globalAlpha=clamp(q.t*2,0,1);c.fillStyle=q.col;c.beginPath();c.arc(p.x,p.y,Math.max(1.2,q.r*p.ppu),0,TAU);c.fill();c.globalAlpha=1}
    else if(q.k==="tap"){if(!q.o)continue;const Lo=q.o.ang!==undefined?fishLen(q.o.size):q.o.sp?len(q.o.size):plantH(q.o.size)*.8,p=toScr(q.o.x,q.o.y,groundY(q.o.x,q.o.y,Lo)),a=clamp(q.t/.5,0,1);if(p.behind)continue;
      c.strokeStyle=`rgba(255,210,120,${a})`;c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,Lo*p.ppu*(.75-.2*a),Lo*p.ppu*(.75-.2*a)*Math.sin(EL),0,0,TAU);c.stroke()}
    else if(q.k==="honk"){const p=toScr(q.x,q.y,camH),a=clamp(q.t/.8,0,1),r=len(me.size)*p.ppu*(1+(1-a)*5);c.strokeStyle=`rgba(255,230,150,${a})`;c.lineWidth=5;c.beginPath();c.ellipse(p.x,p.y,r,r*Math.sin(EL),0,0,TAU);c.stroke()}
    else if(q.k==="star"){const p=toScr(q.x+q.vx*(1.2-q.t),q.y+q.vy*(1.2-q.t),q.g+q.h+q.vh*(1.2-q.t)-len(me.size)*2*(1.2-q.t)**2);if(p.behind)continue;c.globalAlpha=clamp(q.t,0,1);c.fillStyle="#ffd25a";c.font=`${Math.round(18+len(me.size)*p.ppu*.1)}px sans-serif`;c.textAlign="center";c.fillText("★",p.x,p.y);c.globalAlpha=1}
    else if(q.k==="slash"){const p=toScr(q.x,q.y,groundY(q.x,q.y,len(me.size))+q.h);if(p.behind)continue;const s=q.s*p.ppu,a=clamp(q.t/.25,0,1);c.save();c.translate(p.x,p.y);c.scale(q.f,1);c.strokeStyle=`rgba(255,240,220,${a})`;c.lineCap="round";
      for(let k=-1;k<=1;k++){c.lineWidth=Math.max(2,s*.06);c.beginPath();c.moveTo(-s*.4+k*s*.22,-s*.45);c.quadraticCurveTo(k*s*.22+s*.1,0,-s*.2+k*s*.22,s*.45);c.stroke()}
      c.strokeStyle=`rgba(200,30,20,${a*.8})`;c.lineWidth=Math.max(1,s*.025);for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(-s*.4+k*s*.22,-s*.45);c.quadraticCurveTo(k*s*.22+s*.1,0,-s*.2+k*s*.22,s*.45);c.stroke()}c.restore()}
  }
  c.textAlign="center";c.textBaseline="middle";
  for(const q of texts){const p=toScr(q.x,q.y,q.g+q.h);if(p.behind)continue;const up=(1.4-q.t)*30;c.globalAlpha=clamp(q.t*2,0,1);c.font=`800 ${Math.round(clamp(cw/38,18,28))}px "Baloo 2",system-ui,sans-serif`;
    c.lineWidth=4;c.strokeStyle="rgba(0,0,0,.75)";c.strokeText(q.text,p.x,p.y-up);c.fillStyle=q.col;c.fillText(q.text,p.x,p.y-up);c.globalAlpha=1}
  // scary darkness at the edges, red when something big is hunting you
  let danger=0;for(const e of world.dinos)if((e.state==="hunt"||e.state==="wind")&&e.size>me.size)danger=Math.max(danger,e.state==="wind"?1:.55);
  const vg=c.createRadialGradient(cw/2,ch/2,Math.min(cw,ch)*.35,cw/2,ch/2,Math.hypot(cw,ch)*.6);
  vg.addColorStop(0,"rgba(0,0,0,0)");vg.addColorStop(1,danger?`rgba(120,0,0,${.35+.25*danger*(.6+.4*Math.sin(game.t*10))})`:`rgba(0,4,${Math.round(24*(1-dayL))},${.45+.25*(1-dayL)})`);
  c.fillStyle=vg;c.fillRect(0,0,cw,ch);
  if(me.dead){c.fillStyle=`rgba(90,0,0,${clamp(me.deadT*.4,0,.5)})`;c.fillRect(0,0,cw,ch)}
  // arrow to the egg
  if(world.egg&&game.state==="play"){const p=toScr(world.egg.x,world.egg.y,heightAt(world.egg.x,world.egg.y));const m=70;if(p.behind||p.x<m||p.x>cw-m||p.y<m+60||p.y>ch-m){
    const mp=toScr(me.x,me.y,camH);const an=p.behind?Math.atan2(wd(world.egg.y-me.y),wd(world.egg.x-me.x)):Math.atan2(p.y-mp.y,p.x-mp.x);
    const ax=clamp(cw/2+Math.cos(an)*cw,m,cw-m-(Math.sin(an)>.3&&Math.cos(an)>.3?110:0)),ay=clamp(ch/2+Math.sin(an)*ch,Math.cos(an)<0?150:m+20,ch-m);
    c.save();c.translate(ax,ay);c.rotate(an);const pulse=1+.12*Math.sin(game.t*6);c.scale(pulse,pulse);
    c.fillStyle="#4aa8ff";c.strokeStyle="#fff";c.lineWidth=4;c.beginPath();c.moveTo(34,0);c.lineTo(-14,-24);c.lineTo(-4,0);c.lineTo(-14,24);c.closePath();c.stroke();c.fill();c.restore()}}
  net.overlay(c);
  if(location.search.includes("fps")){c.fillStyle="#fff";c.font="14px monospace";c.textAlign="left";c.fillText(`${fps.toFixed(0)} fps  calls ${renderer.info.render.calls}  tris ${(renderer.info.render.triangles/1000).toFixed(0)}k`,12,ch-16)}
}

/* debug hooks for testing in a browser console */
window.DINO={world,game,isWater,get me(){return me},toScr:(x,y,h)=>toScr(x,y,h||0),hitTest,start,collide,save,checkUnlocks,MOVES,isTeen,openBook,obstacles512,grow:()=>{me.food=3;grow()},setSize:s=>{me.size=s;me.food=0;hud()},attack,populate,renderer,scene,camera,THREE,spawnDino,tpl,makeInst,pose};
requestAnimationFrame(frame);
