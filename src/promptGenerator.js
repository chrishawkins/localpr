export function generatePrompt(comments, commits) {
  if (comments.length === 0) return '';

  // Group comments by commit hash
  const byCommit = new Map();
  for (const c of comments) {
    if (!byCommit.has(c.commitHash)) byCommit.set(c.commitHash, []);
    byCommit.get(c.commitHash).push(c);
  }

  const lines = [];
  lines.push('Please address the following code review feedback on the current stack of commits.');
  lines.push('');

  // Iterate in stack order (use commits array order)
  const commitOrder = commits.map((c) => c.hash);
  const sortedHashes = [...byCommit.keys()].sort(
    (a, b) => commitOrder.indexOf(a) - commitOrder.indexOf(b)
  );

  for (const hash of sortedHashes) {
    const commitComments = byCommit.get(hash);
    const commit = commits.find((c) => c.hash === hash);
    const label = commit ? `${hash}: "${commit.subject}"` : hash;

    lines.push(`## Commit ${label}`);
    lines.push('');

    // Group by file
    const byFile = new Map();
    for (const c of commitComments) {
      if (!byFile.has(c.filePath)) byFile.set(c.filePath, []);
      byFile.get(c.filePath).push(c);
    }

    for (const [filePath, fileComments] of byFile) {
      lines.push(`### File: ${filePath}`);
      // Sort by line number
      fileComments.sort((a, b) => a.displayLine - b.displayLine);
      for (const c of fileComments) {
        lines.push(`- **Line ${c.displayLine}**: ${c.text}`);
      }
      lines.push('');
    }
  }

  lines.push('---');
  lines.push(
    'For each commit, use `sl goto <hash>` to navigate to it, make the requested changes, then `sl amend` to update the commit. After all changes, restack with `sl rebase -s <first_modified> -d <parent>`.'
  );

  return lines.join('\n');
}
