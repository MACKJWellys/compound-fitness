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

export function getProgrammeWeek(programmeStart = new Date('2026-09-01'), programmeEnd = new Date('2026-12-31')) {
  const now = new Date();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const totalWeeks = Math.max(1, Math.ceil((programmeEnd - programmeStart) / weekMs));
  const diffMs = now - programmeStart;
  if (diffMs < 0) return { week: 1, phase: 'Foundation', pct: 0, totalWeeks };
  const week = Math.min(totalWeeks, Math.floor(diffMs / weekMs) + 1);
  const third = totalWeeks / 3;
  const phase = week <= Math.ceil(third) ? 'Foundation' : week <= Math.ceil(third * 2) ? 'Push' : 'Peak';
  const pct = Math.min(100, Math.round((diffMs / (programmeEnd - programmeStart)) * 100));
  return { week, phase, pct, totalWeeks };
}
