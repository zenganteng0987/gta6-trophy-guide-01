// Saved progress for the tracker: which trophies are earned and the player's own
// progress counts toward the counted trophies (stunts, scans, dollars and the like).
// Everything lives in this browser's localStorage; export and import move it as a file.

const STORAGE_KEY = 'leonida-legend-progress-v1';
const EXPORT_APP_TAG = 'leonida-legend-trophy-tracker';

export function emptyProgress() {
  return { earned: new Set(), counts: new Map() };
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress();
    const parsed = JSON.parse(raw);
    return {
      earned: new Set(Array.isArray(parsed.earned) ? parsed.earned : []),
      counts: new Map(Object.entries(parsed.counts ?? {})),
    };
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress) {
  const plain = {
    earned: [...progress.earned],
    counts: Object.fromEntries(progress.counts),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plain));
}

export function clearProgress() {
  localStorage.removeItem(STORAGE_KEY);
}

// Serialise the progress to a small JSON document the player can keep or move.
export function progressToFileText(progress) {
  return JSON.stringify(
    {
      app: EXPORT_APP_TAG,
      version: 1,
      earned: [...progress.earned],
      counts: Object.fromEntries(progress.counts),
    },
    null,
    2,
  );
}

export function downloadProgress(progress) {
  const blob = new Blob([progressToFileText(progress)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'leonida-legend-progress.json';
  link.click();
  URL.revokeObjectURL(url);
}

// Read an exported file back. Only names the guide actually holds are accepted,
// so a stray or foreign file cannot invent trophies.
export async function readProgressFile(file, validNames) {
  const parsed = JSON.parse(await file.text());
  const progress = emptyProgress();
  const names = new Set(validNames);
  for (const name of Array.isArray(parsed.earned) ? parsed.earned : []) {
    if (names.has(name)) progress.earned.add(name);
  }
  for (const [name, value] of Object.entries(parsed.counts ?? {})) {
    const n = Number(value);
    if (names.has(name) && Number.isFinite(n) && n >= 0) progress.counts.set(name, n);
  }
  return progress;
}
