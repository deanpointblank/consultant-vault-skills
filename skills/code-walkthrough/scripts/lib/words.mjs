import path from 'node:path';
import { findSavedCopy } from './quotes.mjs';
import { fromItems, isSketch } from './plan.mjs';

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const all = data => (data.stops || []).flatMap(s => s.reasons || []);
const isGap = r => r.source?.kind === 'not-recorded';

export function reasonCounts(data) {
  const rs = all(data);
  const notRecorded = rs.filter(isGap).length;
  return { recorded: rs.length - notRecorded, notRecorded };
}

const uncommittedOf = r => (Array.isArray(r.uncommitted) ? r.uncommitted : []);
const dirtyCount = data => (data.repos || []).reduce((n, r) => n + uncommittedOf(r).length, 0);
const commitList = data => (data.repos || []).map(r => `\`${r.name}\` at commit \`${r.commit}\``);
const andJoin = xs => xs.join(' and ');
const plus = data => { const n = dirtyCount(data); return n ? ` plus uncommitted changes in ${plural(n, 'file', 'files')}` : ''; };

export function builtLine(data) {
  return `Built from ${andJoin(commitList(data))}${plus(data)} on ${data.built}`;
}

const savedKeys = (q, kind) => new Set((q.savedOf && q.savedOf[kind]) || []);

function savedTail(q) {
  const tickets = savedKeys(q, 'ticket'), prs = savedKeys(q, 'pull-request');
  const what = (set, one, many) => set.size === 1 ? `a ${one}` : `${set.size} ${many}`;
  if (tickets.size && prs.size) return ' of tickets and pull requests';
  if (tickets.size) return ` of ${what(tickets, 'ticket', 'tickets')}`;
  if (prs.size) return ` of ${what(prs, 'pull request', 'pull requests')}`;
  return '';
}

function savedPhrase(q) {
  const n = q.saved || 0;
  if (!n) return '';
  const copy = n === 1 ? 'a saved copy' : 'saved copies';
  return q.quotes === 1 ? ` (in ${copy}${savedTail(q)})` : ` (${n} in ${copy}${savedTail(q)})`;
}

const count = (n, one, many) => n === 1 ? one : many;
const brokenCount = m => (Array.isArray(m.broken) ? m.broken.length : m.broken || 0);
const NOT_BUILT = 'not built, because chalk-talk is not installed';
// The build sets leftOut only when --chalk none was given while chalk-talk is installed; older data files never have it.
const LEFT_OUT = 'left out by the command';
const leftOut = m => m.leftOut === true;

export function checksShort(data) {
  const { quotes = {}, map = { built: false } } = data.checks || {};
  const q = quotes.quotes;
  const found = q === 0 ? 'no quotes to check' : `${plural(q, 'quote', 'quotes')} found`;
  const saved = quotes.saved ? ` (${quotes.saved} in ${quotes.saved === 1 ? 'a saved copy' : 'saved copies'})` : '';
  const arrows = map.arrows === 0 ? 'no map arrows' : `${map.traced} of ${map.arrows} map ${count(map.arrows, 'arrow', 'arrows')} traced, ${plural(map.guesses, 'guess', 'guesses')}`;
  const m = map.built ? arrows : `Map ${leftOut(map) ? LEFT_OUT : NOT_BUILT}`;
  return `Code matches the files · ${found}${saved} · ${m}`;
}

export function reasonsLine(data) {
  const { recorded, notRecorded } = reasonCounts(data);
  return `${recorded} recorded, ${notRecorded} not recorded`;
}

export function replyLines(data) {
  const { code = {}, quotes = {}, map = { built: false } } = data.checks || {};
  const repos = data.repos || [];
  const where = repos.length === 1 ? `commit \`${repos[0].commit}\`` : andJoin(commitList(data));
  const b0 = code.blocks;
  const codeLine = b0 === 1 ? `Code: the 1 block matches the file as built (${where}${plus(data)}).`
    : b0 === 0 ? `Code: there are no code blocks to check (${where}${plus(data)}).`
    : `Code: all ${b0} blocks match the files as built (${where}${plus(data)}).`;
  const q0 = quotes.quotes;
  const reasonLine = q0 === 0 ? 'Reasons: no reasons are recorded, so there are no quotes to check.'
    : q0 === 1 ? `Reasons: the 1 quote was found word for word in its source${savedPhrase(quotes)}.`
    : `Reasons: all ${q0} quotes were found word for word in their sources${savedPhrase(quotes)}.`;
  return [codeLine, reasonLine, ...mapLines(map)];
}

// plan: a plan's map line also says how many arrows are planned.
function mapLines(map, plan = false) {
  if (!map.built) return [leftOut(map) ? `Map: ${LEFT_OUT}.` : 'Map: not built, because chalk-talk is not installed. Get it from github.com/oztrkemree/chalk-talk and put it in ~/.claude/skills/chalk-talk.'];
  const lines = [];
  const g = map.guesses, br = brokenCount(map), n = map.arrows, p = map.planned || 0;
  const planned = !plan ? '' : n === 1 ? (p ? ' It is planned.' : ' It is not planned.') : ` ${p ? `${p} ${count(p, 'is', 'are')} planned` : 'None are planned'}.`;
  if (n === 0) lines.push('Map: there are no arrows to trace.');
  else if (n === 1) lines.push(`Map: ${map.traced === 1 ? 'the 1 arrow is' : '0 of 1 arrow is'} traced to a line of code.${planned} ${g ? 'It is marked as a guess.' : 'It is not marked as a guess.'} ${br ? 'It is broken.' : 'It is not broken.'}`);
  else lines.push(`Map: ${map.traced} of ${n} arrows are traced to a line of code.${planned} ${g ? `${g} ${count(g, 'is', 'are')} marked as ${count(g, 'a guess', 'guesses')}` : 'None are marked as guesses'}. ${br ? `${br} ${count(br, 'is', 'are')} broken` : 'None are broken'}.`);
  if (map.layoutChecked === false) lines.push('Map: not checked by eye, because Chrome was not found.');
  return lines;
}

// The reply's not-recorded questions, ready to copy: numbered across the walkthrough, in stop order, one per line.
export function questionLines(data) {
  return all(data).filter(isGap).map((r, i) => `${i + 1}. ${String(r.text).replace(/\s+/g, ' ').trim()}`);
}

const gaps = stop => (stop.reasons || []).filter(isGap).length;

export function stopBadge(stop) {
  const n = gaps(stop), total = (stop.reasons || []).length;
  if (!n) return '';
  return n === total ? 'nothing recorded' : `${n} not recorded`;
}

export function outlineTail(stop) {
  const n = gaps(stop), total = (stop.reasons || []).length;
  if (!n) return 'Reasons recorded.';
  return n === total ? 'Nothing recorded.' : `${plural(n, 'reason', 'reasons')} not recorded.`;
}

export function whyLabel(stop) {
  const n = gaps(stop);
  return `Why ${(stop.reasons || []).length}${n ? ` · ${n} not recorded` : ''}`;
}

const prNumber = ref => (typeof ref === 'object' && ref ? ref.number : ref);

export function chipLabel(source) {
  const { kind, ref } = source;
  switch (kind) {
    case 'vault-note': return 'vault note';
    case 'design-doc': return 'design doc';
    case 'commit': return `commit ${String(ref?.hash ?? '').slice(0, 7)}`;
    case 'pull-request': return `pull request #${prNumber(ref)}`;
    case 'ticket': return `ticket ${ref}`;
    case 'code-comment': return 'code comment';
    case 'build-note': return 'build note';
    case 'chat': return 'chat';
    case 'plan-file': return 'plan';
    default: return 'not recorded';
  }
}

export function chipDetail(reason, data) {
  const { source } = reason;
  const { kind, ref } = source;
  if (kind === 'not-recorded') return 'Not recorded: no source gives this reason.';
  let where = chipLabel(source);
  if (kind === 'vault-note') where += `, ${ref}`;
  if (kind === 'design-doc') where += `, ${ref?.path}`;
  if (kind === 'code-comment') where += `, ${ref?.file}:${ref?.line}`;
  if (kind === 'build-note') where += `, ${path.basename(String(ref))}`;
  if (kind === 'ticket' || kind === 'pull-request') {
    const pr = typeof ref === 'object' && ref ? ref : { number: ref };
    const key = kind === 'ticket' ? String(ref) : `${pr.repo ?? ''}#${pr.number}`;
    const copy = savedKeys(data.checks?.quotes || {}, kind).has(key) ? findSavedCopy(data, kind, kind === 'ticket' ? ref : pr) : null;
    if (copy) where += `, saved copy fetched ${copy.fetched}`;
  }
  return `“${reason.quote}” — ${where}`;
}

// Plan mode: the words for code not yet written.

const ORIGIN_TAGS = { plan: 'In plan', review: 'Awaiting review', proposal: 'Proposal', open: 'Open' };
export const originTag = from => ORIGIN_TAGS[from?.kind] || '';

const PROPOSED = ['sketch', 'choice', 'task'];
const choicesOf = data => (data.stops || []).flatMap(s => s.choices || []);
const isOpen = c => c.from?.kind === 'open';

export function planCounts(data) {
  const stops = data.stops || [], p = data.plan || {};
  const status = { new: 0, changed: 0, unchanged: 0, elsewhere: 0 };
  for (const s of stops) if (Object.hasOwn(status, s.status)) status[s.status]++;
  const blocks = stops.flatMap(s => s.code || []);
  const sketches = blocks.filter(isSketch).length;
  return {
    status,
    open: choicesOf(data).filter(isOpen).length,
    proposals: fromItems(data).filter(x => PROPOSED.includes(x.what) && x.from?.kind === 'proposal').length,
    tasks: (p.tasks || []).length, tests: (p.tests || []).length, risks: (p.risks || []).length, outOfScope: (p.out_of_scope || []).length,
    today: blocks.length - sketches, sketches,
  };
}

const atCommit = r => `(commit ${r.commit})`;

export function planBuiltLine(data) {
  const repos = data.repos || [];
  const one = repos.length === 1 ? repos[0] : null;
  const where = one ? (one.base ? `at \`${one.base}\` ${atCommit(one)}` : `on disk at commit ${one.commit}`)
    : andJoin(repos.map(r => (r.base ? `at \`${r.base}\` in ${r.name} ${atCommit(r)}` : `on disk in ${r.name} ${atCommit(r)}`)));
  return `Code as ${where}${plus(data)}, ${data.built}. Nothing in this plan is built yet.`;
}

// What the today blocks were checked against: the base, the disk, or both across repos.
const target = (data, disk) => {
  const repos = data.repos || [];
  if (repos.length > 1) return 'the code as built';
  return repos[0]?.base || disk;
};

const arrowsShort = map => {
  if (!map.built) return `Map ${leftOut(map) ? LEFT_OUT : NOT_BUILT}`;
  if (map.arrows === 0) return 'no map arrows';
  return `${map.traced} of ${plural(map.arrows, 'arrow', 'arrows')} traced, ${map.planned || 0} planned, ${plural(map.guesses, 'guess', 'guesses')}`;
};

export function planChecksShort(data) {
  const { code = {}, quotes = {}, map = { built: false } } = data.checks || {};
  const b = code.blocks;
  const today = b === 0 ? 'no today blocks' : `${plural(b, 'today block', 'today blocks')} ${count(b, 'matches', 'match')} ${target(data, 'the files')}`;
  const found = quotes.quotes === 0 ? 'no quotes to check' : `${plural(quotes.quotes, 'quote', 'quotes')} found`;
  return `${today} · ${plural(code.sketches, 'sketch', 'sketches')} not checked · ${found} · ${arrowsShort(map)}`;
}

export function planStopsLine(data) {
  const c = planCounts(data);
  const words = { new: 'new', changed: 'changed', unchanged: 'unchanged', elsewhere: 'built by another ticket' };
  const status = Object.keys(words).filter(k => c.status[k]).map(k => `${c.status[k]} ${words[k]}`).join(', ');
  return `${status} · ${c.open} open · ${plural(c.proposals, 'proposal', 'proposals')}`;
}

// How many quotes came from a saved copy of each plan source kind, counted as checkQuotes counts them.
const savedFrom = (data, q, kind) => {
  const keys = savedKeys(q, kind);
  return fromItems(data).filter(({ from }) => ['plan', 'review'].includes(from?.kind) && from.source?.kind === kind && keys.has(String(from.source.ref))).length;
};

function planSavedPhrase(data, q) {
  const n = q.saved || 0;
  if (!n) return '';
  const chat = savedFrom(data, q, 'chat'), file = savedFrom(data, q, 'plan-file'), rest = n - chat - file;
  const files = savedKeys(q, 'plan-file').size, chats = savedKeys(q, 'chat').size;
  const num = k => (q.quotes === 1 ? '' : `${k} `);
  const parts = [];
  if (chat) parts.push(`${num(chat)}in ${chats > 1 ? 'saved copies' : 'a saved copy'} of the chat`);
  if (file) parts.push(`${num(file)}in ${files > 1 ? `saved copies of ${files} plan files, which are gone` : 'a saved copy of the plan file, which is gone'}`);
  if (rest > 0) parts.push(`${num(rest)}in ${rest === 1 ? 'a saved copy' : 'saved copies'}${savedTail(q)}`);
  return parts.length ? ` (${parts.join('; ')})` : '';
}

export function planReplyLines(data) {
  const { code = {}, quotes = {}, map = { built: false } } = data.checks || {};
  const repos = data.repos || [];
  const commits = repos.length === 1 ? `commit ${repos[0].commit}`
    : repos.map(r => `${r.name} ${r.base ? `at ${r.base}` : 'on disk'}, commit ${r.commit}`).join('; ');
  const b = code.blocks, k = code.sketches;
  const today = b === 0 ? `there are no today blocks to check (${repos.length === 1 ? `${repos[0].base || 'on disk'}, ` : ''}${commits}${plus(data)})`
    : `${b === 1 ? 'the 1 today block matches' : `the ${b} today blocks match`} ${target(data, 'the files on disk')} (${commits}${plus(data)})`;
  const codeLine = `Code: ${today}. ${plural(k, 'sketch', 'sketches')} ${count(k, 'is', 'are')} not checked.`;
  const q = quotes.quotes;
  const sources = q === 0 ? 'Sources: there are no quotes to check.'
    : `Sources: ${q === 1 ? 'the 1 quote was' : `all ${q} quotes were`} found word for word${planSavedPhrase(data, quotes)}.`;
  const c = planCounts(data);
  const planLine = `Plan: ${plural(c.tasks, 'task', 'tasks')}, ${plural(c.tests, 'test', 'tests')}, ${plural(c.risks, 'risk', 'risks')}, ${c.outOfScope} out of scope. ${plural(c.open, 'open question', 'open questions')}, ${plural(c.proposals, 'proposal', 'proposals')}.`;
  return [codeLine, sources, ...mapLines(map, true), planLine];
}

// The plan's questions, ready to copy: its open choices in stop order, then the not-recorded reasons, numbered on.
export function planQuestionLines(data) {
  const texts = [...choicesOf(data).filter(isOpen), ...all(data).filter(isGap)].map(x => String(x.text).replace(/\s+/g, ' ').trim());
  return texts.map((t, i) => `${i + 1}. ${t}`);
}
