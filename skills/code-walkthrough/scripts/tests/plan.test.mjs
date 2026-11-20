import test from 'node:test';
import assert from 'node:assert/strict';
import { planShapeErrors, sketchErrors, originErrors } from '../lib/plan.mjs';
import { shapeErrors } from '../lib/data.mjs';
import { tempRoot, ledgerRepo, samplePlan } from './helpers.mjs';

test('extend is refused in plan mode', t => {
  const r = ledgerRepo(tempRoot(t));
  assert.ok(planShapeErrors({ ...samplePlan(r), extend: [{}] }).includes('a plan has no extend points; put the work in plan.tasks'));
});

// One edit to the example plan, then its sketch failures. s = the stops, k = stop s3's sketch.
const sketchAfter = (t, edit) => {
  const d = samplePlan(ledgerRepo(tempRoot(t)));
  edit(d.stops, d.stops[2].code[0], d);
  return sketchErrors(d);
};

test('the example plan has no sketch failures', t => {
  assert.deepEqual(sketchAfter(t, () => {}), []);
});

for (const [title, edit, line] of [
  ['a stop needs a status', s => { delete s[2].status; }, 'stop s3 has no status; use new, changed, unchanged or elsewhere'],
  ['an unknown status', s => { s[2].status = 'done'; }, 'stop s3 has status done; use new, changed, unchanged or elsewhere'],
  ['an unchanged stop holds no sketch', (s, k) => { s[0].code.push(k); }, 'stop s1 is unchanged, so it cannot hold a sketch'],
  ['a new stop holds sketches only', s => { s[2].code.push(s[0].code[0]); }, 'stop s3 is new, so its code is sketches only'],
  ['a new stop needs a sketch', s => { s[2].code = []; }, 'stop s3 is new, so it needs a sketch'],
  ['a changed stop needs both', s => { s[1].code.pop(); }, "stop s2 is changed, so it needs today's code and a sketch"],
  ['new_file is needed', (s, k) => { delete k.new_file; }, 'stop s3 code block 1 is a sketch, so it needs new_file as true or false'],
  ['a sketch of 41 lines', (s, k) => { k.text = Array.from({ length: 41 }, (_, i) => `line ${i + 1}`).join('\n'); }, 'stop s3 code block 1 is a sketch of 41 lines; keep it to 30 or fewer'],
  ['a sketch of 1 line', (s, k) => { k.text = 'x'; }, 'stop s3 code block 1 is a sketch of 1 line; give it 2 or more'],
  ['a sketch has no lines', (s, k) => { k.lines = [1, 2]; }, 'stop s3 code block 1 is a sketch, so it cannot have lines, key_lines or left_out'],
  ['after with new_file', (s, k) => { k.new_file = true; }, 'stop s3 code block 1 has after and new_file together; use one'],
]) {
  test(title, t => {
    assert.deepEqual(sketchAfter(t, edit), [line]);
  });
}

test('only unchanged and changed stops need a Why entry', t => {
  const d = samplePlan(ledgerRepo(tempRoot(t)));
  assert.equal(shapeErrors(d).some(e => e.startsWith('stop s3 has no Why')), false);
  d.stops[1].reasons = [];
  assert.ok(shapeErrors(d).includes('stop s2 has no Why entry'));
});

// One edit to the example plan, then its origin failures. s = the stops, t = the tasks, c = stop s3's choices.
const originAfter = (t, edit) => {
  const d = samplePlan(ledgerRepo(tempRoot(t)));
  edit(d.stops, d.plan.tasks, d.stops[2].choices);
  return originErrors(d);
};

test('the example plan has no origin failures', t => {
  assert.deepEqual(originAfter(t, () => {}), []);
});

for (const [title, edit, line] of [
  ['a new stop needs a from', s => { delete s[2].from; }, 'stop s3 has no from; mark it plan, review or proposal'],
  ['an unchanged stop has no from', s => { s[0].from = { kind: 'proposal' }; }, 'stop s1 is unchanged, so it has no from'],
  ['an unknown origin kind', (s, t) => { t[0].from.kind = 'idea'; }, 'task t1 from has an unknown kind, idea; use plan, review, proposal or open'],
  ['only a choice can be open', (s, t) => { t[0].from = { kind: 'open' }; }, 'task t1 is open, but only a choice can be open'],
  ['an open choice is a question', (s, t, c) => { c[1].text = 'A size limit per file.'; }, 'stop s3 choice 2 is open, so its text must be a question'],
  ['an open choice has no quote', (s, t, c) => { c[1].from.quote = 'x'; }, 'stop s3 choice 2 is open, so it cannot have a quote'],
  ['a proposal has no quote', (s, t) => { t[0].from.quote = 'x'; }, 'task t1 is a proposal, so it cannot have a quote'],
  ['from the plan needs a quote', s => { delete s[1].from.quote; }, 'stop s2 comes from the plan, so it needs a quote and a source'],
  ['awaiting review needs a source', s => { s[1].from = { kind: 'review', quote: 'x' }; }, 'stop s2 is awaiting review, so it needs a quote and a source'],
  ['an unknown origin source kind', s => { s[1].from.source.kind = 'code-comment'; }, 'stop s2 from has an unknown source kind, code-comment'],
]) {
  test(title, t => {
    assert.deepEqual(originAfter(t, edit), [line]);
  });
}

test('a reason cannot quote the chat', t => {
  const d = samplePlan(ledgerRepo(tempRoot(t)));
  d.stops[0].reasons = [{ text: 'x', quote: 'Let users attach files', source: { kind: 'chat', ref: 'goal' } }];
  assert.ok(shapeErrors(d).includes('stop s1 Why entry 1 has an unknown source kind, chat'));
});
