const fs = require("node:fs");
const path = require("node:path");

const schemaDir = path.join(__dirname, "..", "..", "content-seo-pack", "schema");

module.exports = function () {
  const schemas = {};
  for (const file of fs.readdirSync(schemaDir)) {
    if (!file.endsWith(".json")) continue;
    const key = file.replace(/\.json$/, "");
    const raw = JSON.parse(fs.readFileSync(path.join(schemaDir, file), "utf8"));
    delete raw._comment;
    schemas[key] = raw;
  }
  return schemas;
};
