# median

[![median CI](https://github.com/dm1033/dm1033/actions/workflows/median-ci.yml/badge.svg?branch=main)](https://github.com/dm1033/dm1033/actions/workflows/median-ci.yml)

A small, tested JavaScript function that returns the median of an array of numbers.

This project lives in the `median/` folder of the [dm1033/dm1033](https://github.com/dm1033/dm1033) repository, alongside other projects. Run all commands below from inside `median/`.

## Usage

```js
const { median } = require("./median");

median([3, 1, 2]); // 2
median([1, 2, 3, 4]); // 2.5 (mean of the two middle values)
median([10, 9, 2]); // 9 (sorted numerically, not as text)
median([]); // throws Error: median() requires a non-empty array
```

### Behaviour

- **Odd-length array:** returns the middle value.
- **Even-length array:** returns the mean of the two middle values.
- **Sorting:** values are sorted numerically on a copy, so the caller's array is not changed.
- **Invalid input:** throws an `Error` for an empty array or anything that is not an array.

## Development

Requires Node.js 22 or later. The `.nvmrc` file pins the recommended version (Node.js 24), so with [nvm](https://github.com/nvm-sh/nvm) you can run `nvm use` in the project folder to switch to it. `npm install` and `npm ci` stop with an error on older versions.

```bash
npm ci               # install dependencies and the pre-commit hook
npm test             # run the Jest test suite
npm run coverage     # run tests with a coverage report
npm run lint         # check code with ESLint
npm run lint:fix     # fix ESLint problems that can be fixed automatically
npm run format       # format all files with Prettier
npm run format:check # check formatting without changing files
npm run spell        # check spelling with CSpell (British English)
```

A pre-commit hook (Husky and lint-staged) lints, formats and runs related tests on staged files before each commit. See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

`npm run coverage` prints a summary table and writes an HTML report to `coverage/index.html`. The run fails if statement, branch, function or line coverage falls below 100%.

## Continuous integration

The [median CI workflow](../.github/workflows/median-ci.yml), at the top level of the repository, starts on every push to `main` and every pull request, weekly, and on demand from the Actions tab. Its checks only run when files in `median/` (or the workflow itself) change; otherwise they're skipped. It has three check jobs:

- **Test**, on Node.js 22 and 24: `npm ci`, then lint, formatting check, spell check and tests with 100% coverage. The coverage report from the Node.js 24 run is kept as a build artifact for 14 days.
- **npm audit**: fails on any advisory in runtime dependencies, or on high and critical advisories in development dependencies, and verifies package signatures.
- **Check Markdown links**: checks every link in median's Markdown files with lychee.

A final **median CI result** job always reports. It passes when every check passed, or was skipped because `median/` didn't change, and fails otherwise. This is the job to require in branch protection: unlike the individual checks, it never leaves a pull request that doesn't touch `median/` waiting.

## Files that GitHub doesn't act on here

GitHub only reads workflows, issue forms, the pull request template, `CODEOWNERS`, funding and Renovate settings from the top level of a repository. Because this project is in a subfolder, the following files are kept for reference but are **not active**, so they don't affect the rest of the repository:

- `.github/workflows/codeql.yml`, `labels.yml`, `release.yml` and `stale.yml`
- `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md`, `.github/CODEOWNERS`, `.github/FUNDING.yml`, `.github/labels.yml`, `.github/release.yml` and `.github/renovate.json`

They become active if the project moves to its own repository. Until then, dependency updates, releases and labels are handled by hand. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Project structure

```
median/
├── .gitattributes               # line endings and diff settings for Git
├── .husky/pre-commit            # pre-commit hook
├── .npmrc                       # npm settings (enforces the Node.js version)
├── .nvmrc                       # recommended Node.js version
├── .vscode/                     # shared VS Code settings and recommended extensions
├── .github/                     # inactive here; see "Files that GitHub doesn't act on here"
├── median.js                    # the median function
├── cspell.json                  # spell check settings and project words
├── eslint.config.js             # ESLint rules
├── lychee.toml                  # link checker settings
├── median.test.js               # Jest tests
└── package.json                 # scripts and Jest configuration
```

## Getting help

See [SUPPORT.md](SUPPORT.md) for where to ask questions, report bugs and suggest features.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, testing and pull request guidelines, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for the standards expected of everyone taking part. To report a security vulnerability, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.

## License

[MIT](LICENSE) © 2026 Temporary Works Consulting & Design Ltd
