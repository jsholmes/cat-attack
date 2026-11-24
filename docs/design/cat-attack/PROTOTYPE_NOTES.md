# Cat Attack (Phase 2 prototype)

**Current: v17** (`cat_attack_v17.html`, 2026-11-12). Kit: "mace their be more big gies" (read as: more big snakes) and "make the bord bigger". It's v16 plus:
- **Big snakes:** 5 big non-boss snakes roam the board. Each has its size in a bubble over its head, like the numbers at the top: **green** = you're a bit bigger, so you can eat it (+5 points, and you grow a quarter of its size); **red** = it's a bit bigger and can eat you; **grey** = same size, you just slide along it. A red one that you can see will chase you for a few seconds ("uh oh!", angry eyebrows, open mouth), then gives up and rests. If it bites you, you lose ("a big snake got you!"), and "restart level" works as before. Big snakes eat eggs and small snakes and grow; a boss can eat a big snake that's smaller than it. About half start smaller than you and half bigger.
- **Bigger board:** 3600×2400 (was 2400×1600), with 60 eggs/little dragons and 12 small snakes so it isn't empty.
- End screen tally adds "big snakes (5 each)". Pictures: `comparisons/v17_big_snakes.png`, `comparisons/v17_play.png`.
- **Guesses for Kit to approve:** that "big guys" means big snakes (not more bosses at once); 5 of them; their looks (spotted, 4 colours); the coloured size bubbles; that they only chase when on screen, for about 4.5 s; that being eaten by one ends the game; board size 3600×2400.

**v16** (`cat_attack_v16.html`, 2026-11-12). Kit: "make the bord so you cant see the holl thing". It's v15 plus:
- The board is now bigger than the screen, and the view follows Cat Attack around (smoothly, stopping at the board's edges).
- When the boss is off the screen, an arrow at the screen edge (in the boss's colours) points to it.
- Banners like "Level up!", "FASTER!" and "here comes a dragon!" stay fixed on the screen; "CRUNCH!"/"om nom nom" still pop where things get eaten.
- Steering still works when you hold your finger still: the finger is stored as a screen position and turned into a board position every frame.
- Also mirrored to `../web/index.html`. Picture: `comparisons/v16_big_board.png` (iPad left, phone right).
- **Guesses for Kit to approve:** board size 2400×1600 (about 2 iPad screens each way); faint graph-paper lines so you can see you're moving; 30 eggs/little dragons on the board (was 8) and 8 small snakes (was 3–4); the boss arrow; a new boss starts about one screen away from you, facing you.

**v15** (`cat_attack_v15.html`, 2026-11-12). John: "let's make it so kit can play this game on any browser, including on the ipad". No gameplay changes; it's v14 plus:
- It's now a complete web page (doctype, viewport, iPad home-screen tags, icon, manifest), so it can be hosted anywhere, not just as a claude.ai artifact. The hostable copy is in `../web/` (`index.html` = v15, plus `icon.png`, `icon-512.png`, `manifest.json`). "Add to Home Screen" on the iPad gives a Cat Attack icon that opens full screen.
- Touch: pinch-zoom, double-tap zoom, page bounce, the long-press menu and the grey tap flash are blocked. Each finger is tracked, so a second hand touching and lifting doesn't stop the steering finger (the newest finger steers). The start and game-over screens can still scroll on short screens.
- Sound: unlocks on any tap, comes back after switching apps, and plays even with the iPad's silent switch on (Safari 16.4+).
- Rotating the iPad re-measures the board.
- Tested in Chromium emulating iPad Pro 11 (landscape), iPad gen 7 (portrait) and iPhone 13 (landscape): Play by tap, steering by touch, second finger lift, pinch blocked, overlay scroll, no errors. Not tested on real Safari/WebKit (not available here).

**Current: v14** (`cat_attack_v14.html`, 2026-11-12). Kit: "i want the restart button to be a button that when you loos you restart the levle".
- When a dragon gets you on level 2 or later, the game-over screen has a big **"↻ restart level N"** button. It puts you back at the start of that level, with the same boss and the same size, score and speed-ups you had when that boss arrived. You're safe for 2 s. A smaller "start over from level 1" button is under it. On level 1 there's just "Play again". Picture: `comparisons/v14_lose.png`.
- The v13 restart button in the top bar is gone, because Kit wanted the restart on the lose screen instead.
- The game-over screen now fits on a phone held sideways.
- Tested: lost on level 4 against the fire dragon, pressed restart level, and got level 4 and the fire dragon again with the score, size and speed-ups restored. "Start over" goes back to level 1. No errors.

**Current: v13** (`cat_attack_v13.html`, 2026-11-12). John couldn't find the v12 ↻ button, so it's now a red "↻ restart" pill in the top bar, and just a red ↻ circle on phones (`comparisons/v13_hud_desktop.png`).

**Current: v12** (`cat_attack_v12.html`, 2026-11-12). There's now a restart button (↻) in the top bar next to sound. It starts a fresh game straight away, with no "are you sure?" (a guess). Tested: it resets the level, score and speed-ups, and pressing it during the "CHOMP!" pause no longer lets the old game-over screen pop up over the new game. It fits on a 360 px phone.

**Current: v11** (`cat_attack_v11.html`, 2026-11-12). "there should be three more bosses". There are now 15, and you win by crunching all 15. The 3 new ones are guesses for Kit. Picture: `comparisons/v11_three_new.png`.

| Level | Boss | Look | Trick |
|---|---|---|---|
| 13 | lava dragon | rocky lumps, glowing orange cracks, dark jagged wings, glowing eye | drips lava puddles that last 6 s; touching one makes you 10% smaller |
| 14 | spiky dragon | covered in long quills | shoots 8 spikes in every direction every 3 s; a hit makes you 10% smaller |
| 15 | dragon emperor | rainbow scales, crown with three gems, star eye, 4 rainbow wings | uses other bosses' tricks in turn: fireball, lightning, 3 rockets, zoom |

They're the fastest and biggest so far: speed 194 to 198, starting at 1.15× to 1.2× your size, growing 11.5 to 13 per second. Being GiGantic blocks lava, spikes and the emperor's attacks.
- **Tested:** each was started on its own with a robot player. All tricks fired, a lava hit was checked directly, and beating the emperor shows the win screen. No errors.

**Current: v10** (`cat_attack_v10.html`, 2026-11-11). Kit: "when you bump a boss you go in a differt derecishon". This was read as a complaint, so a same-size bump no longer turns you. You keep going your way and slide along the boss as if it were a wall. Test: steering into a boss caused 0 sudden turns and the cat stayed on its own side (`comparisons/v10_slide_along_boss.png`). If Kit actually *wanted* a bounce, v9 has the old behaviour.

**Current: v9** (`cat_attack_v9.html`, 2026-11-11). The win screen now says "you beat all the bosses." (John asked for the correct spelling; Kit wrote "beet" on page 5). The title "cat atack" and "you won (Rrunch!" still use Kit's spelling.

**Current: v8** (`cat_attack_v8.html`, 2026-11-10). John: "more smaller snakes that aren't bosses and if you eat 2 of the smaller snakes you become faster in that game."
- **Small snakes:** up to 4 at a time (3 on a phone). A new one slides in from the edge about 2.5 s after one is eaten. They eat eggs, run away when you get close, and can't hurt you. Bosses can eat them too and grow from it. Picture: `comparisons/v8_small_snakes.png`.
- **Faster:** every 2 small snakes you eat makes you 12% faster, up to 5 times (60% faster), for the rest of that game. A ⚡ appears next to the level for each speed-up, and "FASTER!" pops up. Turning gets a little quicker too, so you can still steer. It resets on Play again.
- Each small snake is worth 3 points and makes you a bit longer. The end screen counts them.
- **Guesses for Kit:** how they look (olive, brown and teal pencil snakes with diamonds and a forked tongue), that the boost stacks, the 12%, the cap of 5, that they can't hurt you, and that bosses eat them.
- **Tested:** a robot that chased small snakes got its first speed-up at about 8 s and reached the maximum in about 30 s. No errors.

**Current: v7** (`cat_attack_v7.html`, 2026-11-09). Bug fixes from John's play-testing:
- **Giant bite.** When GiGantic, a dragon touching your neck could get eaten. That happened because the bite was measured from the body point, while the head is drawn further forward. Now only the face you see can bite, for eggs too. Test: a dragon across your neck used to be eaten and now survives; a dragon across your face is still eaten. Picture: `comparisons/v7_bite_zone.png`, where green is the new bite zone and red is the old one.
- **Stuck, flickering snakes.** You and the dragon both hit the old size limit of 75, so you were always the "same size". The bounce also flipped you every frame, which made you flicker. Now you bounce once, pointed away from the dragon and pushed clear. The size limit is about twice as big (150 on a laptop screen). Test: the same tangle as John's screenshot went from 19 direction flips in 3 seconds to 3 clean bounces.
- The end screen no longer says "level 13" after beating all 12.
- **Tested:** a robot player beat all 12 bosses in 198 s with no errors. Picture: `comparisons/v7_stuck_before_after_and_win.png`.

**Current: v6** (`cat_attack_v6.html`, 2026-11-08). John asked for 7 more bosses that are harder and not like the first five. There are now 12, and you win by crunching all 12. The 7 new ones are all guesses for Kit to change. Pictures: `comparisons/v6_seven_new.png` and `comparisons/v6_bosses_in_game.png`.

| Level | Boss | Look | Trick |
|---|---|---|---|
| 6 | ice dragon | crystal spikes, icicles, ice-shard wings | spits ice balls; a hit freezes you at half speed for 2 s |
| 7 | two-headed dragon | red with spots, a head at both ends | the tail head can eat you too |
| 8 | ghost dragon | see-through, wispy, hollow eyes, tattered wings | vanishes and pops up near you ("boo!") |
| 9 | storm dragon | lightning bolt down its body, clouds, bolt wings | marks where you are, then lightning hits there 1 s later; a hit makes you smaller |
| 10 | hungry dragon | very fat, huge mouth with extra teeth, tiny wings | breathes in ("SSSLURRP!"), pulling eggs and you toward its mouth |
| 11 | robot dragon | metal plates, bolts, antenna, red visor, panel wings | fires 3 rockets at once; a hit makes you smaller |
| 12 | shadow dragon | dark, smoky, glowing red eyes, big horns | the lights go out except around you, and it zooms in the dark |

Each new boss starts bigger (1.0× to 1.15× your size), grows faster (7 to 11 per second), moves faster and turns sharper than the one before. Being GiGantic protects you from ice, fire, lightning and rockets.
- **Tested:** each new boss was started on its own with a robot player. All the tricks fired, with no errors. Levels 10 to 12 caught the robot within 5 to 8 s, so they are very hard; the glowing egg is the way to beat them.

**Current: v5** (`cat_attack_v5.html`, 2026-11-08). Changes from John:
- **Five really different dragons, not just colours.** Each one has its own body, head, wings and trick. Only the blue dragon is Kit's; the other four are guesses for Kit to change. Picture: `comparisons/v5_five_dragons.png`.

| Level | Dragon | Body | Head | Wings | Trick |
|---|---|---|---|---|---|
| 1 | blue dragon (Kit's p5) | zig-zag, small spikes | Kit's "<" jaws, 2 horns | Kit's p2 double ovals | none |
| 2 | sneaky dragon (green) | round back plates, scales | round snout, sleepy half-shut eye | leaf wings | fades almost invisible for a second every 7 s |
| 3 | bat dragon (purple) | stripy rings | pointy ear, fangs, red eye | bat wings with finger bones | zooms at double speed every 3 s |
| 4 | fire dragon (orange) | flames along the back, glowing dots | flame horns | flame wings | spits a fireball every 3 s; a hit makes you 15% smaller (not game over) |
| 5 | king dragon (black) | spikes on both sides, belly scales, arrow tail | crown, beard, bigger head | 4 big feathered wings | stops, roars, then charges |

Each one also starts bigger, grows faster and turns sharper (numbers in the v4 table, slightly slower top speeds now).
- **Same size = nobody can eat** (John, 2026-11-08). To eat, you or the dragon must be 20% bigger (a guess; was 5%). If you bump at about the same size, you both bounce off with a "boing" and "same size! nobody can eat". The size badge outline shows who is big enough to eat right now.
- **Tested:** a robot player that eats and runs away won in 49 to 87 s (one run of 4 was still going when the test stopped). A player who does nothing was eaten in 16 to 25 s. A fireball hit and a same-size bump were checked on their own. No errors.

**Current: v4** (`cat_attack_v4.html`, 2026-11-08). Changes from John and Kit:
- **If the dragon eats you, you lose.** You get "CHOMP!" and the game-over score screen. This replaces Kit's earlier answer that getting eaten "lost a level" (John, 2026-11-08).
- **The dragon keeps growing** while it is alive, and it also eats eggs. If you stand still, it catches you in about 10 to 30 s.
- **Each dragon you crunch brings a different, harder one, and a new level** (John, 2026-11-08). A banner says "Level 2: the green dragon!" and the dragon size badge changes colour.

| Level | Dragon | Speed | Starts at (× your size) | Grows per second | Looks |
|---|---|---|---|---|---|
| 1 | blue dragon (Kit's) | 150 | 0.7 | 2.5 | 2 horns, 2 wings |
| 2 | green dragon | 165 | 0.8 | 3.5 | 3 horns, bigger spikes |
| 3 | purple dragon | 178 | 0.9 | 4.5 | 4 wings |
| 4 | fire dragon | 190 | 0.95 | 5.5 | orange, breathes fire when its mouth opens |
| 5 | king dragon | 200 | 1.0 | 6.5 | black, gold crown |

Later dragons also turn faster. Pictures: `comparisons/v4_five_dragons.png`, `v4_levels.png`, `v4_dragon_eats_you.png`.
- **Tested** with a robot player that eats and runs away: it won in 40 to 65 s across 4 runs. A player who does nothing was eaten in 11 to 34 s. No errors.
- **Guesses for Kit:** the 4 new dragons' colours, names, horns, crown and fire, and every number in the table.

**Current: v3** (`cat_attack_v3.html`, 2026-11-08). Changes from John and Kit:
- **Stripes stay when GiGantic.** This replaces the v1 guess that Mega Me loses them. The stick legs still disappear.
- **The game ends.** If a dragon eats you at Level 1, it says "the dragon got you!". If you crunch 5 dragon snakes, it says "you won (Rrunch!" / "you beet all the bosses.".
- **End screen:** your score (each egg or little dragon is 1, each dragon snake is 10), the tally, your best score on this device, and Play again.
- **Eaten dragons die visibly:** they shrink and fade with X eyes. "here comes another dragon!" shows up, then a new one arrives about 4.5 s later.
- **Biting a bigger dragon** says "too big to eat! grow first".
- **Guesses:** 5 dragons to win, and the scoring numbers.


**Current: v2** (`cat_attack_v2.html`, 2026-11-08). It adds the dragon snake, as Kit described it through John: an enemy snake that tries to get bigger than you, looks like a dragon with wings, and can eat you while you try to eat it.
- **From Kit:** the open "<" jaws and zig-zag body come from p5. The wings are his p2 "little dragon" double shape. "you lost a level" and "Level up" are from p5 and his 2026-11-08 answers.
- **Rules:** the bigger snake wins. Your head has to touch any part of the dragon, or its head has to touch any part of you. Being GiGantic counts as 3× your size. Eat it and you get "Level up!", grow, and the dragon comes back 3.5 s later, a bit faster each level. If it eats you, you get "you lost a level" (never below Level 1), shrink back to the start size, and blink safe for 2.5 s.
- **Guesses for Kit:** the dragon is drawn in blue pencil so it stands out (Kit drew everything in red); the size numbers in the top bar; the dragon is a little slower than you.


**Current: v1** (`cat_attack_v1.html`, 2026-11-08). It adds a chomp: the mouth opens as food gets close, snaps shut with a squint and crumbs, then chews. Head, sticks, paddles, stripes, tail, Mega Me, eggs and the board were redrawn by comparing them side by side with Kit's pages; see `comparisons/`. v1 also fixes a bug where v0 drew his face looking backwards.

### v1 guesses to check with Kit
- When GiGantic he turns into Mega Me from page 4: no stripes, no stick legs, a square head, dash eyes and a nose dot.
- The sticks always stand upright, like on page 1, instead of turning with the body.

---
## v0 notes
Playable page: https://claude.ai/artifact/AJjFwGcrS8tQs6T4diNcKC (private). Source: `cat_attack_v0.html`, a single file you can also open in any browser.

Built 2026-11-08 because Kit chose "cat attack" as the first thing to make move (see Phase 1 `output/KIT_CANON.md` §4).

## From Kit (canon)
- Cat Attack's look from p1: cat head, long striped body, pointy tail, and two sticks with three-toed paddle-feet at both ends. These are drawn in code (no AI art).
- Curvy, swooping movement (p2).
- Little dragons and snake eggs you eat (his 2026-11-08 answer). The shapes are copied from his p2 scribbles.
- Glowing egg → "you become GiGantic" (p4).
- "Rrunch!" / "om nom nom" (p6).
- Played "on a bord" (p3).

## Guesses for Kit to approve or change
- Cat Attack gets longer each time he eats something ("they're bigger" is still unclear).
- Giant mode lasts 7 seconds. It's 2.4× size and a bit faster.
- He bounces off the board edges and can't get hurt. There are no bad guys yet.
- His face always stays upright and turns left or right with him.
- The legs swing as he moves.

## Not in v0
Enemy snakes, bosses, losing or levelling up, two-player QR/password join, the castle and blocks, sound beyond simple blips.
