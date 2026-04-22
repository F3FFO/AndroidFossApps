#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const reportPath = path.join(ROOT, '404-report.json');
const appsPath = path.join(ROOT, 'apps.json');
const recentPath = path.join(ROOT, 'recently-added.json');

if (!fs.existsSync(reportPath)) {
  console.log('No report file, skipping.');
  process.exit(0);
}

const broken = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
if (!broken.length) {
  console.log('Report is empty, skipping.');
  process.exit(0);
}

const brokenUrls = new Set(broken.map(b => b.url.toLowerCase()));

let apps = JSON.parse(fs.readFileSync(appsPath, 'utf-8'));
const recentData = JSON.parse(fs.readFileSync(recentPath, 'utf-8'));
let recent = recentData.apps || recentData;

const appsBefore = apps.length;
const recentBefore = recent.length;

apps = apps.filter(a => !brokenUrls.has(a.url.toLowerCase()));
recent = recent.filter(a => !brokenUrls.has(a.url.toLowerCase()));

fs.writeFileSync(appsPath, JSON.stringify(apps, null, 2) + '\n', 'utf-8');
recentData.apps = recent;
fs.writeFileSync(recentPath, JSON.stringify(recentData, null, 2) + '\n', 'utf-8');

const removedApps = appsBefore - apps.length;
const removedRecent = recentBefore - recent.length;

console.log(`Removed ${removedApps + removedRecent} app(s) (${removedApps} main, ${removedRecent} recent).`);
