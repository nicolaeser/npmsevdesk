import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const esmDir = join(root, "dist/types/esm");
const cjsDir = join(root, "dist/types/cjs");
const clean = process.argv.includes("--clean");

if (clean) {
  await rm(cjsDir, { recursive: true, force: true });
  process.exit(0);
}

await rm(cjsDir, { recursive: true, force: true });
const files = await listFiles(esmDir);
if (files.length === 0) {
  throw new Error("No ESM declarations found under dist/types/esm. Run tsc -p tsconfig.build.json first.");
}

for (const source of files) {
  const relativePath = relative(esmDir, source);
  const target = join(cjsDir, toCjsDeclarationPath(relativePath));
  await mkdir(dirname(target), { recursive: true });
  const contents = await readFile(source, "utf8");
  await writeFile(target, rewriteDeclaration(contents, relativePath));
}

function toCjsDeclarationPath(relativePath) {
  return relativePath
    .replace(/\.d\.ts\.map$/u, ".d.cts.map")
    .replace(/\.d\.ts$/u, ".d.cts");
}

function rewriteDeclaration(contents, relativePath) {
  if (relativePath.endsWith(".d.ts.map")) {
    const map = JSON.parse(contents);
    if (typeof map.file === "string") {
      map.file = map.file.replace(/\.d\.ts$/u, ".d.cts");
    }
    return `${JSON.stringify(map)}\n`;
  }
  if (!relativePath.endsWith(".d.ts")) return contents;
  return contents
    .replaceAll(".d.ts.map", ".d.cts.map")
    .replace(/(from\s+|import\s*\(\s*)(["'])(\.[^"']+)\.js\2/gu, "$1$2$3.cjs$2");
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error && error.code === "ENOENT") return [];
    throw error;
  });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else files.push(path);
  }
  return files;
}
