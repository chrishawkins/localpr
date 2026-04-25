export function parseDiff(diffText) {
  if (!diffText) return [];

  const files = [];
  let currentFile = null;
  let currentHunk = null;
  let oldLine = 0;
  let newLine = 0;

  for (const rawLine of diffText.split('\n')) {
    if (rawLine.startsWith('diff --git')) {
      const match = rawLine.match(/diff --git a\/(.*) b\/(.*)/);
      currentFile = {
        oldPath: match ? match[1] : '',
        newPath: match ? match[2] : '',
        hunks: [],
        type: 'modify',
      };
      files.push(currentFile);
      currentHunk = null;
    } else if (rawLine.startsWith('new file')) {
      if (currentFile) currentFile.type = 'add';
    } else if (rawLine.startsWith('deleted file')) {
      if (currentFile) currentFile.type = 'delete';
    } else if (rawLine.startsWith('rename from')) {
      if (currentFile) currentFile.type = 'rename';
    } else if (rawLine.startsWith('--- ')) {
      // skip, we already have paths from the diff --git line
    } else if (rawLine.startsWith('+++ ')) {
      // skip
    } else if (rawLine.startsWith('@@')) {
      const match = rawLine.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/);
      if (match && currentFile) {
        oldLine = parseInt(match[1]);
        newLine = parseInt(match[3]);
        currentHunk = {
          header: rawLine,
          oldStart: oldLine,
          oldLines: parseInt(match[2] ?? '1'),
          newStart: newLine,
          newLines: parseInt(match[4] ?? '1'),
          context: match[5]?.trim() || '',
          lines: [],
        };
        currentFile.hunks.push(currentHunk);
      }
    } else if (rawLine.startsWith('\\ No newline')) {
      // skip
    } else if (currentHunk) {
      if (rawLine.startsWith('+')) {
        currentHunk.lines.push({
          type: 'add',
          newLine: newLine++,
          content: rawLine.slice(1),
        });
      } else if (rawLine.startsWith('-')) {
        currentHunk.lines.push({
          type: 'delete',
          oldLine: oldLine++,
          content: rawLine.slice(1),
        });
      } else {
        // Context line (starts with space) or empty
        currentHunk.lines.push({
          type: 'context',
          oldLine: oldLine++,
          newLine: newLine++,
          content: rawLine.slice(1),
        });
      }
    }
  }

  return files;
}

export function makeLineKey(filePath, line) {
  if (line.type === 'add') return `${filePath}:add:${line.newLine}`;
  if (line.type === 'delete') return `${filePath}:del:${line.oldLine}`;
  return `${filePath}:ctx:${line.newLine}`;
}
