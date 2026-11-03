# Contributing to median

Thanks for helping improve this project. This guide explains how to set up, make a change and get it merged.

Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

- **Security vulnerabilities:** don't open a public issue. Follow [SECURITY.md](SECURITY.md) to report them privately.
- **Bugs:** open an issue starting the title with `median:`, with the input you used, the result you got and the result you expected.
- **New features or behaviour changes:** open an issue starting the title with `median:` to discuss the idea first, so no one spends time on a change that won't be accepted.
- **Small fixes** (typos, documentation, an extra test): go straight to a pull request.

## Setting up

You need Node.js 22 or later. If you use nvm, run `nvm use` to switch to the version in `.nvmrc`.

```bash
git clone https://github.com/dm1033/dm1033.git
cd dm1033/median
npm ci
npm test
```

All tests should pass before you change anything.

If you use VS Code, accept the prompt to install the recommended extensions (ESLint, Prettier, EditorConfig and Jest). The shared settings in `.vscode/settings.json` then format files with Prettier and apply ESLint fixes each time you save.

`npm ci` also installs a Git pre-commit hook (using [Husky](https://typicode.github.io/husky/) and [lint-staged](https://github.com/lint-staged/lint-staged)). On each commit it runs on your staged files only:

- **JavaScript files:** `eslint --fix`, then Prettier, then a spell check, then the Jest tests related to the changed files
- **JSON, Markdown and YAML files:** Prettier, then a spell check

Formatting and auto-fixable lint problems are fixed and included in the commit for you. If a lint error can't be fixed automatically, or a related test fails, the commit is stopped so you can fix it. The hook doesn't check coverage; CI does that.

In an emergency you can skip the hook with `git commit --no-verify`, but CI runs the same checks, so the pull request will still fail until they pass.

## Making a change

1. Create a branch from `main` with a short, descriptive name, for example `fix-nan-handling`.
2. Make your change in `median.js`.
3. Add or update tests in `median.test.js` that cover it:
   - a **bug fix** needs a test that fails without the fix and passes with it
   - a **new behaviour** needs tests for the normal case and the edge cases (empty input, a single element, negatives, duplicates)
4. Format your code and run the full check:

   ```bash
   npm run format
   npm run lint
   npm run coverage
   ```

   This must pass with **100% statement, branch, function and line coverage**. If you add a branch to the code, add a test that runs it.

5. Update `README.md` if the change affects how the function is used or behaves.
6. Add a line to the `[Unreleased]` section of `CHANGELOG.md` under the right heading (`Added`, `Changed`, `Fixed`, `Removed`), unless the change is internal only, such as a test or tooling tweak.

## Code style

- Keep the function small and free of dependencies.
- Don't change the caller's input. Work on a copy.
- Throw an `Error` with a clear message for invalid input, rather than returning `undefined` or `NaN`.
- Code must pass ESLint (`npm run lint`). The rules in `eslint.config.js` catch likely bugs, such as undefined variables and `==` instead of `===`. `npm run lint:fix` fixes some problems automatically.
- Write in British English (for example, "behaviour", "normalise"). `npm run spell` checks spelling with [CSpell](https://cspell.org). If it flags a correct word, such as a tool name, add it to the `words` list in `cspell.json`.
- Match the formatting of the existing code (two-space indentation, double quotes, semicolons). Formatting is handled by [Prettier](https://prettier.io): run `npm run format` before committing. CI runs `npm run format:check` and fails if any file isn't formatted. The `.editorconfig` file sets matching indentation, line endings and whitespace in most editors as you type.

## Commit messages

Write a short summary line in the imperative mood, under about 72 characters, for example:

```
Reject arrays containing non-numeric values
```

Add a blank line and a longer explanation if the reason for the change isn't obvious.

## Pull requests

- Keep each pull request to one change.
- Explain what changed and why, and link the related issue if there is one.
- The [median CI workflow](../.github/workflows/median-ci.yml) runs automatically when a pull request changes files in `median/`. It must pass before the pull request is merged.
- A maintainer will review it and may ask for changes.

## Dependency overrides (maintainers)

`package.json` has an `overrides` section that forces patched versions of two packages used inside Jest and ESLint:

| Package     | Forced version | Why                                                                                                    |
| ----------- | -------------- | ------------------------------------------------------------------------------------------------------ |
| `glob`      | `^14.0.2`      | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) affects 9.0.0 to 14.0.1       |
| `minimatch` | `^11.0.1`      | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) affects versions below 11.0.1 |

Jest and ESLint weren't released against these versions, so after any Jest or ESLint upgrade, run `npm run coverage` and `npm run lint` to confirm they still work. Once Jest and ESLint depend on patched versions themselves, remove the matching override and run `npm install`. Dependency updates are done by hand while this project shares a repository (Renovate isn't active here), so check the overrides whenever you update dependencies.

## Releasing (maintainers)

1. Decide the new version using [Semantic Versioning](https://semver.org/): major for breaking changes, minor for new features, patch for fixes.
2. In `CHANGELOG.md`, rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD` and add a new empty `## [Unreleased]` section above it.
3. Update the version in `package.json` and `package-lock.json`, without creating a tag yet:

   ```bash
   npm version X.Y.Z --no-git-tag-version
   ```

4. Commit these changes through a pull request and merge it into `main`.
5. Tag the merge commit on `main` and push the tag. Tags are prefixed with `median-` because the repository holds other projects:

   ```bash
   git checkout main && git pull
   git tag median-vX.Y.Z
   git push origin median-vX.Y.Z
   ```

The Release workflow (`.github/workflows/release.yml`) isn't active while this project lives in a subfolder, so for now create the release by hand from the repository's **Releases** page, with that version's changelog section as the notes. If the project moves to its own repository, the workflow will check and publish releases automatically, stopping if the tag doesn't match `package.json`, if `CHANGELOG.md` has no section for that version, or if any check fails. Tags with a suffix, such as `v1.1.0-beta.1`, are published as pre-releases.

## License

By contributing, you agree that your contributions are licensed under the project's [MIT License](LICENSE).
