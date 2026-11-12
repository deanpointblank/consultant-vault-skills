import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gitRead, isCommitHash } from './git.mjs';

// Our own copy of the build command's `home`: that file runs its main when imported.
export const home = p => p.replace(/^~(?=\/|$)/, os.homedir());

const unquote = s => {
  const v = s.trim();
  return v.length >= 2 && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'")) ? v.slice(1, -1) : v;
};

// The frontmatter block as { key: string | string[] }; reads block and inline lists. Null when there is none.
export function frontmatter(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  if (lines[0].trim() !== '---') return null;
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  if (end < 0) return null;
  const out = {};
  let key = null;
  for (const line of lines.slice(1, end)) {
    const item = /^\s+-\s*(.*)$/.exec(line);
    if (item && key && Array.isArray(out[key])) { out[key].push(unquote(item[1])); continue; }
    const kv = /^([A-Za-z0-9_.-]+):\s*(.*)$/.exec(line);
    if (!kv) { key = null; continue; }
    key = kv[1];
    const v = kv[2].trim();
    if (v === '') out[key] = [];
    else if (v.startsWith('[') && v.endsWith(']')) {
      const inner = v.slice(1, -1).trim();
      // split on commas outside quotes
      const parts = inner.match(/"[^"]*"|'[^']*'|[^,]+/g) || [];
      out[key] = parts.map(unquote).filter(s => s !== '');
    } else out[key] = unquote(v);
  }
  return out;
}

const bodyOf = text => {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const end = lines.findIndex((l, i) => i > 0 && l.trim() === '---');
  return (end < 0 ? lines : lines.slice(end + 1)).join('\n');
};

const asList = v => (Array.isArray(v) ? v : v ? [v] : []);
const cleanPath = f => f.replace(/\\/g, '/').replace(/^(\.\/)+/, '');

function citedFilesOf(notePath, noteText, repo) {
  const link = /\[\[([^\]|#]+?\.html)(?:[|#][^\]]*)?\]\]/i.exec(bodyOf(noteText));
  if (!link) return null;
  const dataPath = path.join(path.dirname(notePath), path.basename(link[1]).replace(/\.html$/i, '.walkthrough.json'));
  try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const files = data && data.cited_files && data.cited_files[repo];
    if (!Array.isArray(files)) return null;
    return [...new Set(files.filter(f => typeof f === 'string' && f !== '').map(cleanPath))];
  } catch { return null; }
}

const commitIsHere = (repoPath, hash) => {
  if (!isCommitHash(hash)) return false;
  try { gitRead(repoPath, ['cat-file', '-e', '--end-of-options', `${hash}^{commit}`]); return true; } catch { return false; }
};

function changedFiles(repoPath, hash, cited) {
  if (!cited.length) return 0;
  const set = new Set(cited);
  const hit = new Set();
  const diff = gitRead(repoPath, ['diff', '--name-only', '-z', '--end-of-options', hash, 'HEAD', '--', ...cited]).split('\0');
  for (const f of diff) if (set.has(f)) hit.add(f);
  const status = gitRead(repoPath, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', ...cited]).split('\0');
  for (let i = 0; i < status.length; i++) {
    const entry = status[i];
    if (entry.length < 4) continue;
    if (set.has(entry.slice(3))) hit.add(entry.slice(3));
    if (/[RC]/.test(entry.slice(0, 2))) { i++; if (set.has(status[i])) hit.add(status[i]); }
  }
  return hit.size;
}

// Throws a plain Error only when repoPath is not a git repo; every other problem skips that note.
export function lookUp({ vault, folder, repo, repoPath, files = [] }) {
  try { gitRead(repoPath, ['rev-parse', '--git-dir']); }
  catch { throw new Error(`${repoPath} is not a git repo`); }
  const dir = path.join(vault, folder);
  let names;
  try { names = fs.readdirSync(dir).filter(n => n.toLowerCase().endsWith('.md')); } catch { return []; }
  const wanted = files.map(cleanPath);
  const rows = [];
  for (const name of names) {
    const notePath = path.join(dir, name);
    let text, front;
    try { text = fs.readFileSync(notePath, 'utf8'); front = frontmatter(text); } catch { continue; }
    if (!front || front.type !== 'code-walkthrough' || !asList(front.repos).includes(`[[${repo}]]`)) continue;
    const cited = citedFilesOf(notePath, text, repo);
    if (!cited) continue;
    if (wanted.length && !wanted.some(f => cited.includes(f))) continue;
    const entry = asList(front.commits).find(c => c.startsWith(`${repo}@`));
    const commit = entry ? entry.slice(repo.length + 1) : '';
    const here = commitIsHere(repoPath, commit);
    let changed = 0;
    try { changed = here ? changedFiles(repoPath, commit, cited) : 0; } catch { changed = 0; }
    rows.push({ note: name.replace(/\.md$/i, ''), commit, date: typeof front.created === 'string' ? front.created : '', cited: cited.length, changed, missingCommit: !here });
  }
  return rows.sort((a, b) => (a.date === b.date ? (a.note < b.note ? 1 : -1) : a.date < b.date ? 1 : -1));
}

export function lookLine(r) {
  const tail = r.missingCommit ? 'its commit is no longer in the repo'
    : r.changed === 0 ? 'its cited files have not changed since'
    : `${r.changed} of ${r.cited} cited files changed since`;
  return `[[${r.note}]] · commit ${r.commit || 'not recorded'} · built ${r.date || 'date not recorded'} · ${tail}`;
}
