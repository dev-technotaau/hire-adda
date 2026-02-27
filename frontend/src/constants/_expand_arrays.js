const fs = require('fs');
const path = 'd:/Projects/talent_bridge/frontend/src/constants/suggestions.ts';
let content = fs.readFileSync(path, 'utf8');

function getExistingEntries(content, arrayName) {
  const regex = new RegExp('export const ' + arrayName + ' = \\[([\s\S]*?)\\] as const;');
  const match = content.match(regex);
  if (!match) return new Set();
  const entries = new Set();
  for (const line of match[1].split('\n')) {
    const m = line.match(/'([^']+)'/);
    if (m) entries.add(m[1]);
  }
  return entries;
}

function countEntries(content, arrayName) {
  const regex = new RegExp('export const ' + arrayName + ' = \\[([\s\S]*?)\\] as const;');
  const match = content.match(regex);
  if (!match) return 0;
  return match[1].split('\n').filter(l => l.match(/'[^']+'/)).length;
}
console.log('test');
