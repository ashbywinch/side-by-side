import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * Write build provenance into the deployed site so the smoke test can prove
 * that the URL is serving the commit that was just built.
 */
export async function writeVersion({ outDir, sha, version, builtAt }) {
  if (!sha || String(sha).trim() === "") {
    throw new Error("a commit SHA is required to write version.json");
  }
  const payload = {
    sha: String(sha).trim(),
    version: String(version ?? "0.0.0"),
    builtAt: builtAt ?? new Date().toISOString(),
  };
  await mkdir(outDir, { recursive: true });
  await writeFile(
    path.join(outDir, "version.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
  return payload;
}

async function main() {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const pkg = JSON.parse(await readFile(path.join(repoRoot, "package.json"), "utf8"));
  const sha =
    process.env.GITHUB_SHA ||
    execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString().trim();
  const result = await writeVersion({
    outDir: path.join(repoRoot, "dist"),
    sha,
    version: pkg.version,
  });
  console.log(`wrote version.json for ${result.sha.slice(0, 7)} (${result.version})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
