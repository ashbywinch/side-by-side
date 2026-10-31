import { createHash } from "node:crypto";
import { readFile, readdir, mkdir, rm, stat, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const FORMAT_VERSION = 1;

/**
 * Build the chunked, deployable corpus from the canonical JSONL corpus.
 *
 * Layout:
 *   <source>/<lang>/index.jsonl
 *   <source>/<lang>/<author>/<title>.jsonl
 * ->
 *   <out>/<lang>/index.jsonl
 *   <out>/<lang>/<author>/<title>/meta.json
 *   <out>/<lang>/<author>/<title>/chunk-0001.jsonl
 *
 * Every segment is preserved. Whitespace-only source segments are kept: some of
 * them carry translation text that has drifted out of alignment, and deleting
 * them would lose content.
 */
export async function buildCorpus({ source, out, config, force = false, log = () => {} }) {
  const chunkSize = Number(config?.chunkSize);
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error(`chunkSize must be a positive integer, got ${config?.chunkSize}`);
  }

  const stampPath = path.join(path.dirname(out), ".corpus-stamp.json");
  const stamp = {
    version: FORMAT_VERSION,
    chunkSize,
    source: await hashSource(source),
  };

  if (!force && (await stampMatches(stampPath, stamp)) && (await exists(out))) {
    log("corpus up to date");
    return { skipped: true, books: 0, segments: 0, chunks: 0 };
  }

  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  const stats = { skipped: false, books: 0, segments: 0, chunks: 0 };
  const languages = (await readdir(source, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const lang of languages) {
    const sourceLang = path.join(source, lang);
    const outLang = path.join(out, lang);
    const indexSource = path.join(sourceLang, "index.jsonl");

    if (!(await exists(indexSource))) continue;

    await mkdir(outLang, { recursive: true });
    await copyFile(indexSource, path.join(outLang, "index.jsonl"));

    const authors = (await readdir(sourceLang, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const author of authors) {
      const sourceAuthor = path.join(sourceLang, author);
      const books = (await readdir(sourceAuthor, { withFileTypes: true }))
        .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
        .map((entry) => entry.name)
        .sort();

      for (const file of books) {
        const title = file.slice(0, -".jsonl".length);
        const sourceFile = path.join(sourceAuthor, file);
        const bookStats = await buildBook({
          lang,
          author,
          title,
          sourceFile,
          outDir: path.join(outLang, author, title),
          chunkSize,
        });
        stats.books += 1;
        stats.segments += bookStats.segments;
        stats.chunks += bookStats.chunks;
      }
    }
  }

  await writeFile(stampPath, `${JSON.stringify(stamp, null, 2)}\n`, "utf8");
  log(
    `built ${stats.books} books, ${stats.segments} segments, ${stats.chunks} chunks -> ${out}`,
  );
  return stats;
}

async function buildBook({ lang, author, title, sourceFile, outDir, chunkSize }) {
  const raw = await readFile(sourceFile, "utf8");
  const lines = raw.split("\n");
  const segments = [];
  const chunkFiles = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (line.trim() === "") continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      throw new Error(
        `${path.relative(process.cwd(), sourceFile)}:${lineIndex + 1}: invalid JSON: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    if (parsed === null || typeof parsed !== "object") {
      throw new Error(
        `${path.relative(process.cwd(), sourceFile)}:${lineIndex + 1}: segment is not a JSON object`,
      );
    }
    if (typeof parsed.text !== "string" || parsed.text.trim() === "") {
      throw new Error(
        `${path.relative(process.cwd(), sourceFile)}:${lineIndex + 1}: blank source card; every card must have source text (remove it from the corpus)`,
      );
    }
    segments.push(line);
  }

  await mkdir(outDir, { recursive: true });

  for (let offset = 0; offset < segments.length; offset += chunkSize) {
    const chunk = segments.slice(offset, offset + chunkSize);
    const chunkNumber = String(chunkFiles.length + 1).padStart(4, "0");
    const chunkName = `chunk-${chunkNumber}.jsonl`;
    await writeFile(path.join(outDir, chunkName), `${chunk.join("\n")}\n`, "utf8");
    chunkFiles.push(chunkName);
  }

  const meta = {
    lang,
    author,
    title,
    segments: segments.length,
    chunkSize,
    chunkCount: chunkFiles.length,
  };
  await writeFile(path.join(outDir, "meta.json"), `${JSON.stringify(meta)}\n`, "utf8");

  return { segments: segments.length, chunks: chunkFiles.length };
}

async function hashSource(source) {
  const entries = await walk(source);
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex");
}

async function walk(root, prefix = "") {
  const entries = [];
  const dir = await readdir(root, { withFileTypes: true });
  for (const entry of dir) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) {
      entries.push(...(await walk(absolute, relative)));
    } else if (entry.isFile()) {
      const info = await stat(absolute);
      entries.push({ path: relative, size: info.size, mtimeMs: info.mtimeMs });
    }
  }
  return entries;
}

async function stampMatches(stampPath, stamp) {
  try {
    const existing = JSON.parse(await readFile(stampPath, "utf8"));
    return (
      existing.version === stamp.version &&
      existing.chunkSize === stamp.chunkSize &&
      existing.source === stamp.source
    );
  } catch {
    return false;
  }
}

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const config = JSON.parse(
    await readFile(path.join(repoRoot, "corpus.config.json"), "utf8"),
  );
  const force = process.argv.includes("--force");
  await buildCorpus({
    source: path.join(repoRoot, "corpus", "books"),
    out: path.join(repoRoot, "public", "api", "books"),
    config,
    force,
    log: (message) => console.log(message),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
