/**
 * Template Loader - Load template configuration from package.json
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

export interface TemplatePrompt {
  name: string;
  type: 'input' | 'confirm' | 'select' | 'multiselect' | 'password' | 'editable';
  message: string;
  default?: string | boolean | string[];
  choices?: string[];
  validate?: string;
  when?: string;
}

export interface TemplateConfig {
  id: string;
  displayName?: string;
  description?: string;
  prompts: TemplatePrompt[];
}

export interface TemplateInfo {
  id: string;
  name: string;
  description: string;
  prompts?: TemplatePrompt[];
}

/**
 * Load template configuration from a template's package.json
 * Looks for templates in the templates directory relative to the package
 */
export async function loadTemplateConfig(templateId: string): Promise<TemplateConfig | null> {
  // Try multiple possible locations for templates
  const possiblePaths = [
    // Development path
    join(__dirname, '../../../templates', templateId),
    // Published package path
    join(__dirname, '../../templates', templateId),
    // Alternative relative path
    join(__dirname, '../../../..', 'templates', templateId),
  ];

  for (const templatePath of possiblePaths) {
    try {
      const packageJsonPath = join(templatePath, 'package.json');
      const content = await readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);

      if (packageJson.nesalia) {
        return packageJson.nesalia as TemplateConfig;
      }
    } catch {
      // Try next path
      continue;
    }
  }

  return null;
}

/**
 * Get all available templates from the templates directory
 */
export async function loadTemplates(): Promise<TemplateInfo[]> {
  const { readdir } = await import('fs/promises');
  const templatesDir = join(__dirname, '../../../templates');

  try {
    const entries = await readdir(templatesDir, { withFileTypes: true });
    const templates: TemplateInfo[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      try {
        const packageJsonPath = join(templatesDir, entry.name, 'package.json');
        const content = await readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(content);

        if (packageJson.nesalia) {
          templates.push({
            id: packageJson.nesalia.id || entry.name,
            name: packageJson.nesalia.displayName || entry.name,
            description: packageJson.nesalia.description || '',
            prompts: packageJson.nesalia.prompts || [],
          });
        }
      } catch {
        // Skip templates without valid package.json
        continue;
      }
    }

    return templates;
  } catch {
    // Return empty array if templates directory doesn't exist
    return [];
  }
}
