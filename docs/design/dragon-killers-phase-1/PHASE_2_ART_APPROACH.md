# Phase 2 art policy — design under Kit's direction
**Not part of the Phase 1 assignment.** This document is a future guardrail for using image-generation tools, potentially GPT Image 2.5.

## The idea
Use **Kit's original drawings** as explicit image references, with his agreement and the parent's direction. The point is not to transform his work into generic high-polish fantasy art. The point is to explore what **he** meant.

## Ask permission and choose a source drawing
At the start of a session, ask Kit which of his drawings he wants to improve/extend. Let him choose the mood and 2-3 details the result *must keep*. The parent can upload the matching crop or page. Keep the original beside every generated version.

## Three optional explorations
1. **Faithful redraw:** preserve creature proportions, head, stripes, appendages, primary colors, personality; only clean the edges and improve legibility.
2. **Playable game art:** same visual identity from a usable side/top/isometric view, ideally separated hero/background for future sprites. Do not 'correct' anatomy without permission.
3. **Epic cover:** cinematic poster composition but the same creature identity. Explicitly allow Kit to reject it if it looks like someone else's character.

Each prompt must identify: `Source: Kit scan page X`, `Non-negotiable details from Kit`, `Uncertain features — do not assume`, `What Kit requested`, `What the model may improvise`, and `Needed output (concept art vs sprite/reference)`. AI output is **proposal**, never canon until Kit approves it.

## Feedback loop
Show 2–3 images maximum at a time, preferably with the original. Ask Kit what to **keep**, **change**, **delete**, and what it should **do** in game. Record his words and revisions. Permit drawing over the printout. When he rejects all images, make another round based on his own alterations rather than defending the AI.

## Implementation constraints
- For a real game, a static concept image is not an animation, sprite sheet, collision mask or editable vector. Plan asset cleanup and animation separately.
- Keep clean provenance, version, prompts and Kit approval in an asset register.
- Do not use *Snake Clash* screenshots, logo, characters or commercial game assets as visual references for copied designs.
- Avoid generating anything new unless Kit directed it or a clearly labeled *option* is being evaluated by him.
