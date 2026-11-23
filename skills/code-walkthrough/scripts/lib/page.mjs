import fs from 'node:fs';
import { codeRows, splitLines } from './code.mjs';
import { isPlan, isSketch, tasksOf } from './plan.mjs';
import { builtLine, checksShort, reasonsLine, stopBadge, whyLabel, chipLabel, chipDetail, originTag, planCounts, planBuiltLine, planChecksShort, planStopsLine } from './words.mjs';
import { CAPTION_BAR, CODE_PANEL } from './settings.mjs';

export const FOLD_AT = 14;

const label = r => `${r[0]}–${r[1]}`;
const hiddenCopy = r => ({ ...r, hidden: true });

export function foldRows(rows) {
  const numbered = rows.filter(r => !r.gap).length;
  if (numbered <= FOLD_AT) return rows;
  const keep = rows.map(() => false);
  const mark = i => { if (i >= 0 && i < rows.length) keep[i] = true; };
  rows.forEach((r, i) => { if (r.key || r.gap) { mark(i - 1); mark(i); mark(i + 1); } });
  mark(0); mark(rows.length - 1);
  for (let i = 0; i < rows.length;) {
    if (keep[i]) { i++; continue; }
    let j = i;
    while (j < rows.length && !keep[j]) j++;
    if (j - i < 3) for (let k = i; k < j; k++) keep[k] = true;
    i = j;
  }
  const out = [];
  for (let a = 0; a < rows.length;) {
    if (keep[a]) { out.push(rows[a]); a++; continue; }
    let z = a;
    while (z < rows.length && !keep[z]) z++;
    out.push({ fold: z - a, label: `⋯ ${z - a} more lines` });
    for (let q = a; q < z; q++) out.push(hiddenCopy(rows[q]));
    a = z;
  }
  return out;
}

const range = o => `${o.file}:${o.lines[0]}-${o.lines[1]}`;

function blockModel(block) {
  const all = codeRows(block).map(r => r.gap ? { ...r, label: `lines ${label(r.gap)} left out` } : r);
  const total = all.filter(r => !r.gap).length;
  const rows = foldRows(all);
  return { label: range(block), fn: block.function, rows, total, folded: rows.length !== all.length, showAll: `Show all ${total} lines` };
}

function sketchLabel(b, status) {
  if (b.new_file) return `${b.file} · new file`;
  if (typeof b.after === 'number') return `${b.file} · new, after line ${b.after}`;
  if (b.after !== undefined) return `${b.file} · new, after ${b.after}`;
  return `${b.file} · ${status === 'new' ? 'new' : 'changed'}`;
}

// A sketch is never checked and never folds (30 lines at most): no line numbers, every line shown.
const sketchModel = (b, status) => ({ label: sketchLabel(b, status), head: 'Sketch · not checked', fn: b.function, rows: splitLines(b.text).map(text => ({ text })), originTag: originTag(b.from) });

// The chip's colour: written sources, commits and pull requests, comments in the code, and gaps.
const TONE = {
  'vault-note': 'doc', 'design-doc': 'doc', 'build-note': 'doc', ticket: 'doc',
  commit: 'commit', 'pull-request': 'commit', 'code-comment': 'comment',
};

const stopWord = n => (n === 1 ? 'stop' : 'stops');
const linkTo = s => `${s.n}. ${s.name}`;
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const taskWord = ns => (!ns.length ? '' : `${ns.length === 1 ? 'Task' : 'Tasks'} ${ns.join(', ')}`);
const taskPart = ns => (ns.length ? ` · ${taskWord(ns)}` : '');
const STATUS_TAGS = { new: 'NEW', changed: 'CHANGED', unchanged: 'UNCHANGED', elsewhere: 'ANOTHER TICKET' };
const isGap = r => r.source?.kind === 'not-recorded';

// What a plan page adds to a stop.
function planStop(s, data) {
  const sketches = (s.code || []).filter(isSketch);
  const inExisting = s.status === 'new' && sketches.length && sketches.every(b => !b.new_file);
  const choices = (s.choices || []).map(c => {
    const quoted = ['plan', 'review'].includes(c.from?.kind);
    return { text: c.text, tag: originTag(c.from), open: c.from?.kind === 'open', chip: quoted ? chipLabel(c.from.source) : '', detail: quoted ? chipDetail(c.from, data) : '' };
  });
  const reasons = s.reasons || [];
  const open = choices.filter(c => c.open).length, gaps = reasons.filter(isGap).length;
  const openPart = open ? `${open} open` : '', gapPart = gaps ? `${gaps} not recorded` : '';
  return {
    status: s.status,
    statusTag: inExisting ? 'NEW · in an existing file' : STATUS_TAGS[s.status] || '',
    originTag: originTag(s.from),
    ticket: s.ticket ?? '',
    task: taskWord(tasksOf(s.id, data)),
    sketches: sketches.map(b => sketchModel(b, s.status)),
    points: s.points || [],
    today: s.today ? { what: s.today.what, points: s.today.points || [] } : null,
    takes: s.takes || [], gives: s.gives || [],
    choices,
    whyLabel: [`Why & choices ${reasons.length + choices.length}`, openPart, gapPart].filter(Boolean).join(' · '),
    badge: [openPart, gapPart].filter(Boolean).join(' · '),
    hasOpen: open > 0,
  };
}

// The Build order view: tasks with their stops and build tests, the other lists, and stops another ticket builds.
function buildOrder(data, names) {
  const p = data.plan || {}, tests = p.tests || [], c = planCounts(data);
  const when = x => x.when || 'build';
  const items = list => list.map(x => ({ text: x.text, tag: originTag(x.from) }));
  const stopLink = n => ({ n, link: `Stop ${n} →` });
  const groups = [
    ['Checks before the build', tests.filter(x => when(x) === 'before')],
    ['Tests', tests.filter(x => when(x) === 'build' && x.task === undefined)],
    ['After deploy', tests.filter(x => when(x) === 'after')],
    ['Risks', p.risks || []],
    ['Out of scope', p.out_of_scope || []],
  ].filter(([, list]) => list.length).map(([title, list]) => ({ title, items: items(list) }));
  return {
    summary: `${plural(c.tasks, 'task', 'tasks')} · ${plural(c.tests, 'test', 'tests')} · ${plural(c.risks, 'risk', 'risks')} · ${c.outOfScope} out of scope`,
    tasks: (p.tasks || []).map((t, i) => ({
      n: i + 1, name: t.name, tag: originTag(t.from),
      stops: (t.stops || []).filter(id => names.has(id)).map(id => stopLink(names.get(id).n)),
      tests: items(tests.filter(x => x.task === t.id && when(x) === 'build')).map(x => ({ label: 'Test:', ...x })),
    })),
    groups,
    elsewhere: (data.stops || []).flatMap((s, i) => (s.status === 'elsewhere' ? [{ n: i + 1, name: s.name, ticket: s.ticket ?? '', ...stopLink(i + 1) }] : [])),
  };
}

export function pageModel(data) {
  const stops = data.stops || [];
  const names = new Map(stops.map((s, i) => [s.id, { n: i + 1, name: s.name }]));
  const multi = (data.repos || []).length > 1;
  const uncommittedFiles = (data.repos || []).flatMap(r => (r.uncommitted || []).map(f => multi ? `${r.name}: ${f}` : f));
  const at = i => (i >= 0 && i < stops.length ? { n: i + 1, name: stops[i].name } : null);
  const plan = isPlan(data);
  const sketch = b => plan && isSketch(b);
  const model = {
    title: data.journey,
    built: builtLine(data),
    uncommittedFiles,
    checks: checksShort(data),
    reasons: reasonsLine(data),
    mapMissing: !data.checks?.map?.built,
    outOf: `of ${stops.length} ${stopWord(stops.length)}`,
    stops: stops.map((s, i) => {
      const code = s.code || [];
      const notes = s.notes || [];
      const kicker = `Stop ${i + 1} of ${stops.length}${plan ? taskPart(tasksOf(s.id, data)) : ''}`;
      const prev = at(i - 1), next = at(i + 1);
      const stop = {
        n: i + 1, id: s.id, name: s.name, summary: s.summary,
        kicker, label: `${kicker} — ${s.name}`,
        prevLabel: prev ? `← ${linkTo(prev)}` : '',
        nextLabel: next ? `${linkTo(next)} →` : '',
        badge: stopBadge(s),
        firstFile: !code.length ? '' : sketch(code[0]) ? code[0].file : range(code[0]),
        more: Math.max(0, code.length - 1),
        moreLabel: code.length > 1 ? `+${code.length - 1} more` : '',
        blocks: code.filter(b => !sketch(b)).map(blockModel),
        what: s.what, dataIn: s.data?.in, dataOut: s.data?.out,
        notes,
        notesLabel: `Notes on the code (${notes.length})`,
        whyLabel: whyLabel(s),
        why: (s.reasons || []).map(r => ({
          text: r.text, chip: chipLabel(r.source), detail: chipDetail(r, data),
          notRecorded: r.source.kind === 'not-recorded', tone: TONE[r.source.kind] || 'none',
        })),
        guesses: s.guesses || [],
      };
      return plan ? { ...stop, ...planStop(s, data) } : stop;
    }),
    extend: (data.extend || []).map(e => {
      const to = names.get(e.stop);
      return { where: range(e), text: e.text, stopN: to?.n, stopName: to?.name, link: to ? `${linkTo(to)} →` : '' };
    }),
  };
  if (!plan) return model;
  return {
    ...model, plan: true,
    built: planBuiltLine(data), checks: planChecksShort(data),
    reasonsKey: 'Stops:', reasons: planStopsLine(data),
    lookupOnly: 'Only stops with something open', extendTab: 'Build order',
    order: buildOrder(data, names),
  };
}

// ---- the page: one self-contained HTML file ----

const ASSETS = new URL('../../assets/', import.meta.url);
const asset = name => fs.readFileSync(new URL(name, ASSETS), 'utf8');

// Inside a <script> block a raw "<" can end it ("</script>") or open a comment ("<!--"), and
// U+2028/U+2029 break older script parsers. Each becomes its JSON escape, a backslash then uXXXX,
// built in code so no editor can turn the escape back into the character.
const BACKSLASH = String.fromCharCode(92);
const ESCAPES = ['<', String.fromCharCode(0x2028), String.fromCharCode(0x2029)]
  .map(ch => [ch, BACKSLASH + 'u' + ch.charCodeAt(0).toString(16).padStart(4, '0')]);

export function embedJson(value) {
  return ESCAPES.reduce((s, [ch, esc]) => s.split(ch).join(esc), JSON.stringify(value));
}

const CAPTION_STYLE = '<style>.bar{display:none!important}</style>';

// The map page as the frame gets it, one line per verified setting.
export function prepareMap(mapHtml) {
  const head = mapHtml.indexOf('</head>');
  if (head < 0) throw new Error('the map page has no </head>');
  let page = mapHtml;
  // caption_bar hidden: a style before </head> hides the map's own caption bar.
  if (CAPTION_BAR === 'hidden') page = page.slice(0, head) + CAPTION_STYLE + page.slice(head);
  // map_input blocked: nothing here; page.js stops the map's own keys and taps from the frame's window.
  return page;
}

const htmlText = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

// Every marker is found in the template before anything goes in, so text that is filled in
// (cited code can hold a marker, "$&" or "</script>") is never searched or rewritten.
function fill(template, values) {
  const spots = Object.entries(values).map(([marker, value]) => {
    const at = template.indexOf(marker);
    if (at < 0 || template.indexOf(marker, at + 1) >= 0) throw new Error(`page.html must hold ${marker} exactly once`);
    return { at, end: at + marker.length, value };
  }).sort((a, b) => a.at - b.at);
  let out = '', from = 0;
  for (const s of spots) { out += template.slice(from, s.at) + s.value; from = s.end; }
  return out + template.slice(from);
}

export function assemblePage(model, mapHtml) {
  return fill(asset('page.html'), {
    __TITLE__: htmlText(model.title),
    '/*__PAGE_CSS__*/': asset('page.css'),
    '//__PAGE_JS__': `const CODE_PANEL = ${JSON.stringify(CODE_PANEL)};\n${asset('page.js')}`,
    __WALK_DATA__: embedJson(model),
    __MAP_PAGE__: mapHtml == null ? 'null' : embedJson(prepareMap(mapHtml)),
  });
}
