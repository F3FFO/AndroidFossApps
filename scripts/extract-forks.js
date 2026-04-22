#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const readmePath = path.join(ROOT, 'README.backup.md');
const appsPath = path.join(ROOT, 'apps.json');

const readme = fs.readFileSync(readmePath, 'utf-8');
const apps = JSON.parse(fs.readFileSync(appsPath, 'utf-8'));

const appLineRe = /^(\s*)- \[([^\]]+)\]\(([^)]+)\)/;

const forkMap = new Map();
const lines = readme.split('\n');
const stack = [];

for (const line of lines) {
  const m = line.match(appLineRe);
  if (!m) continue;

  const indent = m[1].length;
  const url = m[3];
  const isFork = /\*\*`FORK`\*\*/.test(line);

  while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
    stack.pop();
  }

  if (isFork && stack.length > 0) {
    const parentUrl = stack[stack.length - 1].url;
    forkMap.set(url, parentUrl);
  }

  stack.push({ indent, url });
}

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

let shown = 0;
for (const [fork, parent] of forkMap) {
  if (shown++ >= 5) break;
  const forkName = apps.find(a => a.url === fork)?.applicationName || '?';
  const parentName = apps.find(a => a.url === parent)?.applicationName || '?';
  console.log(`  ${forkName} → forked from ${parentName}`);
}
