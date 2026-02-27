/**
 * Tests for template registry
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { listTemplates, fetchTemplate, cleanupTemplate } from '../src/registry.js';

// Mock execFileSync
vi.mock('node:child_process', async () => {
  const actual = await vi.importActual('node:child_process');
  return {
    ...actual,
    execFileSync: vi.fn(),
  };
});

const mockExecFileSync = execFileSync as ReturnType<typeof vi.fn>;

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

    mockExecFileSync.mockReturnValue(JSON.stringify(mockNpmSearchResult));

    const templates = await listTemplates();

    expect(mockExecFileSync).toHaveBeenCalledWith(
      'npm',
      expect.arrayContaining(['search', expect.stringContaining('@nesalia/template')]),
      expect.any(Object)
    );
    expect(templates).toHaveLength(3);
    expect(templates[0].id).toBe('cli-py');
    expect(templates[0].displayName).toBe('CLI Python');
  });

  it('should throw error when npm query fails', async () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('Network error');
    });

    await expect(listTemplates()).rejects.toThrow('Failed to fetch templates from npm');
  });
});

describe('fetchTemplate', () => {
  it('should throw error for non-existent package', async () => {
    mockExecFileSync.mockImplementation(() => {
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
