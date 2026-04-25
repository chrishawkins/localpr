import React, { useState } from 'react';
import { makeLineKey } from '../diffParser';
import CommentForm from './CommentForm';

export default function FileDiff({
  file,
  comments,
  commitHash,
  onAddComment,
  onRemoveComment,
  onUpdateComment,
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeLineKey, setActiveLineKey] = useState(null);
  const filePath = file.newPath || file.oldPath;

  // Build comment lookup by line key
  const commentsByLine = {};
  for (const c of comments) {
    if (!commentsByLine[c.lineKey]) commentsByLine[c.lineKey] = [];
    commentsByLine[c.lineKey].push(c);
  }

  function handleLineClick(line) {
    const key = makeLineKey(filePath, line);
    setActiveLineKey((prev) => (prev === key ? null : key));
  }

  function handleSubmitComment(text, line, lineKey) {
    const displayLine = line.type === 'delete' ? line.oldLine : line.newLine;
    onAddComment({
      commitHash,
      filePath,
      lineKey,
      lineType: line.type,
      lineContent: line.content,
      displayLine,
      text,
      timestamp: Date.now(),
    });
    setActiveLineKey(null);
  }

  const fileLabel =
    file.type === 'rename'
      ? `${file.oldPath} → ${file.newPath}`
      : filePath;

  return (
    <div className="file-diff" id={`file-${encodeURIComponent(filePath)}`}>
      <div className="file-diff-header" onClick={() => setCollapsed((c) => !c)}>
        <span className="collapse-icon">{collapsed ? '▸' : '▾'}</span>
        <span className="file-path">{fileLabel}</span>
      </div>

      {!collapsed && (
        <table className="diff-table">
          <tbody>
            {file.hunks.map((hunk, hi) => (
              <React.Fragment key={hi}>
                <tr className="hunk-header">
                  <td className="line-num" />
                  <td className="line-num" />
                  <td className="line-action-cell" />
                  <td className="hunk-info">{hunk.header}</td>
                </tr>
                {hunk.lines.map((line, li) => {
                  const lineKey = makeLineKey(filePath, line);
                  const lineComments = commentsByLine[lineKey] || [];
                  const isFormOpen = activeLineKey === lineKey;

                  return (
                    <React.Fragment key={`${hi}-${li}`}>
                      <tr className={`diff-line diff-${line.type}`}>
                        <td className="line-num old">
                          {line.type !== 'add' ? line.oldLine : ''}
                        </td>
                        <td className="line-num new">
                          {line.type !== 'delete' ? line.newLine : ''}
                        </td>
                        <td className="line-action-cell">
                          <button
                            className="add-comment-btn"
                            onClick={() => handleLineClick(line)}
                            title="Add comment"
                          >
                            +
                          </button>
                        </td>
                        <td className="line-content">
                          <span className="line-prefix">
                            {line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' '}
                          </span>
                          <span className="line-text">{line.content}</span>
                        </td>
                      </tr>

                      {/* Existing comments */}
                      {lineComments.map((comment) => (
                        <tr key={comment.id} className="comment-row">
                          <td colSpan={4}>
                            <div className="inline-comment">
                              <div className="comment-body">
                                <span className="comment-text">{comment.text}</span>
                                <div className="comment-actions">
                                  <button
                                    className="btn-icon"
                                    onClick={() => {
                                      const newText = prompt('Edit comment:', comment.text);
                                      if (newText !== null && newText.trim()) {
                                        onUpdateComment(comment.id, newText.trim());
                                      }
                                    }}
                                    title="Edit"
                                  >
                                    &#9998;
                                  </button>
                                  <button
                                    className="btn-icon btn-danger"
                                    onClick={() => onRemoveComment(comment.id)}
                                    title="Delete"
                                  >
                                    &times;
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Comment form */}
                      {isFormOpen && (
                        <tr className="comment-row">
                          <td colSpan={4}>
                            <CommentForm
                              onSubmit={(text) => handleSubmitComment(text, line, lineKey)}
                              onCancel={() => setActiveLineKey(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
