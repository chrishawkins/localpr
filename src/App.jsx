import React, { useState, useEffect, useCallback } from 'react';
import * as api from './api';
import { parseDiff } from './diffParser';
import { generatePrompt } from './promptGenerator';
import StackSidebar from './components/StackSidebar';
import CommitView from './components/CommitView';
import PromptPanel from './components/PromptPanel';

export default function App() {
  const [repo, setRepo] = useState(null);
  const [commits, setCommits] = useState([]);
  const [selectedHash, setSelectedHash] = useState(null);
  const [diffs, setDiffs] = useState({});
  const [comments, setComments] = useState([]);
  const [promptVisible, setPromptVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load repo info and stack on mount
  useEffect(() => {
    async function load() {
      try {
        const [repoInfo, stack] = await Promise.all([api.getRepo(), api.getStack()]);
        setRepo(repoInfo);
        setCommits(stack);
        if (stack.length > 0) {
          setSelectedHash(stack[stack.length - 1].hash);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load diff when commit is selected
  useEffect(() => {
    if (!selectedHash) return;
    if (diffs[selectedHash]) return;

    const fetchDiff = selectedHash === '__stack__' ? api.getStackDiff : () => api.getDiff(selectedHash);

    fetchDiff().then((diff) => {
      setDiffs((prev) => ({ ...prev, [selectedHash]: diff }));
    }).catch((err) => {
      setError(`Failed to load diff: ${err.message}`);
    });
  }, [selectedHash, diffs]);

  const addComment = useCallback((comment) => {
    setComments((prev) => [...prev, { ...comment, id: crypto.randomUUID() }]);
  }, []);

  const removeComment = useCallback((id) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateComment = useCallback((id, text) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, text } : c))
    );
  }, []);

  const commentCountByCommit = commits.reduce((acc, c) => {
    acc[c.hash] = comments.filter((cm) => cm.commitHash === c.hash).length;
    return acc;
  }, {});

  const currentDiff = diffs[selectedHash] || '';
  const parsedFiles = parseDiff(currentDiff);
  const currentComments = comments.filter((c) => c.commitHash === selectedHash);
  const prompt = generatePrompt(comments, commits);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="spinner" />
        <p>Connecting to Sapling repository...</p>
      </div>
    );
  }

  if (error && !repo) {
    return (
      <div className="app-error">
        <h2>Failed to connect</h2>
        <p>{error}</p>
        <p>Make sure you started LocalPR with a valid Sapling repository path:</p>
        <code>npm run dev /path/to/sapling/repo</code>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1 className="header-title">LocalPR</h1>
          <span className="header-repo" title={repo?.root}>
            {repo?.root?.split('/').slice(-2).join('/')}
          </span>
        </div>
        <div className="header-right">
          <span className="comment-badge">
            {comments.length} comment{comments.length !== 1 ? 's' : ''}
          </span>
          <button
            className="btn btn-primary"
            onClick={() => setPromptVisible((v) => !v)}
            disabled={comments.length === 0}
          >
            {promptVisible ? 'Hide Prompt' : 'Generate Prompt'}
          </button>
        </div>
      </header>

      <div className="app-body">
        <StackSidebar
          commits={commits}
          selectedHash={selectedHash}
          onSelect={setSelectedHash}
          commentCounts={commentCountByCommit}
        />

        <main className="main-content">
          {error && <div className="error-bar">{error}</div>}

          {commits.length === 0 ? (
            <div className="empty-state">
              <h2>No draft commits</h2>
              <p>There are no draft commits in the current stack to review.</p>
              <p>Make some changes and commit with Sapling, then refresh.</p>
            </div>
          ) : !currentDiff && selectedHash ? (
            <div className="loading-diff">Loading diff...</div>
          ) : (
            <CommitView
              commit={commits.find((c) => c.hash === selectedHash)}
              files={parsedFiles}
              comments={currentComments}
              commitHash={selectedHash}
              onAddComment={addComment}
              onRemoveComment={removeComment}
              onUpdateComment={updateComment}
            />
          )}
        </main>
      </div>

      {promptVisible && (
        <PromptPanel
          prompt={prompt}
          onClose={() => setPromptVisible(false)}
        />
      )}
    </div>
  );
}
