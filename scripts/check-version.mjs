import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseVersion(value) {
  const match = SEMVER.exec(String(value ?? "").trim());
  return match ? match.slice(1).map(Number) : null;
}

export function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) throw new Error("both versions must be strict semver");
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

/**
 * Returns an error string, or null when the release version is valid.
 * `tags` are the existing release tags (for example ["v1.0.0"]).
 */
export function validateReleaseVersion({ version, current, tags = [] }) {
  if (!parseVersion(version)) {
    return `Version must be strict semver x.y.z, got ${JSON.stringify(version)}`;
  }
  if (!parseVersion(current)) {
    return `Current package version is not strict semver: ${JSON.stringify(current)}`;
  }
  if (compareVersions(version, current) <= 0) {
    return `Version ${version} must be greater than current ${current}`;
  }
  if (tags.includes(`v${version}`)) {
    return `Tag v${version} already exists`;
  }
  return null;
}

function main() {
  const version = process.argv[2];
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  let tags = [];
  try {
    tags = execFileSync("git", ["tag", "-l", "v*"], { encoding: "utf8" })
      .split("\n")
      .filter(Boolean);
  } catch {
    // A shallow checkout without tags still lets the workflow validate the
    // version shape and monotonicity; the tag check is best effort.
  }
  const error = validateReleaseVersion({ version, current: pkg.version, tags });
  if (error) {
    console.error(`::error::${error}`);
    process.exit(1);
  }
  console.log(`release version ${version} is valid (current ${pkg.version})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
