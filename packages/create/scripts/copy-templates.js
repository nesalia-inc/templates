import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, '..', '..', 'templates');
const dest = path.join(__dirname, 'templates');

console.log('Copying templates from:', src);

// Check if source templates directory exists
try {
  await fs.access(src);
} catch {
  // Source doesn't exist, skip copying (templates might already be in place)
  console.log('Templates source not found, skipping copy.');
  process.exit(0);
}

console.log('Copying templates...');

// Ensure dest directory exists
await fs.mkdir(dest, { recursive: true });

// Copy files manually
async function copyDir(srcDir, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const entries = await fs.readdir(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

await copyDir(src, dest);
console.log('Templates copied successfully!');
