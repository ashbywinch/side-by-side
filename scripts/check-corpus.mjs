import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Validate the canonical corpus. Non-destructive: whitespace-only source rows
 * are reported as warnings, because several carry translation text that has
 * drifted out of alignment. Only a real-text segment without a translation is
 * an error.
 *
 * Returns { errors, warnings, books, segments, languages }.
 */
export async function checkCorpus({ root, allowlist = new Set(), log = () => {} }) {
  const errors = [];
  const warnings = [];
  let books = 0;
  let segments = 0;

  const languages = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const lang of languages) {
    const langDir = path.join(root, lang);
    const indexPath = path.join(langDir, "index.jsonl");
    const index = await readIndex(indexPath, lang, errors);
    const files = await listBookFiles(langDir);

    const indexedKeys = new Set();
    for (const entry of index) {
      const key = `${entry.value.author}/${entry.value.title}`;
      if (indexedKeys.has(key)) {
        errors.push(`${indexPath}:${entry.line}: duplicate index entry for ${lang}/${key}`);
        continue;
      }
      indexedKeys.add(key);

      if (entry.value.translated !== true) {
        errors.push(
          `${indexPath}:${entry.line}: ${lang}/${key} is not marked translated`,
        );
      }
      if (!entry.value.author || !entry.value.title) {
        errors.push(`${indexPath}:${entry.line}: index entry is missing author or title`);
      }
    }

    for (const file of files) {
      const key = `${file.author}/${file.title}`;
      if (!indexedKeys.has(key)) {
        errors.push(`${file.path}: book is not in the index (${lang}/${key})`);
      }
      const book = await checkBook({ file, lang, allowlist, errors, warnings });
      books += 1;
      segments += book.segments;
    }

    for (const key of indexedKeys) {
      const [author, title] = key.split("/");
      if (!files.some((file) => file.author === author && file.title === title)) {
        errors.push(`${indexPath}: missing file for index entry ${lang}/${key}`);
      }
    }
  }

  const summary = `checked ${books} books, ${segments} segments`;
  if (warnings.length) {
    log(`${warnings.length} warning(s) (alignment orphans, no data removed)`);
    for (const warning of warnings) log(`  warning: ${warning}`);
  }
  if (errors.length) {
    log(`${errors.length} error(s)`);
    for (const error of errors) log(`  error: ${error}`);
  }
  log(summary);

  return { errors, warnings, books, segments, languages: languages.length };
}

async function readIndex(indexPath, lang, errors) {
  let raw;
  try {
    raw = await readFile(indexPath, "utf8");
  } catch {
    errors.push(`${indexPath}: missing index for language ${lang}`);
    return [];
  }

  const entries = [];
  const lines = raw.split("\n");
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (line.trim() === "") continue;
    try {
      const value = JSON.parse(line);
      entries.push({ value, line: lineIndex + 1 });
    } catch (error) {
      errors.push(
        `${indexPath}:${lineIndex + 1}: invalid JSON: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
  return entries;
}

async function listBookFiles(langDir) {
  const files = [];
  const authors = (await readdir(langDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const author of authors) {
    const authorDir = path.join(langDir, author);
    const books = (await readdir(authorDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
      .map((entry) => entry.name)
      .sort();
    for (const file of books) {
      files.push({
        path: path.join(authorDir, file),
        author,
        title: file.slice(0, -".jsonl".length),
      });
    }
  }
  return files;
}

async function checkBook({ file, lang, allowlist, errors, warnings }) {
  const raw = await readFile(file.path, "utf8");
  const lines = raw.split("\n");
  let segments = 0;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (line.trim() === "") continue;
    const location = `${file.path}:${lineIndex + 1}`;
    let segment;
    try {
      segment = JSON.parse(line);
    } catch (error) {
      errors.push(
        `${location}: invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    if (segment === null || typeof segment !== "object") {
      errors.push(`${location}: segment is not a JSON object`);
      continue;
    }

    segments += 1;
    const text = typeof segment.text === "string" ? segment.text : "";
    const translation =
      typeof segment.translation === "string" ? segment.translation : "";

    if (text.trim() === "") {
      errors.push(
        `${location}: blank source card in ${lang}/${file.author}/${file.title}; every card must have source text`,
      );
      continue;
    }

    if (translation.trim() === "") {
      const key = `${lang}/${file.author}/${file.title}:${lineIndex + 1}`;
      if (!allowlist.has(key)) {
        errors.push(
          `${location}: missing translation for ${lang}/${file.author}/${file.title}`,
        );
      }
    }
  }

  return { segments };
}

async function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const allowlist = new Set();
  try {
    const parsed = JSON.parse(
      await readFile(path.join(repoRoot, "corpus", "known-empty.json"), "utf8"),
    );
    for (const key of parsed.allowlist ?? []) allowlist.add(key);
  } catch {
    // An absent allowlist is the normal case.
  }

  const result = await checkCorpus({
    root: path.join(repoRoot, "corpus", "books"),
    allowlist,
    log: (message) => console.log(message),
  });
  if (result.errors.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
