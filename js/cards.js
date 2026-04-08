import { iconFor } from './icons.js';

function hostLabel(url) {
  const hosts = [
    ['github.com', 'GitHub'],
    ['gitlab.com', 'GitLab'],
    ['gitlab.', 'GitLab'],
    ['codeberg.org', 'Codeberg'],
    ['sourceforge.net', 'SourceForge'],
    ['f-droid.org', 'F-Droid'],
  ];
  for (const [match, label] of hosts) {
    if (url.includes(match)) return label;
  }
  try { return new URL(url).hostname.replace('www.', ''); }
  catch { return 'Link'; }
}

function hostIcon(url) {
  if (/github|gitlab|codeberg/.test(url)) return 'code';
  if (url.includes('f-droid.org')) return 'store';
  return 'link';
}

function makeBadge(cls, iconName, text) {
  const el = document.createElement('span');
  el.className = `badge ${cls}`;
  const ico = document.createElement('span');
  ico.className = 'material-symbols-outlined';
  ico.textContent = iconName;
  el.append(ico, text);
  return el;
}

export function createCard(app, isNew) {
  const card = document.createElement('article');
  card.className = 'app-card' + (isNew ? ' is-new' : '');

  // name + badges
  const header = document.createElement('div');
  header.className = 'app-card-header';

  const title = document.createElement('h3');
  title.className = 'app-name';
  const titleLink = document.createElement('a');
  titleLink.href = app.url;
  titleLink.target = '_blank';
  titleLink.rel = 'noopener noreferrer';
  titleLink.textContent = app.applicationName;
  title.appendChild(titleLink);

  const badges = document.createElement('div');
  badges.className = 'app-badges';
  if (isNew)     badges.appendChild(makeBadge('badge-new', 'new_releases', 'New'));
  if (app.isDead) badges.appendChild(makeBadge('badge-dead', 'delete_forever', 'Dead'));
  if (app.isFork) {
    if (app.urlFork) {
      const link = document.createElement('a');
      link.href = app.urlFork;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'badge badge-fork';
      link.title = 'Forked from ' + app.urlFork;
      const ico = document.createElement('span');
      ico.className = 'material-symbols-outlined';
      ico.textContent = 'fork_right';
      link.append(ico, 'Fork');
      badges.appendChild(link);
    } else {
      badges.appendChild(makeBadge('badge-fork', 'fork_right', 'Fork'));
    }
  }

  header.appendChild(title);
  if (badges.childElementCount) header.appendChild(badges);

  // source links row
  const urlRow = document.createElement('div');
  urlRow.className = 'app-url';

  const srcIcon = document.createElement('span');
  srcIcon.className = 'material-symbols-outlined';
  srcIcon.textContent = hostIcon(app.url);
  urlRow.appendChild(srcIcon);

  const srcLink = document.createElement('a');
  srcLink.href = app.url;
  srcLink.target = '_blank';
  srcLink.rel = 'noopener noreferrer';
  srcLink.textContent = hostLabel(app.url);
  urlRow.appendChild(srcLink);

  for (const dl of app.downloadUrl ?? []) {
    urlRow.append(' · ');
    const dlLink = document.createElement('a');
    dlLink.href = dl;
    dlLink.target = '_blank';
    dlLink.rel = 'noopener noreferrer';
    dlLink.textContent = hostLabel(dl);
    urlRow.appendChild(dlLink);
  }

  // description (truncated)
  let descRow = null;
  if (app.description) {
    descRow = document.createElement('p');
    descRow.className = 'app-desc';
    const truncated = app.description.length > 50
      ? app.description.slice(0, 50) + '…'
      : app.description;
    descRow.textContent = truncated;
  }

  // tags
  const tagsRow = document.createElement('div');
  tagsRow.className = 'app-tags';
  for (const t of app.tags) {
    const chip = document.createElement('span');
    chip.className = 'app-tag';
    const ico = document.createElement('span');
    ico.className = 'material-symbols-outlined';
    ico.textContent = iconFor(t);
    chip.append(ico, t);
    tagsRow.appendChild(chip);
  }

  // expand button
  const expandBtn = document.createElement('button');
  expandBtn.className = 'app-expand-btn';
  expandBtn.title = 'Espandi';
  expandBtn.setAttribute('aria-label', 'Espandi dettagli app');
  const expandIco = document.createElement('span');
  expandIco.className = 'material-symbols-outlined';
  expandIco.textContent = 'open_in_full';
  expandBtn.appendChild(expandIco);
  expandBtn.addEventListener('click', () => openAppModal(app, isNew));

  const footer = document.createElement('div');
  footer.className = 'app-card-footer';
  footer.appendChild(tagsRow);
  footer.appendChild(expandBtn);

  card.append(header, urlRow, ...(descRow ? [descRow] : []), footer);
  return card;
}

// ── Modal ──────────────────────────────────────────────────────────────────

function getOrCreateOverlay() {
  let overlay = document.getElementById('appModalOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'appModalOverlay';
    overlay.className = 'app-modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeAppModal();
    });
    document.body.appendChild(overlay);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAppModal();
    });
  }
  return overlay;
}

function closeAppModal() {
  const overlay = document.getElementById('appModalOverlay');
  if (overlay) {
    overlay.classList.remove('is-open');
    document.body.classList.remove('modal-open');
  }
}

function openAppModal(app, isNew) {
  const overlay = getOrCreateOverlay();
  overlay.innerHTML = '';

  const modal = document.createElement('div');
  modal.className = 'app-modal-card';

  // close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'app-modal-close';
  closeBtn.title = 'Chiudi';
  closeBtn.setAttribute('aria-label', 'Chiudi');
  const closeIco = document.createElement('span');
  closeIco.className = 'material-symbols-outlined';
  closeIco.textContent = 'close';
  closeBtn.appendChild(closeIco);
  closeBtn.addEventListener('click', closeAppModal);

  // header (name + badges)
  const header = document.createElement('div');
  header.className = 'app-card-header';

  const title = document.createElement('h3');
  title.className = 'app-name';
  const titleLink = document.createElement('a');
  titleLink.href = app.url;
  titleLink.target = '_blank';
  titleLink.rel = 'noopener noreferrer';
  titleLink.textContent = app.applicationName;
  title.appendChild(titleLink);

  const badges = document.createElement('div');
  badges.className = 'app-badges';
  if (isNew)      badges.appendChild(makeBadge('badge-new', 'new_releases', 'New'));
  if (app.isDead) badges.appendChild(makeBadge('badge-dead', 'delete_forever', 'Dead'));
  if (app.isFork) {
    if (app.urlFork) {
      const link = document.createElement('a');
      link.href = app.urlFork;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'badge badge-fork';
      link.title = 'Forked from ' + app.urlFork;
      const ico = document.createElement('span');
      ico.className = 'material-symbols-outlined';
      ico.textContent = 'fork_right';
      link.append(ico, 'Fork');
      badges.appendChild(link);
    } else {
      badges.appendChild(makeBadge('badge-fork', 'fork_right', 'Fork'));
    }
  }
  header.appendChild(title);
  if (badges.childElementCount) header.appendChild(badges);

  // url row
  const urlRow = document.createElement('div');
  urlRow.className = 'app-url';
  const srcIcon = document.createElement('span');
  srcIcon.className = 'material-symbols-outlined';
  srcIcon.textContent = hostIcon(app.url);
  urlRow.appendChild(srcIcon);
  const srcLink = document.createElement('a');
  srcLink.href = app.url;
  srcLink.target = '_blank';
  srcLink.rel = 'noopener noreferrer';
  srcLink.textContent = hostLabel(app.url);
  urlRow.appendChild(srcLink);
  for (const dl of app.downloadUrl ?? []) {
    urlRow.append(' · ');
    const dlLink = document.createElement('a');
    dlLink.href = dl;
    dlLink.target = '_blank';
    dlLink.rel = 'noopener noreferrer';
    dlLink.textContent = hostLabel(dl);
    urlRow.appendChild(dlLink);
  }

  // full description
  let descEl = null;
  if (app.description) {
    descEl = document.createElement('p');
    descEl.className = 'app-modal-desc';
    descEl.textContent = app.description;
  }

  // tags
  const tagsRow = document.createElement('div');
  tagsRow.className = 'app-tags';
  for (const t of app.tags ?? []) {
    const chip = document.createElement('span');
    chip.className = 'app-tag';
    const ico = document.createElement('span');
    ico.className = 'material-symbols-outlined';
    ico.textContent = iconFor(t);
    chip.append(ico, t);
    tagsRow.appendChild(chip);
  }

  modal.append(closeBtn, header, urlRow, ...(descEl ? [descEl] : []), tagsRow);
  overlay.appendChild(modal);
  overlay.classList.add('is-open');
  document.body.classList.add('modal-open');
  closeBtn.focus();
}
