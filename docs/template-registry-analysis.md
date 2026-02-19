# @nesalia/create - Template Registry Analysis

## Executive Summary

This document outlines the analysis and proposed Developer Experience (DX) for creating an npm-based template registry under the `@nesalia/create` scope. The goal is to define the desired DX and understand implementation requirements without writing any code.

## Table of Contents

1. [Ecosystem Analysis](#ecosystem-analysis)
2. [Proposed DX](#proposed-dx)
3. [Technical Specifications](#technical-specifications)
4. [Design Decisions to Clarify](#design-decisions-to-clarify)
5. [Recommendations](#recommendations)

---

## Ecosystem Analysis

### Existing Solutions

#### create-vite (Vite)

- **Command:** `npm create vite@latest` or `npm init vite`
- **Approach:** Templates embedded within the package + external template support
- **Structure:** Templates as subfolders (e.g., `/template-*`)
- **Strengths:** Fast, simple, multiple startup options

#### create-react-app (deprecated but instructive)

- **Command:** `npx create-react-app my-app`
- **Approach:** Monolithic package with fixed template
- **Limitation:** Lack of flexibility led to deprecation
- **Lesson learned:** Flexibility and extensibility are crucial

#### hygen

- **Approach:** Local templates within project (`_templates/`)
- **Philosophy:** "Templates live in your project"
- **Strengths:** Full flexibility, file injection, interactive prompts
- **Use case:** Project-specific code generation

### npm `create-*` Convention

According to npm documentation:

- `npm init <package>` → executes `npx create-<package>`
- `npm init @scope` → executes `npx @scope/create`
- Options are forwarded to the create package

**Examples:**

```bash
npm init foo          → npm exec create-foo
npm init @usr/foo     → npm exec @usr/create-foo
npm init @usr         → npm exec @usr/create
```

---

## Proposed DX

### Architecture

```
@nesalia/create (npm scope)
├── create/                      # Main CLI
│   └── create-nesalia           # Entry point
├── template-*/                  # Individual templates
│   ├── template-basic
│   ├── template-react
│   ├── template-vue
│   └── template-nextjs
└── shared/                      # Common utilities
```

### User Flow

#### 1. Simplest Creation

```bash
npm init @nesalia/create my-app
```

#### 2. With Template Selection

```bash
npm init @nesalia/create my-app --template react
```

#### 3. With Advanced Options

```bash
npm init @nesalia/create my-app --template react --typescript --tailwind
```

#### 4. List Available Templates

```bash
npm init @nesalia/create --list
```

### Key DX Characteristics

#### Discovery

```bash
$ npm init @nesalia/create --help

? Available templates:
  • basic         - Minimal project setup
  • react         - React with Vite
  • vue           - Vue 3 + Vite
  • nextjs        - Next.js fullstack
  • express       - Express API
  • nestjs        - NestJS backend
```

#### Interactive Prompts

```bash
$ npm init @nesalia/create my-app

? Select template: ›
  ◯ basic
  ◯ react
  ◯ vue
  ◯ nextjs

? Use TypeScript? › No / Yes
? Add Tailwind CSS? › No / Yes
? Add ESLint? › No / Yes
```

#### Clear Output

```bash
✓ Created my-app/
✓ Copied 15 files
✓ Installed dependencies

Next steps:
  cd my-app
  npm run dev
```

#### Extensibility

```bash
# External template
npm init @nesalia/create my-app --from @mycompany/template-legacy

# Local template
npm init @nesalia/create my-app --from ./local-template
```

---

## Technical Specifications

### Package Structure

#### `@nesalia/create` (Main CLI)

- **Binary:** `create-nesalia`
- **Responsibilities:**
  - Depends on template packages
  - Manages prompts, validation, installation
  - Handles file operations
  - Provides user feedback

#### `@nesalia/template-xxx` (Templates)

- **Contains:**
  - Template files
  - Metadata (package.json with special fields)
  - Transformation hooks (post-processing)
  - Template-specific dependencies

### Template Metadata

```json
{
  "name": "@nesalia/template-react",
  "version": "1.0.0",
  "nesalia": {
    "id": "react",
    "displayName": "React + Vite",
    "description": "Modern React with Vite, TypeScript ready",
    "tags": ["frontend", "react", "vite"],
    "defaultOptions": {
      "typescript": true,
      "tailwind": false
    },
    "features": [
      {
        "id": "typescript",
        "prompt": "Use TypeScript?",
        "default": true
      },
      {
        "id": "tailwind",
        "prompt": "Add Tailwind CSS?",
        "default": false
      }
    ]
  }
}
```

### Template System Features

#### Variables

- `{{name}}` - Project name
- `{{description}}` - Project description
- Custom variables defined in prompts

#### Conditionals

- Include/exclude files based on options
- Feature-specific file generation

#### Smart Injections

- Add dependencies to package.json
- Configure existing files
- Merge configurations

#### Hooks

- `pre-gen` - Before generation
- `post-gen` - After generation
- Custom actions

---

## Design Decisions to Clarify

### 1. Local vs Remote Templates

**Option A: Embedded Templates**

- Faster execution
- Simpler distribution
- Easier versioning

**Option B: Separate Packages**

- More modular
- Extensible by community
- Independent updates

**Option C: Hybrid**

- Core templates embedded
- External templates supported

### 2. Generation Mode

**Option A: Simple File Copy**

- Simple, rigid
- Fast for basic templates

**Option B: Template Engine (Handlebars, EJS)**

- More flexible
- Variable substitution
- Conditional logic

**Option C: Programmatic Generation**

- Most powerful
- More complex
- Full control

### 3. Update Management

- How to handle outdated templates?
- Version notification?
- Automatic migration?

### 4. CI/CD Integration

- Template validation
- Automated testing
- Preview system

---

## Recommendations

### DX Principles

#### Minimalism

- Single entry point: `npm init @nesalia/create`
- Smart defaults (context detection)
- Flags for power users

#### Transparency

- Preview changes before confirmation
- Clear logging (configurable verbosity)
- Rollback on error

#### Speed

- Local templates (no unnecessary network calls)
- Optimized dependency installation
- Intelligent caching

#### Extensibility

- API for custom templates
- Complete documentation
- Template examples

#### Developer-Friendly

- Clear prompts with sensible defaults
- Input validation
- Useful error messages
- Auto-completion support

### Key Features to Implement

1. **Template Discovery**
   - List command
   - Search by tags
   - Detailed descriptions

2. **Interactive CLI**
   - Smart prompts
   - Default values
   - Validation

3. **Flexible Options**
   - Command-line flags
   - Configuration file support
   - Environment variables

4. **Robust Error Handling**
   - Clear error messages
   - Recovery suggestions
   - Rollback capability

5. **Extensibility**
   - Plugin system
   - Custom templates
   - Hook system

---

## Next Steps

1. **Decide on architecture** (local vs remote vs hybrid)
2. **Choose template engine** (copy vs EJS vs programmatic)
3. **Define initial templates** (basic, react, vue, etc.)
4. **Plan CLI interface** (prompts, flags, commands)
5. **Design metadata format** (template definitions)

---

## Sources

- [npm init documentation](https://docs.npmjs.com/cli/v9/commands/npm-init)
- [npm scope documentation](https://docs.npmjs.com/cli/v9/using-npm/scope)
- [create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite)
- [create-react-app](https://github.com/facebook/create-react-app)
- [hygen](https://github.com/jondot/hygen)
- [plop](https://github.com/plopjs/plop)
- [Vue.js monorepo](https://github.com/vuejs/core)
