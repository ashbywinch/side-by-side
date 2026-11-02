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
5. **Return later**: reopen the site, open the book you were reading, and land
   on your bookmarked page with the same translations uncovered, at the same
   place on the page; a bar offers the way back if you browse elsewhere.
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
- The index shows book cards with author, title, CEFR level (or “Unrated”),
  size, word count and a translated badge. The level filter offers the CEFR
  levels present in the corpus, in order, plus “Unrated”. Books under 250
  words are Unrated; the filter never shows `0`, `2`, or another numeric
  artefact.

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

## Reading position and the bookshelf

- A book joins the bookshelf when the reader first uncovers a translation, or
  turns a page. There is no add control; a glance at page one adds nothing.
- The bookmark is the segment at the top of the viewport, and resume restores
  it with the translations the reader had already uncovered. Page numbers on
  cards are not shown: pagination is arbitrary; the progress bar is the
  signal.
- **The bookmark moves only by reading.** A forward page turn from the
  bookmarked page, a scroll while on it, or an explicit "Stay here" moves it.
  Going back, or jumping to any page that is not the next one, is browsing:
  the bookmark stays, a strip reports where it is with "Return" and "Stay
  here", and leaving the book writes nothing.
- Revealing translations never moves the bookmark, so checking an earlier
  page cannot cost the reader their place.
- Arriving at the bookmark shows a quiet line — "Picked up where you left
  off · Start from the beginning" — which disappears on the first scroll, turn
  or reveal.
- Uncovering the last translation finishes the book; finishing is sticky, and
  re-reading does not unfinish it.
- Everything is local to the device, in versioned `localStorage`. Unavailable
  or corrupt storage degrades to an empty bookshelf rather than an error.

## Bookshelf and filters (delivered)

- **The shelf**: up to three book tiles above the results bar, ordered by
  recency, with "See all N books" beside the heading. The same card is used in
  the catalogue, so a book looks the same everywhere.
- **The card**: a portrait tile whose width follows its wrapped text — title
  and author wrap at spaces, never inside a word and never with a hyphen — and
  whose height matches the rest of its row. Level and word-count pills keep
  their palette colours on the card's bottom edge, with the progress bar below
  them. Progress is a bar, never a percentage: pagination is arbitrary, so a
  number would claim a precision the app does not have.
- **The filters**: collapsed behind a results bar that states the count and
  lists each active filter as a removable chip, with "Clear all". A phone opens
  the filters as a sheet; a desktop expands them in place. Level and size are
  listboxes; author is a type-to-search listbox — typing lists matches, and
  only a chosen author filters. Choosing an author is the one thing that must
  never silently do nothing.
- **Removal**: the bookshelf page lists every entry and is the place to remove
  one. Edit mode with undo is still to build.

## Planned UX

- **Google sign-in**: a single, optional sign-in entry; anonymous use is
  always available; first sign-in merges the local shelf; sign-out is clear
  and does not delete local reading.
- **Removal from the shelf's own row**: edit mode with an undo toast.
