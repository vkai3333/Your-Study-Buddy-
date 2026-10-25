import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import esbuild from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const sources = JSON.parse(await fs.readFile(path.join(root, "tools", "browser-bundle-sources.json"), "utf8"));
if (!Array.isArray(sources) || !sources.length) throw new Error("No browser bundle sources were configured.");

const parts = [];
for (const source of sources) {
  const sourcePath = path.join(dist, source);
  const contents = await fs.readFile(sourcePath, "utf8");
  const browserContents = source === "vendor/ts-fsrs.umd.js"
    ? `(function (exports, module, define) {\n${contents}\n})(undefined, undefined, undefined);`
    : contents;
  parts.push(`\n/* ${source} */\n${browserContents}\n`);
}

const result = await esbuild.transform(parts.join(""), {
  charset: "utf8",
  format: "iife",
  legalComments: "none",
  minify: true,
  sourcemap: false,
  target: ["safari16"],
});

await fs.writeFile(path.join(dist, "app.bundle.js"), result.code);
console.log(`Bundled ${sources.length} browser scripts into dist/app.bundle.js (${Buffer.byteLength(result.code)} bytes).`);
