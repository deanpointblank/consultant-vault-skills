import test from 'node:test';
import assert from 'node:assert/strict';
import { planShapeErrors, sketchErrors, originErrors, taskErrors, tasksOf, chainErrors, nameKey, writingErrors } from '../lib/plan.mjs';
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
  ['a sketch needs a file name', (s, k) => { k.file = ''; }, 'stop s3 code block 1 has no file name'],
  ['a sketch file above the repo', (s, k) => { k.file = '../x.js'; }, 'stop s3 code block 1 is a sketch, so its file must be a path from the repo top'],
  ['a sketch file as an absolute path', (s, k) => { k.file = '/x.js'; }, 'stop s3 code block 1 is a sketch, so its file must be a path from the repo top'],
  ['a sketch file starting ./', (s, k) => { k.file = './x.js'; }, 'stop s3 code block 1 is a sketch, so its file must be a path from the repo top'],
  ['a sketch needs text', (s, k) => { delete k.text; }, 'stop s3 code block 1 has no text'],
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

// One edit to the example plan, then its task failures. s = the stops, p = d.plan.
const tasksAfter = (t, edit) => {
  const d = samplePlan(ledgerRepo(tempRoot(t)));
  edit(d.stops, d.plan, d);
  return taskErrors(d);
};

test('the example plan has no task failures', t => {
  assert.deepEqual(tasksAfter(t, () => {}), []);
});

test('a stop is found in the tasks that name it', t => {
  assert.deepEqual(tasksOf('s3', samplePlan(ledgerRepo(tempRoot(t)))), [1]);
});

// Some edits leave a second failure behind (a stop left unbuilt, or t2 gone); those rows check the line is there.
for (const [title, edit, line, only = true] of [
  ['no plan object', (s, p, d) => { delete d.plan; }, 'there is no plan object; add one with inputs and tasks'],
  ['a task names a stop that does not exist', (s, p) => { p.tasks[1].stops = ['s9']; }, 'task t2 names stop s9, which does not exist', false],
  ['a new stop no task builds', (s, p) => { p.tasks.splice(0, 1); }, 'stop s3 is new and no task builds it'],
  ['a changed stop no task builds', (s, p) => { p.tasks.splice(1, 1); p.tests = []; }, 'stop s2 is changed and no task builds it'],
  ['a task names an unchanged stop', (s, p) => { p.tasks[1].stops.push('s1'); }, 'task t2 names stop s1, which is unchanged and belongs to no task'],
  ['a task names an elsewhere stop', (s, p) => { s[0].status = 'elsewhere'; p.tasks[1].stops.push('s1'); }, 'task t2 names stop s1, which is elsewhere and belongs to no task'],
  ['a test names a task that does not exist', (s, p) => { p.tests[0].task = 't9'; }, 'test 1 names task t9, which does not exist'],
  ['a test has an unknown when', (s, p) => { p.tests[0].when = 'later'; }, 'test 1 has when later; use build, before or after'],
  ['a task id appears twice', (s, p) => { p.tasks[1].id = 't1'; }, 'task t1 appears twice', false],
  ['a task names no stop', (s, p) => { p.tasks[0].stops = []; }, 'task t1 names no stop', false],
  ['a task has no name', (s, p) => { delete p.tasks[0].name; }, 'task t1 has no name'],
  ['a risk has no text', (s, p) => { p.risks[0].text = ''; }, 'risk 1 has no text'],
]) {
  test(title, t => {
    const got = tasksAfter(t, edit);
    if (only) assert.deepEqual(got, [line]); else assert.ok(got.includes(line));
  });
}

const chainAfter = (t, edit) => {
  const d = samplePlan(ledgerRepo(tempRoot(t)));
  edit(d.stops, d.plan, d);
  return chainErrors(d);
};

const NOT_GIVEN = n => `stop s3 takes "${n}", which no earlier stop gives and plan.inputs does not list`;
for (const [title, edit, line, only = true] of [
  ['a takes renamed', s => { s[2].takes[0] = 'invoice record'; }, NOT_GIVEN('invoice record')],
  ['a stop with no takes', s => { delete s[2].takes; }, 'stop s3 has no takes'],
  ['a stop that gives nothing', s => { s[2].gives = []; }, 'stop s3 gives nothing'],
  ['no plan inputs', (s, p) => { delete p.inputs; }, 'plan.inputs is missing; list what the journey starts with', false],
  ['a first stop takes what nothing gives', s => { s[0].takes = ['payment']; }, 'stop s1 takes "payment", which no earlier stop gives and plan.inputs does not list'],
  ['a later stop gives do not count', s => { s[0].takes = ['invoice']; }, 'stop s1 takes "invoice", which no earlier stop gives and plan.inputs does not list'],
]) {
  test(`chain: ${title}`, t => {
    const got = chainAfter(t, edit);
    if (only) assert.deepEqual(got, [line]); else assert.ok(got.includes(line));
  });
}

for (const [title, edit] of [
  ['the example plan', () => {}],
  ['names match after trimming and lower case', s => { s[2].takes[0] = ' Invoice Row '; }],
  ['an unchanged stop may have no takes or gives', (s, p) => { delete s[0].takes; delete s[0].gives; p.inputs.push('invoice'); }],
  ['an elsewhere stop is not checked and its gives count', s => { s[1].status = 'elsewhere'; s[1].takes = ['nothing known']; }],
  ['no plan object is the task check\'s to report', (s, p, d) => { delete d.plan; }, true],
]) {
  test(`chain: ${title} has no failures`, t => assert.deepEqual(chainAfter(t, edit), []));
}

test('a name key is trimmed and lower case', () => assert.equal(nameKey('  Invoice Row '), 'invoice row'));

// One edit to the example plan, then its writing failures. s = the stops.
const writingAfter = (t, edit) => {
  const d = samplePlan(ledgerRepo(tempRoot(t)));
  edit(d.stops, d);
  return writingErrors(d);
};
const words = n => Array.from({ length: n }, () => 'word').join(' ') + '.';

test('the example plan has no writing failures, though it says store and route', t => {
  assert.deepEqual(writingAfter(t, () => {}), []);
});

for (const [title, edit, line] of [
  ['a what of 44 words', s => { s[1].what = words(44); }, 'stop s2 what is 44 words; keep it to one sentence of 30 or fewer'],
  ['a what of 2 sentences', s => { s[1].what = 'It saves the row. Then the files.'; }, 'stop s2 what is 2 sentences; keep it to one'],
  ['a what names a file', s => { s[1].what = 'Changes src/store.js so files are saved.'; }, 'stop s2 what names src/store.js; keep file names in the header and the code'],
  ['a point names a function', s => { s[1].points[0] = 'Calls saveAttachments after the insert.'; }, 'stop s2 point 1 names saveAttachments; keep function names in the header and the code'],
  ['a point holds a backtick', s => { s[1].points[0] = 'Runs `fast.'; }, 'stop s2 point 1 holds a backtick; keep code in the code blocks'],
  ['5 points', s => { s[1].points = ['One.', 'Two.', 'Three.', 'Four.', 'Five.']; }, 'stop s2 has 5 points; keep it to 4 or fewer'],
  ['a point of 23 words', s => { s[1].points[0] = words(23); }, 'stop s2 point 1 is 23 words; keep it to 20 or fewer'],
  ['a stop needs a what', s => { delete s[2].what; }, 'stop s3 has no what'],
  ['a changed stop needs today', s => { delete s[1].today; }, 'stop s2 is changed, so it needs today with what and points'],
  ['a new stop has no today', s => { s[2].today = { what: 'x' }; }, 'stop s3 is new, so it has no today'],
  ['a today what names a base name', s => { s[1].today.what = 'Inserts into store.js.'; }, 'stop s2 today what names store.js; keep file names in the header and the code'],
]) {
  test(`writing: ${title}`, t => {
    assert.deepEqual(writingAfter(t, edit), [line]);
  });
}

test('writing: no code, points or today, and a block with no function, do not throw', t => {
  assert.deepEqual(writingAfter(t, s => { delete s[0].code; delete s[0].points; delete s[2].code[0].function; }), []);
});
