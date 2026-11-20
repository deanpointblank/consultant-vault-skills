import test from 'node:test';
import assert from 'node:assert/strict';
import { pageModel, foldRows } from '../lib/page.mjs';
import { builtLine, checksShort, reasonsLine, planBuiltLine, planChecksShort, planStopsLine } from '../lib/words.mjs';
import { tempRoot, bookingRepo, sampleData, ledgerRepo, samplePlan, withPlanChecks } from './helpers.mjs';

const build = t => {
  const repo = bookingRepo(tempRoot(t));
  const data = sampleData(repo);
  data.built = '2026-11-11';
  data.repos[0].commit = repo.head;
  data.repos[0].uncommitted = ['api/Dock.java'];
  data.checks = { code: { blocks: 4 }, quotes: { quotes: 3, saved: 0, savedOf: [] }, map: { built: true, arrows: 2, traced: 1, guesses: 1, broken: 0, layoutChecked: true } };
  return data;
};
const model = t => pageModel(build(t));

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

test('model carries the finished header text', t => {
  const data = build(t);
  const m = pageModel(data);
  assert.equal(m.title, 'Saving a booking, from the form to the dock check');
  assert.equal(m.built, builtLine(data));
  assert.match(m.built, /^Built from `booking-mini` at commit `[0-9a-f]{7}` plus uncommitted changes in 1 file on 2026-11-11$/);
  assert.deepEqual(m.uncommittedFiles, ['api/Dock.java']);
  assert.equal(m.checks, checksShort(data));
  assert.equal(m.reasons, reasonsLine(data));
  assert.equal(m.reasons, '3 recorded, 1 not recorded');
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
  const seq = b.rows.map(r => r.fold ? `fold ${r.fold}` : r.gap ? 'gap' : r.hidden ? `hidden ${r.n}` : `row ${r.n}`);
  assert.deepEqual(seq, [
    ...[1, 2, 3, 4, 5, 6].map(n => `row ${n}`), 'fold 4', ...[7, 8, 9, 10].map(n => `hidden ${n}`),
    'row 11', 'gap', 'row 21', 'fold 8', ...[22, 23, 24, 25, 26, 27, 28, 29].map(n => `hidden ${n}`), 'row 30',
  ]);
  assert.deepEqual(b.rows.filter(r => r.fold).map(f => f.label), ['⋯ 4 more lines', '⋯ 8 more lines']);
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

test('model carries the words the page shows', t => {
  const m = model(t);
  const [s1, s2, s3] = m.stops;
  assert.equal(s2.kicker, 'Stop 2 of 3');
  assert.equal(s2.label, 'Stop 2 of 3 — The API checks the dock day');
  assert.equal(s2.prevLabel, '← 1. The form sends the booking');
  assert.equal(s2.nextLabel, '3. The yard service hears about it →');
  assert.deepEqual([s1.prevLabel, s3.nextLabel], ['', '']);
  assert.equal(s1.notesLabel, 'Notes on the code (1)');
  assert.deepEqual([s2.moreLabel, s3.moreLabel], ['', '+1 more']);
  assert.equal(m.outOf, 'of 3 stops');
  assert.equal(m.extend[0].link, '2. The API checks the dock day →');
  assert.deepEqual(m.stops.map(s => s.why.map(w => w.tone)), [['none'], ['comment', 'doc'], ['commit']]);
});

test('every source kind has a chip colour', () => {
  const kinds = { 'vault-note': 'doc', 'design-doc': 'doc', 'build-note': 'doc', ticket: 'doc', commit: 'commit', 'pull-request': 'commit', 'code-comment': 'comment', 'not-recorded': 'none' };
  const reasons = Object.keys(kinds).map(kind => ({ text: kind, quote: 'q', source: { kind, ref: kind === 'commit' ? { hash: 'abc1234' } : kind === 'pull-request' ? { number: 4 } : 'x' } }));
  const m = pageModel({ journey: 'j', repos: [], stops: [{ id: 'a', name: 'A', reasons }], checks: {} });
  assert.deepEqual(m.stops[0].why.map(w => w.tone), Object.values(kinds));
});

test('one stop reads in the singular', () => {
  const m = pageModel({ journey: 'j', repos: [], stops: [{ id: 'a', name: 'A', notes: ['x', 'y'] }], checks: {} });
  assert.equal(m.outOf, 'of 1 stop');
  assert.equal(m.stops[0].label, 'Stop 1 of 1 — A');
  assert.equal(m.stops[0].notesLabel, 'Notes on the code (2)');
  assert.deepEqual([m.stops[0].prevLabel, m.stops[0].nextLabel, m.stops[0].moreLabel], ['', '', '']);
});

test('the fold limit is 14 numbered lines', () => {
  const rows = n => Array.from({ length: n }, (_, i) => ({ n: i + 1, text: 'x', key: i + 1 === 8 }));
  assert.equal(foldRows(rows(14)).length, 14);
  const f = foldRows(rows(15));
  assert.ok(f.some(r => r.fold));
  assert.ok(f.length > 15);
});

test('a sketch block has no line numbers', t => {
  const m = pageModel(samplePlan(ledgerRepo(tempRoot(t))));
  const s3 = m.stops[2];
  assert.equal(s3.firstFile, 'src/store.js');
  const b = s3.sketches[0];
  assert.equal(b.label, 'src/store.js · new, after line 20');
  assert.equal(b.fn, 'saveAttachments');
  assert.deepEqual(b.rows[0], { text: 'export async function saveAttachments(invoiceId, files) {' });
  assert.equal(b.rows.length, 5);
  assert.ok(b.rows.every(r => Object.keys(r).join() === 'text'));
  assert.deepEqual(s3.blocks, []);
  assert.deepEqual(m.stops[1].blocks.map(x => x.label), ['src/store.js:16-20']);
  assert.equal(m.stops[1].sketches[0].label, 'src/store.js · changed');
});

const plan = (t, change = () => {}) => { const d = withPlanChecks(samplePlan(ledgerRepo(tempRoot(t)))); change(d); return pageModel(d); };

test('a plan model carries the plan header and views', t => {
  const d = withPlanChecks(samplePlan(ledgerRepo(tempRoot(t))));
  const m = pageModel(d);
  assert.equal(m.plan, true);
  assert.equal(m.built, planBuiltLine(d));
  assert.equal(m.checks, planChecksShort(d));
  assert.equal(m.reasonsKey, 'Stops:');
  assert.equal(m.reasons, planStopsLine(d));
  assert.equal(m.lookupOnly, 'Only stops with something open');
  assert.equal(m.extendTab, 'Build order');
  assert.deepEqual(m.extend, []);
});

test('a new stop in an existing file: kicker, tags, sketch and choices', t => {
  const s3 = plan(t).stops[2];
  assert.equal(s3.kicker, 'Stop 3 of 3 · Task 1');
  assert.equal(s3.label, 'Stop 3 of 3 · Task 1 — Each file becomes an attachment row');
  assert.equal(s3.status, 'new');
  assert.equal(s3.statusTag, 'NEW · in an existing file');
  assert.equal(s3.originTag, 'In plan');
  assert.deepEqual(s3.blocks, []);
  assert.equal(s3.sketches.length, 1);
  const k = s3.sketches[0];
  assert.equal(k.label, 'src/store.js · new, after line 20');
  assert.equal(k.head, 'Sketch · not checked');
  assert.equal(k.originTag, 'Proposal');
  assert.ok(k.rows.every(r => !('n' in r)));
  assert.equal(s3.whyLabel, 'Why & choices 2 · 1 open');
  assert.equal(s3.badge, '1 open');
  assert.equal(s3.hasOpen, true);
  assert.deepEqual(s3.choices, [
    { text: 'One row per file.', tag: 'In plan', open: false, chip: 'chat', detail: '“one row per file” — chat' },
    { text: 'Is there a size limit per file?', tag: 'Open', open: true, chip: '', detail: '' },
  ]);
  assert.deepEqual(s3.takes, ['invoice row', 'attachments']);
  assert.deepEqual(s3.gives, ['attachment rows']);
  assert.deepEqual(s3.points, ['Runs only after the invoice row exists.']);
  assert.equal(s3.today, null);
  assert.equal(s3.ticket, '');
});

test('a changed stop: today blocks, a sketch and today', t => {
  const s2 = plan(t).stops[1];
  assert.equal(s2.kicker, 'Stop 2 of 3 · Task 2');
  assert.equal(s2.statusTag, 'CHANGED');
  assert.equal(s2.originTag, 'In plan');
  assert.deepEqual(s2.blocks.map(b => b.label), ['src/store.js:16-20']);
  assert.deepEqual(s2.sketches.map(k => [k.label, k.head, k.originTag]), [['src/store.js · changed', 'Sketch · not checked', 'Proposal']]);
  assert.deepEqual(s2.today, { what: 'The store totals the invoice and inserts one row.', points: ['Writes an audit entry first.'] });
  assert.deepEqual(s2.choices, [{ text: 'Files are saved after the invoice row, in the same call.', tag: 'Proposal', open: false, chip: '', detail: '' }]);
  assert.equal(s2.whyLabel, 'Why & choices 2 · 1 not recorded');
  assert.equal(s2.badge, '1 not recorded');
  assert.equal(s2.hasOpen, false);
});

test('an unchanged stop has no origin and no task', t => {
  const m = plan(t);
  const s1 = m.stops[0];
  assert.equal(s1.statusTag, 'UNCHANGED');
  assert.equal(s1.originTag, '');
  assert.equal(s1.kicker, 'Stop 1 of 3');
  assert.equal(s1.whyLabel, 'Why & choices 1 · 1 not recorded');
  assert.equal(s1.badge, '1 not recorded');
  assert.equal(s1.hasOpen, false);
  assert.deepEqual(s1.sketches, []);
  assert.equal(s1.blocks.length, 1);
  // a plan stop with no reasons is new, not one whose reasons are recorded
  assert.doesNotMatch(JSON.stringify(m), /Reasons recorded/);
});

test('the build order', t => {
  const o = plan(t).order;
  assert.equal(o.summary, '2 tasks · 1 test · 1 risk · 1 out of scope');
  assert.deepEqual(o.tasks[0], { n: 1, name: 'Add the attachments table and its save', tag: 'Proposal', stops: [{ n: 3, link: 'Stop 3 →' }], tests: [] });
  assert.deepEqual(o.tasks[1].stops, [{ n: 2, link: 'Stop 2 →' }]);
  assert.deepEqual(o.tasks[1].tests, [{ label: 'Test:', text:'An invoice with two files gets two attachment rows.', tag: 'Proposal' }]);
  assert.deepEqual(o.groups.map(g => g.title), ['Risks', 'Out of scope']);
  assert.deepEqual(o.groups[0].items, [{ text: 'Many large files could slow the save.', tag: 'Proposal' }]);
  assert.deepEqual(o.groups.at(-1).items.at(-1), { text: 'The upload screen.', tag: 'In plan' });
  assert.deepEqual(o.elsewhere, []);
});

test('each plan test lands in one place', t => {
  const o = plan(t, d => {
    const p = { kind: 'proposal' };
    d.plan.tests.push(
      { text: 'Before, with a task.', task: 't1', when: 'before', from: p },
      { text: 'A build test, no task.', from: p },
      { text: 'After deploy, with a task.', task: 't2', when: 'after', from: p },
      { text: 'A build test for t1.', task: 't1', when: 'build', from: p },
    );
  }).order;
  assert.equal(o.summary, '2 tasks · 5 tests · 1 risk · 1 out of scope');
  assert.deepEqual(o.tasks.map(x => x.tests.map(y => y.text)), [['A build test for t1.'], ['An invoice with two files gets two attachment rows.']]);
  assert.deepEqual(o.groups.map(g => [g.title, g.items.map(i => i.text)]), [
    ['Checks before the build', ['Before, with a task.']],
    ['Tests', ['A build test, no task.']],
    ['After deploy', ['After deploy, with a task.']],
    ['Risks', ['Many large files could slow the save.']],
    ['Out of scope', ['The upload screen.']],
  ]);
});

test('a stop built by another ticket', t => {
  const m = plan(t, d => { const s = d.stops; s[0].status = 'elsewhere'; s[0].ticket = 'PROJ-123'; });
  assert.equal(m.stops[0].statusTag, 'ANOTHER TICKET');
  assert.equal(m.stops[0].ticket, 'PROJ-123');
  assert.deepEqual(m.order.elsewhere, [{ n: 1, name: 'The API takes the invoice', ticket: 'PROJ-123', link: 'Stop 1 →' }]);
});

test('a sketch never folds', t => {
  const text = ['export function long(a) {', ...Array.from({ length: 18 }, (_, i) => `  step${i + 1}(a);`), '}'].join('\n');
  const k = plan(t, d => { d.stops[2].code[0].text = text; }).stops[2].sketches[0];
  assert.equal(k.rows.length, 20);
  assert.deepEqual(k.rows.map(r => r.text), text.split('\n'));
  assert.ok(k.rows.every(r => !r.fold && !r.hidden));
  for (const key of ['total', 'folded', 'showAll']) assert.equal(key in k, false, key);
});

test('sketch labels, task lists and badges', t => {
  const m = plan(t, d => {
    const [s1, s2, s3] = d.stops;
    d.plan.tasks[0].stops.push('s2');
    Object.assign(s2.code[1], { file: 'src/attach.js', new_file: true });
    s2.code.push({ planned: true, file: 'src/store.js', new_file: false, after: 'totalOf', function: 'sizeOf', from: { kind: 'proposal' }, text: 'function sizeOf(f) {\n  return f.size;\n}' });
    s2.choices.push({ text: 'Do files need a type check?', from: { kind: 'open' } });
    s3.code[0].new_file = true; delete s3.code[0].after;
    s1.reasons.push({ text: 'Lines are capped for the till.', quote: 'x', source: { kind: 'design-doc', ref: { path: 'docs/plan.md' } } });
  });
  const [s1, s2, s3] = m.stops;
  assert.equal(s2.kicker, 'Stop 2 of 3 · Tasks 1, 2');
  assert.equal(s2.task, 'Tasks 1, 2');
  assert.deepEqual(s2.sketches.map(k => k.label), ['src/attach.js · new file', 'src/store.js · new, after totalOf']);
  assert.equal(s2.badge, '1 open · 1 not recorded');
  assert.equal(s2.whyLabel, 'Why & choices 3 · 1 open · 1 not recorded');
  assert.equal(s2.hasOpen, true);
  assert.equal(s3.statusTag, 'NEW');
  assert.equal(s1.badge, '1 not recorded');
  assert.equal(s1.whyLabel, 'Why & choices 2 · 1 not recorded');
});
