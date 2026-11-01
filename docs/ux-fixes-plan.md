# UX fixes and decisions — bookshelf round

The record of what the walkthroughs found, what was changed, and what is still
open. One row per finding; a finding is a **snag** (a bug, a broken layout, a
missing state, a misleading label) or a **concept problem** (the idea itself
cannot serve the requirement). Only snags are fixed before a concept is judged.

## Round 0 — run against the wrong URL

The six walks of the first round were given the plain catalogue
(`/ru/books`) instead of the lab route for their variant, so every walker read
the same build. **They are not evidence about A, B or C** — no walker saw a
bookshelf. They are evidence about the app underneath, and they found real
snags; all six transcripts agree on the first three.

Kept at `/tmp/ux-walkthrough/round0/`.

Fixes below landed in `f350d6d` before round 1 started, because each of them
would otherwise have contaminated the comparison.

## Findings

| # | Finding | Kind | Status |
| --- | --- | --- | --- |
| 1 | The mobile filter sheet opened, but every dropdown's options were painted underneath it: LEVEL, SIZE and AUTHOR all looked dead. Seen by all three phone walks. | snag | **Fixed.** The library dropdown teleports its list to `<body>` at `z-index: 1`, below the sheet at 41. The sheet now renders platform `<select>`/`<datalist>` controls. |
| 2 | Cards were as wide as their titles: one card per row, then two squeezed to half width where a short title allowed it, clipping the word count — the number used to judge whether a text is too long. | snag | **Fixed.** The catalogue is a grid with one card width (`minmax(16rem, 1fr)`, `7rem` in portrait). |
| 3 | The site's own name was a link-coloured title on a primary-blue bar, wrapped over three lines on a phone. | snag | **Fixed.** The brand takes the bar's colour and wraps to two lines at 1rem on a phone. |
| 4 | Reading progress was a 3px line on the card's bottom edge with no label, and on a full-width card it read as a rendering artefact. Walkers did not trust it, and it floated mid-card rather than on the edge. | snag | **Fixed.** Cards are a flex column with the bar on the bottom edge; a wide card also says "26% read", and a finished one shows the tick. |
| 5 | A portrait tile spilled its word count ("271975 words" in a 7rem tile). | snag | **Fixed.** Portrait abbreviates: "272k words". |
| 6 | No "continue reading" on the index after a visit. | not a bug | **Harness.** The walkers were on the variant-less catalogue, which has no shelf. The lab variant is now remembered in `localStorage` so leaving a book and coming back keeps the presentation. |
| 7 | The resume strip ("Picked up where you left off") appears when the site resumes a reader and not when the reader arrives at a deep link with `?page=` in it. Reads as unreliable. | snag, open | Deep links honour the page without claiming to have resumed. Worth revisiting once the shelf carries "continue" — the strip may not need to carry it alone. |
| 8 | A revealed translation cannot be hidden again; revealing is permanent per book. | decision, open | Deliberate for now: the high-water mark never moves back, so re-reading never re-hides work. Whether a reader should be able to re-mask a passage to test themselves is a product question, not a bug. |
| 9 | At the end of a text there is nothing: no next page control in reach, no next book, no "you finished this". | snag, open | Belongs to the reader, not the shelf, but it is the moment the shelf should appear. |
| 10 | The only way out of a book is the house icon, which scrolls away with the page on a long text. | snag, open | Reader header. |
| 11 | Chunks cut sentences in half; a page ends mid-phrase and the next begins in the middle of the same sentence. | snag, open | Corpus chunking, not this workstream. |
| 12 | 2,147 books, 24 per page, icon-only pagination at the bottom, no search. | snag, open | Search is not in this round's scope; the filters are. |
| 13 | "Unrated" and "C2" pills have no legend, and the only levels the corpus offers are C1, C2 and unrated — so "reading at my level" is largely impossible. | data + label | The scale is real (CEFR); the catalogue has no A/B texts and the label does not say what it is. Two separate problems. |
| 14 | On a phone the page had no side margin, so cards ran to both screen edges. | snag | **Fixed.** `.75rem` gutter on the smallest breakpoint. |

## Decisions

- **The lab is a dev-only route and is removed with the winner.** The variant is
  remembered in `localStorage` under `sbs:lab-variant` so a walker who opens a
  book and returns through the home link does not lose the presentation.
- **Round 1 walks are given their variant's exact URL** and no others, and each
  transcript records the URL at every step; a walk that is not on `/ru/lab/<v>`
  is discarded rather than analysed.

## Round 1

Six walks, A/B/C at 390×844 and 1280×800, fresh profiles, empty shelves,
transcripts and screenshots in `/tmp/ux-walkthrough/round1/<variant>/<viewport>/`.
Results and the comparative analysis follow in this document.

## Decision — round 1

**Chosen: the section (A) drawn with the portrait card (C).** Three book tiles
above the results bar, "See all N books" beside them, and the same tiles in the
catalogue.

Why: on R1 (one action back to the current book) A and B were equal — both walkers
reported "You're reading…, tap, back at my exact place with my translations".
They differed on R2 (reaching an older book): A's "See all" is a link that
works; B's rail needed a horizontal gesture, and the overflow walk with eight
books could not move it at all ("drag selects text, scroll gestures and the
scrollbar do nothing… I saw five of the eight and gave up on the last three").
C's tiles were kept because they halve the height the shelf costs on arrival
(R4) and give three books per row on a phone instead of one.

Rejected on evidence or on judgement: the wide-card rail (R2), and the portrait
tiles' original 11rem shape, whose empty middle one walker read as a missing
cover — at 6.5–7rem across three columns the gap no longer reads as a hole.

## Coherence pass

Checked against the built screens at 390 and 1280, not against intentions.

| Check | Finding | Action |
| --- | --- | --- |
| Row alignment | Titles wrap to two or three lines, so cards in a row had ragged bottom edges; none of the progress bars lined up. | **Fixed** — the card's link takes the cell height; rows stretch. |
| Progress legibility | Portrait tiles showed only the bar, with no number: the "unlabelled hairline" every walk complained about. | **Fixed** — "26%" above the bar; "✓ finished" in the same slot. |
| Empty result | Filtering to nothing gave a blank white page (seen in two walks). | **Fixed** — "No books match these filters · Clear all". |
| Tap targets | "See all" was 32px tall at the bottom edge of the phone. | **Fixed** — 44px on a phone, and beside the books rather than under four cards. |
| Focus | Chips, "Clear all", "Filters" and "See all" had no visible focus ring. | **Fixed** — 2px primary outline, offset 2px. |
| Spacing | Shelf gap 0.75rem, catalogue gap 0.5rem on a phone; three different gaps between shelf, results and grid. | **Fixed** — one 1rem rhythm (0.5rem between tiles on a phone). |
| Header weight | The brand occupied a fifth of a phone screen. | **Fixed** — smaller mark and text on the smallest breakpoint. |
| Colour semantics | Level and word-count pills are the only colour signal; "Unrated" and "C2" have no legend. | **Open** — a legend is a catalogue feature, not a fix. |
| Ragged middles | Equal row heights leave whitespace under short titles. | **Accepted** — the alternative is ragged bars; the gap is deliberate space, not filler. |
