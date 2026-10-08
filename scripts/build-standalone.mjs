/**
 * Builds the single-file standalone site.
 *
 *   standalone/template.html  (EDIT THIS — readable source with {{IMG:*}} tokens)
 *   standalone/images/*.jpg   (compressed source images)
 *        │
 *        ▼  npm run standalone
 *   standalone/index.html     (GENERATED — do not edit by hand)
 *
 * No dependencies — plain Node.
 */
import { readFileSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "standalone");
let html = readFileSync(join(root, "template.html"), "utf8");

const tokens = [...new Set([...html.matchAll(/\{\{IMG:([a-z]+)\}\}/g)].map((m) => m[1]))];
for (const key of tokens) {
  const b64 = readFileSync(join(root, "images", `${key}.jpg`)).toString("base64");
  html = html.replaceAll(`{{IMG:${key}}}`, `data:image/jpeg;base64,${b64}`);
}
if (/\{\{IMG:/.test(html)) throw new Error("unreplaced image token remains");

html = html.replace(
  "<!DOCTYPE html>",
  "<!DOCTYPE html>\n<!-- GENERATED FILE — edit standalone/template.html and run: npm run standalone -->",
);

writeFileSync(join(root, "index.html"), html);
console.log(
  `built standalone/index.html (${Math.round(statSync(join(root, "index.html")).size / 1024)} KB, ${tokens.length} images)`,
);
