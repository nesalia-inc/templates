/**
 * @nesalia/create - CLI for creating nesalia projects
 */

import enquirer from 'enquirer';
import fs from 'node:fs/promises';
import path from 'node:path';

import { listTemplates, fetchTemplate, cleanupTemplate } from './registry.js';
import type { DiscoveredTemplate } from './types.js';

interface Options {
  template?: string;
  list?: boolean;
  help?: boolean;
  name?: string;
}

async function copyDir(
  src: string,
  dest: string,
  variables: Record<string, string>
): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, variables);
    } else {
      // Read file content, replace variables, write to destination
      let content = await fs.readFile(srcPath, 'utf-8');
      for (const [key, value] of Object.entries(variables)) {
        content = content.replaceAll(`{{${key}}}`, value);
      }
      await fs.writeFile(destPath, content);
    }
  }
}

async function createProject(projectName: string, templateId: string): Promise<void> {
  const cwd = process.cwd();
  const targetDir = path.join(cwd, projectName);

  // Validate project name (alphanumeric, hyphens, underscores)
  const packageName = projectName === '.' ? 'my-project' : projectName;
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(packageName)) {
    console.error(
      `Error: Invalid project name "${packageName}". Project names must start with a letter and contain only letters, numbers, hyphens, and underscores.`
    );
    process.exit(1);
  }

  // Check for path traversal attacks
  const resolvedTargetDir = path.resolve(cwd, projectName);
  const resolvedCwd = path.resolve(cwd);
  const relativePath = path.relative(resolvedCwd, resolvedTargetDir);
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    console.error('Error: Invalid project name. Path traversal detected.');
    process.exit(1);
  }

  // Check if project directory already exists (skip for current directory)
  if (projectName !== '.') {
    try {
      await fs.access(targetDir);
      console.error(`Error: Directory "${projectName}" already exists.`);
      process.exit(1);
    } catch {
      // Directory doesn't exist, which is what we want
    }
  }

  // Fetch template from npm
  console.log(`Fetching template "${templateId}" from npm...`);
  const fetched = await fetchTemplate(templateId);
  console.log(`Using template: ${fetched.manifest.nesalia?.displayName || templateId}`);

  // Variables for template substitution
  const variables: Record<string, string> = {
    name: packageName,
  };

  // Copy template files with variable substitution
  console.log(`Creating project "${projectName === '.' ? 'current directory' : projectName}"...`);
  await copyDir(fetched.directory, targetDir, variables);

  // Cleanup temp directory
  await cleanupTemplate(fetched.tempDirectory);

  console.log('');
  console.log('✓ Project created successfully!');
  console.log('');
  if (projectName !== '.') {
    console.log('Next steps:');
    console.log(`  cd ${projectName}`);
    console.log('  # Add your project code');
    console.log('');
  }
}

function parseArgs(args: string[]): { projectName?: string; options: Options } {
  const options: Options = {};
  let projectName: string | undefined;

  // Skip 'node' and 'create.js'
  const argv = args.slice(2);

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--list' || arg === '-l') {
      options.list = true;
    } else if ((arg === '--template' || arg === '-t') && i + 1 < argv.length) {
      options.template = argv[++i];
    } else if ((arg === '--name' || arg === '-n') && i + 1 < argv.length) {
      options.name = argv[++i];
    } else if (!arg.startsWith('-')) {
      projectName = arg;
    }
  }

  // Use --name if provided, otherwise use positional argument
  if (!projectName && options.name) {
    projectName = options.name;
  }

  return { projectName, options };
}

function showHelp(templates: DiscoveredTemplate[]): void {
  console.log(
    `
@nesalia/create - Create nesalia projects

Usage:
  npm init @nesalia/create <project-name> [options]
  npx @nesalia/create <project-name> [options]
  npx @nesalia/create --name <project-name> [options]

Options:
  -n, --name <name>       Project name
  -t, --template <name>   Template to use (e.g., cli-py)
  -l, --list              List available templates
  -h, --help             Show this help message

Examples:
  npm init @nesalia/create my-cli
  npm init @nesalia/create my-cli --template cli-py
  npx @nesalia/create --name my-cli --template cli-py

Templates:${templates.length > 0 ? '\n' + templates.map(t => `  ${t.id.padEnd(15)} ${t.displayName} - ${t.description}`).join('\n') : '  (run --list to discover available templates)'}
`.trim()
  );
}

function showTemplates(templates: DiscoveredTemplate[]): void {
  console.log('Available templates:');
  console.log('');
  if (templates.length === 0) {
    console.log('  No templates found. Make sure you have internet access.');
    console.log('');
    return;
  }
  templates.forEach((t, i) => {
    console.log(`  ${(i + 1).toString().padEnd(2)}. ${t.id.padEnd(15)} - ${t.description}`);
  });
  console.log('');
}

export async function run(args: string[]): Promise<void> {
  const { projectName, options } = parseArgs(args);

  // Load available templates
  let templates: DiscoveredTemplate[] = [];
  try {
    templates = await listTemplates();
  } catch (error) {
    console.warn(
      `Warning: Could not fetch templates from npm: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  if (options.help) {
    showHelp(templates);
    return;
  }

  if (options.list) {
    showTemplates(templates);
    return;
  }

  let finalProjectName = projectName;
  let finalTemplate = options.template;

  console.log('');
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│  @nesalia/create                           │');
  console.log('│  Template Registry                         │');
  console.log('└─────────────────────────────────────────────┘');
  console.log('');

  if (!finalProjectName) {
    const response = await enquirer.prompt<{ name: string }>({
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: (value: string) => {
        if (!value.trim()) {
          return 'Please enter a project name.';
        }
        return true;
      },
    });
    finalProjectName = response.name;
  }

  if (!finalTemplate) {
    if (templates.length === 0) {
      console.error('Error: No templates available. Make sure you have internet access.');
      process.exit(1);
    }

    const response = await enquirer.prompt<{ template: string }>({
      type: 'select',
      name: 'template',
      message: 'Select a template:',
      choices: templates.map(t => ({
        name: t.id,
        message: `${t.displayName} - ${t.description}`,
      })),
      initial: 0,
    });
    finalTemplate = response.template;
  }

  // Validate template exists in list (or use anyway if list is empty)
  if (templates.length > 0 && !templates.find(t => t.id === finalTemplate)) {
    console.error(`Error: Unknown template "${finalTemplate}"`);
    console.log('');
    console.log('Available templates:');
    templates.forEach(t => {
      console.log(`  ${t.id}`);
    });
    console.log('');
    process.exit(1);
  }

  await createProject(finalProjectName, finalTemplate);
}
