import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { access } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const packageJson = JSON.parse(await readUtf8(join(root, "package.json")));
const errors = [];

const subpaths = Object.keys(packageJson.exports ?? {}).filter((key) => key !== "./package.json");
if (subpaths.length === 0) errors.push("package.json exports is empty.");

for (const subpath of subpaths) {
  const entry = packageJson.exports[subpath];
  await expectFile(entry?.import?.default, `${subpath} ESM`);
  await expectFile(entry?.import?.types, `${subpath} ESM types`);
  await expectFile(entry?.require?.default, `${subpath} CommonJS`);
  await expectFile(entry?.require?.types, `${subpath} CommonJS types`);
}

const workspace = await mkdtemp(join(tmpdir(), "npmsevdesk-exports-"));
try {
  const linkedPackage = join(workspace, "node_modules", packageJson.name);
  await mkdir(dirname(linkedPackage), { recursive: true });
  await symlink(root, linkedPackage, "dir");

  await writeFile(
    join(workspace, "esm-consumer.mjs"),
    `${consumerSource(packageJson.name, "esm")}\n`
  );
  await writeFile(
    join(workspace, "cjs-consumer.cjs"),
    `${consumerSource(packageJson.name, "cjs")}\n`
  );
  await writeFile(
    join(workspace, "consumer.ts"),
    [
      `import { createSevdeskClient } from "${packageJson.name}";`,
      `import { createRawResources } from "${packageJson.name}/raw";`,
      `import { refs } from "${packageJson.name}/types";`,
      `import { InvoiceStatus } from "${packageJson.name}/enums";`,
      `import { buildInvoicePayload } from "${packageJson.name}/bundles";`,
      `import { taxes } from "${packageJson.name}/taxes";`,
      "export const client: ReturnType<typeof createSevdeskClient> = createSevdeskClient({",
      '  apiToken: "verify-package"',
      "});",
      "void createRawResources;",
      "void refs.contact;",
      "void InvoiceStatus.OPEN;",
      "void buildInvoicePayload;",
      "void taxes;",
      "client.dispose();",
      ""
    ].join("\n")
  );
  await writeFile(
    join(workspace, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ES2024",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
          exactOptionalPropertyTypes: true,
          noEmit: true,
          skipLibCheck: true,
          types: []
        },
        files: ["consumer.ts"]
      },
      null,
      2
    )}\n`
  );

  runOrRecord(errors, "ESM consumer", "node", ["esm-consumer.mjs"], workspace);
  runOrRecord(errors, "CommonJS consumer", "node", ["cjs-consumer.cjs"], workspace);
  runOrRecord(errors, "TypeScript consumer", "npx", ["tsc", "-p", workspace], root);
} finally {
  await rm(workspace, { recursive: true, force: true });
}

if (errors.length > 0) {
  console.error("Package export verification failed:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Verified ${subpaths.length} package export paths as ESM, CommonJS, and TypeScript consumers.`);
}

function consumerSource(name, kind) {
  const specs = [
    [name, "createSevdeskClient", "function"],
    [`${name}/raw`, "createRawResources", "function"],
    [`${name}/types`, "refs.contact", "function"],
    [`${name}/enums`, "InvoiceStatus.OPEN", "defined"],
    [`${name}/bundles`, "buildInvoicePayload", "function"],
    [`${name}/taxes`, "taxes", "object"]
  ];
  if (kind === "esm") {
    return `${specs
      .map(([spec], index) => `import * as m${index} from ${JSON.stringify(spec)};`)
      .join("\n")}
${specs.map((entry, index) => checkLine(`m${index}`, entry[1], entry[2], entry[0])).join("\n")}
`;
  }
  return `"use strict";
${specs
  .map(([spec], index) => `const m${index} = require(${JSON.stringify(spec)});`)
  .join("\n")}
${specs.map((entry, index) => checkLine(`m${index}`, entry[1], entry[2], entry[0])).join("\n")}
`;
}

function checkLine(mod, path, kind, spec) {
  return `if (!(${predicate(mod, path, kind)})) throw new Error(${JSON.stringify(
    `Resolved "${spec}" is missing ${path}.`
  )});`;
}

function predicate(mod, path, kind) {
  if (kind === "function") return `typeof ${mod}.${path} === "function"`;
  if (kind === "object") return `typeof ${mod}.${path} === "object" && ${mod}.${path} !== null`;
  return `${mod}.${path} !== undefined`;
}

function runOrRecord(list, label, command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) {
    list.push(`${label} failed:\n${result.stdout}${result.stderr}`);
  }
}

async function expectFile(relativePath, label) {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    errors.push(`${label} path is missing from package.json exports.`);
    return;
  }
  try {
    await access(join(root, relativePath));
  } catch {
    errors.push(`${label} file is missing: ${relativePath}`);
  }
}

async function readUtf8(path) {
  const { readFile } = await import("node:fs/promises");
  return readFile(path, "utf8");
}
