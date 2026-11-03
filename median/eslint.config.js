const js = require("@eslint/js");
const globals = require("globals");
const prettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["coverage/", "node_modules/"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: globals.node,
    },
    rules: {
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "error",
      "no-param-reassign": "error",
    },
  },
  {
    files: ["**/*.test.js"],
    languageOptions: {
      globals: globals.jest,
    },
  },
  // Turns off rules that conflict with Prettier; keep this last
  prettier,
];
