#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const MAX_RECENT = 25;
const ROOT = path.resolve(__dirname, '..');
const recentPath = path.join(ROOT, 'recently-added.json');
const appsPath = path.join(ROOT, 'apps.json');

const recentData = JSON.parse(fs.readFileSync(recentPath, 'utf-8'));
const recent = recentData.apps || recentData;
const apps = JSON.parse(fs.readFileSync(appsPath, 'utf-8'));

if (recent.length <= MAX_RECENT) {
  console.log(`${recent.length}/${MAX_RECENT} recent apps, nothing to rotate.`);
  process.exit(0);
}

const overflow = recent.length - MAX_RECENT;
const toMove = recent.splice(0, overflow);

for (const entry of toMove) {
  const alreadyExists = apps.some(
    a => a.url.toLowerCase() === entry.url.toLowerCase()
  );
  if (alreadyExists) {
    console.log(`  skip: ${entry.applicationName} (duplicate)`);
    continue;
  }

  apps.push({
    applicationName: entry.applicationName,
    url: entry.url,
    downloadUrl: entry.downloadUrl || [],
    isDead: entry.isDead || false,
    isFork: entry.isFork || false,
    tags: entry.tags && entry.tags.length ? entry.tags : ['IDK'],
    urlFork: entry.urlFork || null,
    description: entry.description || '',
  });
  console.log(`  moved: ${entry.applicationName}`);
}

apps.sort((a, b) =>
  a.applicationName.toLowerCase().localeCompare(b.applicationName.toLowerCase())
);

recentData.apps = recent;
fs.writeFileSync(recentPath, JSON.stringify(recentData, null, 2) + '\n', 'utf-8');
fs.writeFileSync(appsPath, JSON.stringify(apps, null, 2) + '\n', 'utf-8');

console.log(`Moved ${toMove.length} app(s). recent: ${recent.length}, total: ${apps.length}`);
