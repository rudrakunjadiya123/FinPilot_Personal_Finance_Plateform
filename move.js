const fs = require('fs');
const path = require('path');

const srcDir = 'd:/FinPilot';
const destDir = path.join(srcDir, 'backend');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir);
}

const items = [
  'src',
  'prisma',
  '.env',
  'package.json',
  'package-lock.json',
  'prisma.config.ts',
  'node_modules'
];

items.forEach(item => {
  const src = path.join(srcDir, item);
  const dest = path.join(destDir, item);
  if (fs.existsSync(src)) {
    try {
      fs.renameSync(src, dest);
      console.log(`Moved ${item}`);
    } catch(e) {
      console.error(`Failed ${item}:`, e.message);
    }
  }
});
