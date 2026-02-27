/**
 * Template registry - handles fetching templates from npm
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import type { DiscoveredTemplate, FetchedTemplate, TemplatePackageJson } from './types.js';

const TEMPLATE_SCOPE = '@nesalia/template-';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, '../templates');

// Fallback local templates for offline mode
const LOCAL_TEMPLATES = [
  { id: 'cli-py', name: 'CLI Python', description: 'Python CLI with typer and uv' },
];

/**
 * List available templates from npm registry
 */
export const listTemplates = async (): Promise<DiscoveredTemplate[]> => {
  try {
    // Query npm registry for @nesalia/template-* packages
    const result = execFileSync('npm', ['search', '@nesalia/template', '--json', '--searchlimit=100'], {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });

    const packages = JSON.parse(result);

    const templates: DiscoveredTemplate[] = packages
      .filter((pkg: { name: string }) => pkg.name.startsWith(TEMPLATE_SCOPE))
      .map((pkg: { name: string; description?: string; version: string }) => {
        const id = pkg.name.replace(TEMPLATE_SCOPE, '');

        // Parse description or use default
        let description = pkg.description || '';
        let displayName = id;

        // Try to parse displayName from description format: "DisplayName - Description"
        if (description.includes(' - ')) {
          const parts = description.split(' - ');
          displayName = parts[0];
          description = parts.slice(1).join(' - ');
        }

        return {
          name: pkg.name,
          version: pkg.version,
          id,
          displayName,
          description,
          tags: [],
        };
      });

    return templates;
  } catch {
    // Fallback to local templates if npm query fails
    return LOCAL_TEMPLATES.map(t => ({
      name: `${TEMPLATE_SCOPE}${t.id}`,
      version: 'local',
      id: t.id,
      displayName: t.name,
      description: t.description,
      tags: [],
    }));
  }
};

/**
 * Validate template ID to prevent command injection
 */
const validateTemplateId = (templateId: string): void => {
  // Only allow alphanumeric, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(templateId)) {
    throw new Error(
      `Invalid template ID: "${templateId}". Only alphanumeric, hyphens, and underscores allowed.`
    );
  }
};

/**
 * Validate template package
 */
const validateTemplate = async (
  extractedDir: string,
  packageName: string
): Promise<TemplatePackageJson> => {
  // Check for package.json
  const packageJsonPath = path.join(extractedDir, 'package.json');
  let packageJson: TemplatePackageJson;

  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
  } catch {
    throw new Error('Invalid template: missing package.json');
  }

  // Validate name
  if (!packageJson.name) {
    throw new Error('Invalid template: package.json missing name field');
  }

  // Check for nesalia metadata
  if (!packageJson.nesalia) {
    throw new Error(
      `Invalid template: missing nesalia metadata in package.json. ` +
        `Add { "nesalia": { "id": "...", "displayName": "...", "description": "..." } }`
    );
  }

  // Validate nesalia.id matches expected format
  const expectedId = packageName.replace(TEMPLATE_SCOPE, '');
  if (packageJson.nesalia.id !== expectedId) {
    throw new Error(
      `Invalid template: nesalia.id "${packageJson.nesalia.id}" does not match expected "${expectedId}"`
    );
  }

  // Security: Check for dangerous files/paths
  await validateFilePaths(extractedDir);

  // Security: Check for scripts in package.json
  validateNoScripts(packageJson as unknown as Record<string, unknown>);

  return packageJson;
};

/**
 * Validate file paths to prevent path traversal attacks
 */
const validateFilePaths = async (dir: string): Promise<void> => {
  // Recursively walk directory and validate each path
  const walk = async (currentDir: string): Promise<void> => {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      // Construct full path - entry.name is relative to currentDir
      const fullPath = path.join(currentDir, entry.name);

      // Get relative path from extracted directory
      const relativePath = path.relative(dir, fullPath);

      // Check for path traversal attempts
      if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        throw new Error(`Invalid template: path traversal detected: ${relativePath}`);
      }

      // Check for suspicious filenames
      const basename = path.basename(fullPath);
      if (
        basename === '.bashrc' ||
        basename === '.profile' ||
        basename === '.bash_profile' ||
        basename.startsWith('.git')
      ) {
        throw new Error(`Invalid template: suspicious file: ${basename}`);
      }

      // Recursively process subdirectories
      if (entry.isDirectory()) {
        await walk(fullPath);
      }
    }
  };

  await walk(dir);
};

/**
 * Validate that package.json has no dangerous scripts
 */
const validateNoScripts = (packageJson: Record<string, unknown>): void => {
  const scriptFields = ['scripts', 'preinstall', 'postinstall', 'prebuild', 'postbuild'];

  for (const field of scriptFields) {
    if (packageJson[field]) {
      throw new Error(
        `Invalid template: package.json contains "${field}" scripts. ` +
          'Templates must not contain executable scripts for security reasons.'
      );
    }
  }
};

/**
 * Fetch a template from npm and extract it to a temp directory
 */
export const fetchTemplate = async (templateId: string): Promise<FetchedTemplate> => {
  // Validate input to prevent command injection
  validateTemplateId(templateId);

  const packageName = templateId.startsWith(TEMPLATE_SCOPE)
    ? templateId
    : `${TEMPLATE_SCOPE}${templateId}`;

  // Validate package name format
  if (!/^@[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/.test(packageName)) {
    throw new Error(`Invalid package name: "${packageName}"`);
  }

  // Create temp directory
  const tempDir = path.join(os.tmpdir(), `nesalia-template-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    // Download package using npm pack
    const packResult = execFileSync('npm', ['pack', packageName, '--pack-destination', tempDir], {
      encoding: 'utf-8',
    });

    const tgzFile = packResult.trim().split('\n').pop();
    if (!tgzFile) {
      throw new Error(`Failed to download template: ${packageName}`);
    }

    const tgzPath = path.join(tempDir, tgzFile);

    // Extract tarball
    execFileSync('tar', ['-xzf', tgzPath, '-C', tempDir], { stdio: 'pipe' });

    // Find extracted package directory (usually starts with 'package')
    const entries = await fs.readdir(tempDir);
    const packageDir = entries.find(e => e.startsWith('package'));

    if (!packageDir) {
      throw new Error('Invalid template package: missing package directory');
    }

    const extractedDir = path.join(tempDir, packageDir);

    // Validate manifest
    const manifest = await validateTemplate(extractedDir, packageName);

    return {
      directory: extractedDir,
      tempDirectory: tempDir,
      manifest,
    };
  } catch (error) {
    // Cleanup on error
    await fs.rm(tempDir, { recursive: true, force: true });
    throw error;
  }
};

/**
 * Get local template directory (fallback for offline mode)
 */
export const getLocalTemplateDirectory = (templateId: string): string => {
  return path.join(TEMPLATES_DIR, `template-${templateId}`);
};

/**
 * Check if template exists locally (offline mode)
 */
export const hasLocalTemplate = async (templateId: string): Promise<boolean> => {
  const dir = getLocalTemplateDirectory(templateId);
  try {
    await fs.access(dir);
    return true;
  } catch {
    return false;
  }
};

/**
 * Clean up temporary template directory
 */
export const cleanupTemplate = async (tempDir: string): Promise<void> => {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
};
