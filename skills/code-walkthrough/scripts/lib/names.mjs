import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export function slugOf(shortName) {
  const s = String(shortName).normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '');
  return s || `walkthrough-${createHash('sha1').update(String(shortName)).digest('hex').slice(0, 6)}`;
}

export function noteBaseOf(shortName, mode) {
  return `${mode === 'plan' ? 'Plan' : 'Walkthrough'} - ${String(shortName).replace(/[*"\\/<>:|?#^\[\]]/g, ' ').replace(/ +/g, ' ').trim()}`;
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const exts = mode => (mode === 'plan' ? { page: '.plan.html', data: '.plan.json' } : { page: '.html', data: '.walkthrough.json' });
const namesFor = (slug, noteBase, date, n, mode) => {
  const tail = n > 1 ? `-${n}` : '', paren = n > 1 ? ` (${n})` : '', e = exts(mode);
  return { page: `${slug}-${date}${tail}${e.page}`, data: `${slug}-${date}${tail}${e.data}`, note: `${noteBase} ${date}${paren}.md` };
};
const baseNames = (slug, noteBase, mode) => ({ page: `${slug}${exts(mode).page}`, data: `${slug}${exts(mode).data}`, note: `${noteBase}.md` });

// The notes of this journey already in the folder: the base note (dated by its `created`) and
// the dated ones (dated by their names), oldest first.
function existingNotes(folderPath, slug, noteBase, mode) {
  let files = [];
  try { files = fs.readdirSync(folderPath); } catch { return []; }
  const dated = new RegExp(`^${escapeRe(noteBase)} (\\d{4}-\\d{2}-\\d{2})(?: \\((\\d+)\\))?\\.md$`);
  const found = [];
  for (const f of files) {
    if (f === `${noteBase}.md`) {
      let text = '';
      try { text = fs.readFileSync(path.join(folderPath, f), 'utf8'); } catch {}
      const created = text.match(/^created:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1] ?? '0000-00-00';
      found.push({ date: created, seq: 0, names: baseNames(slug, noteBase, mode) });
      continue;
    }
    const m = f.match(dated);
    if (m) found.push({ date: m[1], seq: m[2] ? Number(m[2]) : 1, names: namesFor(slug, noteBase, m[1], m[2] ? Number(m[2]) : 1, mode) });
  }
  return found.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.seq - b.seq));
}

const noteOf = e => e.names.note.replace(/\.md$/, '');

export function chooseNames({ folderPath, slug, noteBase, date, sameDay, mode }) {
  const notes = existingNotes(folderPath, slug, noteBase, mode);
  const taken = names => Object.values(names).some(n => fs.existsSync(path.join(folderPath, n)));
  const firstFreeToday = () => { for (let n = 1; ; n++) { const c = namesFor(slug, noteBase, date, n, mode); if (!taken(c)) return c; } };
  const latest = notes.at(-1);
  if (!latest) {
    const names = baseNames(slug, noteBase, mode);
    return { ...(taken(names) ? firstFreeToday() : names), earlier: null, replace: false };
  }
  if (latest.date !== date) return { ...firstFreeToday(), earlier: noteOf(latest), replace: false };
  if (sameDay === 'keep') return { ...firstFreeToday(), earlier: noteOf(latest), replace: false };
  if (sameDay === 'replace') {
    const before = notes.slice(0, -1).at(-1);
    return { ...latest.names, earlier: before ? noteOf(before) : null, replace: true };
  }
  return { clash: [latest.names.page, latest.names.data, latest.names.note] };
}
