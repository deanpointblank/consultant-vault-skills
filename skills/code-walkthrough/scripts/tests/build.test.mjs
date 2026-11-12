import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { tempRoot, bookingRepo, sampleData, makeVault, repoSnapshot, chalkDir, findChrome } from './helpers.mjs';

const SCRIPT = new URL('../walkthrough-build.mjs', import.meta.url).pathname;
const DAY1 = '2026-11-11';
const NOTE = 'Walkthrough - booking flow.md';

function setup(t, change = d => d, { dirty = false } = {}) {
  const root = tempRoot(t);
  const repo = bookingRepo(root);
  // a line after the cited ones: Dock.java now differs from the commit, and no cited text moves
  if (dirty) fs.appendFileSync(path.join(repo.path, 'api/Dock.java'), 'int extra = 31;\n');
  const vault = makeVault(root, { 'README.md': 'a vault\n' });
  const data = sampleData(repo);
  change(data, repo);
  const dataFile = path.join(root, 'in', 'booking.json');
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  const ctx = { root, repo, vault, data, dataFile, out: path.join(root, 'work'), folder: path.join(vault, 'Walkthroughs') };
  ctx.snapshot = repoSnapshot(repo.path);
  return ctx;
}

function run(ctx, extra = [], { chalk = 'none', file = ctx.dataFile, out = ctx.out, date = DAY1, env = {} } = {}) {
  const args = [SCRIPT, file, '--out', out, '--vault', ctx.vault, '--folder', 'Walkthroughs', '--chalk', chalk, '--date', date, ...extra];
  const r = spawnSync(process.execPath, args, { encoding: 'utf8', env: { ...process.env, CW_GH: '0', ...env }, cwd: ctx.root });
  return { status: r.status, out: r.stdout, err: r.stderr, lines: r.stdout.split('\n') };
}

// D11: the walked repo is untouched and chalk-talk made no folder of its own.
function finish(ctx) {
  const now = repoSnapshot(ctx.repo.path);
  assert.equal(now.porcelain, ctx.snapshot.porcelain);
  assert.deepEqual(now.index, ctx.snapshot.index);
  for (const dir of [ctx.root, ctx.repo.path, process.cwd()]) assert.equal(fs.existsSync(path.join(dir, 'chalk-talks')), false, dir);
}

const vaultFiles = ctx => (fs.existsSync(ctx.folder) ? fs.readdirSync(ctx.folder).sort() : []);
const readJson = f => JSON.parse(fs.readFileSync(f, 'utf8'));

test('passing build writes three files', t => {
  const ctx = setup(t);
  const r = run(ctx, ['--write']);
  assert.equal(r.status, 0, r.out + r.err);
  assert.ok(r.lines[0].startsWith('Code: all 4 blocks match the files as built'), r.out);
  assert.ok(r.lines.includes('Reasons: all 3 quotes were found word for word in their sources.'), r.out);
  assert.ok(r.lines.some(l => l.startsWith('Map: not built, because chalk-talk is not installed.')), r.out);
  assert.deepEqual(vaultFiles(ctx), [NOTE, 'booking-flow.html', 'booking-flow.walkthrough.json']);
  for (const n of vaultFiles(ctx)) assert.ok(r.lines.includes(`WROTE ${path.join(ctx.folder, n)}`), r.out);
  assert.deepEqual(fs.readdirSync(ctx.out).filter(f => !f.startsWith('.')).sort(), [NOTE, 'booking-flow.html', 'booking-flow.walkthrough.json']);
  assert.match(fs.readFileSync(path.join(ctx.folder, NOTE), 'utf8'), /^---\ntype: code-walkthrough\n/);
  finish(ctx);
});

test('without --write nothing reaches the vault', t => {
  const ctx = setup(t);
  assert.equal(run(ctx).status, 0);
  assert.deepEqual(vaultFiles(ctx), []);
  assert.ok(fs.existsSync(path.join(ctx.out, NOTE)));
  finish(ctx);
});

test('the data file gets what the build learned', t => {
  const ctx = setup(t);
  assert.equal(run(ctx).status, 0);
  const d = readJson(ctx.dataFile);
  assert.deepEqual(d.cited_files['booking-mini'], ['api/Dock.java', 'web/form.ts']);
  assert.equal(d.repos[0].commit, ctx.repo.head);
  assert.deepEqual(d.repos[0].uncommitted, []);
  assert.equal(d.checks.code.blocks, 4);
  assert.deepEqual(d.checks.quotes, { quotes: 3, saved: 0, savedOf: { ticket: [], 'pull-request': [] } });
  assert.deepEqual(d.checks.map, { built: false });
  assert.equal(d.built, DAY1);
  assert.equal(d.map_tool, undefined);
  assert.equal(d.earlier, undefined);
  finish(ctx);
});

test('uncommitted cited files are listed', t => {
  const ctx = setup(t, d => d, { dirty: true });
  const r = run(ctx);
  assert.equal(r.status, 0, r.out + r.err);
  assert.deepEqual(readJson(ctx.dataFile).repos[0].uncommitted, ['api/Dock.java']);
  assert.match(r.out, /plus uncommitted changes in 1 file\)\./);
  assert.match(fs.readFileSync(path.join(ctx.out, NOTE), 'utf8'), /uncommitted:\n  - "booking-mini: api\/Dock\.java"\n/);
  finish(ctx);
});

test('the input may be the very file left in the working folder', t => {
  const ctx = setup(t);
  fs.mkdirSync(ctx.out, { recursive: true });
  const same = path.join(ctx.out, 'booking-flow.walkthrough.json');
  fs.copyFileSync(ctx.dataFile, same);
  const r = run(ctx, ['--write'], { file: same });
  assert.equal(r.status, 0, r.out + r.err);
  const d = readJson(same);
  assert.equal(d.checks.code.blocks, 4);
  assert.deepEqual(readJson(path.join(ctx.folder, 'booking-flow.walkthrough.json')), d);
  finish(ctx);
});

test('failing build writes nothing to the vault', t => {
  const ctx = setup(t);
  fs.rmSync(path.join(ctx.repo.path, 'web/form.ts'));
  ctx.snapshot = repoSnapshot(ctx.repo.path);
  const r = run(ctx, ['--write']);
  assert.equal(r.status, 1, r.out + r.err);
  assert.ok(r.lines.includes('FAIL s1 web/form.ts:1-12: the file is gone'), r.out);
  assert.doesNotMatch(r.out, /^Code: all/m);
  assert.deepEqual(vaultFiles(ctx), []);
  assert.doesNotMatch(r.err, /\n\s+at /);
  finish(ctx);
});

test('a paraphrased quote fails', t => {
  const ctx = setup(t, d => { d.stops[1].reasons[1].quote = 'Every booking has to reach the yard service'; });
  const r = run(ctx, ['--write']);
  assert.equal(r.status, 1, r.out);
  assert.ok(r.lines.some(l => /^FAIL s2 reason 2 \(design doc docs\/adr\.md\): /.test(l)), r.out);
  assert.deepEqual(vaultFiles(ctx), []);
  finish(ctx);
});

test('shape errors fail before anything else', t => {
  const ctx = setup(t, d => { d.stops[0].reasons = [];});
  fs.rmSync(path.join(ctx.repo.path, 'web/form.ts'));
  ctx.snapshot = repoSnapshot(ctx.repo.path);
  const r = run(ctx, ['--write']);
  assert.equal(r.status, 1, r.out);
  assert.ok(r.lines.some(l => l.startsWith('FAIL ') && /stop s1 has no Why entry/.test(l)), r.out);
  assert.doesNotMatch(r.out, /the file is gone/);
  assert.deepEqual(vaultFiles(ctx), []);
  assert.equal(readJson(ctx.dataFile).checks, undefined);
  finish(ctx);
});

test('same-day rebuild stops and asks', t => {
  const ctx = setup(t);
  assert.equal(run(ctx, ['--write']).status, 0);
  const first = fs.readFileSync(path.join(ctx.folder, NOTE), 'utf8');
  const r = run(ctx, ['--write']);
  assert.equal(r.status, 3, r.out + r.err);
  assert.ok(r.lines.includes(`SAME DAY booking-flow.html, booking-flow.walkthrough.json, ${NOTE}`), r.out);
  assert.equal(vaultFiles(ctx).length, 3);

  const keep = run(ctx, ['--write', '--same-day', 'keep']);
  assert.equal(keep.status, 0, keep.out + keep.err);
  assert.deepEqual(vaultFiles(ctx), [
    NOTE, `Walkthrough - booking flow ${DAY1}.md`, 'booking-flow-2026-11-11.html', 'booking-flow-2026-11-11.walkthrough.json',
    'booking-flow.html', 'booking-flow.walkthrough.json'].sort());
  assert.equal(fs.readFileSync(path.join(ctx.folder, NOTE), 'utf8'), first);
  assert.match(fs.readFileSync(path.join(ctx.folder, `Walkthrough - booking flow ${DAY1}.md`), 'utf8'), /Earlier walkthrough of this journey: \[\[Walkthrough - booking flow\]\]\./);

  finish(ctx);
});

test('same-day replace rewrites today\'s three files and nothing else', t => {
  const ctx = setup(t);
  assert.equal(run(ctx, ['--write']).status, 0);
  const d = readJson(ctx.dataFile);
  d.summary = 'A changed summary.';
  fs.writeFileSync(ctx.dataFile, JSON.stringify(d));
  const rep = run(ctx, ['--write', '--same-day', 'replace']);
  assert.equal(rep.status, 0, rep.out + rep.err);
  assert.deepEqual(vaultFiles(ctx), [NOTE, 'booking-flow.html', 'booking-flow.walkthrough.json']);
  assert.match(fs.readFileSync(path.join(ctx.folder, NOTE), 'utf8'), /A changed summary\./);
  assert.equal(readJson(path.join(ctx.folder, 'booking-flow.walkthrough.json')).summary, 'A changed summary.');
  finish(ctx);
});

test('rebuild on a later day', t => {
  const ctx = setup(t);
  assert.equal(run(ctx, ['--write']).status, 0);
  const r = run(ctx, ['--write'], { date: '2026-11-12' });
  assert.equal(r.status, 0, r.out + r.err);
  assert.deepEqual(vaultFiles(ctx), [NOTE, 'Walkthrough - booking flow 2026-11-12.md', 'booking-flow-2026-11-12.html',
    'booking-flow-2026-11-12.walkthrough.json', 'booking-flow.html', 'booking-flow.walkthrough.json'].sort());
  assert.equal(readJson(ctx.dataFile).earlier, 'Walkthrough - booking flow');
  assert.match(fs.readFileSync(path.join(ctx.folder, 'Walkthrough - booking flow 2026-11-12.md'), 'utf8'), /Earlier walkthrough of this journey: \[\[Walkthrough - booking flow\]\]\./);
  finish(ctx);
});

test('working folder in the wrong place is refused', t => {
  const ctx = setup(t);
  const workRoot = path.join(ctx.root, 'roots');
  fs.mkdirSync(workRoot);
  fs.symlinkSync(ctx.vault, path.join(ctx.root, 'link-to-vault'));
  const cases = [
    [path.join(ctx.repo.path, 'sub'), []],
    [ctx.repo.path, []],
    [path.join(ctx.vault, 'x'), []],
    [path.join(ctx.root, 'link-to-vault', 'x'), []],
    [path.join(workRoot, 'x'), ['--work-root', workRoot]],
  ];
  for (const [out, extra] of cases) {
    const existed = fs.existsSync(out);
    const r = run(ctx, ['--write', ...extra], { out });
    assert.equal(r.status, 2, `${out}: ${r.out}${r.err}`);
    assert.equal(fs.existsSync(out), existed, out);
    assert.doesNotMatch(r.err + r.out, /\n\s+at /);
  }
  assert.deepEqual(vaultFiles(ctx), []);
  assert.deepEqual(fs.readdirSync(ctx.vault), ['README.md']);
  assert.equal(readJson(ctx.dataFile).checks, undefined);
  finish(ctx);
});

test('a data file inside the vault, a repo or a work root is refused and left alone', t => {
  const ctx = setup(t);
  const workRoot = path.join(ctx.root, 'roots');
  fs.mkdirSync(workRoot);
  fs.mkdirSync(ctx.folder, { recursive: true });
  const homes = [
    [path.join(ctx.folder, 'booking-flow.walkthrough.json'), []],
    [path.join(ctx.repo.path, 'copy.json'), []],
    [path.join(workRoot, 'copy.json'), ['--work-root', workRoot]],
  ];
  for (const [file, extra] of homes) {
    fs.copyFileSync(ctx.dataFile, file);
    const before = fs.readFileSync(file);
    const r = run(ctx, ['--write', ...extra], { file });
    assert.equal(r.status, 2, `${file}: ${r.out}${r.err}`);
    assert.match(r.err, /copy the data file to the working folder/);
    assert.deepEqual(fs.readFileSync(file), before, file);
    assert.equal(fs.existsSync(ctx.out), false);
  }
  assert.deepEqual(vaultFiles(ctx), ['booking-flow.walkthrough.json']);
});

test('the same folder typed in another letter case is still inside', t => {
  const ctx = setup(t);
  fs.mkdirSync(path.join(ctx.root, 'probe'));
  const blind = fs.existsSync(path.join(ctx.root, 'PROBE'));
  if (!blind) return t.skip('this disk tells letter cases apart');
  const out = path.join(ctx.root, 'VAULT', 'work');
  const r = run(ctx, ['--write'], { out });
  assert.equal(r.status, 2, r.out + r.err);
  assert.deepEqual(fs.readdirSync(ctx.vault), ['README.md']);
  const lower = run(ctx, [], { out: path.join(ctx.root, 'REPOS-NOT', 'x'), file: ctx.dataFile });
  assert.equal(lower.status, 0, lower.out + lower.err);
  const repoCase = run(ctx, [], { out: path.join(ctx.root, 'BOOKING-MINI', 'x') });
  assert.equal(repoCase.status, 2, repoCase.out + repoCase.err);
});

test('a leading ~ means the home folder, even in a work root that does not exist yet', t => {
  const ctx = setup(t);
  const home = path.join(ctx.root, 'home');
  fs.mkdirSync(home);
  const r = run(ctx, ['--work-root', '~/later'], { out: path.join(home, 'later', 'x'), env: { HOME: home } });
  assert.equal(r.status, 2, r.out + r.err);
  assert.equal(fs.existsSync(path.join(home, 'later')), false);
  const ok = run(ctx, ['--work-root', '~/later'], { env: { HOME: home } });
  assert.equal(ok.status, 0, ok.out + ok.err);
  finish(ctx);
});

test('a folder that only shares a prefix is not inside', t => {
  const ctx = setup(t);
  const r = run(ctx, [], { out: ctx.vault + '-old' });
  assert.equal(r.status, 0, r.out + r.err);
  finish(ctx);
});

test('bad input is a plain message, never a stack trace', t => {
  const ctx = setup(t);
  const bad = path.join(ctx.root, 'bad.json');
  fs.writeFileSync(bad, '{ nope');
  const notRepo = setup(t);
  const plain = path.join(notRepo.root, 'plain');
  fs.mkdirSync(plain);
  const nd = readJson(notRepo.dataFile);
  nd.repos[0].path = plain;
  fs.writeFileSync(notRepo.dataFile, JSON.stringify(nd));
  const cases = [
    [run(ctx, [], { file: path.join(ctx.root, 'missing.json') }), 2],
    [run(ctx, [], { file: bad }), 2],
    [run(ctx, ['--same-day', 'maybe']), 2],
    [run(ctx, ['--date', '11/11/2026']), 2],
    [run(ctx, ['--bogus']), 2],
    [run({ ...ctx, vault: path.join(ctx.root, 'no-vault') }), 2],
    [run(notRepo), 1],
  ];
  const notRepoRun = cases[6][0];
  for (const [r, status] of cases) {
    assert.equal(r.status, status, r.out + r.err);
    assert.doesNotMatch(r.err + r.out, /\n\s+at |Error:/);
    assert.ok((r.err + r.out).trim().length > 0);
  }
  assert.ok(notRepoRun.lines.some(l => /^FAIL booking-mini: .*not a git repo/.test(l)), notRepoRun.out);
  const none = spawnSync(process.execPath, [SCRIPT], { encoding: 'utf8' });
  assert.equal(none.status, 2);
  finish(ctx);
});

test('plain words in the note', t => {
  const ctx = setup(t);
  assert.equal(run(ctx).status, 0);
  const note = fs.readFileSync(path.join(ctx.out, NOTE), 'utf8');
  assert.doesNotMatch(note, /data file|scene|map_step|left_out|key_lines|not-recorded|vault-note|design-doc|build-note|pull-request|code-comment/);
  finish(ctx);
});

const chalk = chalkDir();
test('with chalk-talk the page carries the map', { skip: !chalk || !findChrome() }, t => {
  const ctx = setup(t);
  const r = run(ctx, ['--write'], { chalk });
  assert.equal(r.status, 0, r.out + r.err);
  assert.ok(r.lines.includes('Map: 1 of 2 arrows are traced to a line of code. 1 is marked as a guess. None are broken.'), r.out);
  const page = fs.readFileSync(path.join(ctx.out, 'booking-flow.html'), 'utf8');
  assert.match(page, /id="map-page"[^>]*>[^<]{200,}/);
  const d = readJson(ctx.dataFile);
  assert.equal(d.map_tool.name, 'chalk-talk');
  assert.equal(d.map_tool.commit, '4f88ead');
  assert.deepEqual(Object.keys(d.checks.map).sort(), ['arrows', 'broken', 'built', 'guesses', 'layoutChecked', 'traced']);
  assert.equal(d.checks.map.built, true);
  assert.ok(fs.existsSync(path.join(ctx.out, 'booking-flow-snaps')));
  finish(ctx);
});
