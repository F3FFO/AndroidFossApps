import * as theme from './theme.js';
import { createCard } from './cards.js';
import {
  buildTagChips, filterChips, updateBadge,
  setupDropdown, clearTagSelection
} from './filters.js';

const el = id => document.getElementById(id);

const searchInput     = el('searchInput');
const clearBtn        = el('clearSearch');
const filterToggle    = el('filterToggle');
const filterPanel     = el('filterPanel');
const filterBadge     = el('filterBadge');
const tagContainer    = el('tagContainer');
const tagSearch       = el('tagSearch');
const appGrid         = el('appGrid');
const resultsCount    = el('resultsCount');
const noResults       = el('noResults');
const hideDeadCb      = el('hideDead');
const hideForksCb     = el('hideForks');
const showNewCb       = el('showNewOnly');
const clearFiltersBtn = el('clearFilters');
const themeToggle     = el('themeToggle');

let apps = [];
let recentUrls = new Set();
let activeTags = new Set();
let search = '';
let hideDead = false;
let hideForks = false;
let newOnly = false;

function isNew(app) {
  return recentUrls.has(app.url);
}

function activeFilterCount() {
  return activeTags.size + hideDead + hideForks + newOnly;
}

function getFiltered() {
  return apps.filter(app => {
    if (search) {
      const q = search.toLowerCase();
      const hit =
        app.applicationName.toLowerCase().includes(q) ||
        app.tags.some(t => t.toLowerCase().includes(q)) ||
        app.url.toLowerCase().includes(q);
      if (!hit) return false;
    }

    if (hideDead && app.isDead) return false;
    if (hideForks && app.isFork) return false;
    if (newOnly && !isNew(app)) return false;

    for (const tag of activeTags) {
      if (!app.tags.includes(tag)) return false;
    }

    return true;
  });
}

function render() {
  const list = getFiltered();

  resultsCount.textContent = `${list.length} of ${apps.length} apps`;
  noResults.hidden = list.length > 0;
  appGrid.style.display = list.length ? '' : 'none';

  const frag = document.createDocumentFragment();
  for (const app of list) {
    frag.appendChild(createCard(app, isNew(app)));
  }
  appGrid.replaceChildren(frag);
}

function refreshBadge() {
  updateBadge(filterBadge, activeFilterCount());
}

function resetAll() {
  activeTags.clear();
  hideDead = false;
  hideForks = false;
  newOnly = false;
  hideDeadCb.checked = false;
  hideForksCb.checked = false;
  showNewCb.checked = false;
  search = '';
  searchInput.value = '';
  clearBtn.classList.remove('visible');
  tagSearch.value = '';
  filterChips(tagContainer, '');
  clearTagSelection(tagContainer);
  refreshBadge();
  render();
}

async function load() {
  try {
    const [appsRes, recentRes] = await Promise.all([
      fetch('apps.json'),
      fetch('recently-added.json').catch(() => null),
    ]);

    if (!appsRes.ok) throw new Error('Failed to load apps.json');
    apps = await appsRes.json();

    if (recentRes?.ok) {
      const recentData = await recentRes.json();
      const recent = recentData.apps || recentData;
      recentUrls = new Set(recent.map(r => r.url));
    }

    buildTagChips(apps, tagContainer, (tag, checked) => {
      checked ? activeTags.add(tag) : activeTags.delete(tag);
      refreshBadge();
      render();
    });

    render();
  } catch (err) {
    resultsCount.textContent = 'Error loading data.';
    console.error(err);
  }
}

theme.init();
themeToggle.addEventListener('click', theme.toggle);

searchInput.addEventListener('input', () => {
  search = searchInput.value.trim();
  clearBtn.classList.toggle('visible', search.length > 0);
  render();
});

clearBtn.addEventListener('click', () => {
  searchInput.value = '';
  search = '';
  clearBtn.classList.remove('visible');
  searchInput.focus();
  render();
});

hideDeadCb.addEventListener('change', () => {
  hideDead = hideDeadCb.checked;
  refreshBadge();
  render();
});

hideForksCb.addEventListener('change', () => {
  hideForks = hideForksCb.checked;
  refreshBadge();
  render();
});

showNewCb.addEventListener('change', () => {
  newOnly = showNewCb.checked;
  refreshBadge();
  render();
});

tagSearch.addEventListener('input', () => filterChips(tagContainer, tagSearch.value));
clearFiltersBtn.addEventListener('click', resetAll);

const dropdown = setupDropdown(filterToggle, filterPanel);

document.addEventListener('keydown', e => {
  if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    searchInput.focus();
  }
  if (e.key === 'Escape') {
    searchInput.blur();
  }
});

load();
