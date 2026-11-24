# Phase 1 playbook: listen to the designer

## 1 · Mission and scope
Interpret Kit's **existing** drawings and answers into a rigorous but playful design starter pack. Do not build a game, generate AI art, or settle major open questions. The purpose is to prepare a short creative-direction conversation with Kit and a responsible handoff for Phase 2.

## 2 · Source handling
- The original source is the **12-page duplex scan**. Its filled fronts correspond to pages 1, 3, 5, 7, 9, 11 in the PDF. The six-page subset in `source/` is a convenience, not a replacement for the original.
- Inspect each source front **visually**, at full resolution. Faint pink pencil may be easier to see in `source/page_images/` than in text extraction.
- For any ambiguous mark, record it as `[illegible]` or `possible: …`; cite the printed page (Kit p1–p6).
- Never turn scribble interpretation into a definitive rule. If a word matters, Kit can explain it later.
- Don't crop out or remove his original drawings from the source. All crops are derived, read-only references.

## 3 · The source ledger
Create a Q1–Q10 ledger with the **printed question**, handwriting (quote exactly when legible), visual description, confidence, implications, and **one unanswered design question** if necessary. Source cite every claim.
Use three epistemic labels consistently:
- **Said/drawn by Kit:** visually observed facts, as literal as possible.
- **Interpretation:** a plausible meaning, not confirmed.
- **Proposal:** an idea introduced by agent/parent, not Kit.

## 4 · Art and style interpretation
Describe the cat-snake's features in plain words: silhouette, stripes, face, appendages, expression, growth comparison; describe the enemy and the final scene with the same care. Do not copy the commercial *Snake Clash* look. Preserve surprising features instead of 'fixing' anatomy. Identify which details would need Kit's approval in future image generation. NO images generated this phase.

## 5 · Short conversation with Kit
Prepare **3–5** pointed, delightful questions that resolve the most consequential ambiguity. Make each answerable verbally, with a quick sketch or by pointing at his original art. Don't overload him with 20 options, ratings scales or developer jargon. Refer to `docs/KIT_DIRECTOR_SESSION.md`.

## 6 · Minimal game outline (explicitly provisional)
Describe a plausible 30–90-second vertical slice with only: Cat Attack, an arena, collecting, one transformation or clash, one win/lose condition. Flag all decisions Kit needs to approve, especially the role of the castle, boss and collectibles. No code yet.

## 7 · Files to deliver under `output/`
- `ANSWER_EVIDENCE.md`: complete ten-question source ledger and uncertainties.
- `KIT_CANON.md`: confirmed, needs-confirmation, and open topics. Short and cite pages.
- `KIT_ONE_PAGE.md`: exciting, child-friendly presentation, no technical jargon.
- `QUESTIONS_FOR_KIT.md`: up to five questions and why they matter.
- `CONCEPT_AND_FIRST_SLICE.md`: options and proposed v0; visually descriptive, not prescriptive.
- `ART_ASSET_REGISTER.md`: what later images would use from his original source and constraints; no artwork itself.
- `PHASE_1_HANDOFF.md`: summary with decisions due from Kit and next step.

You may add `output/visual_notes/` with crops or annotated **reference** figures, provided they are visibly labeled 'derived from Kit's source scan' and the original remains untouched. Do not generate synthetic designs or characters yet.

## 8 · Review gate
Before calling Phase 1 done, verify:
- All ten question areas reviewed; each core fact linked to page.
- The hero, gigantic power, castle, bosses, and title appear as Kit gave them.
- No ambiguities are falsely resolved.
- The child's one-page brief is fun and comprehensible to a seven-/eight-year-old.
- No paid game mechanics, dark patterns, art from commercial games, or educational mandates were introduced.
- Exactly **zero** code files or AI-generated character images were made in `output/`.
- Next actions are suitable for a brief conversation with Kit.
