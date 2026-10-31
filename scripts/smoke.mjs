import { pathToFileURL } from "node:url";

const DEFAULT_BOOK = {
  lang: "ru",
  author: "Александр Блок",
  title: "Двенадцать",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function read(url, fetchImpl, init) {
  const response = await fetchImpl(url, init);
  const body = await response.text();
  return { response, body };
}

function contentType(response) {
  return (response.headers.get("content-type") ?? "").toLowerCase();
}

/**
 * Verify a deployed site end to end. Returns { ok, attempts, failures }.
 * Attempts are retried so a first deploy can wait for DNS/certificate
 * propagation.
 */
export async function runSmoke({
  base,
  sha,
  fetchImpl = fetch,
  expectedBooks = 2148,
  expectedChunkSize = 500,
  book = DEFAULT_BOOK,
  attempts = 1,
  delayMs = 0,
  log = () => {},
}) {
  if (!sha) throw new Error("a commit SHA is required for the smoke test");
  const failures = [];

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    failures.length = 0;
    const root = new URL("/", base);
    const bookBase = new URL(
      `/api/books/${book.lang}/${encodeURIComponent(book.author)}/${encodeURIComponent(book.title)}`,
      base,
    );

    const check = async (name, fn) => {
      try {
        await fn();
      } catch (error) {
        failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    await check("app shell", async () => {
      const { response, body } = await read(root.toString(), fetchImpl);
      if (response.status !== 200) throw new Error(`returned ${response.status}`);
      if (!body.includes('id="app"')) throw new Error("missing #app mount point");
    });

    await check("index route", async () => {
      const { response, body } = await read(new URL("/ru/books", base).toString(), fetchImpl);
      if (response.status !== 200) throw new Error(`returned ${response.status}`);
      if (!body.includes('id="app"')) throw new Error("missing #app mount point");
    });

    await check("book deep link", async () => {
      const path = `/ru/book/${encodeURIComponent(book.author)}/${encodeURIComponent(book.title)}`;
      const { response, body } = await read(new URL(path, base).toString(), fetchImpl);
      if (response.status !== 200) throw new Error(`returned ${response.status}`);
      if (!body.includes('id="app"')) throw new Error("missing #app mount point");
    });

    await check("version.json", async () => {
      const { response, body } = await read(new URL("/version.json", base).toString(), fetchImpl);
      if (response.status !== 200) throw new Error(`returned ${response.status}`);
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        throw new Error("not valid JSON (SPA fallback?)");
      }
      if (parsed.sha !== sha) {
        throw new Error(`sha mismatch: deployed ${parsed.sha}, expected ${sha}`);
      }
    });

    await check("corpus index", async () => {
      const { response, body } = await read(
        new URL("/api/books/ru/index.jsonl", base).toString(),
        fetchImpl,
      );
      if (response.status !== 200) throw new Error(`returned ${response.status}`);
      if (contentType(response).includes("text/html")) {
        throw new Error("content-type is text/html (SPA fallback), not JSONL");
      }
      const lines = body.split("\n").filter((line) => line.trim() !== "");
      if (lines.length !== expectedBooks) {
        throw new Error(`expected ${expectedBooks} books, got ${lines.length}`);
      }
      try {
        JSON.parse(lines[0]);
      } catch {
        throw new Error("first index line is not valid JSON");
      }
    });

    await check("book metadata", async () => {
      const { response, body } = await read(`${bookBase}/meta.json`, fetchImpl);
      if (response.status !== 200) throw new Error(`returned ${response.status}`);
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch {
        throw new Error("not valid JSON (SPA fallback?)");
      }
      if (!(parsed.segments > 0)) throw new Error("segments is not positive");
      if (parsed.chunkSize !== expectedChunkSize) {
        throw new Error(`chunkSize ${parsed.chunkSize}, expected ${expectedChunkSize}`);
      }
    });

    await check("first chunk", async () => {
      const { response, body } = await read(`${bookBase}/chunk-0001.jsonl`, fetchImpl);
      if (response.status !== 200) throw new Error(`returned ${response.status}`);
      const type = contentType(response);
      if (type.includes("text/html")) throw new Error("content-type is text/html (SPA fallback)");
      if (type.includes("application/octet-stream")) {
        throw new Error("content-type is application/octet-stream");
      }
      const lines = body.split("\n").filter((line) => line.trim() !== "");
      if (lines.length === 0) throw new Error("chunk is empty");
      const first = JSON.parse(lines[0]);
      if (!String(first.text ?? "").trim() || !String(first.translation ?? "").trim()) {
        throw new Error("first segment is missing text or translation");
      }
    });

    await check("corpus compression", async () => {
      const { response } = await read(`${bookBase}/chunk-0001.jsonl`, fetchImpl, {
        headers: { "Accept-Encoding": "br" },
      });
      const encoding = (response.headers.get("content-encoding") ?? "").toLowerCase();
      if (!encoding.includes("br") && !encoding.includes("gzip")) {
        throw new Error(`not compressed (content-encoding: ${encoding || "none"})`);
      }
    });

    if (failures.length === 0) {
      log(`smoke passed on attempt ${attempt}`);
      return { ok: true, attempts: attempt, failures: [] };
    }

    log(`smoke attempt ${attempt}/${attempts} failed:`);
    for (const failure of failures) log(`  ${failure}`);
    if (attempt < attempts) await sleep(delayMs);
  }

  return { ok: false, attempts, failures: [...failures] };
}

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function main() {
  const result = await runSmoke({
    base: argValue("--base", "https://sbs.blueumbrella.net"),
    sha: argValue("--sha", process.env.GITHUB_SHA ?? ""),
    attempts: Number(argValue("--attempts", "30")),
    delayMs: Number(argValue("--delay", "10000")),
    log: (message) => console.log(message),
  });
  if (!result.ok) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
