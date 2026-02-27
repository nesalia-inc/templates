/**
 * Tests for template registry
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execSync } from 'node:child_process';
import {
  listTemplates,
  fetchTemplate,
  getLocalTemplateDirectory,
  hasLocalTemplate,
  cleanupTemplate,
} from '../src/registry.js';

// Mock execSync
vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process');
  return {
    ...actual,
    execSync: vi.fn(),
  };
});

const mockExecSync = execSync as ReturnType<typeof vi.fn>;

describe('listTemplates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return templates from npm registry', async () => {
    const mockNpmSearchResult = [
      {
        name: '@nesalia/template-cli-py',
        description: 'CLI Python - Python CLI with typer',
        version: '1.0.0',
      },
      { name: '@nesalia/template-react', description: 'React - React with Vite', version: '1.0.0' },
      { name: '@nesalia/template-vue', description: 'Vue - Vue 3 with Vite', version: '1.0.0' },
    ];

    mockExecSync.mockReturnValue(JSON.stringify(mockNpmSearchResult));

    const templates = await listTemplates();

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('npm search @nesalia/template'),
      expect.any(Object)
    );
    expect(templates).toHaveLength(3);
    expect(templates[0].id).toBe('cli-py');
    expect(templates[0].displayName).toBe('CLI Python');
  });

  it('should fallback to local templates on error', async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('Network error');
    });

    const templates = await listTemplates();

    expect(templates).toHaveLength(1);
    expect(templates[0].id).toBe('cli-py');
  });
});

describe('getLocalTemplateDirectory', () => {
  it('should return correct local template path', () => {
    const dir = getLocalTemplateDirectory('cli-py');
    expect(dir).toContain('templates');
    expect(dir).toContain('template-cli-py');
  });
});

describe('hasLocalTemplate', () => {
  it('should return true for existing template', async () => {
    const exists = await hasLocalTemplate('cli-py');
    expect(exists).toBe(true);
  });

  it('should return false for non-existing template', async () => {
    const exists = await hasLocalTemplate('non-existent-template');
    expect(exists).toBe(false);
  });
});

describe('fetchTemplate', () => {
  it('should throw error for non-existent package', async () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('npm error: 404');
    });

    await expect(fetchTemplate('non-existent')).rejects.toThrow('npm error: 404');
  });
});

describe('cleanupTemplate', () => {
  it('should handle cleanup of non-existent directory', async () => {
    // Should not throw
    await cleanupTemplate('/non/existent/path');
  });
});
