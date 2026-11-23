import { plainRelative } from './git.mjs';

export const isPlan = data => data?.mode === 'plan';

export const STATUSES = ['new', 'changed', 'unchanged', 'elsewhere'];

export const isSketch = block => block?.planned === true;

// Counted as code.mjs's splitLines counts; not imported from there, which would make an import cycle.
const lineCount = t => { const ls = t.split(/\r\n|\n|\r/); if (ls.at(-1) === '') ls.pop(); return ls.length; };

// Each stop's status, the code its status allows, and each sketch's shape.
export function sketchErrors(data) {
  const errors = [];
  for (const s of data.stops || []) {
    const id = s.id;
    const code = s.code || [];
    const sketches = code.filter(isSketch).length, today = code.length - sketches;
    if (s.status === undefined) errors.push(`stop ${id} has no status; use new, changed, unchanged or elsewhere`);
    else if (!STATUSES.includes(s.status)) errors.push(`stop ${id} has status ${s.status}; use new, changed, unchanged or elsewhere`);
    if (s.status === 'unchanged' && sketches) errors.push(`stop ${id} is unchanged, so it cannot hold a sketch`);
    if (s.status === 'new' && today) errors.push(`stop ${id} is new, so its code is sketches only`);
    if (s.status === 'new' && !sketches) errors.push(`stop ${id} is new, so it needs a sketch`);
    if (s.status === 'changed' && (!today || !sketches)) errors.push(`stop ${id} is changed, so it needs today's code and a sketch`);
    code.forEach((b, i) => {
      if (!isSketch(b)) return;
      const at = `stop ${id} code block ${i + 1}`;
      // fieldProblem's words, since a sketch skips fieldProblem.
      if (typeof b.file !== 'string' || !b.file) errors.push(`${at} has no file name`);
      else if (!plainRelative(b.file) || b.file.startsWith('./')) errors.push(`${at} is a sketch, so its file must be a path from the repo top`);
      if (typeof b.new_file !== 'boolean') errors.push(`${at} is a sketch, so it needs new_file as true or false`);
      if (typeof b.text !== 'string') errors.push(`${at} has no text`);
      else {
        const n = lineCount(b.text);
        if (n > 30) errors.push(`${at} is a sketch of ${n} lines; keep it to 30 or fewer`);
        if (n < 2) errors.push(`${at} is a sketch of ${n} ${n === 1 ? 'line' : 'lines'}; give it 2 or more`);
      }
      if (b.lines !== undefined || b.key_lines !== undefined || b.left_out !== undefined) errors.push(`${at} is a sketch, so it cannot have lines, key_lines or left_out`);
      if (b.after !== undefined && b.new_file === true) errors.push(`${at} has after and new_file together; use one`);
      if (b.after !== undefined && !(Number.isInteger(b.after) && b.after >= 1) && !(typeof b.after === 'string' && b.after)) errors.push(`${at} needs after as a whole number, 1 or more, or as text from the file`);
    });
  }
  return errors;
}

export const ORIGIN_KINDS = ['plan', 'review', 'proposal', 'open'];

// Own list, not data.mjs's SOURCE_KINDS, which would make an import cycle.
export const FROM_SOURCES = ['design-doc', 'vault-note', 'ticket', 'pull-request', 'commit', 'plan-file', 'chat'];

// Every part of a plan that can have a from, with what originErrors needs to judge it.
function fromSlots(data) {
  const slots = [];
  for (const s of data.stops || []) {
    slots.push({ at: `stop ${s.id}`, what: 'stop', from: s.from, status: s.status });
    (s.code || []).forEach((b, i) => { if (isSketch(b)) slots.push({ at: `stop ${s.id} code block ${i + 1}`, what: 'sketch', from: b.from }); });
    (s.choices || []).forEach((c, i) => slots.push({ at: `stop ${s.id} choice ${i + 1}`, what: 'choice', from: c.from, text: c.text }));
  }
  const plan = data.plan || {};
  for (const t of plan.tasks || []) slots.push({ at: `task ${t.id}`, what: 'task', from: t.from });
  for (const [list, name, what] of [[plan.tests, 'test', 'test'], [plan.risks, 'risk', 'risk'], [plan.out_of_scope, 'out of scope', 'out-of-scope']]) {
    (list || []).forEach((x, i) => slots.push({ at: `${name} ${i + 1}`, what, from: x.from }));
  }
  return slots;
}

// Each from given in the plan, in page order.
export const fromItems = data => fromSlots(data).filter(x => x.from !== undefined).map(({ at, what, from }) => ({ at, what, from }));

// One failure per part at most: the first rule it breaks.
function originError({ at, what, from, status, text }) {
  if (what === 'stop' && status === 'unchanged') return from === undefined ? null : `${at} is unchanged, so it has no from`;
  if (what === 'stop' && !['new', 'changed', 'elsewhere'].includes(status)) return null;
  if (from === undefined) return `${at} has no from; mark it plan, review or proposal`;
  const { kind, quote, source } = from || {};
  if (!ORIGIN_KINDS.includes(kind)) return `${at} from has an unknown kind, ${kind}; use plan, review, proposal or open`;
  if (kind === 'open') {
    if (what !== 'choice') return `${at} is open, but only a choice can be open`;
    if (!String(text || '').trim().endsWith('?')) return `${at} is open, so its text must be a question`;
    if (quote !== undefined) return `${at} is open, so it cannot have a quote`;
    return null;
  }
  if (kind === 'proposal') return quote === undefined ? null : `${at} is a proposal, so it cannot have a quote`;
  if (!quote || !source) return `${at} ${kind === 'plan' ? 'comes from the plan' : 'is awaiting review'}, so it needs a quote and a source`;
  if (!FROM_SOURCES.includes(source.kind)) return `${at} from has an unknown source kind, ${source.kind}`;
  return null;
}

export const originErrors = data => fromSlots(data).map(originError).filter(Boolean);

export const WHENS = ['build', 'before', 'after'];

// The 1-based numbers of the tasks that name a stop, in task order.
export const tasksOf = (stopId, data) => ((data.plan || {}).tasks || []).flatMap((t, i) => (t.stops || []).includes(stopId) ? [i + 1] : []);

// Tasks, tests, risks and out of scope against the stops.
export function taskErrors(data) {
  if (!data.plan || typeof data.plan !== 'object') return ['there is no plan object; add one with inputs and tasks'];
  const errors = [], p = data.plan, tasks = p.tasks || [];
  const stops = new Map((data.stops || []).map(s => [s.id, s]));
  const seen = new Set();
  for (const t of tasks) {
    if (seen.has(t.id)) errors.push(`task ${t.id} appears twice`);
    seen.add(t.id);
    if (typeof t.name !== 'string' || !t.name.trim()) errors.push(`task ${t.id} has no name`);
    if (!(t.stops || []).length) errors.push(`task ${t.id} names no stop`);
    for (const id of t.stops || []) {
      if (!stops.has(id)) errors.push(`task ${t.id} names stop ${id}, which does not exist`);
      else if (!['new', 'changed'].includes(stops.get(id).status)) errors.push(`task ${t.id} names stop ${id}, which is ${stops.get(id).status} and belongs to no task`);
    }
  }
  for (const s of data.stops || []) {
    if (['new', 'changed'].includes(s.status) && !tasksOf(s.id, data).length) errors.push(`stop ${s.id} is ${s.status} and no task builds it`);
  }
  (p.tests || []).forEach((x, i) => {
    if (x.task !== undefined && !seen.has(x.task)) errors.push(`test ${i + 1} names task ${x.task}, which does not exist`);
    if (x.when !== undefined && !WHENS.includes(x.when)) errors.push(`test ${i + 1} has when ${x.when}; use build, before or after`);
    if (typeof x.text !== 'string' || !x.text.trim()) errors.push(`test ${i + 1} has no text`);
  });
  for (const [list, name] of [[p.risks, 'risk'], [p.out_of_scope, 'out of scope']]) {
    (list || []).forEach((x, i) => { if (typeof x.text !== 'string' || !x.text.trim()) errors.push(`${name} ${i + 1} has no text`); });
  }
  return errors;
}

export const nameKey = s => String(s).trim().toLowerCase();

// Takes and gives, and the data chain: each stop's takes come from plan.inputs or an earlier stop's gives.
export function chainErrors(data) {
  if (!data.plan || typeof data.plan !== 'object') return []; // taskErrors reports the missing plan
  const errors = [];
  if (!Array.isArray(data.plan.inputs)) errors.push('plan.inputs is missing; list what the journey starts with');
  const known = new Set((Array.isArray(data.plan.inputs) ? data.plan.inputs : []).map(nameKey));
  for (const s of data.stops || []) {
    const built = ['new', 'changed'].includes(s.status);
    if (built && !Array.isArray(s.takes)) errors.push(`stop ${s.id} has no takes`);
    if (built && !(Array.isArray(s.gives) && s.gives.length)) errors.push(`stop ${s.id} gives nothing`);
    if (s.status !== 'elsewhere') for (const n of Array.isArray(s.takes) ? s.takes : []) {
      if (!known.has(nameKey(n))) errors.push(`stop ${s.id} takes "${n}", which no earlier stop gives and plan.inputs does not list`);
    }
    for (const n of Array.isArray(s.gives) ? s.gives : []) known.add(nameKey(n));
  }
  return errors;
}

const escapeRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The writing rules on each stop's what, points and today: short plain text, no cited names, no code.
export function writingErrors(data) {
  const blocks = (data.stops || []).flatMap(s => Array.isArray(s.code) ? s.code : []);
  const named = list => [...new Set(list.filter(n => typeof n === 'string' && n))];
  const paths = named(blocks.map(b => b.file));
  // Full paths first, so a text with src/store.js names it rather than its base name store.js.
  const files = named([...paths, ...paths.map(f => f.split('/').pop())]);
  const functions = named(blocks.map(b => b.function));
  // Whole words only, so the stem store never matches store.js.
  const cited = (text, names) => names.find(n => new RegExp(`(?<!\\w)${escapeRe(n)}(?!\\w)`).test(text));
  const wordCount = text => (text.match(/\S+/g) || []).length;
  const nameErrors = (at, text) => {
    const errors = [], file = cited(text, files), fn = cited(text, functions);
    if (file) errors.push(`${at} names ${file}; keep file names in the header and the code`);
    if (fn) errors.push(`${at} names ${fn}; keep function names in the header and the code`);
    if (text.includes('`')) errors.push(`${at} holds a backtick; keep code in the code blocks`);
    return errors;
  };
  const partErrors = (at, { what, points }) => {
    const errors = [];
    if (typeof what !== 'string' || !what.trim()) errors.push(`${at} has no what`);
    else {
      const words = wordCount(what), sentences = 1 + (what.match(/[.!?]\s+\S/g) || []).length;
      if (words > 30) errors.push(`${at} what is ${words} words; keep it to one sentence of 30 or fewer`);
      if (sentences > 1) errors.push(`${at} what is ${sentences} sentences; keep it to one`);
      errors.push(...nameErrors(`${at} what`, what));
    }
    const list = Array.isArray(points) ? points : [];
    if (list.length > 4) errors.push(`${at} has ${list.length} points; keep it to 4 or fewer`);
    list.forEach((p, i) => {
      const text = String(p ?? ''), words = wordCount(text);
      if (words > 20) errors.push(`${at} point ${i + 1} is ${words} words; keep it to 20 or fewer`);
      errors.push(...nameErrors(`${at} point ${i + 1}`, text));
    });
    return errors;
  };
  const errors = [];
  for (const s of data.stops || []) {
    const at = `stop ${s.id}`, today = s.today;
    errors.push(...partErrors(at, s));
    if (s.status === 'changed') {
      if (!today || typeof today.what !== 'string' || !today.what.trim() || !Array.isArray(today.points)) errors.push(`${at} is changed, so it needs today with what and points`);
      else errors.push(...partErrors(`${at} today`, today));
    } else if (today !== undefined && STATUSES.includes(s.status)) errors.push(`${at} is ${s.status}, so it has no today`);
  }
  return errors;
}

// Shape failures that only a plan has. Later checks are added to this list.
export function planShapeErrors(data) {
  const errors = [];
  if (data.extend !== undefined) errors.push('a plan has no extend points; put the work in plan.tasks');
  errors.push(...sketchErrors(data));
  errors.push(...originErrors(data));
  errors.push(...taskErrors(data));
  errors.push(...chainErrors(data));
  errors.push(...writingErrors(data));
  return errors;
}
