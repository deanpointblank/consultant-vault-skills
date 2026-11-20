import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { repoByName } from './data.mjs';
import { gitRead, gitEnv, isCommitHash, fileAt } from './git.mjs';
import { splitLines } from './code.mjs';
import { isPlan, fromItems } from './plan.mjs';

export const normalizeForQuote = s => s.normalize('NFC')
  .replace(/[‘’‚‛′]/g, "'").replace(/[“”„‟″]/g, '"')
  .replace(/`/g, '').replace(/\s+/g, ' ').trim();

const isWordChar = ch => ch !== undefined && /[\p{L}\p{N}_]/u.test(ch);

export function quoteFound(quote, source) {
  const pieces = String(quote).split('…').map(normalizeForQuote).filter(Boolean);
  if (!pieces.length) return false;
  const hay = normalizeForQuote(String(source));
  let from = 0;
  for (const piece of pieces) {
    const first = piece[0], last = piece.at(-1);
    let i = hay.indexOf(piece, from);
    while (i >= 0) {
      const before = hay[i - 1], after = hay[i + piece.length];
      const startOk = !(isWordChar(first) && isWordChar(before));
      const endOk = !(isWordChar(last) && isWordChar(after));
      if (startOk && endOk) break;
      i = hay.indexOf(piece, i + 1);
    }
    if (i < 0) return false;
    from = i + piece.length;
  }
  return true;
}

const KIND_WORDS = {
  'vault-note': 'vault note', 'design-doc': 'design doc', commit: 'commit', 'pull-request': 'pull request',
  ticket: 'ticket', 'code-comment': 'code comment', 'build-note': 'build note',
};

const prKey = ref => `${ref.repo ? ref.repo : ''}#${ref.number}`;

const refLabel = (kind, ref) => {
  if (ref === undefined || ref === null) return '';
  if (typeof ref === 'string') return ref;
  if (kind === 'design-doc') return ref.path;
  if (kind === 'commit') return ref.hash;
  if (kind === 'pull-request') return prKey(ref);
  if (kind === 'code-comment') return `${ref.file} line ${ref.line}`;
  return '';
};

const isPrivate = text => {
  const m = text.replace(/^\uFEFF/, '').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return false;
  const v = m[1].match(/^visibility\s*:\s*(.*)$/mi);
  return !!v && v[1].replace(/\s+#.*$/, '').replace(/["'\s]/g, '').toLowerCase() === 'private';
};

const readText = file => {
  try { return fs.readFileSync(file, 'utf8'); }
  catch (e) { throw new Error(`cannot read ${file}: ${e.code === 'ENOENT' ? 'no such file' : e.message}`); }
};

const needString = (v, what) => { if (typeof v !== 'string' || !v) throw new Error(`the source has no ${what}`); return v; };

// A repo file: at the repo's base when a plan gives it one, otherwise on disk.
function repoText(repo, file, bases) {
  const base = bases[repo.name];
  if (!base) return readText(path.join(repo.path, file));
  const text = fileAt(repo.path, base.hash, file);
  if (text == null) throw new Error(`cannot read ${file} at ${base.ref}`);
  return text;
}

function vaultNoteText(vault, rel, named) {
  needString(rel, 'note path');
  const root = path.resolve(vault);
  const file = path.resolve(root, rel);
  if (file !== root && !file.startsWith(root + path.sep)) throw new Error(`${rel} is outside the vault`);
  const text = readText(file);
  if (isPrivate(text) && !named) throw new Error(`${rel} is a private note and the user did not name it`);
  return text;
}

export function findSavedCopy(data, kind, ref) {
  const single = (data.repos || []).length === 1;
  return (data.sources || []).find(s => {
    if (s.kind !== kind) return false;
    if (kind === 'ticket') return String(s.ref) === String(ref);
    const sr = typeof s.ref === 'object' && s.ref ? s.ref : { number: s.ref };
    return String(sr.number) === String(ref.number) && (ref.repo === undefined ? sr.repo === undefined || single : sr.repo === ref.repo || (sr.repo === undefined && single));
  });
}

function savedCopy(data, kind, ref) {
  const hit = findSavedCopy(data, kind, ref);
  if (!hit || typeof hit.text !== 'string') throw new Error(`no saved copy of ${kind === 'ticket' ? 'ticket ' + ref : 'pull request ' + prKey(ref)}`);
  return hit.text;
}

// Returns { text, saved? } for one reason's source, or throws a plain Error.
function sourceText(data, source, { vault, gh, bases = {} }) {
  const { kind, ref } = source;
  const repoOf = () => repoByName(data, ref?.repo);
  switch (kind) {
    case 'vault-note': return { text: vaultNoteText(vault, ref, source.named_by_user === true) };
    case 'design-doc': {
      const repo = repoOf();
      return { text: repoText(repo, needString(ref?.path, 'file path'), bases) };
    }
    case 'commit': {
      const repo = repoOf();
      if (!isCommitHash(ref?.hash)) throw new Error('bad commit hash: it must be 4 to 40 hex characters');
      try { return { text: gitRead(repo.path, ['log', '-1', '--format=%B', '--end-of-options', ref.hash]) }; }
      catch { throw new Error(`git cannot read commit ${ref.hash} in ${repo.name}`); }
    }
    case 'code-comment': {
      const repo = repoOf();
      const lines = splitLines(repoText(repo, needString(ref?.file, 'file name'), bases));
      if (!Number.isInteger(ref.line) || ref.line < 1 || ref.line > lines.length) throw new Error(`line ${ref.line} is not in ${ref.file}: the file has ${lines.length} lines`);
      return { text: lines[ref.line - 1] };
    }
    case 'build-note': {
      needString(ref, 'file path');
      if (!path.isAbsolute(ref)) throw new Error(`${ref} must be an absolute path`);
      return { text: readText(ref) };
    }
    case 'ticket': {
      needString(ref, 'ticket key');
      if (typeof source.note === 'string' && source.note) {
        try { return { text: vaultNoteText(vault, source.note, source.named_by_user === true) }; }
        catch (e) { if (/private note/.test(e.message)) throw e; }
      }
      return { text: savedCopy(data, 'ticket', ref), saved: true };
    }
    case 'pull-request': {
      const repo = repoOf();
      if (!Number.isInteger(ref?.number)) throw new Error('the source has no pull request number');
      if (gh) {
        try {
          const out = execFileSync('gh', ['pr', 'view', String(ref.number), '--json', 'title,body,comments'], {
            cwd: repo.path, encoding: 'utf8', timeout: 15000, env: gitEnv(), stdio: ['ignore', 'pipe', 'pipe'],
          });
          const j = JSON.parse(out);
          return { text: [j.title, j.body, ...(j.comments || []).map(c => c.body)].filter(Boolean).join('\n\n') };
        } catch { /* fall back to the saved copy */ }
      }
      return { text: savedCopy(data, 'pull-request', ref), saved: true };
    }
    default: throw new Error(`unknown source kind ${kind}`);
  }
}

const labelOf = source => {
  if (source.kind === 'plan-file') return 'plan-file';
  const ref = refLabel(source.kind, source.ref);
  return `${KIND_WORDS[source.kind] || source.kind}${ref ? ' ' + ref : ''}`;
};

const savedText = (data, kind, ref) => {
  const hit = (data.sources || []).find(s => s.kind === kind && s.ref === ref);
  return typeof hit?.text === 'string' ? hit.text : undefined;
};

// A plan entry's source: chat and plan-file here, today's kinds as reasons read them.
// A plan file that exists is read once per build into `live`; `copy` is its saved copy from an earlier build.
function fromText(data, source, live, opts) {
  const { kind, ref } = source;
  if (kind === 'chat') {
    const text = savedText(data, 'chat', ref);
    if (text === undefined) throw new Error(`no saved copy of chat ${ref}`);
    return { text, saved: true };
  }
  if (kind !== 'plan-file') return sourceText(data, source, opts);
  needString(ref, 'file path');
  if (!path.isAbsolute(ref)) throw new Error(`${ref} must be an absolute path`);
  const copy = savedText(data, 'plan-file', ref);
  if (!fs.existsSync(ref)) {
    if (copy === undefined) throw new Error(`cannot read ${ref}: no such file, and there is no saved copy`);
    return { text: copy, saved: true };
  }
  if (!live.has(ref)) live.set(ref, { text: readText(ref), allFound: true });
  return { text: live.get(ref).text, live: live.get(ref), copy };
}

export function checkQuotes(data, { vault, gh = false, date, bases = {} } = {}) {
  const plan = isPlan(data);
  const out = { quotes: 0, saved: 0, savedOf: { ticket: [], 'pull-request': [], ...(plan ? { chat: [], 'plan-file': [] } : {}) }, failures: [] };
  const check = (where, source, quote, read) => {
    out.quotes++;
    let got;
    try { got = read(); }
    catch (e) { out.failures.push({ where, why: e.message }); return; }
    if (got.saved) {
      out.saved++;
      const key = source.kind === 'pull-request' ? prKey(source.ref) : String(source.ref);
      const list = out.savedOf[source.kind];
      if (!list.includes(key)) list.push(key);
    }
    if (quoteFound(quote ?? '', got.text)) return;
    if (got.live) got.live.allFound = false;
    const changed = got.live && got.copy !== undefined && quoteFound(quote ?? '', got.copy);
    out.failures.push({ where, why: changed ? 'the plan file no longer says this; re-quote it or make this a proposal' : 'the quote is not found word for word in the source' });
  };
  for (const stop of data.stops || []) {
    (stop.reasons || []).forEach((r, i) => {
      const source = r.source || {};
      if (!source.kind || source.kind === 'not-recorded') return;
      check(`${stop.id} reason ${i + 1} (${labelOf(source)})`, source, r.quote, () => sourceText(data, source, { vault, gh, bases }));
    });
  }
  if (!plan) return out;
  const live = new Map();
  for (const { at, from } of fromItems(data)) {
    if (from?.kind !== 'plan' && from?.kind !== 'review') continue;
    const source = from.source || {};
    check(`${at.replace(/^stop /, '')} from (${labelOf(source)})`, source, from.quote, () => fromText(data, source, live, { vault, gh, bases }));
  }
  // A plan file's copy is saved only when every quote from it is found, so a changed file keeps the last good copy.
  for (const [ref, f] of live) {
    if (!f.allFound) continue;
    const copy = { kind: 'plan-file', ref, fetched: date, text: f.text };
    data.sources ??= [];
    const i = data.sources.findIndex(s => s.kind === 'plan-file' && s.ref === ref);
    if (i < 0) data.sources.push(copy); else data.sources[i] = copy;
  }
  return out;
}
