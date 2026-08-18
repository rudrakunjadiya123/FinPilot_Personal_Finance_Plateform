const fs = require('fs');
let css = fs.readFileSync('src/styles/globals.css', 'utf8');

const themeBlock = `@theme {
  --color-ink: var(--color-ink-val);
  --color-ink-soft: var(--color-ink-soft-val);
  --color-ink-faint: var(--color-ink-faint-val);
  --color-paper: var(--color-paper-val);
  --color-paper-raised: var(--color-paper-raised-val);
  --color-paper-sunken: var(--color-paper-sunken-val);
  --color-sidebar: var(--color-sidebar-val);
  --color-accent: var(--color-accent-val);
  --color-accent-hover: var(--color-accent-hover-val);
  --color-accent-soft: var(--color-accent-soft-val);
  --color-positive: var(--color-positive-val);
  --color-positive-soft: var(--color-positive-soft-val);
  --color-negative: var(--color-negative-val);
  --color-negative-soft: var(--color-negative-soft-val);
  --color-warning: var(--color-warning-val);
  --color-warning-soft: var(--color-warning-soft-val);
  --color-info: var(--color-info-val);
  --color-info-soft: var(--color-info-soft-val);
  --color-border-default: var(--color-line-val);
  --color-border-strong: var(--color-line-strong-val);
}
`;

css = css.replace('@import "tailwindcss";', '@import "tailwindcss";\n\n' + themeBlock);

const varsToReplace = [
  'ink', 'ink-soft', 'ink-faint',
  'paper', 'paper-raised', 'paper-sunken', 'sidebar',
  'accent', 'accent-hover', 'accent-soft',
  'positive', 'positive-soft',
  'negative', 'negative-soft',
  'warning', 'warning-soft',
  'info', 'info-soft',
  'line', 'line-strong'
];

varsToReplace.forEach(v => {
  const regex = new RegExp('--color-' + v + ':(?![^;]*var\\()', 'g');
  css = css.replace(regex, '--color-' + v + '-val:');
});

fs.writeFileSync('src/styles/globals.css', css);
console.log('updated globals.css');
