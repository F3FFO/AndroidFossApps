import { activeTags, refreshBadge, render } from './app.js';
import { iconFor } from './icons.js';

const HOST_LABELS = [
  ['github.com', 'GitHub'],
  ['gitlab.com', 'GitLab'],
  ['gitlab.', 'GitLab'],
  ['codeberg.org', 'Codeberg'],
  ['sourceforge.net', 'SourceForge'],
  ['f-droid.org', 'F-Droid'],
];

function hostLabel(url) {
  for (const [match, label] of HOST_LABELS) {
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

function ico(name) {
  const el = document.createElement('span');
  el.className = 'material-symbols-outlined';
  el.textContent = name;
  return el;
}

function makeBadge(cls, iconName, text) {
  const el = document.createElement('span');
  el.className = `badge ${cls}`;
  el.append(ico(iconName), text);
  return el;
}

function buildHeader(app, isNew) {
  const header = document.createElement('div');
  header.className = 'app-card-header';

  const title = document.createElement('h3');
  title.className = 'app-name';
  const a = document.createElement('a');
  a.href = app.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = app.applicationName;
  title.appendChild(a);

  const badges = document.createElement('div');
  badges.className = 'app-badges';
  if (isNew) badges.appendChild(makeBadge('badge-new', 'new_releases', 'New'));
  if (app.isDead) badges.appendChild(makeBadge('badge-dead', 'delete_forever', 'Dead'));
  if (app.isFork) {
    if (app.urlFork) {
      const link = document.createElement('a');
      link.href = app.urlFork;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'badge badge-fork';
      link.title = 'Forked from ' + app.urlFork;
      link.append(ico('fork_right'), 'Fork');
      badges.appendChild(link);
    } else {
      badges.appendChild(makeBadge('badge-fork', 'fork_right', 'Fork'));
    }
  }

  header.appendChild(title);
  if (badges.childElementCount) header.appendChild(badges);
  return header;
}

function buildUrlRow(app) {
  const row = document.createElement('div');
  row.className = 'app-url';
  row.appendChild(ico(hostIcon(app.url)));

  const src = document.createElement('a');
  src.href = app.url;
  src.target = '_blank';
  src.rel = 'noopener noreferrer';
  src.textContent = hostLabel(app.url);
  row.appendChild(src);

  for (const dl of app.downloadUrl ?? []) {
    const a = document.createElement('a');
    a.href = dl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = hostLabel(dl);
    row.append(' · ', a);
  }

  return row;
}

function buildTags(tags) {
  const row = document.createElement('div');
  row.className = 'app-tags';
  for (const t of tags ?? []) {
    const chip = document.createElement('span');
    chip.className = 'app-tag';
    chip.append(ico(iconFor(t)), t);
    row.appendChild(chip);

    chip.addEventListener('click', () => {
      activeTags.has(t) ? activeTags.delete(t) : activeTags.add(t);
      refreshBadge();
      render();
    });
  }
  return row;
}

export function createCard(app, isNew) {
  const card = document.createElement('article');
  card.className = 'app-card' + (isNew ? ' is-new' : '');

  let desc = null;
  if (app.description) {
    desc = document.createElement('p');
    desc.className = 'app-desc';
    desc.textContent = app.description.length > 50
      ? app.description.slice(0, 50) + '…'
      : app.description;
  }

  const expandBtn = document.createElement('button');
  expandBtn.className = 'app-expand-btn';
  expandBtn.title = 'Espandi';
  expandBtn.setAttribute('aria-label', 'Espandi dettagli app');
  expandBtn.appendChild(ico('open_in_full'));
  expandBtn.addEventListener('click', () => openModal(app, isNew));

  const footer = document.createElement('div');
  footer.className = 'app-card-footer';
  footer.append(buildTags(app.tags), expandBtn);

  card.append(buildHeader(app, isNew), buildUrlRow(app), ...(desc ? [desc] : []), footer);
  return card;
}

let modalOverlay = null;

function getOverlay() {
  if (modalOverlay) return modalOverlay;
  modalOverlay = document.createElement('div');
  modalOverlay.className = 'app-modal-overlay';
  modalOverlay.setAttribute('role', 'dialog');
  modalOverlay.setAttribute('aria-modal', 'true');
  modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });
  document.body.appendChild(modalOverlay);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
  return modalOverlay;
}

function closeModal() {
  modalOverlay?.classList.remove('is-open');
  document.body.classList.remove('modal-open');
}

function openModal(app, isNew) {
  const ol = getOverlay();
  ol.innerHTML = '';

  const modal = document.createElement('div');
  modal.className = 'app-modal-card';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'app-modal-close';
  closeBtn.title = 'Chiudi';
  closeBtn.setAttribute('aria-label', 'Chiudi');
  closeBtn.appendChild(ico('close'));
  closeBtn.addEventListener('click', closeModal);

  let desc = null;
  if (app.description) {
    desc = document.createElement('p');
    desc.className = 'app-modal-desc';
    desc.textContent = app.description;
  }

  modal.append(closeBtn, buildHeader(app, isNew), buildUrlRow(app), ...(desc ? [desc] : []), buildTags(app.tags));
  ol.appendChild(modal);
  ol.classList.add('is-open');
  document.body.classList.add('modal-open');
  closeBtn.focus();
}
