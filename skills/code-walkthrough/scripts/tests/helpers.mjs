import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { expectedText } from '../lib/code.mjs';

const IDENTITY = {
  GIT_AUTHOR_NAME: 'Test Author', GIT_AUTHOR_EMAIL: 'author@example.com',
  GIT_COMMITTER_NAME: 'Test Author', GIT_COMMITTER_EMAIL: 'author@example.com',
};
const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, ...IDENTITY }, stdio: ['ignore', 'pipe', 'pipe'] });

export function tempRoot(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cw-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const put = (dir, files) => {
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), text);
  }
};

export function commitAll(repoPath, message) {
  git(repoPath, ['add', '.']);
  git(repoPath, ['commit', '-q', '-m', message]);
  return git(repoPath, ['rev-parse', '--short=7', 'HEAD']).trim();
}

export function makeRepo(dir, { files, message, dirty = {}, untracked = {} }) {
  fs.mkdirSync(dir, { recursive: true });
  git(dir, ['init', '-q']);
  put(dir, files);
  const head = commitAll(dir, message);
  put(dir, dirty);
  put(dir, untracked);
  return { path: dir, head };
}

// Moves a tracked file's mtime forward so a plain `git status` would rewrite .git/index.
export function makeIndexStale(repoPath) {
  const file = git(repoPath, ['ls-files']).split('\n')[0];
  const when = new Date(Date.now() + 60_000);
  fs.utimesSync(path.join(repoPath, file), when, when);
}

export function repoSnapshot(repoPath) {
  const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
  const porcelain = execFileSync('git', ['status', '--porcelain=v1'], { cwd: repoPath, encoding: 'utf8', env });
  const idx = path.join(repoPath, '.git', 'index');
  return { porcelain, index: fs.existsSync(idx) ? fs.readFileSync(idx) : null };
}

export function makeVault(dir, notes) {
  const vault = path.join(dir, 'vault');
  fs.mkdirSync(vault, { recursive: true });
  put(vault, notes);
  return vault;
}

const lines = (n, f) => Array.from({ length: n }, (_, i) => f(i + 1)).join('\n') + '\n';

export function bookingRepo(root) {
  const form = lines(12, n => n === 6 ? '  retry(2);' : `const form${n} = ${n};`);
  const dock = lines(30, n =>
    n === 3 ? '\tint indented = 3;' :
    n === 5 ? '// Docks close on Sundays for cleaning.' :
    n === 9 ? 'int spaced = 9;  ' : `int dock${n} = ${n};`);
  return makeRepo(path.join(root, 'booking-mini'), {
    files: {
      'web/form.ts': form,
      'api/Dock.java': dock,
      'docs/adr.md': 'Every booking must reach the yard service, so the API sends each one on.\n',
    },
    message: 'Add the booking flow\n\nEvery booking goes through the API so the yard service hears about it.',
  });
}

export function sampleData(repo) {
  const read = f => fs.readFileSync(path.join(repo.path, f), 'utf8');
  const text = (file, lines, leftOut = []) => expectedText(read(file), lines, leftOut).text;
  return {
    format: 1,
    journey: 'Saving a booking, from the form to the dock check',
    short_name: 'booking flow',
    summary: 'A booking leaves the form, reaches the API and is checked against dock days.',
    client: 'uscold',
    repos: [{ name: 'booking-mini', path: repo.path }],
    stops: [
      {
        id: 's1', name: 'The form sends the booking', summary: 'Collects the fields and posts them.',
        code: [{ file: 'web/form.ts', lines: [1, 12], function: 'saveBooking', text: text('web/form.ts', [1, 12]), key_lines: [6], left_out: [] }],
        what: 'The form gathers the fields and sends them to the API.',
        data: { in: 'The form fields.', out: 'A request to the API.' },
        notes: ['retry(2) tries the send again, up to two more times.'],
        reasons: [{ text: 'Why does the form retry twice?', source: { kind: 'not-recorded' } }],
        guesses: ['The retries may cover a slow first call.'],
        map_step: { flow: ['e1'], focus: ['form'] },
      },
      {
        id: 's2', name: 'The API checks the dock day', summary: 'Rejects days the dock is closed.',
        code: [{ file: 'api/Dock.java', lines: [1, 30], function: 'checkDay', text: text('api/Dock.java', [1, 30], [[12, 20]]), key_lines: [5], left_out: [[12, 20]] }],
        what: 'The API looks up the dock day and refuses closed days.',
        data: { in: 'A booking with a day.', out: 'Accepted, or refused with a reason.' },
        notes: [],
        reasons: [
          { text: 'Docks are closed on Sundays for cleaning.', quote: 'Docks close on Sundays for cleaning.', source: { kind: 'code-comment', ref: { file: 'api/Dock.java', line: 5 } } },
          { text: 'Every booking must reach the yard service.', quote: 'Every booking must reach the yard service', source: { kind: 'design-doc', ref: { path: 'docs/adr.md' } } },
        ],
        guesses: [],
        map_step: { focus: ['api'] },
      },
      {
        id: 's3', name: 'The yard service hears about it', summary: 'The API passes the booking on.',
        code: [
          { file: 'api/Dock.java', lines: [25, 30], function: 'sendOn', text: text('api/Dock.java', [25, 30]), key_lines: [], left_out: [] },
          { file: 'web/form.ts', lines: [6, 6], function: 'saveBooking', text: text('web/form.ts', [6, 6]), key_lines: [6], left_out: [] },
        ],
        what: 'The API sends the saved booking on to the yard service.',
        data: { in: 'The saved booking.', out: 'A message to the yard service.' },
        notes: [],
        reasons: [{ text: 'Every booking goes through the API so the yard service hears about it.', quote: 'Every booking goes through the API so the yard service hears about it.', source: { kind: 'commit', ref: { hash: repo.head } } }],
        guesses: [],
        map_step: { flow: ['e2'], focus: ['yard'] },
      },
    ],
    map: {
      style: 'studio',
      nodes: [
        { id: 'form', kind: 'browser', label: 'Booking form', sub: 'web/form.ts', at: [0, 0], code: 'web/form.ts:1-12' },
        { id: 'api', kind: 'box', label: 'Booking API', sub: 'api/Dock.java', at: [1, 0], code: 'api/Dock.java:1-30' },
        { id: 'yard', kind: 'db', label: 'Yard service', at: [2, 0] },
      ],
      edges: [
        { id: 'e1', from: 'form', to: 'api', label: 'send booking', code: 'web/form.ts:1-12', calls: 'retry(2)' },
        { id: 'e2', from: 'api', to: 'yard', label: 'pass it on', inferred: 'the API hands the booking to the yard service over the network' },
      ],
      groups: [{ id: 'backend', label: 'backend', members: ['api', 'yard'] }],
    },
    extend: [{ stop: 's2', file: 'api/Dock.java', lines: [5, 6], text: 'Add a new closed day here.' }],
    sources: [],
  };
}
