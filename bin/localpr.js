#!/usr/bin/env node

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Build frontend if dist doesn't exist
const distPath = path.join(projectRoot, 'dist');
try {
  const fs = await import('fs');
  if (!fs.existsSync(distPath)) {
    console.log('Building frontend...');
    execSync('npx vite build', { cwd: projectRoot, stdio: 'inherit' });
  }
} catch {
  console.log('Building frontend...');
  execSync('npx vite build', { cwd: projectRoot, stdio: 'inherit' });
}

// Pass through all args to the server
process.argv = [process.argv[0], process.argv[1], ...(process.argv.slice(2).length ? process.argv.slice(2) : [process.cwd()])];

await import(path.join(projectRoot, 'server', 'index.js'));
