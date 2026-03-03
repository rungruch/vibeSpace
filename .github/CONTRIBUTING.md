# Contributing Guide

## Branch Strategy

This repository uses a **dual-branch strategy** to control what is publicly visible while keeping active development on `main`.

### Branch Overview

| Branch   | Purpose                                    | Publicly Featured |
|----------|--------------------------------------------|:-----------------:|
| `main`   | Active development – merged features land here | No (internal)  |
| `public` | Stable, publicly-showcased snapshot of `main` | **Yes** (default) |

> **Note:** Both branches are technically accessible in a public repository. The `public` branch is set as the **default branch** in GitHub settings so it is what visitors see first when they open the repository page.

---

## Setting `public` as the Default Branch

To make `public` the branch visitors see by default:

1. Go to your repository on GitHub.
2. Click **Settings** → **Branches**.
3. Under **Default branch**, click the pencil icon (✏️).
4. Select `public` from the dropdown and click **Update**.
5. Confirm the change.

After this, anyone visiting the repository URL will land on the `public` branch instead of `main`.

---

## How the Sync Works

A GitHub Actions workflow (`.github/workflows/sync-public-branch.yml`) automatically pushes every commit on `main` to the `public` branch. This means:

- `main` receives all active development.
- `public` stays in sync with `main` automatically after each push.
- **Never push directly to `public`** – it is managed exclusively by the workflow. Direct pushes will be overwritten on the next sync and may cause diverging histories.
- You can temporarily **pause** the sync by disabling the workflow in **Actions → Sync to Public Branch → ⋯ → Disable workflow** if you want to hold back changes from the public branch.

---

## Keeping Changes Off the Public Branch

If you want a period of development that is **not yet reflected** on `public`:

1. Disable the **Sync to Public Branch** workflow in the GitHub Actions UI (**Actions → Sync to Public Branch → ⋯ → Disable workflow**).
2. Push commits to `main` as normal.
3. When you are ready, re-enable the workflow **or** trigger it manually from the Actions tab.

---

## Development Workflow

```
feature/my-feature ──┐
                      ▼
                    main  ──(auto-sync)──▶  public
```

1. Create a feature branch from `main`.
2. Open a pull request targeting `main`.
3. Once merged, the **Sync to Public Branch** workflow automatically updates `public`.
