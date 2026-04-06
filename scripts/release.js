#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const rootPackageJsonPath = path.join(repoRoot, 'package.json');
const rootPackageJson = JSON.parse(fs.readFileSync(rootPackageJsonPath, 'utf8'));

const packageByKey = {
  sdk: {
    packageJsonPath: path.join(repoRoot, 'packages', 'sdk', 'package.json'),
    tagPrefix: 'sdk-v',
  },
  worker: {
    packageJsonPath: path.join(repoRoot, 'packages', 'webhook-worker', 'package.json'),
    tagPrefix: 'worker-v',
  },
};

function parseArgs(args) {
  const out = { packageKey: null, versionType: 'patch', customVersion: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--package' || a === '-p') {
      out.packageKey = args[i + 1] || null;
      i++;
      continue;
    }
    if (!a.startsWith('-') && (a === 'major' || a === 'minor' || a === 'patch')) {
      out.versionType = a;
      continue;
    }
    if (!a.startsWith('-') && /^\d+\.\d+\.\d+$/.test(a)) {
      out.customVersion = a;
      continue;
    }
  }
  return out;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function getNextVersion(type = 'patch') {
  throw new Error('getNextVersion requires currentVersion; use getNextVersionFrom(currentVersion, type)');
}

function getNextVersionFrom(currentVersion, type = 'patch') {
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function updatePackageVersion(packageKey, newVersion) {
  const pkgInfo = packageByKey[packageKey];
  if (!pkgInfo) throw new Error(`Unknown package: ${packageKey}`);

  const pkgJson = readJson(pkgInfo.packageJsonPath);
  pkgJson.version = newVersion;
  fs.writeFileSync(pkgInfo.packageJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');

  console.log(`✅ Updated ${pkgJson.name} to version ${newVersion}`);
}

function commitVersionChange(packageKey, newVersion) {
  try {
    const pkgInfo = packageByKey[packageKey];
    const files = [path.relative(repoRoot, pkgInfo.packageJsonPath)];
    execSync(`git add ${files.join(' ')}`, { stdio: 'inherit' });
    execSync(`git commit -m "chore(${packageKey}): bump version to ${newVersion}"`, { stdio: 'inherit' });
    console.log(`✅ Committed version change`);
  } catch (error) {
    console.error(`❌ Failed to commit version change: ${error.message}`);
    process.exit(1);
  }
}

function createGitTag(packageKey, version) {
  const pkgInfo = packageByKey[packageKey];
  const tag = `${pkgInfo.tagPrefix}${version}`;
  try {
    execSync(`git tag ${tag}`, { stdio: 'inherit' });
    console.log(`✅ Created git tag: ${tag}`);
    return tag;
  } catch (error) {
    console.error(`❌ Failed to create git tag: ${error.message}`);
    process.exit(1);
  }
}

function pushToGit(tag) {
  try {
    execSync(`git push origin main`, { stdio: 'inherit' });
    execSync(`git push origin ${tag}`, { stdio: 'inherit' });
    console.log(`✅ Pushed to GitHub`);
  } catch (error) {
    console.error(`❌ Failed to push to GitHub: ${error.message}`);
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage: node scripts/release.js --package <sdk|worker> [major|minor|patch] [customVersion]`);
    console.log(`Examples:`);
    console.log(`  node scripts/release.js --package sdk patch`);
    console.log(`  node scripts/release.js --package worker minor`);
    console.log(`  node scripts/release.js --package sdk patch 0.2.0`);
    process.exit(0);
  }

  const parsed = parseArgs(args);
  const packageKey = parsed.packageKey;
  if (!packageKey || !packageByKey[packageKey]) {
    console.error(`❌ Missing or invalid --package. Use --package sdk|worker`);
    process.exit(1);
  }

  const versionType = parsed.versionType || 'patch';
  const customVersion = parsed.customVersion;
  
  let newVersion;
  
  if (customVersion) {
    newVersion = customVersion;
  } else {
    const pkgJson = readJson(packageByKey[packageKey].packageJsonPath);
    newVersion = getNextVersionFrom(pkgJson.version, versionType);
  }
  
  console.log(`🚀 Releasing ${packageKey} version ${newVersion}`);
  
  // Update package version
  updatePackageVersion(packageKey, newVersion);
  
  // Commit the version change
  commitVersionChange(packageKey, newVersion);
  
  // Create git tag (points to the commit with the updated version)
  const tag = createGitTag(packageKey, newVersion);
  
  // Push to GitHub
  pushToGit(tag);
  
  console.log(`🎉 Release ${newVersion} is ready!`);
  console.log(`📦 GitHub Actions will automatically publish to npm`);
  console.log(`🔗 Check the Actions tab for progress: https://github.com/Crackdevs/RBTC-Onboarding-EventKit/actions`);
}

if (require.main === module) {
  main();
}

module.exports = { getNextVersionFrom, updatePackageVersion, createGitTag };
