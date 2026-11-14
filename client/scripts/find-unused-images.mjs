import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');
const imagesDir = path.join(srcDir, 'assets', 'images');

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg']);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    return fullPath;
  });
}

function stripResponsiveImageSize(filename) {
  return filename
    .replace(/\.(jpg|jpeg|png|webp|avif|svg)$/i, '')
    .replace(/-\d+$/i, '');
}

const sourceFiles = walk(srcDir).filter((file) => {
  return /\.(js|jsx|ts|tsx|css|scss|json)$/.test(file);
});

const sourceText = sourceFiles
  .map((file) => fs.readFileSync(file, 'utf8'))
  .join('\n');

const imageFiles = walk(imagesDir).filter((file) => {
  return imageExtensions.has(path.extname(file).toLowerCase());
});

const groupedImages = new Map();

for (const file of imageFiles) {
  const filename = path.basename(file);
  const imageName = stripResponsiveImageSize(filename);

  if (!groupedImages.has(imageName)) {
    groupedImages.set(imageName, []);
  }

  groupedImages.get(imageName).push(file);
}

const unusedGroups = [];

for (const [imageName, files] of groupedImages.entries()) {
  if (!sourceText.includes(imageName)) {
    unusedGroups.push({
      imageName,
      files,
    });
  }
}

console.log('\nUnused image groups:\n');

if (!unusedGroups.length) {
  console.log('No unused image groups found.');
  process.exit(0);
}

for (const group of unusedGroups) {
  console.log(`❌ ${group.imageName}`);

  for (const file of group.files) {
    console.log(`   ${path.relative(rootDir, file)}`);
  }

  console.log('');
}

console.log(`Total unused image groups: ${unusedGroups.length}`);