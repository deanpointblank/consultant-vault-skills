import { execFileSync } from 'node:child_process';

export const READ_ONLY_GIT = ['rev-parse', 'status', 'log', 'show', 'diff', 'cat-file', 'ls-files'];

export function gitRead(repoPath, args) {
  if (!READ_ONLY_GIT.includes(args[0])) throw new Error(`git ${args[0]} is refused: this tool is read only`);
  return execFileSync('git', ['-C', repoPath, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
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
