import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { quoteFound, checkQuotes } from '../lib/quotes.mjs';
import { tempRoot, makeVault, bookingRepo, sampleData } from './helpers.mjs';

test('exact quote is found', () => assert.equal(quoteFound('reach the yard service', 'Every booking must reach the yard service, so'), true));
test('spaces and line breaks count as one space', () => assert.equal(quoteFound('must  reach\nthe', 'must reach the'), true));
test('curly and straight quote marks are the same', () => {
  assert.equal(quoteFound('the “yard” isn’t', 'the "yard" isn\'t'), true);
  assert.equal(quoteFound('the "yard" isn\'t', 'the “yard” isn’t'), true);
});
test('backticks are ignored on both sides', () => {
  assert.equal(quoteFound('calls `wc_kind` first', 'calls wc_kind first'), true);
  assert.equal(quoteFound('calls wc_kind first', 'calls `wc_kind` first'), true);
});
test('an ellipsis splits a quote into pieces in order', () => {
  const src = 'Every booking must reach the yard service, so the API sends each one on.';
  assert.equal(quoteFound('Every booking … each one on', src), true);
  assert.equal(quoteFound('each one on … Every booking', src), false);
});
test('three dots do not split', () => assert.equal(quoteFound('f(...args)', 'f(a, ...args)'), false));
test('case and words still count', () => {
  assert.equal(quoteFound('every booking must reach', 'Every booking must reach'), false);
  assert.equal(quoteFound('Every booking has to reach', 'Every booking must reach'), false);
});
test('regex characters are plain text', () => {
  assert.equal(quoteFound('a.b(*)+$', 'xa.b(*)+$y'), true);
  assert.equal(quoteFound('a.b', 'axb'), false);
});
test('empty quote fails', () => assert.equal(quoteFound('', 'anything'), false));

function setup(t, notes = {}) {
  const root = tempRoot(t);
  const repo = bookingRepo(root);
  const vault = makeVault(root, notes);
  const data = sampleData(repo);
  return { root, repo, vault, data };
}
const withReason = (data, source, quote) => { data.stops = [{ id: 's9', reasons: [{ text: 'x', quote, source }] }]; return data; };
const run = (data, vault) => checkQuotes(data, { vault, gh: false });

test('sample quotes are all found', t => {
  const { data, vault } = setup(t);
  const r = run(data, vault);
  assert.equal(r.quotes, 3); assert.equal(r.saved, 0); assert.deepEqual(r.failures, []);
});

test('vault-note kind', t => {
  const { data, vault } = setup(t, { 'Notes/a.md': '---\ntype: note\n---\nWe chose the queue for retries.\n' });
  const src = { kind: 'vault-note', ref: 'Notes/a.md' };
  assert.deepEqual(run(withReason(data, src, 'chose the queue'), vault).failures, []);
  const f = run(withReason(data, src, 'chose the topic'), vault).failures;
  assert.equal(f.length, 1); assert.match(f[0].where, /s9 reason 1/); assert.match(f[0].where, /vault note Notes\/a\.md/);
});

test('design-doc kind', t => {
  const { data, vault } = setup(t);
  const src = { kind: 'design-doc', ref: { path: 'docs/adr.md' } };
  assert.deepEqual(run(withReason(data, src, 'reach the yard service'), vault).failures, []);
  assert.equal(run(withReason(data, src, 'reach the dock service'), vault).failures.length, 1);
});

test('commit kind, and a bad hash is a failure', t => {
  const { data, vault, repo } = setup(t);
  const src = { kind: 'commit', ref: { hash: repo.head } };
  assert.deepEqual(run(withReason(data, src, 'so the yard service hears about it'), vault).failures, []);
  assert.equal(run(withReason(data, src, 'nothing like this'), vault).failures.length, 1);
  const bad = run(withReason(data, { kind: 'commit', ref: { hash: 'deadbee' } }, 'x'), vault).failures;
  assert.equal(bad.length, 1); assert.match(bad[0].why, /git cannot read commit/);
});

test('code-comment kind and a line past the end', t => {
  const { data, vault } = setup(t);
  const ok = { kind: 'code-comment', ref: { file: 'api/Dock.java', line: 5 } };
  assert.deepEqual(run(withReason(data, ok, 'Docks close on Sundays'), vault).failures, []);
  assert.equal(run(withReason(data, ok, 'Docks close on Mondays'), vault).failures.length, 1);
  const past = run(withReason(data, { kind: 'code-comment', ref: { file: 'api/Dock.java', line: 99 } }, 'x'), vault).failures;
  assert.match(past[0].why, /the file has 30 lines/);
});

test('build-note kind', t => {
  const { data, vault, root } = setup(t);
  const f = path.join(root, 'task-1-report.md'); fs.writeFileSync(f, 'Tests pass: 12 of 12.\n');
  const src = { kind: 'build-note', ref: f };
  assert.deepEqual(run(withReason(data, src, 'Tests pass: 12 of 12'), vault).failures, []);
  assert.equal(run(withReason(data, src, 'Tests pass: 11 of 12'), vault).failures.length, 1);
  assert.equal(run(withReason(data, { kind: 'build-note', ref: path.join(root, 'none.md') }, 'x'), vault).failures.length, 1);
});

test('ticket from its vault note is not a saved copy', t => {
  const { data, vault } = setup(t, { 'Tickets/PFD-1.md': '---\ntype: ticket\n---\nThe dock check must skip Sundays.\n' });
  const src = { kind: 'ticket', ref: 'PFD-1', note: 'Tickets/PFD-1.md' };
  const r = run(withReason(data, src, 'must skip Sundays'), vault);
  assert.deepEqual(r.failures, []); assert.equal(r.saved, 0);
  assert.equal(run(withReason(data, src, 'must skip Mondays'), vault).failures.length, 1);
});

test('ticket from a saved copy', t => {
  const { data, vault } = setup(t);
  data.sources = [{ kind: 'ticket', ref: 'PFD-1', fetched: '2026-11-12', text: 'Docks are closed on Sundays.' }];
  const r = run(withReason(data, { kind: 'ticket', ref: 'PFD-1' }, 'closed on Sundays'), vault);
  assert.deepEqual(r.failures, []); assert.equal(r.saved, 1); assert.deepEqual(r.savedOf.ticket, ['PFD-1']);
});

test('pull-request with gh off reads the saved copy', t => {
  const { data, vault } = setup(t);
  data.sources = [{ kind: 'pull-request', ref: 7, fetched: '2026-11-12', text: 'Adds the dock check for Sundays.' }];
  const src = { kind: 'pull-request', ref: { number: 7 } };
  const r = run(withReason(data, src, 'dock check for Sundays'), vault);
  assert.deepEqual(r.failures, []); assert.equal(r.saved, 1); assert.deepEqual(r.savedOf['pull-request'], ['7']);
  assert.equal(run(withReason(data, src, 'dock check for Mondays'), vault).failures.length, 1);
});

test('a private vault note is refused unless the user named it', t => {
  const { data, vault } = setup(t, { 'p.md': '---\nvisibility: private\n---\nThe secret reason.\n' });
  const f = run(withReason(data, { kind: 'vault-note', ref: 'p.md' }, 'secret reason'), vault).failures;
  assert.equal(f.length, 1); assert.match(f[0].why, /private note/);
  assert.deepEqual(run(withReason(data, { kind: 'vault-note', ref: 'p.md', named_by_user: true }, 'secret reason'), vault).failures, []);
});

test('a missing saved copy fails', t => {
  const { data, vault } = setup(t);
  const f = run(withReason(data, { kind: 'ticket', ref: 'PFD-9', note: 'none.md' }, 'x'), vault).failures;
  assert.equal(f.length, 1); assert.match(f[0].why, /no saved copy/);
});

test('bad sources fail plainly and the check carries on', t => {
  const { data, vault } = setup(t);
  data.stops = [{ id: 's1', reasons: [
    { text: 'a', quote: 'x', source: { kind: 'vault-note', ref: 'missing.md' } },
    { text: 'b', quote: 'x', source: { kind: 'vault-note', ref: '../../etc/passwd' } },
    { text: 'c', quote: 'x', source: { kind: 'design-doc', ref: { repo: 'nope', path: 'a' } } },
    { text: 'd', quote: 'x', source: { kind: 'commit', ref: {} } },
    { text: 'e', quote: 'Every booking', source: { kind: 'design-doc', ref: { path: 'docs/adr.md' } } },
  ] }];
  const r = run(data, vault);
  assert.equal(r.quotes, 5); assert.equal(r.failures.length, 4);
});
