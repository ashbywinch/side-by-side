# Page turning — swipes, margins and the first-run lesson

How the reader moves between pages, why the targets are invisible, and what the
lesson is allowed to reuse.

## The interaction

A page turn goes through `BookPage`'s one turn path, so the bookmark, the browse
bar and browser history behave exactly as they did for the pager. The reader
turns the page itself and points `?page=` at it once the row has finished; the
navigation does not run during the turn, because re-rendering the route mid-row
drops frames on a phone and reads as a jump.

- **Swipe** (touch): direct manipulation, not a release-only animation. After
  a 6px axis lock, a horizontal drag moves the page 1:1 with the finger and
  reveals the adjacent page's edge underneath. On release the drag commits if
  it travelled 50px or was a flick of at least 0.4px/ms in the direction of
  travel; otherwise the page springs back. A vertical drag is a scroll, a tap
  is a tap, and a two-finger gesture is ignored. The click the browser
  synthesises after a drag is swallowed, so a drag that ends over a translation
  cannot reveal it.
- **Margin click** (any device): the space between the viewport edge and the
  text is a full-height invisible button. It is the largest target available
  without covering something else, and it includes the container gutter and the
  card's padding. Clicking a link with a modifier, extending a selection, or
  clearing one does not turn the page.
- **Keys**: `ArrowLeft` and `ArrowRight`, except while typing in a field.
- The gesture listens across the page surface, including the invisible margin
  targets, so a back-swipe that starts at the edge is still a swipe rather than
  a click on the target.

The targets are measured, not assumed: the width is the distance from the
viewport edge to the text's box, so it follows the card width, the container
gutter and the scrollbar. Below 24px (WCAG 2.5.8) the target is hidden — a
phone gives 28px (12px gutter plus 16px card padding), a 1440px desktop gives
352px. At both ends of the book the target is disabled; a turn never changes
the URL past the first or last page.

Swipe is a path-based gesture, so WCAG 2.5.1 and 2.5.7 require a single-pointer
alternative without a path: the margin target and the pager are those
alternatives, and the target is focusable with a visible cue and ring.

## The page turn

A page is usually taller than the viewport, so a turn has to move from the
bottom of one page to the top of the next. Scrolling that jump is what felt
dislocating: the text flies past and the browser's scrollbar is too quiet to
explain it.

The turn hides the jump instead by moving the row. The page being left is
frozen as a snapshot at the exact place it occupies in the viewport — for a
finger drag, that is where the finger released it — and the reader renders the
new page at its top, one panel to the side. Both then travel the same distance:
the old page off to one side, the new page to its resting place, with the page
margins as the gutter between them. Because both start from the row position
the drag established, there is no jump when the finger lifts: the new page
starts where the peek left it and the seam between the two cards never changes.
The turn is 360ms with a standard ease; the incoming page's contents fade in
over 240ms as the row arrives, because the peek during a drag is a blank card
and the text must not pop into the strip at the release. Under
`prefers-reduced-motion` the row is skipped and the turn is an instant swap. If
the snapshot cannot be taken (the card has no box), the turn still works; it
just swaps without the slide.

The snapshot is a clone of the page card, positioned in a fixed, clipped layer
with `aria-hidden` and `inert`, so it can never take focus or a click. It must be
cloned and measured *before* the drag transform is reset, and the live page keeps
following the finger until the row takes over. Both matter, for the same reason:
the reader needs a few frames to render the new page, and for that whole window
the page must stay where the hand left it. Reset the transform at release and the
page sits at rest behind the snapshot, so it jumps back by the drag distance —
visible as a jump followed by a slide, however smooth the slide itself is.

The peek that shows during a drag is a blank card, and it is placed at the page
card's document top and width — not at the top of the viewport. The turn scrolls
the document to the top, so the page it becomes sits below the header; align the
peek anywhere else and the incoming column loses its top edge, and its text
starts at a different height, the instant the finger lifts.

The root clips horizontal overflow (`overflow-x: clip` on `html, body`). Without
it, a mobile browser widens the layout viewport to fit the translated page and
zooms out for the duration of the turn — the debug viewport jumped from 390 to
619 — which reads as a snap. The clip keeps the row visible to the viewport edge
without letting it change the page's width, and it does not create a scroll
container, so vertical scrolling is untouched.

## The first-run lesson

The lesson follows the gesture-education pattern: the sample UI mimics the
movement of the real UI, and a swipe is taught by a **partial swipe** (hint
motion), not by an abstract arrow. The gesture indicator and the page move
together; the page returns because the reader is being shown a preview, not
performing the turn.

- **Coarse pointer (swipe):** the live page nudges 56px left under a hand,
  sliding the next page's card in from the right behind a 24px gutter — two
  cards moving as one row, not a margin stretching. The finger presses, drags,
  holds, then lifts; the page eases back and the hand fades at the end of the
  drag rather than snapping to its resting position. A bottom caption reads
  "Swipe left for the next page". One pass, no loop.
- **Fine pointer (click):** the margins the reader can use are lit at 18% of
  the primary colour, clearly visible behind the page; a single chip at the
  right holds the words "Click the margin to turn the page" and the mouse
  glyph together, mouse on the right, with two expanding rings from one press.
  No arrows.

Under `prefers-reduced-motion` the page does not nudge, and the hand and rings
are static for the hold.

The revealed page during a hint or a drag is a blank card edge: the next page's
content is not fetched mid-gesture. The real page swaps in under the snapshot
wipe on release.

It appears only when the reader has something to learn:

- the book has more than one page;
- the device has shown it fewer than **three** times;
- no swipe or margin click has already taught the gesture (a pager click or an
  arrow key does not count — those are not the hinted mechanism).

The book's own history does not matter: a reader who resumes a book can still
see the lesson, if the device has not taught it yet.

It waits 1.2s after the first page renders so it does not collide with the
translation lesson. It hides on the first swipe/margin turn or after 2.6s; a
translation reveal does not dismiss it, because the reader may still need the
turn gesture.

For inspection, `?turn-hint=1` forces the lesson without spending one of the
device's three showings; `?turn-hint=swipe` and `?turn-hint=click` force a mode
too, so the click cue can be seen on a phone. `?debug=1` shows the device's
reduced-motion state, pointer type, viewport, last turn and the animation
actually running — the quickest way to tell whether a missing animation is the
device's motion setting or the app.

State is device-wide in versioned `localStorage` under
`sbs:page-turn-hint:v1`:

```json
{ "version": 1, "shown": 0, "turned": false }
```

Unreadable data resets. A newer schema is neither read nor overwritten — the
same policy as the bookshelf. A denied store degrades to one showing per book
open, in memory.

## Pattern research

- [Material gesture education](https://m1.material.io/growth-communications/gesture-education.html)
  is explicit that the sample UI "should mimic the movement of the real UI it
  represents"; hint motion previews the action, and a prompt is shown to users
  who have not performed the gesture, usually once.
- The **partial-swipe / peek** pattern: show a little of the next surface
  peeking out, then slide back. It is the pattern that helped users understand
  there was more to swipe in the UX-hinting case studies.
- [NN/g on instructional overlays](https://www.nngroup.com/articles/mobile-instructional-overlay/)
  and [onboarding](https://www.nngroup.com/articles/onboarding-tutorials/): one
  interaction at a time, ultra-short text, visuals alongside the words, and a
  visual treatment distinct from real controls so nobody tries to use the hint
  itself.
- [NN/g on animation duration](https://www.nngroup.com/articles/animation-duration/):
  substantial screen changes belong in the 200–300ms range; a gesture lesson
  is a short sequence, not a loop.
- [Mosso's swipe-hint pattern](https://mosso.video/library/swipe-hint/): a hand
  presses, swipes left, lifts, ends on a clear final frame, and is paired with
  words. That is the coarse-pointer cue here, one pass.

The animation is a press → drag → hold → release, with an ease on each segment
(`cubic-bezier(0.2, 0.7, 0.2, 1)` for the drag, `cubic-bezier(0.4, 0, 0.6, 1)`
for the return) and `animation-fill-mode: both` so the hand never snaps back to
its resting position when the pass ends.

## Reuse research — what is legal to take

The cue is original: its layout and motion are ours, and nothing was vendored.
The hand and mouse glyphs come from the Material Icons font the app already
loads. The candidates considered:

| Candidate | Licence | Why not |
| --- | --- | --- |
| [StPageFlip](https://github.com/Nodlik/StPageFlip) (`page-flip`) | MIT | A real page-curl engine: it takes over layout, clones page DOM and drives its own paging. Wrong tool for a two-second cue; it would fight the reader's scroll, selection and accessibility model. |
| [turn.js](https://github.com/blasten/turn.js) | "non-commercial BSD" | Excluded on licence alone for a commercial site. |
| LottieFiles free animations | [Lottie Simple License](https://lottiefiles.com/page/license) (FL 9.13.21) | Commercial use and no attribution are allowed, but derivative files must carry the same terms, community provenance varies, and it adds a runtime plus a JSON asset for a small cue. |
| CodePen / Dribbble examples | all rights reserved by default | Inspiration only; not licensed to copy. |
| Figma community files | per file, often CC BY 4.0 | Attribution would be required and the motion/geometry still would not fit. |
| Material Icons (already loaded in `index.html`) | Apache 2.0 | The hand and mouse are glyphs from this already-loaded set; no new asset. |
| Font Awesome Free (already a dependency) | CC BY 4.0 (icons) | Available, but Material Icons is the app's icon path. |

The lesson's motion is ours: the page's partial swipe, the next-page peek, the
hand's press-drag-lift, the mouse's ring pulse and the margin's opacity
envelope. It is not a page curl, and deliberately so — a curl would imply a
physical page model the reader does not
have.

## Where it lives

| Module | Responsibility |
| --- | --- |
| `src/components/Book/pageTurn.ts` | Pure page arithmetic and swipe classification |
| `src/components/Book/pageMargins.ts` | Pure margin geometry and the 24px floor |
| `src/components/Book/usePageMargins.ts` | Measures the text's box; re-measures on resize; subtracts the reader's transform so a mid-turn measurement never grows the targets over the page |
| `src/components/Book/usePageTurning.ts` | Touch listeners, arrow keys, synthetic-click suppression |
| `src/components/Book/usePageSlide.ts` | Snapshots the outgoing page and wipes it aside for a turn |
| `src/components/Book/PageTurnTargets.vue` | The two invisible margin buttons and their focus cues |
| `src/components/Book/PageTurnHint.vue` | The hint motion, click cue and bottom caption |
| `src/components/Book/pageTurnHintStorage.ts` | Versioned read/write and validation |
| `src/components/Book/usePageTurnHint.ts` | The show cap, delay, hold and learned flag |
| `src/types/pageTurnHint.ts` | The stored record |

Interaction tests dispatch real `TouchEvent` sequences and assert the URL, the
bookmark and the DOM outcome; the pure geometry, gesture and storage rules are
unit-tested. The lesson's timing is tested with fake timers.

The window's scroll is never the book's business on open: `router.ts` resets it
to the top on every route change that is not a history traversal, and a book with
a stored position scrolls there after it renders. A book that scrolls itself to
the top appears to animate up from wherever the previous page was left.

## Accepting it

- A left swipe advances, a right swipe returns, on a phone-sized viewport.
- A vertical drag scrolls and never turns; a tap on a translation reveals.
- A margin click turns; the targets are invisible; focus is visible.
- First and last page turns are disabled with no URL change.
- Arrow keys turn; they do nothing inside a field.
- The lesson shows at most three times, stops after a swipe or margin click,
  plays for a book with history too, never shows for a single page, and is
  static under reduced motion. On touch it nudges the page and reveals the
  next page's edge; with a mouse it lights the margins and presses a cursor.
- Forward turns still move the bookmark; back turns still browse.
