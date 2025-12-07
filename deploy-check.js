#!/usr/bin/env node

/**
 * Pre-Deployment Verification Script
 * Checks if all required files and configurations are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Pre-Deployment Verification...\n');

let errors = 0;
let warnings = 0;

// Check required files
const requiredFiles = [
  'server/package.json',
  'client/package.json',
  'server/.env.example',
  'client/.env.example',
  'server/Dockerfile',
  'client/Dockerfile',
  'docker-compose.yml',
  'render.yaml',
  '.gitignore',
  'server/app.js',
  'server/server.js',
  'client/nginx.conf'
];

console.log('📁 Checking Required Files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    errors++;
  }
});

// Check .env files are not committed
console.log('\n🔒 Checking Security...');
const sensitiveFiles = [
  'server/.env',
  'client/.env',
  '.env'
];

sensitiveFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ⚠️  ${file} exists - Ensure it's in .gitignore`);
    warnings++;
  } else {
    console.log(`  ✅ ${file} not found (good - should not be committed)`);
  }
});

// Check .gitignore
if (fs.existsSync('.gitignore')) {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (gitignore.includes('.env')) {
    console.log('  ✅ .env files are in .gitignore');
  } else {
    console.log('  ❌ .env files NOT in .gitignore');
    errors++;
  }
}

// Check package.json scripts
console.log('\n📦 Checking Build Scripts...');
try {
  const clientPkg = JSON.parse(fs.readFileSync('client/package.json', 'utf8'));
  if (clientPkg.scripts && clientPkg.scripts.build) {
    console.log('  ✅ Client build script exists');
  } else {
    console.log('  ❌ Client build script missing');
    errors++;
  }

  const serverPkg = JSON.parse(fs.readFileSync('server/package.json', 'utf8'));
  if (serverPkg.scripts && serverPkg.scripts.start) {
    console.log('  ✅ Server start script exists');
  } else {
    console.log('  ❌ Server start script missing');
    errors++;
  }
} catch (e) {
  console.log('  ❌ Error reading package.json files');
  errors++;
}

// Check for hardcoded credentials
console.log('\n🔐 Checking for Hardcoded Credentials...');
const filesToCheck = [
  'server/app.js',
  'server/server.js',
  'client/src/index.js'
];

let foundCredentials = false;
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    // Check for common credential patterns
    if (content.match(/mongodb\+srv:\/\/[^"']*@/i) || 
        content.match(/password\s*[:=]\s*["'][^"']+["']/i) ||
        content.match(/api[_-]?key\s*[:=]\s*["'][^"']+["']/i)) {
      console.log(`  ⚠️  Possible hardcoded credentials in ${file}`);
      warnings++;
      foundCredentials = true;
    }
  }
});

if (!foundCredentials) {
  console.log('  ✅ No obvious hardcoded credentials found');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(50));

if (errors === 0 && warnings === 0) {
  console.log('✅ All checks passed! Ready to deploy.');
  console.log('\n🚀 Next steps:');
  console.log('   1. Review QUICK_DEPLOY.md');
  console.log('   2. Set up environment variables');
  console.log('   3. Deploy to your chosen platform');
  process.exit(0);
} else {
  console.log(`❌ Found ${errors} error(s) and ${warnings} warning(s)`);
  console.log('\n⚠️  Please fix the issues above before deploying.');
  if (warnings > 0 && errors === 0) {
    console.log('   Warnings can be ignored if you\'re sure they\'re safe.');
  }
  process.exit(errors > 0 ? 1 : 0);
}
