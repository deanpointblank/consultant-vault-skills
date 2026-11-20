import { OUTCOME, EMBED_HEIGHT, OPEN_LINK } from './settings.mjs';
import { builtLine, reasonCounts, outlineTail, originTag, planCounts, planBuiltLine } from './words.mjs';
import { isPlan, tasksOf } from './plan.mjs';

const q = JSON.stringify;
const list = (key, items) => (items.length ? [`${key}:`, ...items.map(i => `  - ${i}`)] : []);
const plainKey = k => (/^[A-Za-z0-9._-]+$/.test(k) ? k : q(String(k)));

export function noteText(data, names, opts = {}) {
  if (isPlan(data)) return planNoteText(data, names, opts);
  const { outcome = OUTCOME, embedHeight = EMBED_HEIGHT, openLink = OPEN_LINK } = opts;
  const repos = data.repos || [], stops = data.stops || [];
  const multi = repos.length > 1;
  const dirty = repos.flatMap(r => (r.uncommitted || []).map(f => (multi ? `${r.name}: ${f}` : f)));
  const { recorded, notRecorded } = reasonCounts(data);
  const front = [
    '---',
    'type: code-walkthrough',
    `client: ${data.client}`,
    `created: ${data.built}`,
    ...list('repos', repos.map(r => q(`[[${r.name}]]`))),
    ...list('commits', repos.map(r => q(`${r.name}@${r.commit}`))),
    ...list('uncommitted', repos.flatMap(r => (r.uncommitted || []).map(f => q(`${r.name}: ${f}`)))),
    `journey: ${q(data.journey)}`,
    `stops: ${stops.length}`,
    `reasons_recorded: ${recorded}`,
    `reasons_not_recorded: ${notRecorded}`,
    ...list('jira', (data.jira || []).map(plainKey)),
    '---',
  ];
  const builtText = `${builtLine(data)}${dirty.length ? ` (${dirty.map(f => `\`${f}\``).join(', ')})` : ''}. The code may have changed since.`;
  const embed = `![[${names.page}|height: ${embedHeight}px]]`;
  const body = ['', `# ${data.journey}`, ''];
  if (outcome === 2) {
    body.push(openLink === 'button'
      ? 'Use the "open in external browser" button on the page below to read this walkthrough.'
      : `Open [[${names.page}]] in your browser to read this walkthrough.`, '');
  }
  body.push(data.summary, '', builtText, '', embed, '');
  body.push(`Not showing, or too small? Open [[${names.page}]], or use the "open in external browser" button on the page above.`, '');
  if (names.earlier) body.push(`Earlier walkthrough of this journey: [[${names.earlier}]].`, '');
  body.push('## Stops', '');
  stops.forEach((s, i) => {
    const code = s.code || [];
    const first = code.length ? `\`${code[0].file}:${code[0].lines[0]}-${code[0].lines[1]}\`${code.length > 1 ? ` (+${code.length - 1} more)` : ''}` : '';
    body.push(`${i + 1}. **${s.name}** · ${first ? `${first} · ` : ''}${s.summary} ${outlineTail(s)}`);
  });
  const nameOf = new Map(stops.map((s, i) => [s.id, i + 1]));
  if ((data.extend || []).length) {
    body.push('', '## Where to extend', '');
    for (const e of data.extend) body.push(`- \`${e.file}:${e.lines[0]}-${e.lines[1]}\` (stop ${nameOf.get(e.stop)}): ${e.text}`);
  }
  return [...front, ...body, ''].join('\n');
}

// "task 2", "tasks 1, 2"; the same for stops.
const numbered = (word, ns) => (ns.length ? `${word}${ns.length > 1 ? 's' : ''} ${ns.join(', ')}` : '');

export function planNoteText(data, names, { embedHeight = EMBED_HEIGHT } = {}) {
  const repos = data.repos || [], stops = data.stops || [], c = planCounts(data);
  const front = [
    '---',
    'type: code-plan',
    `client: ${data.client}`,
    `created: ${data.built}`,
    ...list('repos', repos.map(r => q(`[[${r.name}]]`))),
    ...list('commits', repos.map(r => q(`${r.name}@${r.commit}`))),
    ...list('base', repos.filter(r => r.base).map(r => q(`${r.name}@${r.base}`))),
    `journey: ${q(data.journey)}`,
    `stops: ${stops.length}`,
    ...Object.entries(c.status).map(([k, n]) => `stops_${k}: ${n}`),
    `open: ${c.open}`,
    `proposals: ${c.proposals}`,
    ...list('jira', (data.jira || []).map(plainKey)),
    '---',
  ];
  const body = ['', `# ${data.journey}`, '', data.summary, '', planBuiltLine(data), '', `![[${names.page}|height: ${embedHeight}px]]`, ''];
  if (names.earlier) body.push(`Earlier plan of this journey: [[${names.earlier}]].`, '');
  if (data.walkthrough) body.push(`Walkthrough of the same code: [[${data.walkthrough}]].`, '');
  body.push('## Stops', '');
  stops.forEach((s, i) => {
    const parts = [s.status, originTag(s.from).toLowerCase(), numbered('task', tasksOf(s.id, data)), s.summary].filter(Boolean);
    body.push(`${i + 1}. **${s.name}** · ${parts.join(' · ')}`);
  });
  const stopNo = new Map(stops.map((s, i) => [s.id, i + 1]));
  const tasks = (data.plan || {}).tasks || [];
  if (tasks.length) {
    body.push('', '## Build order', '');
    tasks.forEach((t, i) => body.push(`${i + 1}. ${t.name} (${originTag(t.from).toLowerCase()}) · ${numbered('stop', (t.stops || []).map(id => stopNo.get(id)))}`));
  }
  const open = stops.flatMap(s => (s.choices || []).filter(ch => ch.from?.kind === 'open'));
  if (open.length) {
    body.push('', '## Open questions', '');
    open.forEach((ch, i) => body.push(`${i + 1}. ${String(ch.text).replace(/\s+/g, ' ').trim()}`));
  }
  return [...front, ...body, ''].join('\n');
}
