#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

// Get the staged files from process.argv (lint-staged passes them as arguments)
const stagedFiles = process.argv.slice(2);

// Filter out test files
const nonTestFiles = stagedFiles.filter(file => {
  const fileName = path.basename(file);
  return !fileName.includes('.test.') && 
         !fileName.includes('.spec.') && 
         !file.includes('__tests__') && 
         !file.includes('__mocks__');
});

if (nonTestFiles.length === 0) {
  console.log('No non-test files to type check');
  process.exit(0);
}

try {
  // Run TypeScript check only on non-test files
  const command = `npx tsc --noEmit ${nonTestFiles.join(' ')}`;
  execSync(command, { stdio: 'inherit' });
  console.log('TypeScript check passed');
} catch (error) {
  console.error('TypeScript check failed');
  process.exit(1);
} 