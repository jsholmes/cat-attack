// Dino Attack multiplayer server.
// One Durable Object holds one shared world ("room"). Every iPad keeps a WebSocket open to it.
//
// Who simulates what: each player's own iPad moves its own dinosaur. The wild dinosaurs, plants and fish
// are simulated by whichever player is nearest ("owner"), and the server only keeps the latest copy,
// decides who owns each one, and sends every player what is near them 20 times a second.
// That keeps the server tiny and the game feeling instant, while everyone still sees the same world.
//
// Messages are JSON. Client -> server:
//   {t:"hi", name, dev}                join or change name (dev = device id: an older connection from the same device is closed); server answers {t:"welcome", pid, base, now} (first time) and {t:"you", name}
//   {t:"nm", name}                     is this name free? server answers {t:"nm", name, ok, mine}
//   {t:"p", s:[x,y,r,playing,...]}     my dinosaur (r = how far I can see, playing = 1 when alive and not paused)
//   {t:"e", u:[[id,k,x,y,...]], g:[id]} wild things I own: upserts (u) and removals (g)
//   {t:"c", id}                        claim a wild thing (I just attacked or ate it)
//   {t:"h", to, sp, size, dmg}         I hit another player
//   {t:"k", by, sp, size}              I was killed by player `by`
//   {t:"reset"}                        I restarted: let go of everything I owned
//   {t:"ping"}                         still here (anyone silent for IDLE_MS is dropped)
// Server -> client:
//   {t:"s", p:[[pid,name|0,...s]], pg:[pid], e:[[id,owner,k,x,y,...]], g:[id]}  what changed near you
//   {t:"bye"}  a newer connection from your device took over (you are disconnected)
//   {t:"h", from, sp, size, dmg}  {t:"k", from, sp, size}  {t:"lb", n, top:[[name,size,sp]]}

const W = 40960; // world size (wraps), same as the game
const wd = d => { d %= W; if (d > W / 2) d -= W; else if (d < -W / 2) d += W; return d };
const dist2 = (ax, ay, bx, by) => { const dx = wd(ax - bx), dy = wd(ay - by); return dx * dx + dy * dy };
const cleanName = v => String(v || "").replace(/[^\p{L}\p{N} '\-!]/gu, "").replace(/\s+/g, " ").trim().slice(0, 14);
const TICK_MS = 50, HANDOFF_MS = 500, LB_MS = 1000, MAX_PLAYERS = 64, MAX_ENTS_PER_PLAYER = 500, IDLE_MS = 15000;

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/room\/([a-z0-9-]{1,24})$/i);
    if (m) {
      if (req.headers.get("Upgrade") !== "websocket") return new Response("Expected a WebSocket", { status: 426 });
      const stub = env.WORLD.get(env.WORLD.idFromName(m[1].toLowerCase()));
      return stub.fetch(req);
    }
    return new Response("Dino Attack server is running. Connect to /room/world with a WebSocket.", { headers: { "content-type": "text/plain" } });
  },
};

export class World {
  constructor(state, env) {
    this.players = new Map(); // pid -> player
    this.ents = new Map();    // id -> {id,k,x,y,d,owner,ver}
    this.nextPid = 1;
    this.timer = null;
    this.lastHandoff = 0; this.lastLb = 0;
  }

  async fetch(req) {
    if (this.players.size >= MAX_PLAYERS) return new Response("World is full", { status: 503 });
    const pair = new WebSocketPair();
    const ws = pair[1];
    ws.accept();
    const pid = this.nextPid++;
    const p = { pid, ws, name: "Dino", s: null, x: 0, y: 0, r: 0, playing: false, ver: 0, kp: new Map(), ke: new Map(), joined: false, dev: "", seen: Date.now() };
    this.players.set(pid, p);
    ws.addEventListener("message", ev => { try { this.onMsg(p, JSON.parse(ev.data)) } catch (e) { } });
    const bye = () => this.leave(p);
    ws.addEventListener("close", bye); ws.addEventListener("error", bye);
    if (!this.timer) this.timer = setInterval(() => this.tick(), TICK_MS);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  send(p, o) { try { p.ws.send(JSON.stringify(o)) } catch (e) { } }

  // drop a connection for good (and tell everyone else it's gone on the next tick)
  kick(q, why) {
    if (why) this.send(q, { t: why });
    try { q.ws.close(1000, why || "idle") } catch (e) { }
    this.leave(q);
  }

  onMsg(p, m) {
    p.seen = Date.now();
    switch (m.t) {
      case "nm": { // is this name free? (someone else connected right now has it = taken)
        const n = cleanName(m.name);
        this.send(p, { t: "nm", name: n, ok: !!n && !this.taken(n, p), mine: !!n && n.toLowerCase() === p.name.toLowerCase() });
        break;
      }
      case "hi": {
        // the same device connecting again (reload, other tab, phone woke up): the old connection is a ghost now
        const dev = typeof m.dev === "string" ? m.dev.slice(0, 20) : "";
        if (dev) { p.dev = dev; for (const q of [...this.players.values()]) if (q !== p && q.dev === dev) this.kick(q, "bye") }
        let n = cleanName(m.name) || "Dino";
        if (n !== "Dino" && this.taken(n, p)) { const base = n.slice(0, 11); for (let k = 2; this.taken(n, p); k++) n = base + " " + k }
        p.name = n;
        this.send(p, { t: "you", name: n });
        for (const q of this.players.values()) q.kp.delete(p.pid); // others get the new name
        if (!p.joined) this.send(p, { t: "welcome", pid: p.pid, base: p.pid * 1e6, now: Date.now() });
        p.joined = true;
        break;
      }
      case "p": {
        const s = m.s; if (!Array.isArray(s) || s.length > 40) return;
        p.s = s; p.x = +s[0] || 0; p.y = +s[1] || 0; p.r = Math.min(30000, +s[2] || 0); p.playing = s[3] === 1; p.ver++;
        break;
      }
      case "e": {
        if (Array.isArray(m.u)) for (const u of m.u) {
          if (!Array.isArray(u) || u.length > 40) continue;
          const id = u[0]; if (typeof id !== "number") continue;
          let e = this.ents.get(id);
          if (e && e.owner !== p.pid) continue; // someone else owns it now
          if (!e) {
            if (p.count >= MAX_ENTS_PER_PLAYER) continue;
            e = { id, k: u[1], owner: p.pid, ver: 0 }; this.ents.set(id, e); p.count = (p.count || 0) + 1;
            p.ke.set(id, [-1, p.pid]); // the owner already has it: don't echo it back
          }
          e.x = +u[2] || 0; e.y = +u[3] || 0; e.d = u; e.ver++;
        }
        if (Array.isArray(m.g)) for (const id of m.g) { const e = this.ents.get(id); if (e && e.owner === p.pid) this.drop(e) }
        break;
      }
      case "c": { const e = this.ents.get(m.id); if (e && e.owner !== p.pid) this.give(e, p); break }
      case "h": { const q = this.players.get(m.to); if (q) this.send(q, { t: "h", from: p.pid, sp: m.sp, size: m.size, dmg: Math.min(3, m.dmg | 0 || 1) }); break }
      case "k": { const q = this.players.get(m.by); if (q) this.send(q, { t: "k", from: p.pid, sp: m.sp, size: m.size }); break }
      case "reset":
        for (const e of [...this.ents.values()]) if (e.owner === p.pid) this.rehome(e, p);
        p.kp.clear(); p.ke.clear();
        break;
    }
  }

  taken(n, p) { n = n.toLowerCase(); for (const q of this.players.values()) if (q !== p && q.joined && q.name.toLowerCase() === n) return true; return false }
  drop(e) { this.ents.delete(e.id); const o = this.players.get(e.owner); if (o) o.count = Math.max(0, (o.count || 1) - 1) }
  give(e, to) { const o = this.players.get(e.owner); if (o) o.count = Math.max(0, (o.count || 1) - 1); e.owner = to.pid; to.count = (to.count || 0) + 1; e.ver++ }
  // the owner is leaving: give it to the nearest player who can see it, or remove it
  rehome(e, except) {
    let best = null, bd = Infinity;
    for (const q of this.players.values()) {
      if (q === except || !q.playing || !q.s) continue;
      const d = dist2(e.x, e.y, q.x, q.y); if (d < q.r * q.r && d < bd) { bd = d; best = q }
    }
    if (best) this.give(e, best); else this.drop(e);
  }

  leave(p) {
    if (!this.players.has(p.pid)) return;
    this.players.delete(p.pid);
    for (const e of [...this.ents.values()]) if (e.owner === p.pid) this.rehome(e, p);
    if (!this.players.size) { clearInterval(this.timer); this.timer = null; this.ents.clear() }
  }

  // every half second: whoever is clearly nearest to a wild thing takes it over, so it hunts them and they see it move smoothly
  handoff() {
    const live = [...this.players.values()].filter(q => q.playing && q.s);
    for (const e of this.ents.values()) {
      const o = this.players.get(e.owner);
      if (!o) { this.rehome(e, null); continue }
      const dOwn = dist2(e.x, e.y, o.x, o.y);
      let best = null, bd = Infinity;
      for (const q of live) { if (q === o) continue; const d = dist2(e.x, e.y, q.x, q.y); if (d < bd && d < q.r * q.r) { bd = d; best = q } }
      if (!best) continue;
      if (!o.playing || bd < dOwn * 0.36) this.give(e, best); // 0.36 = (0.6)^2: the new player is under 60% of the owner's distance
    }
  }

  tick() {
    const now = Date.now();
    if (now - this.lastHandoff > HANDOFF_MS) { this.lastHandoff = now; this.handoff() }
    // a phone that went to sleep can leave its connection open without ever saying goodbye: let it go
    for (const q of [...this.players.values()]) if (now - q.seen > IDLE_MS) this.kick(q);
    if (!this.players.size) return;
    const all = [...this.players.values()];
    for (const p of all) {
      if (!p.joined || !p.s) continue;
      const out = { t: "s" }; const ps = [], pg = [], es = [], g = [];
      const R2 = p.r * p.r, RP2 = (p.r * 1.3) ** 2;
      for (const q of all) {
        if (q === p || !q.s) continue;
        const near = dist2(p.x, p.y, q.x, q.y) < RP2, known = p.kp.get(q.pid);
        if (near) { if (known !== q.ver) { ps.push([q.pid, known === undefined ? q.name : 0, ...q.s]); p.kp.set(q.pid, q.ver) } }
        else if (known !== undefined) { pg.push(q.pid); p.kp.delete(q.pid) }
      }
      for (const pid of p.kp.keys()) if (!this.players.has(pid)) { pg.push(pid); p.kp.delete(pid) }
      for (const e of this.ents.values()) {
        const near = dist2(p.x, p.y, e.x, e.y) < R2, known = p.ke.get(e.id);
        if (near) {
          if (!known || known[0] !== e.ver) {
            // skip echoing a player's own updates back, but tell them when they gain or lose ownership
            if (e.owner === p.pid) { if (!(known && known[1] === p.pid)) es.push([e.id, e.owner, ...e.d.slice(1)]) }
            else es.push([e.id, e.owner, ...(e.k === "d" ? e.d.slice(1, 16) : e.d.slice(1))]); // watchers only need how it looks; a new owner gets everything
            p.ke.set(e.id, [e.ver, e.owner]);
          }
        } else if (known) {
          p.ke.delete(e.id); if (e.owner !== p.pid) g.push(e.id);
        }
      }
      for (const id of p.ke.keys()) if (!this.ents.has(id)) { g.push(id); p.ke.delete(id) }
      if (ps.length) out.p = ps; if (pg.length) out.pg = pg; if (es.length) out.e = es; if (g.length) out.g = g;
      if (ps.length || pg.length || es.length || g.length) this.send(p, out);
    }
    if (now - this.lastLb > LB_MS) {
      this.lastLb = now;
      const top = all.filter(q => q.s && q.s[3] >= 1 && !q.s[10]).map(q => [q.name, q.s[6] | 0, q.s[5]]).sort((a, b) => b[1] - a[1]).slice(0, 8);
      for (const p of all) if (p.joined) this.send(p, { t: "lb", n: all.filter(q => q.joined).length, top });
    }
  }
}
