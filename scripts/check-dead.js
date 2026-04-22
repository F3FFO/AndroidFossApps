#!/usr/bin/env node
// Usage: GITHUB_TOKEN=xxx node scripts/check-dead.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const appsPath = path.join(ROOT, 'apps.json');
const recentPath = path.join(ROOT, 'recently-added.json');
const apps = JSON.parse(fs.readFileSync(appsPath, 'utf-8'));
const recentData = JSON.parse(fs.readFileSync(recentPath, 'utf-8'));
const recent = recentData.apps || recentData;

const THREE_YEARS_MS = 3 * 365.25 * 24 * 60 * 60 * 1000;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchJSON(url, headers = {}) {
  const res = await fetch(url, { headers });
  if (res.status === 404 || res.status === 451) return { _notFound: true };
  if (!res.ok) {
    console.warn(`  HTTP ${res.status} for ${url}`);
    return null;
  }
  return res.json();
}

async function checkGitHub(owner, repo) {
  const headers = {};
  if (GITHUB_TOKEN) headers.Authorization = `token ${GITHUB_TOKEN}`;

  const info = await fetchJSON(
    `https://api.github.com/repos/${owner}/${repo}`,
    headers
  );
  if (!info || info._notFound) return null;

  if (info.archived) return true;

  if (info.pushed_at) {
    const age = Date.now() - new Date(info.pushed_at).getTime();
    if (age > THREE_YEARS_MS) return true;
  }

  return false;
}

async function checkGitLab(host, projectPath) {
  const encoded = encodeURIComponent(projectPath);
  const info = await fetchJSON(`https://${host}/api/v4/projects/${encoded}`);
  if (!info || info._notFound) return null;

  if (info.archived) return true;

  if (info.last_activity_at) {
    const age = Date.now() - new Date(info.last_activity_at).getTime();
    if (age > THREE_YEARS_MS) return true;
  }

  return false;
}

async function checkCodeberg(owner, repo) {
  const info = await fetchJSON(
    `https://codeberg.org/api/v1/repos/${owner}/${repo}`
  );
  if (!info || info._notFound) return null;

  if (info.archived) return true;

  if (info.updated_at) {
    const age = Date.now() - new Date(info.updated_at).getTime();
    if (age > THREE_YEARS_MS) return true;
  }

  return false;
}

function parseUrl(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.replace(/^\/|\/$/g, '').split('/');

    if (u.hostname === 'github.com' && parts.length >= 2) {
      return { type: 'github', owner: parts[0], repo: parts[1] };
    }

    if ((u.hostname.includes('gitlab') || u.hostname.includes('torproject'))
        && parts.length >= 2) {
      return { type: 'gitlab', host: u.hostname, path: parts.join('/') };
    }

    if (u.hostname === 'codeberg.org' && parts.length >= 2) {
      return { type: 'codeberg', owner: parts[0], repo: parts[1] };
    }

    return { type: 'unknown' };
  } catch {
    return { type: 'unknown' };
  }
}

async function checkApp(app) {
  const parsed = parseUrl(app.url);

  switch (parsed.type) {
    case 'github':
      return checkGitHub(parsed.owner, parsed.repo);
    case 'gitlab':
      return checkGitLab(parsed.host, parsed.path);
    case 'codeberg':
      return checkCodeberg(parsed.owner, parsed.repo);
    default:
      return null;
  }
}

async function main() {
  const allApps = [...apps, ...recent];
  console.log(`Checking ${allApps.length} apps for dead status (${apps.length} main + ${recent.length} recent)...`);
  if (!GITHUB_TOKEN) {
    console.warn('Warning: GITHUB_TOKEN not set, GitHub rate limits will apply');
  }

  let changed = 0;
  let checked = 0;
  let skipped = 0;

  for (let i = 0; i < allApps.length; i++) {
    const app = allApps[i];
    const dead = await checkApp(app);

    if (dead === null) {
      skipped++;
    } else {
      checked++;
      if (dead !== app.isDead) {
        console.log(`  ${app.applicationName}: ${app.isDead} → ${dead}`);
        app.isDead = dead;
        changed++;
      }
    }

    if (i % 10 === 9) await sleep(500);
    else await sleep(50);

    if ((i + 1) % 100 === 0) {
      console.log(`  ... ${i + 1}/${allApps.length}`);
    }
  }

  console.log(`\nDone. Checked: ${checked}, Skipped: ${skipped}, Changed: ${changed}`);

  if (changed > 0) {
    fs.writeFileSync(appsPath, JSON.stringify(apps, null, 2) + '\n', 'utf-8');
    recentData.apps = recent;
    fs.writeFileSync(recentPath, JSON.stringify(recentData, null, 2) + '\n', 'utf-8');
    console.log('apps.json and recently-added.json updated.');
  } else {
    console.log('No changes needed.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
