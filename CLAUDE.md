# CLAUDE.md: Kit's games

Read this first if you are a new Claude picking up this project cold.

## What this is

Browser games designed by **Kit** (John's 7-year-old) to play on an iPad, alone and with friends. Kit is the creative director and **John** (GitHub `jsholmes`) is the producer who relays Kit's requests. Kit can't read yet, so on-screen text should be short, and anything meant for Kit should be pictures plus read-aloud, not documents.

The design is kid-directed: Kit's words are the spec. When Kit asks for something vague ("make the bord bigger", "more big gies"), pick the most likely reading, build it, and tell John which parts were guesses so Kit can correct them. On-screen text uses correct spelling (John's rule), but the hero's name is still spelled Kit's way in places ("cat atack").

All the games here are plain static HTML/JS with no framework and no npm. GitHub Pages serves `main`, so **merging to main is deploying**.

| Game | Live link | Source |
|---|---|---|
| Cat Attack (snake-style: eat, grow, beat 15 dragon bosses) | https://jsholmes.github.io/cat-attack/ | `index.html` (one self-contained file, v17) |
| Big Chomp (3D dinosaur survival, multiplayer) | https://jsholmes.github.io/cat-attack/dinos/ | `dinos/src/*.js` built into `dinos/index.html` |
| Dino Attack 2D (old 2D Big Chomp, v6, kept as a fallback) | https://jsholmes.github.io/cat-attack/dinos-2d/ | `dinos-2d/index.html` |
| Games hub (Kit's and Addie's games on one page) | https://jsholmes.github.io/games/ | separate repo `jsholmes/games` (`index.html` + `img/`, add a game = one line in the `GAMES` list) |

`/dinos-3d/` only redirects to `/dinos/`. Addie has games too, such as https://jsholmes.github.io/best-tree-friends/ (repo `jsholmes/best-tree-friends`), made in a different project.

## Working rules (John's)

- **Merge game PRs yourself, without asking**, so the change goes live and Kit and John can test it on the iPad. Then tell John it's live.
- **iPad first.** Everything is touch-driven (drag to move, tap to act) and must also work on iPhone and with a keyboard. Test with an iPad-sized viewport (and a phone one) before merging. Kit plays from a home-screen icon (`manifest.json`, `icon.png`, `icon-512.png` per game).
- Iterate on visuals by rendering the game (Playwright screenshots) and comparing, not by guessing.
- Keep a list of guesses in the PR body and in the design notes so John can check them with Kit.

## Cat Attack (`index.html`)

Kit's first game, from Kit's "Dragon Killers" worksheet. You steer Cat Attack (a striped cat-snake on four paddle feet) around a board bigger than the screen; eat eggs and little dragons to grow, the glowing egg makes you GiGantic, and you crunch 15 different dragon bosses, one per level. Bigger eats smaller (you must be about 1.2x bigger). Small harmless snakes give speed boosts; 5 big roaming snakes chase you when they're bigger. Losing offers "restart level N" or start over. Best score is in localStorage `catattack-best`.

It's one hand-written file. Version history and every rule/guess are in `docs/design/cat-attack/PROTOTYPE_NOTES.md`. Kit's original design (canon, in Kit's exact words) is in `docs/design/dragon-killers-phase-1/KIT_CANON.md`. Still open from Kit's canon and not built: 2-player versus joined by QR code, and building a castle from blocks won between games.

## Big Chomp (`dinos/`)

Kit's dinosaur game, renamed from "Dino Attack" to "Big Chomp" on 2026-11-23 (the URL and save key stayed). Three.js r170 is vendored as `dinos/three.module.min.js`; all ~26 dinosaurs are procedural skinned models built in code.

**Spec from Kit:** pick a dinosaur and start as a baby in a huge wrapping open world (varied terrain, lakes and rivers with fish, day/night, no volcanoes or lava, no people, realistic and a bit scary). Drag to walk, tap to attack. Hits needed = how many sizes bigger the target is; anything smaller dies in one hit, and a bigger dino kills you in one hit if it gets you first. Meat eaters eat their kills; plant eaters fight but only eat plants, and they have special moves (tail club, charge, spikes). Eat 3 of your size for a star and grow; 10 sizes. Die and you restart as a baby. At size 10 a blue arrow leads to an egg that hatches your own baby; it follows you, eats your kills and grows into a teen that fights with you. Flyers (Nemicolopterus, Quetzalcoatlus). A Dino Book collects what you've played and eaten. Stop at water (or tap it) to drink for a short speed boost (no thirst meter, on purpose).

**Unlocks** (`UNLOCK` in `dinos/src/game3d.js`): Giganotosaurus (grow a T-Rex to 10), Quetzalcoatlus (grow a Nemicolopterus to 10), Utahraptor (grow a Velociraptor to 10), Baryonyx (catch 10 fish), Diplodocus (grow a Brachiosaurus to 10), Styracosaurus (grow a Triceratops to 10), Argentinosaurus (grow 3 different dinos to 10). Progress is saved in localStorage key `dinoAttack3d`.

**Build step.** Never hand-edit `dinos/index.html`. Edit the sources and run:

```
python3 dinos/build.py
```

It takes the markup, CSS, species table and ground/noise code from `dinos-2d/index.html` (by line numbers, with asserts, so be careful editing that file) and appends `src/models.js` (3D models), `src/world3d.js` (terrain, scenery, rock collision), `src/game3d.js` (gameplay, unlocks, book, render) and `src/net.js` (multiplayer). Commit the rebuilt `index.html` with the source change.

**Debug URL flags:** `?fps` frame rate, `?unlockall` unlock every dino, `?solo` offline, `?room=name` private multiplayer room, `?server=ws://...` another server. `window.DINO` exposes start, grow, setSize, attack, spawnDino and more for Playwright tests.

## Multiplayer server (`dino-server/`)

Everyone shares one live world, like Snake Clash. A Cloudflare Worker named `dino-attack-server` with one Durable Object (`World`) per room; the default room is `world`. Chosen over Vercel because Vercel can't hold WebSockets. Protocol is documented at the top of `dino-server/src/index.js`. The client is `dinos/src/net.js`, with `NET_SERVER = wss://dino-attack-server.prue-starfield-cloudflare.workers.dev`.

Design: each iPad simulates its own dino. Each wild dino, plant and fish is run by the nearest player (its "owner") and the server hands ownership over; attacking or eating something claims it. Other players appear in `world.dinos` as `remote` pseudo-dinos (`player:pid`). PvP uses the same hits-needed rule and the victim's device decides the death. Day/night follows the server clock. `game3d.js` calls `net.keep/claim/attack/tick/render/overlay/reset/clock` in several places; keep those hooks when editing it. Names are unique per room (the name box shows free or taken). A newer connection from the same device (`dinoDev` id) kicks the older one, and players silent for 15 s are dropped.

**Deploying the server.** Pages does not deploy it. Two ways:

1. **By hand with wrangler** (how it has been done so far, from John's Mac where wrangler 4 is logged in to John's Cloudflare account): `cd dino-server && npx wrangler deploy`. Ask John before deploying; it changes the live shared world.
2. **GitHub Action** `.github/workflows/deploy-dino-server.yml` deploys on any push to main that touches `dino-server/`, but only once the repo secrets `CLOUDFLARE_API_TOKEN` (an "Edit Cloudflare Workers" token) and `CLOUDFLARE_ACCOUNT_ID` are set. They are not set yet, so the Action just prints "skipping". Adding them would make server deploys automatic like the games.

Cloud sandboxes usually can't reach `api.cloudflare.com` or `*.workers.dev`, so test the live server from a real device or John's Mac. Locally, `npx wrangler dev` in `dino-server/` and `?server=ws://localhost:8787` works.

## Status (2026-11-24)

- Everything is merged to `main`; there are no open PRs. Leftover `claude/project-thread-*` branches are old and fully contained in main.
- The server code on main includes the duplicate-player ("second Kit") fix from PR #24. John approved redeploying it on 2026-11-24 and it was being redeployed from John's Mac that day.
- Ideas not built yet for Big Chomp: `docs/design/big-chomp/20_ideas_2026-11-23.md` (boss dinos, warning signs, hiding spots, packs, mini-map, herds and more). Several (Dino Book, plant-eater moves, night) are already done.

## Where else things live

- `docs/design/`: copies of the design docs from the original claude.ai project. `dragon-killers-phase-1/` is Kit's worksheet interview (canon, brief, questions); `cat-attack/PROTOTYPE_NOTES.md` is the Cat Attack version log and guess list; `big-chomp/` has playtest ideas.
- The original claude.ai project's shared folder also held Kit's scanned worksheet (PDFs and page images, kept private on purpose), old prototype HTML versions (Cat Attack v0 to v16, Dino Attack 2D v1 to v5, whose later versions are in this repo's git history), and comparison screenshots. None of that is needed to keep building.
- The games hub page is the `jsholmes/games` repo, not this one. It may still call Big Chomp "Dino Attack".
