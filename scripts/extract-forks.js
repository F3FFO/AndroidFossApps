#!/usr/bin/env node

/**
 * Parses README.backup.md to extract fork relationships (parent→child)
 * and updates apps.json with isFork + urlFork fields.
 *
 * Fork detection: in the original README, forked apps are indented
 * under their parent with 2+ extra spaces and tagged **`FORK`**.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readmePath = path.join(ROOT, 'README.backup.md');
const appsPath = path.join(ROOT, 'apps.json');

const readme = fs.readFileSync(readmePath, 'utf-8');
const apps = JSON.parse(fs.readFileSync(appsPath, 'utf-8'));

// Regex for a markdown list item with a link: captures indent, name, url
const appLineRe = /^(\s*)- \[([^\]]+)\]\(([^)]+)\)/;

// Build a map of fork URL → parent URL from README indentation
const forkMap = new Map(); // forkUrl → parentUrl
const lines = readme.split('\n');

// Stack tracks indentation levels with their URLs
// [{indent: 0, url: '...'}, {indent: 2, url: '...'}, ...]
const stack = [];

for (const line of lines) {
  const m = line.match(appLineRe);
  if (!m) continue;

  const indent = m[1].length;
  const url = m[3];
  const isFork = /\*\*`FORK`\*\*/.test(line);

  // Pop stack entries that are at the same level or deeper
  while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
    stack.pop();
  }

  if (isFork && stack.length > 0) {
    // Parent is the top of the stack (closest ancestor with less indentation)
    const parentUrl = stack[stack.length - 1].url;
    forkMap.set(url, parentUrl);
  }

  stack.push({ indent, url });
}

// Apply fork info to apps.json
let updated = 0;
for (const app of apps) {
  if (forkMap.has(app.url)) {
    app.isFork = true;
    app.urlFork = forkMap.get(app.url);
    updated++;
  } else {
    app.isFork = false;
    app.urlFork = null;
  }
}

fs.writeFileSync(appsPath, JSON.stringify(apps, null, 2) + '\n', 'utf-8');

console.log(`Fork relationships found: ${forkMap.size}`);
console.log(`Apps updated in apps.json: ${updated}`);

// Show some examples
let shown = 0;
for (const [fork, parent] of forkMap) {
  if (shown++ >= 5) break;
  const forkName = apps.find(a => a.url === fork)?.applicationName || '?';
  const parentName = apps.find(a => a.url === parent)?.applicationName || '?';
  console.log(`  ${forkName} → forked from ${parentName}`);
}
