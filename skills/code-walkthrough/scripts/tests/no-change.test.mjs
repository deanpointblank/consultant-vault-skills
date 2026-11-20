import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pageModel, assemblePage } from '../lib/page.mjs';
import { chalkTalkAt, buildMap } from '../lib/map.mjs';
import { tempRoot, bookingRepo, sampleData, pageSample, chalkDir, findChrome, dumpDom, captureApp } from './helpers.mjs';

const GOLDEN = path.join(path.dirname(fileURLToPath(import.meta.url)), 'golden', 'booking-flow.app.html');
const noChrome = !findChrome() && 'no Chrome';
const needsChrome = { skip: noChrome };
const needsMap = { skip: noChrome || (!chalkTalkAt(chalkDir() ?? 'none') && 'chalk-talk not installed') };

test('a walkthrough page renders as before, apart from the divider', needsChrome, async t => {
  const got = (await captureApp(tempRoot(t))).replace(/<div id="split"[^>]*><\/div>/g, '');
  assert.ok(fs.existsSync(GOLDEN), `missing golden file ${GOLDEN}`);
  assert.equal(got, fs.readFileSync(GOLDEN, 'utf8'));
});

test('the map keeps its height when no size is stored', needsMap, async t => {
  const root = tempRoot(t);
  const repo = bookingRepo(root);
  const built = buildMap(sampleData(repo), { chalk: chalkDir(), out: path.join(root, 'out'), slug: 'booking-flow' });
  assert.deepEqual(built.failures, []);
  const file = path.join(root, 'page.html');
  fs.writeFileSync(file, assemblePage(pageModel(pageSample(repo)), built.html));
  const body = `<script>setTimeout(() => {
    const h = id => document.getElementById(id).getBoundingClientRect().height;
    const n = document.createElement('script');
    n.type = 'application/json'; n.id = 'sizes';
    n.textContent = JSON.stringify({ frame: h('map-frame'), read: h('read') });
    document.body.appendChild(n);
  }, 500);</script>`;
  const dump = await dumpDom(file, { size: [1280, 900], body });
  const m = dump.match(/id="sizes">([^<]*)</);
  assert.ok(m, 'the page wrote no sizes');
  const { frame, read } = JSON.parse(m[1]);
  assert.ok(Math.abs(frame - Math.max(180, 0.46 * read)) <= 1, `frame ${frame}px, read ${read}px`);
});
