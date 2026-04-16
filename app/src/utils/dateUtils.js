export function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1 - day); // Monday-based
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getProgrammeWeek(programmeStart = new Date('2026-04-01')) {
  const now = new Date();
  const diffMs = now - programmeStart;
  if (diffMs < 0) return { week: 1, phase: 'Foundation', pct: 0 };
  const week = Math.min(12, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);
  const phase = week <= 4 ? 'Foundation' : week <= 8 ? 'Push' : 'Peak';
  const pct = Math.round((week - 1) / 12 * 100);
  return { week, phase, pct };
}
