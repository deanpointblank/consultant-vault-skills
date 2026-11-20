import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { resolveBase, fileAt, existsAt } from '../lib/git.mjs';
import { checkCode } from '../lib/code.mjs';
import { checkQuotes } from '../lib/quotes.mjs';
import { tempRoot, ledgerRepo, samplePlan, makeVault } from './helpers.mjs';

const ahead = t => ledgerRepo(tempRoot(t), { ahead: true });

test('a base resolves to its commit', t => {
  const repo = ahead(t);
  const b = resolveBase(repo.path, 'origin/main');
  assert.equal(b.short, repo.base);
  assert.equal(b.ref, 'origin/main');
  assert.match(b.hash, /^[0-9a-f]{40}$/);
});

test('a base the repo does not know', t => {
  const repo = ahead(t);
  assert.throws(() => resolveBase(repo.path, 'origin/nope'), { message: 'git cannot find origin/nope here; the build never fetches, so fetch it yourself or change base' });
  assert.throws(() => resolveBase(repo.path, '--all'));
});

test('a file is read at the base, not the disk', t => {
  const repo = ahead(t);
  const { hash } = resolveBase(repo.path, 'origin/main');
  assert.equal(fileAt(repo.path, hash, 'src/store.js').split('\n')[15], 'export async function saveInvoice(invoice) {');
  assert.equal(fs.readFileSync(path.join(repo.path, 'src/store.js'), 'utf8').split('\n')[16], 'export async function saveInvoice(invoice) {');
  assert.equal(fileAt(repo.path, hash, 'src/none.js'), null);
  assert.equal(fileAt(repo.path, hash, 'SRC/store.js'), null);
  assert.equal(fileAt(repo.path, hash, './src/store.js'), null);
  assert.equal(existsAt(repo.path, hash, 'src/store.js'), true);
  assert.equal(existsAt(repo.path, hash, 'src/none.js'), false);
});

test('a sketch place is judged at the base', t => {
  const repo = ledgerRepo(tempRoot(t));
  fs.writeFileSync(path.join(repo.path, 'src/attach.js'), 'only on disk\n');
  const d = samplePlan(repo);
  Object.assign(d.stops[2].code[0], { file: 'src/attach.js' });
  delete d.stops[2].code[0].after;
  const bases = { 'ledger-api': resolveBase(repo.path, 'origin/main') };
  assert.deepEqual(checkCode(d, { bases }).failures, [{ where: 's3 src/attach.js (sketch)', why: 'the file is not at origin/main; set new_file to true' }]);
});

test('a code-comment quote is read at the base', t => {
  const root = tempRoot(t);
  const repo = ledgerRepo(root, { ahead: true });
  const d = samplePlan(repo);
  d.stops[1].reasons.push({ text: 'The store.', quote: 'the invoice store', source: { kind: 'code-comment', ref: { file: 'src/store.js', line: 1 } } });
  d.stops[1].reasons.push({ text: 'Gone.', quote: 'x', source: { kind: 'code-comment', ref: { file: 'src/none.js', line: 1 } } });
  const bases = { 'ledger-api': resolveBase(repo.path, 'origin/main') };
  const r = checkQuotes(d, { vault: makeVault(root, {}), gh: false, date: '2026-11-20', bases });
  const n = d.stops[1].reasons.length;
  assert.deepEqual(r.failures, [{ where: `s2 reason ${n} (code comment src/none.js line 1)`, why: 'cannot read src/none.js at origin/main' }]);
});
