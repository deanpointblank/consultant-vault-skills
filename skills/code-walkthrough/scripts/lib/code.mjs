import fs from 'node:fs';
import path from 'node:path';
import { repoByName, fieldProblem } from './data.mjs';
import { isPlan, isSketch } from './plan.mjs';
import { fileAt } from './git.mjs';

export const splitLines = t => { const ls = t.split(/\r\n|\n|\r/); if (ls.length && ls.at(-1) === '') ls.pop(); return ls; };

const inLeftOut = (n, leftOut) => (leftOut || []).some(([x, y]) => n >= x && n <= y);

export function expectedText(fileText, lines, leftOut = []) {
  if (fileText == null) return { error: 'the file is gone' };
  const ls = splitLines(fileText);
  const [a, b] = lines;
  if (b > ls.length) return { error: `the file has ${ls.length} lines` };
  const out = [];
  for (let n = a; n <= b; n++) if (!inLeftOut(n, leftOut)) out.push(ls[n - 1]);
  return { text: out.join('\n') };
}

export function codeRows(block) {
  const [a, b] = block.lines;
  const own = splitLines(block.text);
  const key = new Set(block.key_lines || []);
  const starts = new Map((block.left_out || []).map(r => [r[0], r]));
  const rows = [];
  let i = 0;
  for (let n = a; n <= b; n++) {
    if (starts.has(n)) rows.push({ gap: starts.get(n) });
    if (inLeftOut(n, block.left_out)) continue;
    rows.push({ n, text: own[i++] ?? '', key: key.has(n) });
  }
  return rows;
}

const range = l => `${l[0]}-${l[1]}`;

// A repo with a base is read at that commit, never on disk.
function read(data, block, readFile, bases) {
  const repo = repoByName(data, block.repo);
  const base = bases[repo.name];
  if (base) return fileAt(repo.path, base.hash, block.file);
  const file = path.join(repo.path, block.file);
  try { return readFile(file, 'utf8'); } catch { return null; }
}

function firstDiff(want, got) {
  const w = want.split('\n'), g = got.split('\n');
  for (let i = 0; i < Math.max(w.length, g.length); i++) if (w[i] !== g[i]) return i + 1;
  return 1;
}

// Two spellings that look right land here: an accented name in another byte form, and a file of a nested repo or submodule.
const MISNAMED = 'git names this file differently; use the path as git names it, copied from git ls-files. If the file is in a repo inside this one, such as a submodule, list that repo as its own repos entry';

// misnamed(repo name, file): true when git does not name the file exactly so; such a file is never read.
// bases: { [repo name]: { ref, hash, short } } for the repos a plan reads at a base ref.
export function checkCode(data, { readFile = fs.readFileSync, misnamed = () => false, bases = {} } = {}) {
  const failures = [];
  let blocks = 0, sketches = 0;
  const attempt = (where, fn) => {
    try { fn(); } catch (e) { failures.push({ where, why: e.message }); }
  };
  const gitNamesOtherwise = (where, o) => {
    if (!misnamed(repoByName(data, o.repo).name, o.file)) return false;
    failures.push({ where, why: MISNAMED });
    return true;
  };
  const baseOf = o => bases[repoByName(data, o.repo).name];
  for (const stop of data.stops) {
    (stop.code || []).forEach((block, i) => {
      if (isPlan(data) && isSketch(block)) {
        sketches++;
        // A sketch's text is never checked; only the place it goes.
        const where = `${stop.id} ${block.file} (sketch)`;
        attempt(where, () => {
          const text = read(data, block, readFile, bases);
          if (block.new_file === true) {
            if (text != null) failures.push({ where, why: 'the file already exists; set new_file to false' });
            return;
          }
          const base = baseOf(block);
          if (text == null) { failures.push({ where, why: `the file is not ${base ? `at ${base.ref}` : 'on disk'}; set new_file to true` }); return; }
          const { after } = block;
          const n = splitLines(text).length;
          if (typeof after === 'number' && after > n) failures.push({ where, why: `after line ${after}, but the file has ${n} lines` });
          if (typeof after === 'string' && !text.includes(after)) failures.push({ where, why: `after "${after}", but the file does not contain it` });
        });
        return;
      }
      blocks++;
      const named = typeof block.file === 'string' && Array.isArray(block.lines) ? `${stop.id} ${block.file}:${range(block.lines)}` : `${stop.id} code block ${i + 1}`;
      const bad = fieldProblem(block, true);
      if (bad) { failures.push({ where: named, why: `the block ${bad}` }); return; }
      attempt(named, () => {
        const where = named;
        if (gitNamesOtherwise(where, block)) return;
        const [a, b] = block.lines;
        const base = baseOf(block);
        const text = read(data, block, readFile, bases);
        if (text == null && base) { failures.push({ where, why: `the file is not at ${base.ref}` }); return; }
        const exp = expectedText(text, block.lines, block.left_out);
        if (exp.error) { failures.push({ where, why: exp.error }); return; }
        const outside = [];
        for (const k of block.key_lines || []) if (k < a || k > b) outside.push(`line ${k} is outside ${a}-${b}`);
        for (const r of block.left_out || []) if (r[0] < a || r[1] > b || r[0] > r[1]) outside.push(`left-out lines ${range(r)} are outside ${a}-${b}`);
        if (outside.length) { failures.push({ where, why: outside.join('; ') }); return; }
        const got = block.text.replace(/\r\n|\r/g, '\n');
        if (got !== exp.text) failures.push({ where, why: `the text differs from ${base ? `${base.ref} (commit ${base.short})` : 'the file'}, first at line ${firstDiff(exp.text, got)} of the shown text` });
      });
    });
  }
  (data.extend || []).forEach((e, i) => {
    const where = `extend ${i + 1}`;
    const bad = fieldProblem(e, false);
    if (bad) { failures.push({ where, why: `the extend point ${bad}` }); return; }
    attempt(where, () => {
      if (gitNamesOtherwise(where, e)) return;
      const exp = expectedText(read(data, e, readFile, bases), e.lines);
      if (exp.error) failures.push({ where, why: exp.error });
    });
  });
  return { blocks, sketches, failures };
}
