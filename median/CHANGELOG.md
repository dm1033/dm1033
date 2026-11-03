# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

First version, planned for release as 1.0.0.

### Added

- `median(arr)` function that returns the median of an array of numbers:
  - returns the middle value for odd-length arrays
  - returns the mean of the two middle values for even-length arrays
  - sorts numerically on a copy, leaving the caller's array unchanged
  - throws an `Error` for an empty array or input that is not an array
- Jest 30 test suite (15 tests) covering odd and even lengths, numeric sorting, negatives, decimals, duplicates, input order, unchanged input and invalid input.
- Coverage report via `npm run coverage` (terminal summary, HTML and LCOV), with a 100% minimum for statements, branches, functions and lines.
- median CI workflow (`.github/workflows/median-ci.yml` at the repository's top level), run when files in `median/` change, weekly and on demand, with three jobs: lint, formatting, spelling and tests with coverage on Node.js 22 and 24; `npm audit` with signature checks; and a Markdown link check with lychee.
- `README.md` with usage, behaviour, development commands and a CI status badge.
- `CONTRIBUTING.md` with setup, testing, code style and pull request guidelines.
- MIT `LICENSE`.
- `CODE_OF_CONDUCT.md`, adopting the Contributor Covenant 2.1.
- `SECURITY.md` explaining supported versions and how to report vulnerabilities privately.
- Prettier formatting with `npm run format` and `npm run format:check`, checked in CI.
- ESLint with the recommended rules plus stricter checks (`eqeqeq`, `no-var`, `prefer-const`, `no-param-reassign`), run with `npm run lint` and checked in CI.
- Pre-commit hook (Husky and lint-staged) that lints, formats and runs related tests on staged files in `median/`, and skips itself if median's dependencies aren't installed, so commits elsewhere in the repository are never blocked.
- `.nvmrc` recommending Node.js 24, and an `engines` field in `package.json` requiring Node.js 22 or later.
- `.npmrc` that enforces the `engines` requirement during install and hides funding messages.
- `.gitattributes` that stores text files with LF line endings, protects binary files and collapses `package-lock.json` in pull request diffs.
- Shared VS Code settings (format with Prettier and fix ESLint problems on save) and recommended extensions.
- `main`, `description` and `files` fields in `package.json`, so the package contains only `median.js`, `README.md`, `LICENSE` and `package.json`.
- `SUPPORT.md` explaining where to ask questions and report problems.
- Spell checking with CSpell (British English) via `npm run spell`, in the pre-commit hook and in CI.
- npm `overrides` forcing patched versions of `glob` (`^14.0.2`) and `minimatch` (`^11.0.1`) inside Jest and ESLint, clearing all moderate audit advisories.

### Not active in this repository

These are included for reference, and become active if the project moves to its own repository. GitHub only reads them from a repository's top level:

- Renovate configuration (`.github/renovate.json`) for weekly updates, immediate security updates and monthly lock file maintenance.
- Pull request template, and issue forms for bug reports and feature requests.
- `.github/CODEOWNERS`, `.github/FUNDING.yml`, `.github/release.yml` and `.github/labels.yml`.
- Release, Sync labels, Stale and CodeQL workflows in `.github/workflows/`.

### Fixed

Compared with the original one-line implementation, `function median(a){a.sort();return a[a.length/2]}`:

- Numbers were sorted as text, so `[10, 9, 2]` became `[10, 2, 9]`.
- Odd-length arrays returned `undefined`, because `a.length / 2` is not a whole number.
- Even-length arrays returned the upper middle value instead of the mean of the two middle values.
- The caller's array was reordered in place.
- An empty array returned `undefined` with no error.
