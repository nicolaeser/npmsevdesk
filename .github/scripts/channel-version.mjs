import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = new URL("../../", import.meta.url);

export function developmentVersion(baseVersion, commitDate, fullSha) {
  if (!/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u.test(baseVersion)) {
    throw new Error(`Base version must be stable SemVer, received ${JSON.stringify(baseVersion)}.`);
  }
  const date = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(commitDate);
  if (date === null) {
    throw new Error(`Commit date must be YYYY-MM-DD, received ${JSON.stringify(commitDate)}.`);
  }
  if (!/^[0-9a-f]{40}$/u.test(fullSha)) {
    throw new Error(`Commit SHA must be 40 hex characters, received ${JSON.stringify(fullSha)}.`);
  }
  const year = String(Number(date[1]));
  const month = String(Number(date[2]));
  const day = String(Number(date[3]));
  const sha7 = fullSha.slice(0, 7);
  const shaId = /^[0-9]+$/u.test(sha7) ? `s${sha7}` : sha7;
  const version = `${baseVersion}-vdev.${year}.${month}.${day}.${shaId}`;
  if (!/^[A-Za-z0-9][A-Za-z0-9._+-]{0,63}$/u.test(version)) {
    throw new Error(`Development version ${version} is not a valid release tag.`);
  }
  return version;
}

export function developmentDistTag(fullSha) {
  if (!/^[0-9a-f]{40}$/u.test(fullSha)) {
    throw new Error(`Commit SHA must be 40 hex characters, received ${JSON.stringify(fullSha)}.`);
  }
  return `dev-${fullSha.slice(0, 7)}`;
}

export function replaceLeadingVersions(source, fromVersion, toVersion, count) {
  let replaced = 0;
  const next = source.replace(/"version": "[^"]+"/g, (match) => {
    if (replaced >= count || match !== `"version": "${fromVersion}"`) return match;
    replaced += 1;
    return `"version": "${toVersion}"`;
  });
  if (replaced !== count) {
    throw new Error(`Expected ${count} leading ${fromVersion} versions, replaced ${replaced}.`);
  }
  return next;
}

const invokedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  const channel = argumentValue("--channel");
  if (channel !== "dev") {
    throw new Error(`--channel must be "dev" when stamping a development build, received ${JSON.stringify(channel)}.`);
  }
  const packagePath = new URL("package.json", root);
  const lockPath = new URL("package-lock.json", root);
  const packageJson = JSON.parse(await readFile(packagePath, "utf8"));
  const fullSha = git(["rev-parse", "HEAD"]);
  const commitDate = git(["show", "-s", "--format=%cs", "HEAD"]);
  const version = developmentVersion(packageJson.version, commitDate, fullSha);
  const packageSource = await readFile(packagePath, "utf8");
  const lockSource = await readFile(lockPath, "utf8");
  await writeFile(packagePath, replaceLeadingVersions(packageSource, packageJson.version, version, 1));
  await writeFile(lockPath, replaceLeadingVersions(lockSource, packageJson.version, version, 2));
  process.stdout.write(`version=${version}\n`);
  process.stdout.write(`dev_tag=${developmentDistTag(fullSha)}\n`);
}

function git(args) {
  return execFileSync("git", args, {
    cwd: fileURLToPath(root),
    encoding: "utf8"
  }).trim();
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return undefined;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}
