# Repository Structure and Development Standards

## Overview

This document defines the repository structure, tooling, and development standards for the `@nesalia/create` monorepo. These standards are strictly enforced to maintain code quality and consistency across all packages.

## Table of Contents

1. [Repository Structure](#repository-structure)
2. [Tooling](#tooling)
3. [Pre-commit Hooks](#pre-commit-hooks)
4. [Development Workflow](#development-workflow)
5. [Code Quality Standards](#code-quality-standards)
6. [Release Process](#release-process)

---

## Repository Structure

```
@nesalia/create/
├── .changeset/              # Changeset configurations
│   └── config.json
├── .github/
│   └── workflows/           # CI/CD workflows
├── packages/
│   ├── create/              # Main CLI package
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── template-basic/      # Basic template
│   ├── template-react/      # React template
│   └── template-vue/        # Vue template
├── packages-shared/         # Shared utilities (optional)
│   └── config/              # Shared configs
├── .husky/                  # Git hooks
│   ├── pre-commit
│   └── commit-msg
├── .prettierrc.json         # Prettier configuration
├── .eslint.config.js        # ESLint configuration
├── pnpm-workspace.yaml      # pnpm workspace configuration
├── package.json             # Root package.json
├── tsconfig.json            # Root TypeScript configuration
├── vitest.workspace.ts      # Vitest workspace configuration
└── README.md
```

---

## Tooling

### Package Manager: pnpm

We use **pnpm** as our package manager for its efficiency and strict handling of dependencies.

**Why pnpm?**

- Fast installation times
- Disk space efficient (uses hard links)
- Strict dependency handling (no phantom dependencies)
- Built-in workspace support

**Workspace Configuration** (`pnpm-workspace.yaml`):

```yaml
packages:
  - 'packages/*'
  - 'packages-shared/*'
```

**Common Commands:**

```bash
# Install dependencies
pnpm install

# Add dependency to specific package
pnpm --filter @nesalia/create add <package>

# Add dev dependency to all packages
pnpm -wD add <package>

# Run script in specific package
pnpm --filter @nesalia/template-react test

# Run script in all packages
pnpm -r test
```

### Code Formatting: Prettier

**Configuration** (`.prettierrc.json`):

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

**Ignore patterns** (`.prettierignore`):

```
node_modules/
dist/
build/
coverage/
*.lock
pnpm-lock.yaml
```

### Linting: ESLint

**Configuration** (`.eslint.config.js`):

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  }
);
```

**Note:** We use the modern flat config format.

### Type Checking: TypeScript

**Root Configuration** (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Package-specific Configuration** (`packages/*/tsconfig.json`):

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "references": [{ "path": "../shared-config" }]
}
```

### Testing: Vitest

**Workspace Configuration** (`vitest.workspace.ts`):

```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'packages/*/vitest.config.ts',
  'packages-shared/*/vitest.config.ts',
]);
```

**Package Configuration** (`packages/*/vitest.config.ts`):

```typescript
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/test/**'],
    },
  },
  plugins: [tsconfigPaths()],
});
```

### Version Management: Changesets

**Configuration** (`.changeset/config.json`):

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

**Usage:**

```bash
# Add a changeset for your changes
pnpm changeset

# Version packages based on changesets
pnpm changeset version

# Release packages to npm
pnpm changeset publish
```

### Git Hooks: Husky

**Configuration:**

```bash
# Initialize Husky
pnpm exec husky init

# Set up pre-commit hook
echo "pnpm lint-staged" > .husky/pre-commit

# Set up commit-msg hook (optional)
echo "pnpm commitlint --edit \$1" > .husky/commit-msg
```

---

## Pre-commit Hooks

### Strict Pre-commit Checks

Our pre-commit hooks **MUST** pass before any commit can be made. This ensures that:

1. All tests pass
2. Code is properly linted
3. TypeScript types are correct
4. Code is formatted

### Pre-commit Hook Implementation

**File:** `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running pre-commit checks..."

# Run type checking
echo "Checking types..."
pnpm -r exec tsc --noEmit || {
  echo "Type check failed. Commit aborted."
  exit 1
}

# Run linter
echo "Running linter..."
pnpm -r exec eslint . || {
  echo "Lint check failed. Commit aborted."
  exit 1
}

# Run tests
echo "Running tests..."
pnpm -r vitest run || {
  echo "Tests failed. Commit aborted."
  exit 1
}

# Run formatter check
echo "Checking formatting..."
pnpm exec prettier --check . || {
  echo "Code is not formatted. Run 'pnpm format' to fix."
  exit 1
}

echo "All checks passed! Proceeding with commit..."
```

### Using lint-staged (Optional Optimization)

For better performance on large repositories, we can use `lint-staged`:

**Installation:**

```bash
pnpm -D add lint-staged
```

**Configuration** (`package.json`):

```json
{
  "lint-staged": {
    "*.{ts,js}": ["prettier --write", "eslint --fix", "tsc --noEmit"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

**Updated Pre-commit Hook:**

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running pre-commit checks..."

# Run lint-staged
pnpm exec lint-staged || {
  echo "Lint-staged failed. Commit aborted."
  exit 1
}

# Run all tests (after lint-staged passes)
echo "Running tests..."
pnpm -r vitest run || {
  echo "Tests failed. Commit aborted."
  exit 1
}

echo "All checks passed! Proceeding with commit..."
```

---

## Development Workflow

### Branch Strategy: Trunk-Based Development

We follow **trunk-based development** with strict branch protection rules:

1. **`main` is protected** - No direct commits allowed
2. **Short-lived feature branches** - Branches should live < 1 day
3. **Every merge to main triggers a release** - Automatic versioning, npm publish, and GitHub release
4. **Temporary verification branches** - PR checks run on temporary branches before merge

```
main (protected)
  ├── ci/verify-<sha> (temporary, auto-created for PR checks)
  ├── feature/add-vue-template (short-lived)
  ├── fix/typo-correction (short-lived)
  └── chore/update-dependencies (short-lived)
```

### Branch Protection Rules (GitHub Settings)

**Repository Settings → Branches → Branch Protection Rules**

**Rule: `main` branch**

```yaml
✓ Require status checks to pass before merging
  - Require branches to be up to date before merging
  Required status checks:
    - typecheck
    - lint
    - format:check
    - test
    - build

✓ Require pull request reviews before merging
  - Required approving reviews: 1
  - Dismiss stale reviews when new commits are pushed

✓ Require conversation resolution before merging

✓ Limit who can push to matching branches
  - Only allow: admins, maintainers

✓ Do not allow bypassing the above settings

✓ Restrict pushes that create branches
  - Only allow: admins, maintainers
```

### Setting Up Development Environment

1. **Clone the repository:**

   ```bash
   git clone <repo-url>
   cd <repo-dir>
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Install Husky hooks:**
   ```bash
   pnpm exec husky install
   ```

### Making Changes

1. **Create a short-lived feature branch:**

   ```bash
   # Naming convention: feature/, fix/, chore/, docs/
   git checkout -b feature/my-feature
   ```

2. **Make your changes**

3. **Run checks locally:**

   ```bash
   # Type check
   pnpm -r exec tsc --noEmit

   # Lint
   pnpm -r exec eslint .

   # Format
   pnpm exec prettier --write .

   # Test
   pnpm -r vitest
   ```

4. **Add a changeset (REQUIRED for all changes):**

   ```bash
   pnpm changeset
   ```

   _Note: Every PR must include a changeset. PRs without changesets will be rejected._

5. **Commit your changes:**

   ```bash
   git add .
   git commit -m "feat: add my feature"
   ```

   _Note: Pre-commit hooks will automatically run._

6. **Push and create PR:**

   ```bash
   git push origin feature/my-feature
   ```

   _Note: GitHub will create a temporary `ci/verify-<sha>` branch to run all CI checks._

7. **Wait for CI verification:**
   - All status checks must pass
   - Request review from a maintainer
   - Address review feedback

8. **Merge to main:**
   - After approval, merge using "Squash and merge"
   - This triggers the automatic release process

### What Happens on Merge to Main

When a PR is merged to `main`, the following happens **automatically**:

1. **Version Bump** - Changesets action updates versions based on changesets
2. **Build** - All packages are built
3. **npm Publish** - Packages are published to npm registry
4. **GitHub Release** - Release is created with changelog
5. **Tag Created** - Git tag is created for the version

This is **fully automated** - no manual intervention required.

### Trunk-Based Development Best Practices

#### Branch Lifecycle

1. **Keep branches short-lived** - Aim for < 1 day

   ```bash
   # Good: Branch created, worked on, merged same day
   # Bad: Branch that lives for weeks
   ```

2. **Small, focused changes** - One feature per PR

   ```bash
   # Good: feature/add-vue-template
   # Bad: feature/multiple-templates-and-refactor
   ```

3. **Frequent commits** - Commit often with clear messages
   ```bash
   # Good: Multiple small commits with progress
   # Bad: One giant commit at the end
   ```

#### Branch Naming Convention

```bash
# New features
feat/feature-name
feature/feature-name

# Bug fixes
fix/bug-description
bugfix/bug-description

# Breaking changes
breaking/change-description

# Documentation
docs/update-description

# Maintenance
chore/update-description
```

#### Merge Strategy

**Always use "Squash and Merge":**

- ✅ Keeps `main` history clean
- ✅ Each commit to `main` = one release
- ✅ Avoids merge commits
- ✅ Easier to revert if needed

#### What If a PR Needs Multiple Days?

If work takes longer than a day:

1. **Split into smaller PRs** if possible
2. **Draft PR** for work-in-progress
3. **Mark as `[WIP]`** in title
4. **Add "Do not merge yet"** label
5. **Keep it updated** to avoid conflicts

#### Handling Merge Conflicts

```bash
# Update your branch with latest main
git checkout feature/my-feature
git fetch origin main
git rebase origin/main

# Fix conflicts
git add .
git rebase --continue

# Force push (carefully!)
git push origin feature/my-feature --force-with-lease
```

### Available Scripts

**Root `package.json`:**

```json
{
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "test": "pnpm -r vitest",
    "test:watch": "pnpm -r --parallel vitest watch",
    "test:coverage": "pnpm -r vitest run --coverage",
    "lint": "pnpm -r exec eslint .",
    "lint:fix": "pnpm -r exec eslint --fix .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "pnpm -r exec tsc --noEmit",
    "changeset": "changeset",
    "changeset:version": "changeset version",
    "changeset:publish": "changeset publish",
    "prepare": "husky install"
  }
}
```

---

## Code Quality Standards

### TypeScript Standards

- **Strict mode enabled** - No implicit any, strict null checks
- **No explicit `any` types** - Use `unknown` or proper types
- **Unused variables** - Treat as errors (prefix with `_` if intentional)
- **Return types** - Inferred for simple functions, explicit for complex ones

### Testing Standards

- **Coverage target:** Minimum 80% code coverage
- **Test organization:** Group related tests with `describe`
- **Test naming:** Clear, descriptive test names
- **No skipped tests** - All tests must pass before committing

**Example test structure:**

```typescript
import { describe, it, expect } from 'vitest';

describe('TemplateLoader', () => {
  describe('loadTemplate', () => {
    it('should load template metadata successfully', async () => {
      const template = await loadTemplate('react');
      expect(template).toBeDefined();
      expect(template.id).toBe('react');
    });

    it('should throw error for non-existent template', async () => {
      await expect(loadTemplate('nonexistent')).rejects.toThrow();
    });
  });
});
```

### Code Style Standards

- **Use Prettier** - No manual formatting debates
- **No console.log in production code** - Use proper logging
- **File naming:** `kebab-case.ts` for files, `PascalCase` for classes/types
- **Constants:** UPPER_SNAKE_CASE
- **Private members:** Prefix with `#` (private fields) or `_` (protected)

### Commit Message Standards

We use **Changesets** for conventional commits:

```bash
pnpm changeset
```

This prompts for:

- **Type:** patch | minor | major
- **Scope:** affected package(s)
- **Summary:** brief description of changes

**Examples:**

```bash
# Fixes
fix: resolve template loading issue in CLI

# Features
feat: add Vue template support

# Breaking changes
feat: redesign template metadata format
BREAKING CHANGE: template packages now require nesalia field

# Documentation
docs: update README with new CLI commands
```

---

## Release Process

### Fully Automated Releases

**Every commit to `main` triggers an automatic release.** No manual intervention required.

The release process follows this flow:

```
PR merged to main
    ↓
Changesets action detects changesets
    ↓
Versions updated automatically
    ↓
CHANGELOG.md generated
    ↓
All packages built
    ↓
Published to npm
    ↓
GitHub release created
    ↓
Git tag pushed
```

### Development Workflow with Changesets

1. **During development (on feature branch):**

   ```bash
   # Add a changeset for your changes
   pnpm changeset

   # This creates .changeset/<hash>.md file
   # Example: .changeset/cool-wombats-cheer.md
   ```

   **Changeset file format:**

   ```markdown
   ---
   '@nesalia/create': minor
   '@nesalia/template-react': patch
   ---

   Add Vue template support and fix React template issue
   ```

2. **Commit the changeset:**

   ```bash
   git add .changeset/
   git commit -m "feat: add Vue template"
   ```

3. **Create PR and merge:**
   - After review and approval, merge to main
   - The release workflow triggers automatically

4. **Automatic release (no action needed):**
   - Changesets action consumes all changesets
   - Versions are bumped based on changeset types (patch/minor/major)
   - `CHANGELOG.md` is updated
   - Packages are published to npm
   - GitHub release is created with changelog

### Release Automation (CI/CD)

**GitHub Actions Workflow** (`.github/workflows/release.yml`):

```yaml
name: Release

on:
  push:
    branches:
      - main

concurrency: ${{ github.workflow }}-${{ github.ref }}

permissions:
  contents: write
  id-token: write
  pull-requests: write

jobs:
  release:
    name: Release
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install Dependencies
        run: pnpm install

      - name: Build Packages
        run: pnpm -r build

      - name: Create Release Pull Request or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm changeset:publish
          version: pnpm changeset:version
          commit: 'chore: version packages'
          title: 'chore: version packages'
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Create GitHub Release
        if: steps.changesets.outputs.published == 'true'
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.changesets.outputs.publishedPackages[0].version }}
          release_name: ${{ steps.changesets.outputs.publishedPackages[0].version }}
          body: ${{ steps.changesets.outputs.changelog }}
```

### Version Bump Rules

The version is automatically determined by the changeset type:

| Changeset Type | Version Bump  | Example                             |
| -------------- | ------------- | ----------------------------------- |
| `patch`        | 1.0.0 → 1.0.1 | Bug fixes                           |
| `minor`        | 1.0.0 → 1.1.0 | New features (backwards compatible) |
| `major`        | 1.0.0 → 2.0.0 | Breaking changes                    |

**Example:**

```bash
# During development
pnpm changeset
# Select: minor for @nesalia/create
# Select: patch for @nesalia/template-react

# After merge to main, versions become:
# @nesalia/create: 1.2.3 → 1.3.0
# @nesalia/template-react: 2.0.0 → 2.0.1
```

### Changelog Generation

Changelogs are automatically generated from changesets and included in:

1. **GitHub Releases** - Each release has a detailed changelog
2. **CHANGELOG.md** - Automatically updated in each package
3. **Release Notes** - Formatted from changeset summaries

**Example GitHub Release:**

```
## @nesalia/create@1.3.0

### Minor Changes

- abc123: Add Vue template support (@developer)
- def456: Improve error messages (@developer)

### Patch Changes

- Updated dependencies [@nesalia/template-react@2.0.1]

## @nesalia/template-react@2.0.1

### Patch Changes

- fix: resolve template loading issue
```

### Required Secrets

Configure these secrets in your GitHub repository settings:

| Secret         | Description                  | Required for      |
| -------------- | ---------------------------- | ----------------- |
| `NPM_TOKEN`    | npm automation token         | Publishing to npm |
| `GITHUB_TOKEN` | GitHub token (auto-provided) | Creating releases |

**Creating an NPM Token:**

1. Go to https://www.npmjs.com/settings/<username>/tokens
2. Create a new "Automation" token
3. Add it to your GitHub repository secrets as `NPM_TOKEN`

---

## CI/CD Pipeline

### Pull Request Checks (Temporary Verification Branch)

When a PR is created, GitHub automatically creates a temporary branch `ci/verify-<sha>` to run all checks. This ensures that the code is verified before it can be merged.

**Status Checks (All Must Pass):**

```yaml
Required checks:
  - typecheck # TypeScript compilation
  - lint # ESLint rules
  - format:check # Prettier formatting
  - test # Vitest tests
  - build # Build all packages
  - changesets # PR has changeset
```

**CI Workflow** (`.github/workflows/ci.yml`):

```yaml
name: CI

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - main

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm -r exec tsc --noEmit

  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm -r exec eslint .

  format:
    name: Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec prettier --check .

  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm -r vitest run --coverage

  build:
    name: Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm -r build

  changesets:
    name: Changesets
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install
      - name: Validate Changesets
        run: |
          pnpm exec changeset status
          if [ -z "$(pnpm exec changeset status)" ]; then
            echo "No changesets found. Please add a changeset."
            echo "Run: pnpm changeset"
            exit 1
          fi
```

### Required Approvals

Every PR must have:

- ✅ **At least one code review approval** from a maintainer
- ✅ **All CI status checks passing**
- ✅ **No unresolved conversations** (all comments addressed)
- ✅ **Up to date with main branch** (no merge conflicts)

### Merge Requirements

Before merging, ensure:

1. **Changeset added** - Every PR must include a changeset
2. **All checks pass** - No failing status checks
3. **Code reviewed** - At least one approval
4. **Conversation resolved** - No outstanding feedback

**Merge Method:** Use **"Squash and merge"** to maintain a clean history.

---

## Troubleshooting

### Pre-commit Hook Issues

If you need to bypass pre-commit hooks (not recommended):

```bash
git commit --no-verify -m "message"
```

### Type Errors

Clear TypeScript cache and reinstall:

```bash
rm -rf node_modules packages/*/node_modules
rm -rf packages/*/dist
pnpm install
```

### Changeset Issues

If you forgot to add a changeset:

```bash
# Add changeset after commit
pnpm changeset

# Amend the commit
git add .
git commit --amend --no-verify
```

---

## Summary

This repository enforces **strict quality standards** and **trunk-based development** through:

1. **Trunk-Based Development**
   - Short-lived feature branches (< 1 day)
   - Protected `main` branch (no direct commits)
   - Automatic releases on every merge
   - Temporary verification branches for PRs

2. **Branch Protection**
   - All commits to `main` via PRs only
   - Required status checks
   - Required code review approval
   - Conversation resolution required

3. **Automated Release Pipeline**
   - Every `main` commit triggers version bump
   - Automatic npm publish
   - Automatic GitHub release
   - No manual intervention required

4. **Pre-commit hooks** that block commits if any check fails
5. **Automated testing** with Vitest
6. **Type safety** with strict TypeScript
7. **Code formatting** with Prettier
8. **Linting** with ESLint
9. **Structured versioning** with Changesets

These standards ensure code quality, consistency, and reliability across all packages in the monorepo.

---

## Quick Reference

```bash
# Development
pnpm install              # Install dependencies
pnpm dev                  # Start development mode
pnpm build                # Build all packages

# Quality Checks
pnpm typecheck           # Check TypeScript types
pnpm lint                # Check code style
pnpm lint:fix            # Fix linting issues
pnpm format              # Format code
pnpm format:check        # Check formatting
pnpm test                # Run tests
pnpm test:watch          # Watch mode
pnpm test:coverage       # Coverage report

# Release
pnpm changeset           # Add changeset
pnpm changeset:version   # Version packages
pnpm changeset:publish   # Publish to npm
```
