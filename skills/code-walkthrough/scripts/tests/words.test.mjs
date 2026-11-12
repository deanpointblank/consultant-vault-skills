import test from 'node:test';
import assert from 'node:assert/strict';
import { reasonCounts, builtLine, checksShort, reasonsLine, replyLines, stopBadge, outlineTail, whyLabel, chipLabel, chipDetail } from '../lib/words.mjs';

const mk = (over = {}) => ({
  built: '2026-11-11',
  repos: [{ name: 'booking-mini', commit: 'abc1234', uncommitted: [] }],
  stops: [],
  sources: [],
  checks: { code: { blocks: 31 }, quotes: { quotes: 22, saved: 0, savedOf: [] }, map: { built: true, arrows: 15, traced: 12, guesses: 3, broken: 0, layoutChecked: true } },
  ...over,
});
const withReasons = (n, gaps) => ({ reasons: Array.from({ length: n }, (_, i) => ({ text: 'x', source: { kind: i < gaps ? 'not-recorded' : 'commit', ref: { hash: 'abcdef123' } } })) });
const quotes = (q) => mk({ checks: { ...mk().checks, quotes: { quotes: 22, ...q } } });

test('built line', () => {
  assert.equal(builtLine(mk()), 'Built from `booking-mini` at commit `abc1234` on 2026-11-11');
  const dirty = n => mk({ repos: [{ name: 'booking-mini', commit: 'abc1234', uncommitted: Array.from({ length: n }, (_, i) => `f${i}`) }] });
  assert.equal(builtLine(dirty(1)), 'Built from `booking-mini` at commit `abc1234` plus uncommitted changes in 1 file on 2026-11-11');
  assert.equal(builtLine(dirty(3)), 'Built from `booking-mini` at commit `abc1234` plus uncommitted changes in 3 files on 2026-11-11');
  assert.equal(builtLine(mk({ repos: [{ name: 'a', commit: '1111111', uncommitted: ['x'] }, { name: 'b', commit: '2222222', uncommitted: [] }] })),
    'Built from `a` at commit `1111111` and `b` at commit `2222222` plus uncommitted changes in 1 file on 2026-11-11');
});

test('reply lines', () => {
  const d = mk({ repos: [{ name: 'r', commit: '3f2a9c1', uncommitted: ['x'] }] });
  const l = replyLines({ ...d, checks: { ...d.checks, quotes: { quotes: 22, saved: 2, savedOf: ['PFD-1', 'PFD-1'] } } });
  assert.deepEqual(l, [
    'Code: all 31 blocks match the files as built (commit `3f2a9c1` plus uncommitted changes in 1 file).',
    'Reasons: all 22 quotes were found word for word in their sources (2 in saved copies of a ticket).',
    'Map: 12 of 15 arrows are traced to a line of code. 3 are marked as guesses. None are broken.',
  ]);
  const reasons = q => replyLines(quotes(q))[1];
  assert.equal(reasons({ saved: 3, savedOf: ['A-1', 'B-2', 'A-1'] }), 'Reasons: all 22 quotes were found word for word in their sources (3 in saved copies of 2 tickets).');
  assert.equal(reasons({ saved: 1, savedOf: ['#412'] }), 'Reasons: all 22 quotes were found word for word in their sources (1 in a saved copy of a pull request).');
  assert.equal(reasons({ saved: 2, savedOf: ['A-1', 'r#4'] }), 'Reasons: all 22 quotes were found word for word in their sources (2 in saved copies of tickets and pull requests).');
  assert.equal(reasons({ saved: 0, savedOf: [] }), 'Reasons: all 22 quotes were found word for word in their sources.');
  const map = m => replyLines(mk({ checks: { ...mk().checks, map: { built: true, arrows: 15, traced: 12, guesses: 3, broken: 0, layoutChecked: true, ...m } } }))[2];
  assert.equal(map({ guesses: 1 }), 'Map: 12 of 15 arrows are traced to a line of code. 1 is marked as a guess. None are broken.');
  assert.equal(map({ guesses: 0 }), 'Map: 12 of 15 arrows are traced to a line of code. None are marked as guesses. None are broken.');
});

test('map not built and not checked by eye', () => {
  const nb = replyLines(mk({ checks: { ...mk().checks, map: { built: false } } }));
  assert.equal(nb.length, 3);
  assert.equal(nb[2], 'Map: not built, because chalk-talk is not installed. Get it from github.com/oztrkemree/chalk-talk and put it in ~/.claude/skills/chalk-talk.');
  const un = replyLines(mk({ checks: { ...mk().checks, map: { ...mk().checks.map, layoutChecked: false } } }));
  assert.equal(un.length, 4);
  assert.equal(un[3], 'Map: not checked by eye, because Chrome was not found.');
});

test('header line', () => {
  assert.equal(checksShort(quotes({ saved: 2, savedOf: ['A-1'] })), 'Code matches the files · 22 quotes found (2 in saved copies) · 12 of 15 map arrows traced, 3 guesses');
  assert.equal(checksShort(mk({ checks: { ...mk().checks, map: { built: false } } })), 'Code matches the files · 22 quotes found · Map not built, because chalk-talk is not installed');
});

test('reasons line', () => {
  const d = mk({ stops: [withReasons(3, 1), withReasons(2, 0)] });
  assert.deepEqual(reasonCounts(d), { recorded: 4, notRecorded: 1 });
  assert.equal(reasonsLine(mk({ stops: Array.from({ length: 11 }, () => withReasons(3, 1)) })), '22 recorded, 11 not recorded');
});

test('stop badge and outline tail', () => {
  assert.deepEqual([stopBadge(withReasons(3, 0)), outlineTail(withReasons(3, 0))], ['', 'Reasons recorded.']);
  assert.deepEqual([stopBadge(withReasons(3, 1)), outlineTail(withReasons(3, 1))], ['1 not recorded', '1 reason not recorded.']);
  assert.equal(outlineTail(withReasons(3, 2)), '2 reasons not recorded.');
  assert.deepEqual([stopBadge(withReasons(3, 3)), outlineTail(withReasons(3, 3))], ['nothing recorded', 'Nothing recorded.']);
});

test('why label', () => {
  assert.equal(whyLabel(withReasons(3, 1)), 'Why 3 · 1 not recorded');
  assert.equal(whyLabel(withReasons(3, 0)), 'Why 3');
});

test('chip labels', () => {
  const l = (kind, ref) => chipLabel({ kind, ref });
  assert.equal(l('vault-note', 'Notes/a.md'), 'vault note');
  assert.equal(l('design-doc', { path: 'x' }), 'design doc');
  assert.equal(l('commit', { hash: '545220f9abc' }), 'commit 545220f');
  assert.equal(l('pull-request', { number: 412 }), 'pull request #412');
  assert.equal(l('ticket', 'PFD-1'), 'ticket PFD-1');
  assert.equal(l('code-comment', { file: 'a', line: 1 }), 'code comment');
  assert.equal(l('build-note'), 'build note');
  assert.equal(l('not-recorded'), 'not recorded');
});

test('chip detail is the exact quote and where it comes from', () => {
  const q = 'every booking must reach the yard service';
  const d = mk({ sources: [{ kind: 'ticket', ref: 'PFD-1', fetched: '2026-11-11', text: q }] });
  assert.equal(chipDetail({ quote: q, source: { kind: 'commit', ref: { hash: '545220f1' } } }, d), `“${q}” — commit 545220f`);
  assert.equal(chipDetail({ quote: q, source: { kind: 'ticket', ref: 'PFD-1' } }, d), `“${q}” — ticket PFD-1, saved copy fetched 2026-11-11`);
  assert.equal(chipDetail({ quote: q, source: { kind: 'ticket', ref: 'PFD-2' } }, d), `“${q}” — ticket PFD-2`);
  assert.equal(chipDetail({ quote: q, source: { kind: 'code-comment', ref: { file: 'api/Dock.java', line: 5 } } }, d), `“${q}” — code comment, api/Dock.java:5`);
});
