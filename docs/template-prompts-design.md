# Template-Specific Prompts

## Overview

This document describes the design for allowing each template to define its own interactive prompts. When a user selects a template, they will be asked template-specific questions (e.g., CLI name, feature flags) in addition to the global prompts.

## Problem Statement

Currently, the CLI only supports two global prompts:

1. Project name
2. Template selection

Each template has unique requirements:

- **cli-py** needs: CLI command name, whether to add rich, whether to add Docker
- **react** needs: TypeScript, package manager, CSS framework
- **nextjs** needs: Auth setup, database choice

Hardcoding these in the main CLI creates tight coupling and makes adding new templates cumbersome.

## Proposed Solution

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        @nesalia/create                       │
├─────────────────────────────────────────────────────────────┤
│  1. Parse CLI args                                           │
│  2. Prompt: project name (global)                           │
│  3. Prompt: template selection (global)                     │
│  4. Load template package                                    │
│  5. Prompt: template-specific questions (from config)        │
│  6. Generate project                                         │
└─────────────────────────────────────────────────────────────┘
```

### Template Configuration Structure

Each template package exposes a `nesalia` field in its `package.json`:

```json
{
  "name": "@nesalia/template-cli-py",
  "nesalia": {
    "id": "cli-py",
    "displayName": "CLI Python",
    "description": "Python CLI with typer and uv",
    "prompts": [
      {
        "name": "cliName",
        "type": "input",
        "message": "CLI command name:",
        "default": "my-cli",
        "validate": "value => value.trim().length > 0 || 'Required'"
      },
      {
        "name": "description",
        "type": "input",
        "message": "Project description:",
        "default": "A Python CLI application"
      },
      {
        "name": "rich",
        "type": "confirm",
        "message": "Add rich for fancy terminal output?",
        "default": false
      },
      {
        "name": "docker",
        "type": "confirm",
        "message": "Add Dockerfile?",
        "default": false
      }
    ]
  }
}
```

### Prompt Types

Supported prompt types mapping to enquirer:

| Template Type | Enquirer Type | Description             |
| ------------- | ------------- | ----------------------- |
| `input`       | `input`       | Free text input         |
| `confirm`     | `confirm`     | Yes/no boolean          |
| `select`      | `select`      | Single choice from list |
| `multiselect` | `multiselect` | Multiple choices        |
| `password`    | `password`    | Hidden input            |
| `editable`    | `editable`    | Multiline input         |

### Prompt Schema

Each prompt object follows this schema:

```typescript
interface TemplatePrompt {
  name: string; // Variable name (used in templates)
  type: 'input' | 'confirm' | 'select' | 'multiselect' | 'password' | 'editable';
  message: string; // Question displayed to user
  default?: string | boolean | string[]; // Default value
  choices?: string[]; // For select/multiselect types
  validate?: string; // Validation function as string
  when?: string; // Conditional display (e.g., "rich === true")
}
```

## Implementation

### Step 1: Template Loader

Create a utility to load template configuration:

```typescript
// packages/create/src/template-loader.ts
import { readFile } from 'fs/promises';
import { join } from 'path';

interface TemplateConfig {
  id: string;
  displayName: string;
  description: string;
  prompts: TemplatePrompt[];
}

export async function loadTemplateConfig(templateId: string): Promise<TemplateConfig> {
  const templatePath = join(__dirname, '../../templates', templateId);
  const packageJson = JSON.parse(await readFile(join(templatePath, 'package.json'), 'utf-8'));
  return packageJson.nesalia;
}
```

### Step 2: Dynamic Prompt Execution

```typescript
// packages/create/src/prompts.ts
import Enquirer from 'enquirer';

const enquirer = new Enquirer();

export async function runTemplatePrompts(prompts: TemplatePrompt[]): Promise<Record<string, any>> {
  const enquirerPrompts = prompts.map(p => ({
    type: p.type,
    name: p.name,
    message: p.message,
    initial: p.default,
    choices: p.choices,
    validate: p.validate ? eval(p.validate) : undefined,
    skip: p.when
      ? (answers: any) => {
          // Evaluate conditional
          const condition = new Function('answers', `return ${p.when}`);
          return !condition(answers);
        }
      : undefined,
  }));

  return await enquirer.prompt(enquirerPrompts);
}
```

### Step 3: Integration in Main CLI

```typescript
// packages/create/src/index.ts (simplified)
import { loadTemplateConfig } from './template-loader';
import { runTemplatePrompts } from './prompts';

async function main() {
  const args = parseArgs();

  // Global prompts
  const projectName = args.name || (await promptProjectName());
  const templateId = args.template || (await promptTemplateSelection());

  // Load template-specific config
  const templateConfig = await loadTemplateConfig(templateId);

  // Template-specific prompts
  const templateAnswers = await runTemplatePrompts(templateConfig.prompts);

  // Generate project with all variables
  await generateProject(projectName, templateId, {
    ...templateAnswers,
    name: projectName,
  });
}
```

## Example: cli-py Template

With this system, the cli-py template would:

1. Ask user for project name (global)
2. Ask user to select "CLI Python" template (global)
3. Ask template-specific questions:
   - CLI command name (e.g., `my-cli`)
   - Description
   - Add rich?
   - Add Dockerfile?

The generated `pyproject.toml` would use these values:

```toml
[project.scripts]
{{ cli_name }} = "{{ package_name }}:main"
```

## Alternative Approaches Considered

### Option A: Config File in Template (Selected)

```json
// templates/cli-py/nesalia.json
{
  "prompts": [...]
}
```

**Pros:**

- Simple to implement
- Easy to read
- No runtime parsing needed

**Cons:**

- Separate from package.json

### Option B: JavaScript Module Export

```javascript
// templates/cli-py/config.js
module.exports = {
  prompts: [...]
};
```

**Pros:**

- Flexible validation logic
- Dynamic prompts possible

**Cons:**

- Requires loading JS module
- More complex security

### Option C: YAML Configuration

**Pros:**

- Human readable
- Well-known format

**Cons:**

- Need YAML parser
- Less common in JS ecosystem

## Backwards Compatibility

Templates without a `nesalia.prompts` field will work without modification:

- Global prompts still work
- Template-specific prompts are skipped
- Default values used for template variables

## Future Enhancements

1. **Prompt Groups**: Group prompts into categories (e.g., "Core", "Optional Features")
2. **Prompt Dependencies**: Show/hide prompts based on previous answers
3. **Prompt Validation**: Custom validation functions
4. **Prompt Preview**: Show generated values
5. ** before confirmationTemplate Wizard**: Multi-step wizard flow for complex templates

## References

- [Enquirer Documentation](https://github.com/enquirer/enquirer)
- [Template Registry Analysis](./template-registry-analysis.md)
- [CLI Python Template Spec](./template-cli-py.md)
