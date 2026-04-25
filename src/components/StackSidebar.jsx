import React from 'react';

export default function StackSidebar({ commits, selectedHash, onSelect, commentCounts }) {
  return (
    <aside className="stack-sidebar">
      <div className="sidebar-header">
        <h2>Stack</h2>
        <span className="commit-count">{commits.length} commit{commits.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="stack-list">
        {/* Show commits in reverse order (newest at top) */}
        {[...commits].reverse().map((commit, idx) => {
          const isSelected = commit.hash === selectedHash;
          const count = commentCounts[commit.hash] || 0;
          const isTop = idx === 0;
          const isBottom = idx === commits.length - 1;

          return (
            <div key={commit.hash} className="stack-item-wrapper">
              {/* Connecting line above */}
              {!isTop && <div className="stack-line" />}

              <button
                className={`stack-item ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelect(commit.hash)}
                title={`${commit.hash} - ${commit.subject}`}
              >
                <div className="stack-node" />
                <div className="stack-item-content">
                  <div className="stack-item-header">
                    <code className="commit-hash">{commit.hash}</code>
                    {count > 0 && (
                      <span className="comment-count-badge">{count}</span>
                    )}
                  </div>
                  <div className="commit-subject">{commit.subject}</div>
                  <div className="commit-meta">
                    {commit.author} &middot; {formatDate(commit.date)}
                  </div>
                </div>
              </button>

              {/* Connecting line below */}
              {!isBottom && <div className="stack-line" />}
            </div>
          );
        })}

        {/* Base indicator */}
        {commits.length > 0 && (
          <div className="stack-item-wrapper">
            <div className="stack-line" />
            <div className="stack-base">
              <div className="stack-node base" />
              <span>base</span>
            </div>
          </div>
        )}
      </div>

      {commits.length > 1 && (
        <div className="sidebar-footer">
          <button
            className={`btn btn-secondary full-width ${selectedHash === '__stack__' ? 'active' : ''}`}
            onClick={() => onSelect('__stack__')}
          >
            View Full Stack Diff
          </button>
        </div>
      )}
    </aside>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return dateStr.split(' ')[0];
  } catch {
    return dateStr;
  }
}
