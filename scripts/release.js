#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

function getNextVersion(type = 'patch') {
  const currentVersion = packageJson.version;
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

function updateVersion(newVersion) {
  packageJson.version = newVersion;
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`✅ Updated package.json to version ${newVersion}`);
}

function commitVersionChange(newVersion) {
  try {
    execSync(`git add package.json`, { stdio: 'inherit' });
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, { stdio: 'inherit' });
    console.log(`✅ Committed version change`);
  } catch (error) {
    console.error(`❌ Failed to commit version change: ${error.message}`);
    process.exit(1);
  }
}

function createGitTag(version) {
  const tag = `v${version}`;
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
  const versionType = args[0] || 'patch';
  const customVersion = args[1];
  
  let newVersion;
  
  if (customVersion) {
    newVersion = customVersion;
  } else {
    newVersion = getNextVersion(versionType);
  }
  
  console.log(`🚀 Releasing version ${newVersion}`);
  
  // Update package.json
  updateVersion(newVersion);
  
  // Commit the version change
  commitVersionChange(newVersion);
  
  // Create git tag (points to the commit with the updated version)
  const tag = createGitTag(newVersion);
  
  // Push to GitHub
  pushToGit(tag);
  
  console.log(`🎉 Release ${newVersion} is ready!`);
  console.log(`📦 GitHub Actions will automatically publish to npm`);
  console.log(`🔗 Check the Actions tab for progress: https://github.com/Crackdevs/RBTC-Onboarding-EventKit/actions`);
}

if (require.main === module) {
  main();
}

module.exports = { getNextVersion, updateVersion, createGitTag };
