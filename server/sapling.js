import { execFile } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(execFile);
const SL = 'sl';

async function sl(args, repoPath) {
  try {
    const { stdout } = await execAsync(SL, args, {
      cwd: repoPath,
      maxBuffer: 10 * 1024 * 1024,
      env: { ...process.env, HGPLAIN: '1' },
    });
    return stdout;
  } catch (err) {
    if (err.stderr) {
      throw new Error(`sl ${args[0]} failed: ${err.stderr.trim()}`);
    }
    throw err;
  }
}

export async function getRepoRoot(repoPath) {
  const out = await sl(['root'], repoPath);
  return out.trim();
}

export async function getStack(repoPath) {
  const template = '{node|short}\\t{author|person}\\t{date|isodate}\\t{desc|firstline}\\n';
  const out = await sl(
    ['log', '-r', 'sort(ancestors(.) & draft(), rev)', '-T', template],
    repoPath
  );

  if (!out.trim()) return [];

  return out
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, author, date, ...subjectParts] = line.split('\t');
      return { hash, author, date, subject: subjectParts.join('\t') };
    });
}

export async function getCommitDetail(repoPath, rev) {
  const template =
    '{node|short}\\t{author|person}\\t{date|isodate}\\t{desc|firstline}\\t{desc}\\t{file_adds % "{file}\\n"}\\t{file_dels % "{file}\\n"}\\t{file_mods % "{file}\\n"}';
  const out = await sl(['log', '-r', rev, '-T', template], repoPath);
  const [hash, author, date, subject, body, adds, dels, mods] = out.split('\t');
  return {
    hash,
    author,
    date,
    subject,
    body,
    filesAdded: adds ? adds.trim().split('\n').filter(Boolean) : [],
    filesDeleted: dels ? dels.trim().split('\n').filter(Boolean) : [],
    filesModified: mods ? mods.trim().split('\n').filter(Boolean) : [],
  };
}

export async function getDiff(repoPath, rev) {
  return await sl(['diff', '-c', rev, '-g', '--nodates'], repoPath);
}

export async function getStackDiff(repoPath) {
  // Diff from the parent of the earliest draft commit to the working copy parent
  try {
    return await sl(
      ['diff', '-r', 'last(ancestors(.) & public())', '-g', '--nodates'],
      repoPath
    );
  } catch {
    // If no public ancestor, diff against the root
    return await sl(['diff', '-r', 'null', '-g', '--nodates'], repoPath);
  }
}

export async function getSmartlog(repoPath) {
  return await sl(['smartlog', '-T', '{node|short} {desc|firstline}\\n'], repoPath);
}

export async function getCurrentRev(repoPath) {
  const out = await sl(['log', '-r', '.', '-T', '{node|short}'], repoPath);
  return out.trim();
}
