import React, { useState } from 'react';

export default function PromptPanel({ prompt, onClose }) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="prompt-panel">
      <div className="prompt-panel-header">
        <h3>Generated Prompt</h3>
        <div className="prompt-actions">
          <button className="btn btn-primary" onClick={copyToClipboard}>
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
      <div className="prompt-panel-body">
        <pre className="prompt-text">{prompt}</pre>
      </div>
      <div className="prompt-panel-footer">
        Paste this prompt into your Claude Code session to iterate on the changes.
      </div>
    </div>
  );
}
