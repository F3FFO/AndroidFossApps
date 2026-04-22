#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const appsPath = path.join(ROOT, 'apps.json');
const recentPath = path.join(ROOT, 'recently-added.json');
const reportPath = path.join(ROOT, '404-report.json');

const apps = JSON.parse(fs.readFileSync(appsPath, 'utf-8'));
const recentData = JSON.parse(fs.readFileSync(recentPath, 'utf-8'));
const recent = recentData.apps || recentData;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    return res.status;
  } catch {
    try {
      const res = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      return res.status;
    } catch {
      return -1;
    }
  }
}

async function main() {
  const allApps = [
    ...apps.map(a => ({ ...a, source: 'apps.json' })),
    ...recent.map(a => ({ ...a, source: 'recently-added.json' })),
  ];

  console.log(`Checking ${allApps.length} URLs for 404...`);

  const broken = [];

  for (let i = 0; i < allApps.length; i++) {
    const app = allApps[i];
    const status = await checkUrl(app.url);

    if (status === 404 || status === 451) {
      console.log(`  [${status}] ${app.applicationName} — ${app.url}`);
      broken.push({
        applicationName: app.applicationName,
        url: app.url,
        status,
        source: app.source,
      });
    }

    if (i % 10 === 9) await sleep(1000);
    else await sleep(100);

    if ((i + 1) % 50 === 0) {
      console.log(`  ... ${i + 1}/${allApps.length}`);
    }
  }

  fs.writeFileSync(reportPath, JSON.stringify(broken, null, 2) + '\n', 'utf-8');

  console.log(`\n${broken.length} broken URL(s) found.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
