/**
 * @nesalia/create - CLI for creating nesalia projects
 */

import enquirer from 'enquirer';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATES = [
  { id: 'cli-py', name: 'CLI Python', description: 'Python CLI with typer and uv' },
];

// Get the templates directory (relative to the package directory)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

interface Options {
  template?: string;
  list?: boolean;
  help?: boolean;
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function createProject(projectName: string, templateId: string): Promise<void> {
  const templateDir = path.join(TEMPLATES_DIR, `template-${templateId}`);
  const targetDir = path.join(process.cwd(), projectName);

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

  // Check if template exists
  try {
    await fs.access(templateDir);
  } catch {
    console.error(`Error: Template "${templateId}" not found.`);
    console.log('');
    console.log('Available templates:');
    TEMPLATES.forEach(t => {
      console.log(`  ${t.id}`);
    });
    console.log('');
    process.exit(1);
  }

  // Copy template files
  console.log(
    `Creating project "${projectName === '.' ? 'current directory' : projectName}" from template "${templateId}"...`
  );
  await copyDir(templateDir, targetDir);

  console.log('');
  console.log('✓ Project created successfully!');
  console.log('');
  if (projectName !== '.') {
    console.log('Next steps:');
    console.log(`  cd ${projectName}`);
    console.log('  # Add your CLI code');
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
    } else if (arg === '--template' || arg === '-t') {
      options.template = argv[++i];
    } else if (!arg.startsWith('-')) {
      projectName = arg;
    }
  }

  return { projectName, options };
}

function showHelp(): void {
  console.log(
    `
@nesalia/create - Create nesalia projects

Usage:
  npm init @nesalia/create <project-name> [options]
  npx @nesalia/create <project-name> [options]

Options:
  -t, --template <name>   Template to use (cli-py)
  -l, --list               List available templates
  -h, --help               Show this help message

Examples:
  npm init @nesalia/create my-cli
  npm init @nesalia/create my-cli --template cli-py
  npx @nesalia/create my-cli --template cli-py

Templates:
${TEMPLATES.map(t => `  ${t.id.padEnd(10)} ${t.description}`).join('\n')}
`.trim()
  );
}

function showTemplates(): void {
  console.log('Available templates:');
  console.log('');
  TEMPLATES.forEach((t, i) => {
    console.log(`  ${(i + 1).toString().padEnd(2)}. ${t.id.padEnd(10)} - ${t.description}`);
  });
  console.log('');
}

export async function run(args: string[]): Promise<void> {
  const { projectName, options } = parseArgs(args);

  if (options.help) {
    showHelp();
    return;
  }

  if (options.list) {
    showTemplates();
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
    const response = await enquirer.prompt<{ template: string }>({
      type: 'select',
      name: 'template',
      message: 'Select a template:',
      choices: TEMPLATES.map(t => ({
        name: t.id,
        message: `${t.name} - ${t.description}`,
      })),
      initial: 0,
    });
    finalTemplate = response.template;
  }

  if (finalTemplate && !TEMPLATES.find(t => t.id === finalTemplate)) {
    console.error(`Error: Unknown template "${finalTemplate}"`);
    console.log('');
    console.log('Available templates:');
    TEMPLATES.forEach(t => {
      console.log(`  ${t.id}`);
    });
    console.log('');
    process.exit(1);
  }

  await createProject(finalProjectName, finalTemplate);
}
