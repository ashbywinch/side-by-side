# Translation repair runbook

Audience: someone fixing shifted translations in the corpus.
Related: `books_to_anki` (the translation pipeline),
`scripts/check-corpus.mjs`, `docs/deployment.md`.

## What went wrong

The 2026-07-31/08-01 translation batch ran before the source-echo alignment
check was restored. A whitespace-only source card can carry an orphaned
translation; when that happens the following cards are shifted by one. The
symptom in the corpus is a segment whose `text` is blank but whose
`translation` is not.

A blank-source card is not a card. A translation attached to one cannot be an
"alternative translation" of the blank source; it is either a duplicate of the
adjacent card's translation or a sign that the source segment is missing.

The corpus now has **zero blank-source cards**. The 30 rows that existed were
removed. Their source spans were a single newline (or, in one case, 70 spaces),
and their translations duplicated or re-worded the adjacent card's translation.
Nothing unique was lost, and every block of source text still has a translation.

The rule is simple: **every card must have non-empty source text, and every
non-empty source card must have a translation.** `check-corpus` and the corpus
builder both fail on a violation, so the release cannot ship one.

## Detection

```sh
cd /home/ashby/Documents/code/side-by-side
make check-corpus
```

The gate fails on any blank source card, blank translation for a real source
card, malformed JSON, index/file mismatch, duplicate index entry, or untranslated
index entry. To find a book that was translated before the source-echo check was
restored, compare the first few cards' source and translation:

- If the first card's translation covers only the first line of a multi-line
  verse card, the book is shifted (e.g. *Домовому*).
- If prose translations start matching the previous card around a point, the
  book is shifted from there (e.g. *Антигона* from ~segment 145).

## Books repaired on 2026-10-31

Re-translated whole with the `books_to_anki` driver through the local LiteLLM
gateway (`deepseek-direct`, `disable_thinking: true`, batch 30):

| Book | Segments |
| --- | --- |
| Александр Пушкин/Домовому | 7 |
| Константин Бальмонт/Ласточки | 7 |
| Аполлон Майков/Звуки ночи | 7 |
| Николай Гумилев/Жираф | 10 |
| Иван Бунин/Антигона | 174 |
| Максим Горький/Макар Чудра | 258 |

The other blank-source rows (20 with translations, 10 fully blank) were
removed after the audit; see the policy above. No blank cards remain.

## Procedure for the next repair

The provider is configured in `books_to_anki/translate.config.json`; no
endpoint, model, key or header is hardcoded in the translation path. Set the
API key environment variable named there:

```sh
export LITELLM_MASTER_KEY=...   # only the env var name is in the config
```

1. Select the books and build a **blank-translation input**. Never edit the
   corpus in place at this stage:

   ```sh
   python3 - <<'PY'
   import json, shutil
   from pathlib import Path

   corpus = Path("/home/ashby/Documents/code/side-by-side/corpus/books/ru")
   dest = Path("/tmp/sbs-retranslate/input")
   books = [
       "Александр Пушкин/Домовому.jsonl",
       # ...
   ]
   for rel in books:
       lines = []
       for line in (corpus / rel).read_text(encoding="utf-8").splitlines():
           if not line.strip():
               continue
           card = json.loads(line)
           card["translation"] = ""
           lines.append(json.dumps(card, ensure_ascii=False, separators=(",", ":")))
       out = dest / rel
       out.parent.mkdir(parents=True, exist_ok=True)
       out.write_text("\n".join(lines) + "\n", encoding="utf-8")
   PY
   ```

2. Run the driver. It skips completed books and resumes `.partial`
   checkpoints, so a re-run is safe:

   ```sh
   cd /home/ashby/Documents/code/books_to_anki
   .venv/bin/python -m book_to_flashcards.translate_books \
     --input /tmp/sbs-retranslate/input \
     --output /tmp/sbs-retranslate/output \
     --config translate.config.json
   ```

   Override the config with `--model`, `--base-url`, `--api-key-env`,
   `--workers` or `--batch-size` when needed.

3. Validate before copying. Card count, order, `text`, `start` and `end` must
   be unchanged. Every non-blank source card must have a translation; the
   selected input must contain no blank-source cards:

   ```sh
   python3 - <<'PY'
   import json
   from pathlib import Path
   src = Path("/tmp/sbs-retranslate/input")
   out = Path("/tmp/sbs-retranslate/output")
   for f in sorted(out.glob("*/*.jsonl")):
       a = [json.loads(l) for l in (src / f.relative_to(out)).read_text(encoding="utf-8").splitlines() if l.strip()]
       b = [json.loads(l) for l in f.read_text(encoding="utf-8").splitlines() if l.strip()]
       assert len(a) == len(b), f
       for x, y in zip(a, b):
           assert all(x[k] == y[k] for k in ("title", "author", "start", "end", "text")), f
           assert x["text"].strip(), f
           assert y["translation"].strip(), f
   print("validated", len(list(out.glob("*/*.jsonl"))), "books")
   PY
   ```

4. Back up, copy only the selected files into `corpus/books/ru`, and rebuild:

   ```sh
   cd /home/ashby/Documents/code/side-by-side
   mkdir -p /tmp/sbs-retranslate/backup
   cp -a corpus/books/ru/. /tmp/sbs-retranslate/backup/
   cp -a /tmp/sbs-retranslate/output/. corpus/books/ru/
   make data
   make check-corpus
   ```

   `check-corpus` must report 0 errors. The builder also rejects blank-source
   cards, so `make data` fails rather than deploying one.

5. Rebuild and smoke after deploying:

   ```sh
   make dist
   make smoke ARGS="--base https://sbs.blueumbrella.net --sha $(git rev-parse HEAD)"
   ```
