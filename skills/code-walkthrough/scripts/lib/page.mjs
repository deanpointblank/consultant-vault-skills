import { codeRows } from './code.mjs';
import { builtLine, checksShort, reasonsLine, stopBadge, whyLabel, chipLabel, chipDetail } from './words.mjs';

export const FOLD_AT = 14;

const label = r => `${r[0]}–${r[1]}`;
const hiddenCopy = r => ({ ...r, hidden: true });

export function foldRows(rows) {
  const numbered = rows.filter(r => !r.gap).length;
  if (numbered <= FOLD_AT) return rows;
  const keep = rows.map(() => false);
  const mark = i => { if (i >= 0 && i < rows.length) keep[i] = true; };
  rows.forEach((r, i) => { if (r.key || r.gap) { mark(i - 1); mark(i); mark(i + 1); } });
  mark(0); mark(rows.length - 1);
  for (let i = 0; i < rows.length;) {
    if (keep[i]) { i++; continue; }
    let j = i;
    while (j < rows.length && !keep[j]) j++;
    if (j - i < 3) for (let k = i; k < j; k++) keep[k] = true;
    i = j;
  }
  const out = [];
  for (let a = 0; a < rows.length;) {
    if (keep[a]) { out.push(rows[a]); a++; continue; }
    let z = a;
    while (z < rows.length && !keep[z]) z++;
    out.push({ fold: z - a, label: `⋯ ${z - a} more lines` });
    for (let q = a; q < z; q++) out.push(hiddenCopy(rows[q]));
    a = z;
  }
  return out;
}

const range = o => `${o.file}:${o.lines[0]}-${o.lines[1]}`;

function blockModel(block) {
  const all = codeRows(block).map(r => r.gap ? { ...r, label: `lines ${label(r.gap)} left out` } : r);
  const total = all.filter(r => !r.gap).length;
  const rows = foldRows(all);
  return { label: range(block), fn: block.function, rows, total, folded: rows.length !== all.length, showAll: `Show all ${total} lines` };
}

export function pageModel(data) {
  const stops = data.stops || [];
  const names = new Map(stops.map((s, i) => [s.id, { n: i + 1, name: s.name }]));
  const multi = (data.repos || []).length > 1;
  const uncommittedFiles = (data.repos || []).flatMap(r => (r.uncommitted || []).map(f => multi ? `${r.name}: ${f}` : f));
  return {
    title: data.journey,
    built: builtLine(data),
    uncommittedFiles,
    checks: checksShort(data),
    reasons: reasonsLine(data),
    mapMissing: !data.checks?.map?.built,
    stops: stops.map((s, i) => {
      const code = s.code || [];
      return {
        n: i + 1, id: s.id, name: s.name, summary: s.summary,
        badge: stopBadge(s),
        firstFile: code.length ? range(code[0]) : '',
        more: Math.max(0, code.length - 1),
        blocks: code.map(blockModel),
        what: s.what, dataIn: s.data?.in, dataOut: s.data?.out,
        notes: s.notes || [],
        whyLabel: whyLabel(s),
        why: (s.reasons || []).map(r => ({ text: r.text, chip: chipLabel(r.source), detail: chipDetail(r, data), notRecorded: r.source.kind === 'not-recorded' })),
        guesses: s.guesses || [],
      };
    }),
    extend: (data.extend || []).map(e => ({ where: range(e), text: e.text, stopN: names.get(e.stop)?.n, stopName: names.get(e.stop)?.name })),
  };
}
