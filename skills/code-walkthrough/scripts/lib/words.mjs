import { findSavedCopy } from './quotes.mjs';

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

function savedPhrase(q) {
  const n = q.saved || 0;
  if (!n) return '';
  const of = q.savedOf || [];
  const prs = new Set(of.filter(k => String(k).includes('#')));
  const tickets = new Set(of.filter(k => !String(k).includes('#')));
  const what = (set, one, many) => set.size === 1 ? `a ${one}` : `${set.size} ${many}`;
  let tail = '';
  if (tickets.size && prs.size) tail = ' of tickets and pull requests';
  else if (tickets.size) tail = ` of ${what(tickets, 'ticket', 'tickets')}`;
  else if (prs.size) tail = ` of ${what(prs, 'pull request', 'pull requests')}`;
  return ` (${n} in ${n === 1 ? 'a saved copy' : 'saved copies'}${tail})`;
}

const count = (n, one, many) => n === 1 ? one : many;
const brokenCount = m => (Array.isArray(m.broken) ? m.broken.length : m.broken || 0);
const NOT_BUILT = 'not built, because chalk-talk is not installed';

export function checksShort(data) {
  const { quotes = {}, map = { built: false } } = data.checks || {};
  const saved = quotes.saved ? ` (${quotes.saved} in saved copies)` : '';
  const m = map.built ? `${map.traced} of ${map.arrows} map arrows traced, ${plural(map.guesses, 'guess', 'guesses')}` : `Map ${NOT_BUILT}`;
  return `Code matches the files · ${quotes.quotes} quotes found${saved} · ${m}`;
}

export function reasonsLine(data) {
  const { recorded, notRecorded } = reasonCounts(data);
  return `${recorded} recorded, ${notRecorded} not recorded`;
}

export function replyLines(data) {
  const { code = {}, quotes = {}, map = { built: false } } = data.checks || {};
  const repos = data.repos || [];
  const where = repos.length === 1 ? `commit \`${repos[0].commit}\`` : andJoin(commitList(data));
  const lines = [
    `Code: all ${code.blocks} blocks match the files as built (${where}${plus(data)}).`,
    `Reasons: all ${quotes.quotes} quotes were found word for word in their sources${savedPhrase(quotes)}.`,
  ];
  if (!map.built) {
    lines.push('Map: not built, because chalk-talk is not installed. Get it from github.com/oztrkemree/chalk-talk and put it in ~/.claude/skills/chalk-talk.');
    return lines;
  }
  const g = map.guesses, b = brokenCount(map);
  lines.push(`Map: ${map.traced} of ${map.arrows} arrows are traced to a line of code. ${g ? `${g} ${count(g, 'is', 'are')} marked as ${count(g, 'a guess', 'guesses')}` : 'None are marked as guesses'}. ${b ? `${b} ${count(b, 'is', 'are')} broken` : 'None are broken'}.`);
  if (map.layoutChecked === false) lines.push('Map: not checked by eye, because Chrome was not found.');
  return lines;
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
  if (kind === 'ticket' || kind === 'pull-request') {
    const copy = findSavedCopy(data, kind, kind === 'ticket' ? ref : (typeof ref === 'object' && ref ? ref : { number: ref }));
    if (copy) where += `, saved copy fetched ${copy.fetched}`;
  }
  return `“${reason.quote}” — ${where}`;
}
