/**
 * @nesalia/create - CLI for creating nesalia projects
 *
 * UX/DX is final but actual project creation is not implemented yet
 */

import enquirer from 'enquirer';

const TEMPLATES = [
  { id: 'basic', name: 'Basic', description: 'Minimal project setup' },
  { id: 'react', name: 'React', description: 'React with Vite' },
  { id: 'vue', name: 'Vue', description: 'Vue 3 + Vite' },
  { id: 'nextjs', name: 'Next.js', description: 'Next.js fullstack' },
];

interface Options {
  template?: string;
  list?: boolean;
  help?: boolean;
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
  npm init @nesalia/templates <project-name> [options]
  npx @nesalia/create <project-name> [options]

Options:
  -t, --template <name>   Template to use (basic, react, vue, nextjs)
  -l, --list               List available templates
  -h, --help               Show this help message

Examples:
  npm init @nesalia/templates my-app
  npm init @nesalia/templates my-app --template react
  npx @nesalia/create my-app --template react --typescript

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

function showWelcome(projectName: string, template?: string): void {
  console.log('');
  console.log('┌─────────────────────────────────────────────┐');
  console.log('│  @nesalia/create                           │');
  console.log('│  Template Registry                         │');
  console.log('└─────────────────────────────────────────────┘');
  console.log('');
  console.log(`Project name: ${projectName}`);
  if (template) {
    const templateInfo = TEMPLATES.find(t => t.id === template);
    console.log(`Template: ${templateInfo?.name || template}`);
  } else {
    console.log('Template: (not selected)');
  }
  console.log('');
  console.log('(DUMMY MODE - No actual project will be created)');
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
    } as any);
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

  showWelcome(finalProjectName, finalTemplate);
}
