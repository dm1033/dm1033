# Security Policy

## Supported versions

This project has not had a tagged release yet. Until 1.0.0 is released, only the latest code on the `main` branch receives security fixes.

After release, security fixes will go into the latest minor version of the current major version.

| Version             | Supported |
| ------------------- | --------- |
| `main` (unreleased) | Yes       |

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues, pull requests or discussions.**

Report them privately through GitHub instead:

1. Go to the repository's **Security** tab.
2. Select **Report a vulnerability**.
3. Fill in the form.

Only the maintainers can see the report. GitHub's guide explains the process: [Privately reporting a security vulnerability](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability).

### What to include

- a description of the problem and what an attacker could do with it
- the version or commit you tested
- steps or a minimal code sample that reproduces it
- any suggested fix, if you have one

## What happens next

This is a small project maintained on a best-effort basis. We aim to:

- acknowledge your report within **5 working days**
- give an initial assessment, or ask for more detail, within **10 working days**
- keep you updated while a fix is prepared
- publish a fix and a GitHub security advisory once it's resolved, crediting you unless you'd rather stay anonymous

Please give us a reasonable chance to fix the problem before you disclose it publicly.

## Automated scanning

The median CI workflow runs `npm audit` when median's files change and once a week. It fails if any runtime dependency has a known advisory, or any development dependency has a high or critical one. It doesn't replace reports from people, so please tell us about anything you find.

## Scope

`median` is a single function with no runtime dependencies. Reports most likely to be relevant include:

- input that makes the function hang, crash the process or use excessive memory
- a problem in the median CI workflow (`.github/workflows/median-ci.yml`) that could expose secrets or let untrusted code run with elevated permissions

Vulnerabilities in development dependencies, such as Jest, should be reported to those projects. Tell us as well if they affect how this project is built or tested.
