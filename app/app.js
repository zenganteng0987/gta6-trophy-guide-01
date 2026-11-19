// Leonida Legend — entry point. Loads the trophy data, wires the toolbar (search,
// kind chips, grade filter, spoiler shield, hide-earned), the roadmap and the
// export/import/reset tools, and keeps the header progress in step with the ticks.
// The app runs entirely from its own files: the only fetch is its own data file.

import {
  loadProgress,
  saveProgress,
  clearProgress,
  downloadProgress,
  readProgressFile,
} from './state.js';
import { renderRoadmap, renderTrophyList } from './render.js';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const validNames = trophies.map((t) => t.name);

let progress = loadProgress();
const openGuides = new Set();
const filters = { kind: 'all', grade: 'all', query: '', spoiler: false, hideEarned: false };
let notice = '';

const els = {
  earnedCount: document.getElementById('earned-count'),
  progressBar: document.getElementById('progress-bar'),
  gradeTallies: document.getElementById('grade-tallies'),
  search: document.getElementById('search'),
  gradeFilter: document.getElementById('grade-filter'),
  spoilerToggle: document.getElementById('spoiler-toggle'),
  hideEarnedToggle: document.getElementById('hide-earned-toggle'),
  kindChips: document.getElementById('kind-chips'),
  exportButton: document.getElementById('export-button'),
  importInput: document.getElementById('import-input'),
  resetButton: document.getElementById('reset-button'),
  resultCount: document.getElementById('result-count'),
  roadmapStages: document.getElementById('roadmap-stages'),
  trophyList: document.getElementById('trophy-list'),
  emptyState: document.getElementById('empty-state'),
  aboutText: document.getElementById('about-text'),
};

function matchesFilters(trophy) {
  if (filters.kind === 'missable' && !trophy.missable) return false;
  if (filters.kind === 'online' && trophy.kind !== 'online') return false;
  if (
    filters.kind !== 'all' &&
    filters.kind !== 'missable' &&
    filters.kind !== 'online' &&
    trophy.kind !== filters.kind
  )
    return false;
  if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
  if (filters.hideEarned && progress.earned.has(trophy.name)) return false;
  if (filters.query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(filters.query)) return false;
  }
  return true;
}

function updateHeader() {
  const earnedTotal = progress.earned.size;
  els.earnedCount.textContent = String(earnedTotal);
  els.progressBar.style.width = `${Math.round((earnedTotal / trophies.length) * 100)}%`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const all = trophies.filter((t) => t.grade === grade);
    const got = all.filter((t) => progress.earned.has(t.name)).length;
    const label = grade.charAt(0).toUpperCase() + grade.slice(1);
    return `${label} ${got}/${all.length}`;
  });
  els.gradeTallies.textContent = parts.join(' · ');
}

function render() {
  const shown = trophies.filter(matchesFilters);
  renderTrophyList(els.trophyList, shown, {
    progress,
    spoilerOn: filters.spoiler,
    openGuides,
    onToggleEarned(name, checked) {
      if (checked) progress.earned.add(name);
      else progress.earned.delete(name);
      saveProgress(progress);
      render();
    },
    onCountChange(name, value) {
      if (value > 0) progress.counts.set(name, value);
      else progress.counts.delete(name);
      saveProgress(progress);
      render();
    },
  });
  updateHeader();
  if (shown.length === 0) {
    els.emptyState.hidden = false;
    els.emptyState.textContent =
      filters.kind === 'online'
        ? 'No online trophies: this list is entirely single-player — all 55 trophies are earned offline. (PowerPyx — GTA 6 Trophy Guide & Roadmap.)'
        : 'No trophies match these filters. Loosen the search or pick another kind or grade.';
  } else {
    els.emptyState.hidden = true;
  }
  const base = `Showing ${shown.length} of ${trophies.length} trophies · ${progress.earned.size} earned`;
  els.resultCount.textContent = notice ? `${notice} ${base}` : base;
  notice = '';
}

function jumpToTrophy(name) {
  filters.kind = 'all';
  filters.grade = 'all';
  filters.query = '';
  filters.hideEarned = false;
  els.search.value = '';
  els.gradeFilter.value = 'all';
  els.hideEarnedToggle.checked = false;
  for (const chip of els.kindChips.querySelectorAll('.chip')) {
    chip.classList.toggle('active', chip.dataset.kind === 'all');
  }
  openGuides.add(name);
  render();
  const card = els.trophyList.querySelector(`[data-name="${CSS.escape(name)}"]`);
  if (card) card.scrollIntoView({ block: 'start' });
}

// --- Toolbar wiring -------------------------------------------------------

els.search.addEventListener('input', () => {
  filters.query = els.search.value.trim().toLowerCase();
  render();
});
els.gradeFilter.addEventListener('change', () => {
  filters.grade = els.gradeFilter.value;
  render();
});
els.spoilerToggle.addEventListener('change', () => {
  filters.spoiler = els.spoilerToggle.checked;
  render();
});
els.hideEarnedToggle.addEventListener('change', () => {
  filters.hideEarned = els.hideEarnedToggle.checked;
  render();
});
els.kindChips.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (!chip) return;
  filters.kind = chip.dataset.kind;
  for (const c of els.kindChips.querySelectorAll('.chip')) {
    c.classList.toggle('active', c === chip);
  }
  render();
});
els.exportButton.addEventListener('click', () => downloadProgress(progress));
els.importInput.addEventListener('change', async () => {
  const file = els.importInput.files[0];
  if (!file) return;
  try {
    progress = await readProgressFile(file, validNames);
    saveProgress(progress);
    notice = 'Progress imported.';
  } catch {
    notice = 'That file could not be read as progress.';
  }
  els.importInput.value = '';
  render();
});
els.resetButton.addEventListener('click', () => {
  if (!confirm('Clear all saved progress for this guide?')) return;
  clearProgress();
  progress = loadProgress();
  notice = 'Progress cleared.';
  render();
});

// --- Shareable views (also how the screenshots frame a state) -------------

const params = new URLSearchParams(location.search);
if (params.get('kind')) {
  filters.kind = params.get('kind');
  for (const chip of els.kindChips.querySelectorAll('.chip')) {
    chip.classList.toggle('active', chip.dataset.kind === filters.kind);
  }
}
if (params.get('grade')) {
  filters.grade = params.get('grade');
  els.gradeFilter.value = filters.grade;
}
if (params.get('q')) {
  filters.query = params.get('q').toLowerCase();
  els.search.value = params.get('q');
}
if (params.get('spoiler') === '1') {
  filters.spoiler = true;
  els.spoilerToggle.checked = true;
}
if (params.get('open')) openGuides.add(params.get('open'));

els.aboutText.textContent = doc.about ?? '';
renderRoadmap(els.roadmapStages, doc.roadmap, trophies, jumpToTrophy);
render();
if (params.get('open')) {
  const card = els.trophyList.querySelector(
    `[data-name="${CSS.escape(params.get('open'))}"]`,
  );
  if (card) card.scrollIntoView({ block: 'start' });
}
