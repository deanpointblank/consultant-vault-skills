import test from 'node:test';
import assert from 'node:assert/strict';
import { pageModel, foldRows } from '../lib/page.mjs';
import { tempRoot, bookingRepo, sampleData } from './helpers.mjs';

const model = t => {
  const repo = bookingRepo(tempRoot(t));
  const data = sampleData(repo);
  data.built = '2026-11-11';
  data.repos[0].commit = repo.head;
  data.repos[0].uncommitted = [];
  data.checks = { code: { blocks: 4 }, quotes: { quotes: 3, saved: 0, savedOf: [] }, map: { built: true, arrows: 2, traced: 1, guesses: 1, broken: 0, layoutChecked: true } };
  return pageModel(data);
};

test('model mirrors the sample', t => {
  const m = model(t);
  assert.equal(m.stops.length, 3);
  assert.equal(m.stops[1].firstFile, 'api/Dock.java:1-30');
  assert.equal(m.stops[1].more, 0);
  assert.equal(m.stops[2].more, 1);
  assert.equal(m.extend[0].where, 'api/Dock.java:5-6');
  assert.equal(m.extend[0].stopN, 2);
  assert.equal(m.mapMissing, false);
});

test('left-out row reads plainly', t => {
  const rows = model(t).stops[1].blocks[0].rows;
  const gap = rows.find(r => r.gap);
  assert.deepEqual(gap.gap, [12, 20]);
  assert.equal(gap.label, 'lines 12–20 left out');
});

test('short blocks are not folded', t => {
  const b = model(t).stops[0].blocks[0];
  assert.equal(b.folded, false);
  assert.equal(b.rows.some(r => r.fold || r.hidden), false);
});

test('long blocks fold like the mockup', t => {
  const b = model(t).stops[1].blocks[0];
  assert.equal(b.folded, true);
  assert.equal(b.total, 21);
  assert.equal(b.showAll, 'Show all 21 lines');
  const shown = b.rows.filter(r => !r.hidden && r.n).map(r => r.n);
  for (const n of [1, 4, 5, 6, 30, 11, 21]) assert.ok(shown.includes(n), `line ${n} shown`);
  const folds = b.rows.filter(r => r.fold);
  assert.ok(folds.length > 0);
  for (const f of folds) assert.ok(f.fold >= 3);
  assert.deepEqual(folds.map(f => f.label), folds.map(f => `⋯ ${f.fold} more lines`));
  // each fold row is followed by exactly that many hidden rows
  b.rows.forEach((r, i) => { if (r.fold) { for (let k = 1; k <= r.fold; k++) assert.ok(b.rows[i + k].hidden); assert.ok(!b.rows[i + r.fold + 1]?.hidden); } });
  assert.deepEqual(foldRows([{ n: 1, text: 'a' }]), [{ n: 1, text: 'a' }]);
});

test('guesses never enter the Why list', t => {
  const m = model(t);
  assert.equal(m.stops[0].why.length, 1);
  assert.equal(m.stops[0].why[0].notRecorded, true);
  assert.equal(m.stops[0].guesses.length, 1);
  assert.equal(m.stops[1].why.length, 2);
  assert.deepEqual(m.stops[1].guesses, []);
  for (const s of m.stops) for (const w of s.why) assert.ok(!/^Guess/.test(w.text));
});

test('thin stops do not crash', () => {
  const m = pageModel({ journey: 'j', repos: [], stops: [{ id: 'a', name: 'A' }], checks: {} });
  assert.deepEqual(m.extend, []);
  assert.deepEqual(m.stops[0].notes, []);
  assert.equal(m.mapMissing, true);
});

test('plain words only', t => {
  assert.doesNotMatch(JSON.stringify(model(t)), /data file|scene|map_step|left_out|key_lines|not-recorded|vault-note|design-doc|build-note|pull-request|code-comment/);
});
