import { readFile } from "node:fs/promises";

const root = new URL("../../", import.meta.url);
const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const packageLock = JSON.parse(await readFile(new URL("package-lock.json", root), "utf8"));
const errors = [];

const releaseTag = argumentValue("--tag") ?? process.env.GITHUB_REF_NAME;
const channel = argumentValue("--channel");
const version = packageJson.version;
const lockRoot = packageLock.packages?.[""];
const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "", 10);
const prerelease = /-(?:0|[1-9]\d*|[0-9A-Za-z-]+(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]+))*)$/u.test(
  version
);

if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/u.test(version)) {
  errors.push(`package.json version "${version}" is not a valid release SemVer.`);
}
if (packageLock.name !== packageJson.name || packageLock.version !== version) {
  errors.push("package-lock.json top-level name/version must match package.json.");
}
if (lockRoot?.name !== packageJson.name || lockRoot?.version !== version) {
  errors.push("package-lock.json root package name/version must match package.json.");
}
if (channel !== undefined && channel !== "latest" && channel !== "dev") {
  errors.push(`release channel must be "latest" or "dev", received "${channel}".`);
}
if (channel === "latest" && prerelease) {
  errors.push(`channel "latest" cannot publish prerelease version "${version}".`);
}
if (typeof releaseTag === "string" && /^v\d/u.test(releaseTag) && releaseTag !== `v${version}`) {
  errors.push(`release tag must be exactly "v${version}", received "${releaseTag}".`);
}

expectEqual(packageJson.engines?.node, ">=24.0.0", "engines.node");
expectEqual(packageJson.engines?.npm, ">=11.5.1", "engines.npm");
expectEqual(packageJson.type, "module", "type");
expectEqual(packageJson.sideEffects, false, "sideEffects");
expectEqual(packageJson.publishConfig?.access, "public", "publishConfig.access");
expectEqual(packageJson.publishConfig?.provenance, true, "publishConfig.provenance");
expectEqual(
  packageJson.publishConfig?.registry,
  "https://registry.npmjs.org/",
  "publishConfig.registry"
);
if (!Number.isSafeInteger(nodeMajor) || nodeMajor < 24) {
  errors.push(`release verification requires Node.js 24 or newer, received ${process.version}.`);
}
if (packageJson.private === true) {
  errors.push("package.json must not be private for a public npm release.");
}

if (!/^npm@\d+\.\d+\.\d+$/u.test(packageJson.packageManager ?? "")) {
  errors.push("packageManager must pin an exact npm version.");
} else {
  const expectedNpmVersion = packageJson.packageManager.slice("npm@".length);
  const actualNpmVersion = process.env.npm_config_user_agent?.match(/^npm\/([^ ]+)/u)?.[1];
  if (actualNpmVersion !== undefined && actualNpmVersion !== expectedNpmVersion) {
    errors.push(
      `release verification must run with npm ${expectedNpmVersion}, received ${actualNpmVersion}.`
    );
  }
}
for (const [label, dependencies] of [
  ["package.json", packageJson.dependencies],
  ["package-lock.json root package", lockRoot?.dependencies]
]) {
  if (Object.keys(dependencies ?? {}).join(",") !== "axios") {
    errors.push(`${label}: Axios must remain the package's only runtime dependency.`);
  }
}
expectEqual(
  packageJson.scripts?.prepack,
  "npm run build && npm run verify:package",
  "scripts.prepack"
);
expectEqual(
  packageJson.scripts?.prepublishOnly,
  "npm run verify:release && npm run check",
  "scripts.prepublishOnly"
);
for (const file of ["dist", "README.md", "AGENTS.md", "CLAUDE.md", ".ai"]) {
  if (!packageJson.files?.includes(file)) {
    errors.push(`package files allowlist is missing "${file}".`);
  }
}
if (packageJson.files?.some((file) => file === "examples" || file.startsWith("examples/"))) {
  errors.push("package files allowlist must not include examples.");
}

const repositoryUrl =
  typeof packageJson.repository === "string" ? packageJson.repository : packageJson.repository?.url;
if (!isHttpsUrl(repositoryUrl)) {
  errors.push("package.json repository must contain the verified HTTPS repository URL.");
}
if (!isHttpsUrl(packageJson.homepage)) {
  errors.push("package.json homepage must contain the verified HTTPS project URL.");
}
if (!isHttpsUrl(packageJson.bugs?.url)) {
  errors.push("package.json bugs.url must contain the verified HTTPS issue URL.");
}
if (
  typeof packageJson.author !== "string" ||
  packageJson.author.trim() === "" ||
  /(?:todo|placeholder|your name|^npmsevdesk contributors$|^contributors$)/iu.test(
    packageJson.author.trim()
  )
) {
  errors.push("package.json author must identify the verified package owner/maintainers.");
}

if (process.env.GITHUB_REPOSITORY && repositoryUrl) {
  const expected = `https://github.com/${process.env.GITHUB_REPOSITORY}`.toLowerCase();
  const normalized = repositoryUrl
    .replace(/^git\+/u, "")
    .replace(/(?:\.git)?\/?$/u, "")
    .toLowerCase();
  if (normalized !== expected) {
    errors.push(`repository URL must match GITHUB_REPOSITORY (${expected}).`);
  }
}

if (errors.length > 0) {
  console.error("Release verification failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  const suffix = channel === undefined ? "" : ` (${channel}${prerelease ? ", prerelease" : ""})`;
  console.log(`Release metadata verified for ${packageJson.name}@${version}${suffix}.`);
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    console.error(`${name} requires a value.`);
    process.exit(2);
  }
  return value;
}

function expectEqual(actual, expected, path) {
  if (actual !== expected) {
    errors.push(`${path} must be ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`);
  }
}

function isHttpsUrl(value) {
  if (typeof value !== "string") return false;
  try {
    return new URL(value.replace(/^git\+/u, "")).protocol === "https:";
  } catch {
    return false;
  }
}
