import React from 'react';
import FileDiff from './FileDiff';

export default function CommitView({
  commit,
  files,
  comments,
  commitHash,
  onAddComment,
  onRemoveComment,
  onUpdateComment,
}) {
  if (files.length === 0) {
    return (
      <div className="empty-diff">
        <p>No changes in this commit.</p>
      </div>
    );
  }

  return (
    <div className="commit-view">
      {commit && (
        <div className="commit-banner">
          <code className="commit-hash">{commit.hash}</code>
          <span className="commit-subject">{commit.subject}</span>
          <span className="commit-author">{commit.author}</span>
        </div>
      )}

      <div className="file-summary">
        {files.length} file{files.length !== 1 ? 's' : ''} changed
        <span className="additions">
          +{files.reduce((sum, f) => sum + f.hunks.reduce((s, h) => s + h.lines.filter((l) => l.type === 'add').length, 0), 0)}
        </span>
        <span className="deletions">
          -{files.reduce((sum, f) => sum + f.hunks.reduce((s, h) => s + h.lines.filter((l) => l.type === 'delete').length, 0), 0)}
        </span>
      </div>

      {/* File jump list */}
      <div className="file-list">
        {files.map((file) => (
          <a
            key={file.newPath || file.oldPath}
            href={`#file-${encodeURIComponent(file.newPath || file.oldPath)}`}
            className={`file-link file-${file.type}`}
          >
            {file.type === 'add' && <span className="file-badge add">A</span>}
            {file.type === 'delete' && <span className="file-badge del">D</span>}
            {file.type === 'rename' && <span className="file-badge rename">R</span>}
            {file.type === 'modify' && <span className="file-badge mod">M</span>}
            {file.newPath || file.oldPath}
          </a>
        ))}
      </div>

      {files.map((file) => {
        const filePath = file.newPath || file.oldPath;
        const fileComments = comments.filter((c) => c.filePath === filePath);
        return (
          <FileDiff
            key={filePath}
            file={file}
            comments={fileComments}
            commitHash={commitHash}
            onAddComment={onAddComment}
            onRemoveComment={onRemoveComment}
            onUpdateComment={onUpdateComment}
          />
        );
      })}
    </div>
  );
}
