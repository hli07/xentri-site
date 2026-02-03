# xentri-site
# Xentri Website

This repository contains the source and release configuration for the **Xentri** website.

The site is designed to be:
- Static, fast, and secure
- Fully responsive (mobile, tablet, desktop)
- Deployed via GitHub Pages
- Versioned and released automatically using **semantic-release**

The domain (`xentri.co.uk`) is managed via Squarespace DNS and points to GitHub Pages.

---

## Repository Overview

This repository focuses on:
- Website source files (static content)
- Automated release management
- Versioned changelog and GitHub releases

Key files:
- `package.json` – release tooling configuration
- `.releaserc` – semantic-release rules
- `.github/workflows/release.yml` – GitHub Actions release pipeline
- `CHANGELOG.md` – auto-generated release notes

---

## Prerequisites

- Node.js **18+** (Node 20 recommended)
- npm

---

## Local Setup

Install dependencies:

```bash
npm install
```

This repository does not require a local development server at this stage.
It is primarily used for **content management and release automation**.

---

## Release Process (Semantic Release)

This project uses **semantic-release** to automate:
- Versioning
- Git tags
- `CHANGELOG.md`
- GitHub Releases

### Branching Strategy

- Releases are generated **only from the `main` branch**
- Other branches do not trigger releases

This is configured in `.releaserc`:

```json
{
  "branches": ["main"]
}
```

---

### Commit Message Convention

Releases are driven entirely by **Conventional Commits**.

Examples:

| Commit message                          | Result          |
|----------------------------------------|-----------------|
| `fix: correct typo on homepage`        | Patch release   |
| `feat: add jobs listing page`          | Minor release   |
| `feat!: redesign site layout`          | Major release   |
| `chore: update copy`                   | No release      |

Breaking changes must include `!` or a `BREAKING CHANGE:` footer.

---

### How a Release Is Triggered

1. Commit changes using conventional commit messages
2. Push changes to the `main` branch
3. GitHub Actions runs the release workflow
4. semantic-release will:
   - Determine the next semantic version
   - Update `CHANGELOG.md`
   - Create a Git tag
   - Create a GitHub Release
   - Commit version and changelog updates back to `main`

A release can also be triggered manually via **GitHub Actions → Workflow Dispatch**.

---

## Versioning

- Versions are **not** manually edited
- The `version` field in `package.json` is managed by semantic-release
- Git tags follow semantic versioning (`vX.Y.Z`)

---

## Notes

- This repository is **private** and not open source
- No license is intentionally applied
- All content, copy, and structure are proprietary to Xentri

---

## Maintainers

Xentri Ltd