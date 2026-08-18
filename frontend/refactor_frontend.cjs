const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const allOldFiles = walk(srcDir).filter(f => !f.endsWith('.md'));

const moveMap = new Map();
allOldFiles.forEach(oldPath => {
  const rel = path.relative(srcDir, oldPath).replace(/\\/g, '/');
  let newRel = rel;
  const basename = path.basename(oldPath);

  if (rel === 'app/App.jsx') newRel = 'routes/AppRoutes.jsx';
  else if (rel === 'app/AppShell.jsx') newRel = 'layouts/AppShell.jsx';
  else if (rel === 'app/store/uiStore.js') newRel = 'store/uiStore.js';
  else if (rel === 'index.css') newRel = 'styles/globals.css';
  else if (rel === 'App.css') newRel = 'styles/App.css';
  else if (rel === 'lib/apiClient.js') newRel = 'services/apiClient.js';
  else if (rel === 'modules/auth/hooks/useAuth.jsx') newRel = 'context/AuthContext.jsx';
  else if (basename.endsWith('Page.jsx')) newRel = `pages/${basename}`;
  else if (basename.startsWith('use') && basename.endsWith('.js')) newRel = `hooks/${basename}`;
  else if (rel.includes('components/') || rel.includes('composed/') || rel.includes('primitives/') || basename === 'DashboardLayout.jsx' || basename === 'ChatPanel.jsx') {
      if (rel.includes('primitives/')) newRel = `components/primitives/${basename}`;
      else newRel = `components/${basename}`;
  } else if (basename === 'App.jsx' || basename === 'main.jsx') {
      newRel = basename;
  } else {
      newRel = `components/${basename}`;
  }

  moveMap.set(oldPath, path.join(srcDir, newRel));
});

const newContents = new Map();

allOldFiles.forEach(oldPath => {
  if (!oldPath.endsWith('.js') && !oldPath.endsWith('.jsx') && !oldPath.endsWith('.css')) return;
  const oldDir = path.dirname(oldPath);
  let content = fs.readFileSync(oldPath, 'utf8');

  if (oldPath.endsWith('.css')) {
     newContents.set(oldPath, content);
     return;
  }

  const importRegex = /(import\s+.*?from\s+['"])(.*?)(['"])/g;
  const importSideRegex = /(import\s+['"])(.*?)(['"])/g;
  const dynamicImportRegex = /(import\(['"])(.*?)(['"]\))/g;

  const replacePath = (match, p1, oldImportPath, p3) => {
    if (!oldImportPath.startsWith('.') && !oldImportPath.startsWith('/')) {
      return match;
    }
    
    // Attempt resolving absolute
    let resolvedOldPath = null;
    const testExtensions = ['', '.js', '.jsx', '.css', '/index.js', '/index.jsx'];
    for (const ext of testExtensions) {
      const tPath = path.resolve(oldDir, oldImportPath + ext);
      if (fs.existsSync(tPath)) {
         // Exact match map
         for (const [k, v] of moveMap.entries()) {
            if (path.resolve(k) === path.resolve(tPath)) {
               resolvedOldPath = k; break;
            }
         }
         if (resolvedOldPath) break;
      }
    }

    if (resolvedOldPath && moveMap.has(resolvedOldPath)) {
      const newDest = moveMap.get(resolvedOldPath);
      const myNewDest = moveMap.get(oldPath);
      
      let newlyComputedRel = path.relative(path.dirname(myNewDest), newDest).replace(/\\/g, '/');
      if (!newlyComputedRel.startsWith('.')) newlyComputedRel = './' + newlyComputedRel;
      
      if (newlyComputedRel.endsWith('.js')) newlyComputedRel = newlyComputedRel.slice(0, -3);
      if (newlyComputedRel.endsWith('.jsx')) newlyComputedRel = newlyComputedRel.slice(0, -4);

      return p1 + newlyComputedRel + p3;
    }

    return match;
  };

  content = content.replace(importRegex, replacePath);
  content = content.replace(importSideRegex, replacePath);
  content = content.replace(dynamicImportRegex, replacePath);
  newContents.set(oldPath, content);
});

moveMap.forEach((newPath, oldPath) => {
  const tDir = path.dirname(newPath);
  if (!fs.existsSync(tDir)) fs.mkdirSync(tDir, { recursive: true });

  if (newContents.has(oldPath)) {
    fs.writeFileSync(newPath, newContents.get(oldPath), 'utf8');
  } else {
    fs.copyFileSync(oldPath, newPath);
  }
});

// Since files are copied over mapped, I will delete old deprecated structure dirs
const oldDirs = ['app', 'lib', 'design-system', 'modules'];
oldDirs.forEach(d => {
   const dPath = path.join(srcDir, d);
   if (fs.existsSync(dPath)) {
      fs.rmSync(dPath, { recursive: true, force: true });
   }
});

console.log("Migration mapped correctly. Structure upgraded.");
