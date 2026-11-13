import { execFileSync } from 'node:child_process';

export const READ_ONLY_GIT = ['rev-parse', 'status', 'log', 'show', 'diff', 'cat-file', 'ls-files'];

// What `git rev-parse --local-env-vars` lists (git 2.50): the variables that point git at another repo,
// index, object store or config, over `-C`. Written out here so no git has to run before the first call.
const LOCAL_ENV_VARS = ['GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_CONFIG', 'GIT_CONFIG_PARAMETERS', 'GIT_CONFIG_COUNT',
  'GIT_OBJECT_DIRECTORY', 'GIT_DIR', 'GIT_WORK_TREE', 'GIT_IMPLICIT_WORK_TREE', 'GIT_GRAFT_FILE', 'GIT_INDEX_FILE',
  'GIT_NO_REPLACE_OBJECTS', 'GIT_REPLACE_REF_BASE', 'GIT_PREFIX', 'GIT_SHALLOW_FILE', 'GIT_COMMON_DIR'];

// The environment for git and for whatever runs git (gh, chalk-talk): the caller's, without those variables, optional locks off.
export function gitEnv() {
  const env = { ...process.env, GIT_OPTIONAL_LOCKS: '0' };
  for (const k of LOCAL_ENV_VARS) delete env[k];
  return env;
}

export function gitRead(repoPath, args) {
  if (!READ_ONLY_GIT.includes(args[0])) throw new Error(`git ${args[0]} is refused: this tool is read only`);
  return execFileSync('git', ['-C', repoPath, ...args], {
    encoding: 'utf8',
    env: { ...gitEnv(), GIT_LITERAL_PATHSPECS: '1', GIT_NO_LAZY_FETCH: '1', GIT_TERMINAL_PROMPT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

export function repoFacts(repoPath, files) {
  let commit;
  try { commit = gitRead(repoPath, ['rev-parse', '--short=7', 'HEAD']).trim(); }
  catch { throw new Error(`${repoPath} is not a git repo`); }
  const uncommitted = [];
  if (files.length) {
    const parts = gitRead(repoPath, ['status', '--porcelain=v1', '-z', '--untracked-files=all', '--', ...files]).split('\0');
    for (let i = 0; i < parts.length; i++) {
      const entry = parts[i];
      if (entry.length < 4) continue;
      uncommitted.push(entry.slice(3));
      if (/[RC]/.test(entry.slice(0, 2))) i++;
    }
  }
  return { commit, uncommitted };
}

export const isCommitHash = s => typeof s === 'string' && /^[0-9a-f]{4,40}$/i.test(s);
