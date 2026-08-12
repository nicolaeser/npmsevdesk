import { readFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const channel = argumentValue("--channel");
const version = packageJson.version;
const name = packageJson.name;
const prerelease = /-(?:0|[1-9]\d*|[0-9A-Za-z-]+(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]+))*)$/u.test(
  version
);

if (channel !== "latest" && channel !== "dev") {
  fail(`--channel must be "latest" or "dev", received ${JSON.stringify(channel)}.`);
}
if (channel === "latest" && prerelease) {
  writeOutput({
    name,
    version,
    channel,
    dist_tag: "latest",
    should_publish: false,
    already_published: false,
    skip_reason: `Refusing to publish prerelease ${name}@${version} to latest.`
  });
  process.exit(0);
}
if (channel === "dev" && !prerelease) {
  writeOutput({
    name,
    version,
    channel,
    dist_tag: "dev",
    should_publish: false,
    already_published: false,
    skip_reason: `Stable ${name}@${version} is reserved for main/latest. Use a prerelease such as ${version}-dev.0 for @dev.`
  });
  process.exit(0);
}

const existing = await publishedVersion(name, version);
if (existing === "error") {
  fail(`Could not query the npm registry for ${name}@${version}.`);
}

writeOutput({
  name,
  version,
  channel,
  dist_tag: channel,
  should_publish: existing === false,
  already_published: existing === true,
  skip_reason:
    existing === true
      ? `${name}@${version} is already on the registry; skipping so this version is not retagged.`
      : ""
});

async function publishedVersion(packageName, packageVersion) {
  const response = await fetch(
    `https://registry.npmjs.org/${encodeURIComponent(packageName)}/${encodeURIComponent(packageVersion)}`
  );
  if (response.status === 404) return false;
  if (!response.ok) {
    console.error(`npm registry returned HTTP ${response.status} for ${packageName}@${packageVersion}.`);
    return "error";
  }
  return true;
}

function writeOutput(values) {
  for (const [key, value] of Object.entries(values)) {
    const serialized = typeof value === "boolean" ? String(value) : String(value);
    process.stdout.write(`${key}=${serialized}\n`);
  }
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    fail(`${name} requires a value.`);
  }
  return value;
}

function fail(message) {
  console.error(message);
  process.exit(2);
}
