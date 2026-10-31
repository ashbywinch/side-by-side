# UX — Side by Side

Written against `docs/PRD.md`. The current release covers the reader; the
bookshelf and sign-in journeys are the next phases.

## Journeys to usability-test

1. **First visit**: land on the index, understand that books can be filtered,
   choose a book, and reach a readable first page.
2. **Read and reveal**: read a source card, reveal its translation, reveal the
   next one, hide all with `Esc`, and keep reading without losing place.
3. **Page turn**: move forward and back; confirm the page number, scroll
   position, and URL stay in sync; a deep link opens the same page.
4. **Mobile**: repeat 1–3 at phone width, including the translation reveal and
   pagination controls.
5. **Return later** (planned): reopen the site, see the bookshelf, resume the
   same book at the saved page.
6. **Cross-device** (planned): sign in with Google on a second device and see
   the same shelf and positions.

## Reader interaction spec

- One source card beside its translation; the translation is masked until
  revealed.
- Clicking a translation reveals it and every earlier translation on the page
  (progressive reveal). `Ctrl+ArrowDown` reveals one more, `Ctrl+ArrowUp`
  hides one, `Esc` hides all.
- An orphaned translation (source text is empty) must not exist; the reader
  does not render translation-only cards in the current corpus.
- Page turns keep the reading position at the top of the new page. Browser
  back/forward restores the previous position.
- The page header shows title/author on page 1 and a compact header otherwise;
  the footer shows “X of Y”.
- Loading shows a quiet busy state without blanking the current page. A
  missing book or chunk shows a readable error, not a raw parse failure.
- The index shows book cards with author, title, CEFR level, size, word count
  and a translated badge.

## Accessibility

- All controls are keyboard reachable; the translation reveal is operable
  without a mouse.
- The page region exposes `aria-busy` while loading and a polite “Page X of Y”
  live region.
- Masked translations are hidden from screen readers until revealed.
- Colour is not the only signal for level/size/translated state.
- Body text has a readable line length on desktop and a comfortable single
  column on mobile.

## Empty, error and edge states

- No books match a filter: a clear empty state with a reset action.
- A book fails to load: an error with a link back to the index.
- A page beyond the end: clamp to the last page and replace the URL.
- An empty corpus/book: skip rather than render an empty card; the builder
  rejects blank-source cards.

## Planned UX

- **Bookshelf**: “Continue reading” on the index, a shelf with currently
  reading/finished, page progress, remove with confirmation.
- **Google sign-in**: a single, optional sign-in entry; anonymous use is
  always available; first sign-in merges the local shelf; sign-out is clear
  and does not delete local reading.
- **CEFR**: only A1–C2 in the level filter; unrated books are labelled
  “Unrated”, never `0` or `2`.
