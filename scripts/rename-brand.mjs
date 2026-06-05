import fs from 'fs';
import path from 'path';

const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  bold: '\x1b[1m'
};

const REPLACEMENTS = [
  { search: /Bali Dolphin Tours/g, replace: 'Bali Dolphin Tours' },
  { search: /lovinaethicalmarine\.com/g, replace: 'balidolphintours.com' }
];

const IGNORE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'out',
  '.antigravitycli'
];

const IGNORE_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.db', '.tsbuildinfo'
];

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        walkDir(filePath, fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (!IGNORE_EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

function main() {
  console.log(`\n${colors.cyan}${colors.bold}🏷️ REBRANDING SYSTEM TO "Bali Dolphin Tours"...${colors.reset}\n`);

  try {
    const rootDir = process.cwd();
    const files = walkDir(rootDir);
    let changedFilesCount = 0;
    let replacementCount = 0;

    for (const filePath of files) {
      // Don't modify the rename script itself
      if (filePath.endsWith('rename-brand.mjs')) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      let updatedContent = content;
      let matched = false;

      for (const pair of REPLACEMENTS) {
        if (pair.search.test(updatedContent)) {
          updatedContent = updatedContent.replace(pair.search, pair.replace);
          matched = true;
        }
      }

      if (matched) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        const relativePath = path.relative(rootDir, filePath);
        console.log(`  ${colors.green}✔ Updated:${colors.reset} ${relativePath}`);
        changedFilesCount++;
      }
    }

    console.log(`\n${colors.green}${colors.bold}🎉 REBRAND COMPLETE!${colors.reset}`);
    console.log(`Total files updated: ${colors.bold}${changedFilesCount}${colors.reset}\n`);

  } catch (error) {
    console.error(`\n${colors.red}✖ Rebranding failed:${colors.reset}`, error.message);
  }
}

main();
