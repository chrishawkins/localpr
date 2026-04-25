# LocalPR

A local code review tool for [Sapling](https://sapling-scm.com/) repositories that generates structured prompts for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Built for the stacked diffs workflow.

## The Problem

When working with Claude Code on a Sapling repository, there's no lightweight way to review code changes inline and provide structured feedback. You end up describing issues in prose, losing the connection between your feedback and the specific lines of code.

## The Workflow

```
Claude Code makes changes ──> commits to Sapling stack
                                      │
                                      ▼
                              You run LocalPR
                                      │
                                      ▼
                           Review each commit's diff
                           Add inline comments on lines
                                      │
                                      ▼
                           Generate structured prompt
                                      │
                                      ▼
                        Paste back into Claude Code session
                                      │
                                      ▼
                     Claude addresses feedback, amends commits
```

## Quick Start

```bash
# Clone and install
git clone <repo-url> localpr
cd localpr
npm install

# Point at any Sapling repository
REPO_PATH=/path/to/your/sapling/repo npm run dev
```

Open `http://localhost:5173` in your browser.

## Usage

### Development mode (with hot reload)

```bash
REPO_PATH=/path/to/repo npm run dev
```

This starts the API server on port 3001 and the Vite dev server on port 5173 with hot module replacement.

### Production mode

```bash
npm start -- /path/to/repo
```

Builds the frontend and serves everything from port 3001.

### Server only (if already built)

```bash
node server/index.js /path/to/repo
```

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Sapling](https://sapling-scm.com/) (`sl` CLI) installed and on PATH
- A Sapling repository with draft commits to review

## How It Works

### Stack Sidebar

The left panel shows your current stack of draft commits, ordered newest-first. Each commit displays its short hash, message, author, and a badge showing how many review comments you've added. Click a commit to review its diff. If the stack has multiple commits, a "View Full Stack Diff" button shows the combined changes.

### Diff Viewer

The main panel renders a unified diff for the selected commit. Files are listed at the top for quick navigation. Each file section is collapsible and shows:

- Line numbers for both old and new sides
- Color-coded additions (green) and deletions (red)
- Hunk headers with context

### Inline Commenting

Hover over any diff line to reveal a **+** button. Click it to open a comment form directly below that line. Type your feedback and press **Cmd+Enter** (or click Comment) to save. Comments appear inline in the diff and can be edited or deleted.

### Prompt Generation

Click **Generate Prompt** in the header to produce a structured review prompt. Comments are organized by commit and file, with specific line numbers. The output includes Sapling-specific instructions for Claude Code:

```
Please address the following code review feedback on the current stack of commits.

## Commit abc1234: "Add user authentication"

### File: src/auth.js
- **Line 42**: Use bcrypt instead of md5 for password hashing.
- **Line 78**: This error handler swallows exceptions silently. Log the error.

## Commit def5678: "Add user profile page"

### File: src/profile.jsx
- **Line 15**: Missing null check for user data before accessing properties.

---
For each commit, use `sl goto <hash>` to navigate to it, make the requested
changes, then `sl amend` to update the commit. After all changes, restack
with `sl rebase -s <first_modified> -d <parent>`.
```

Copy to clipboard and paste into your Claude Code session.

## Architecture

```
LocalPR/
├── server/
│   ├── index.js          # Express API server + static file serving
│   └── sapling.js        # Sapling CLI wrapper (sl log, sl diff, etc.)
├── src/
│   ├── App.jsx           # Main app with state management
│   ├── api.js            # Frontend API client
│   ├── diffParser.js     # Unified diff parser
│   ├── promptGenerator.js
│   └── components/
│       ├── StackSidebar.jsx    # Commit stack navigation
│       ├── CommitView.jsx      # File list + diff rendering
│       ├── FileDiff.jsx        # Per-file diff with inline comments
│       ├── CommentForm.jsx     # Comment input widget
│       └── PromptPanel.jsx     # Generated prompt display + copy
├── index.html
├── vite.config.js
└── package.json
```

**Backend**: Express.js server that wraps the `sl` CLI. Uses `HGPLAIN=1` for stable output parsing. API endpoints return commit metadata and git-format unified diffs.

**Frontend**: React 18 SPA built with Vite. Custom diff parser and renderer (no heavy diff library dependencies). All review state lives in React component state -- comments are ephemeral by design (one review session per run).

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/repo` | Repository root path and current revision |
| `GET /api/stack` | Draft commits in the current stack |
| `GET /api/commit/:rev` | Detailed info for a single commit |
| `GET /api/diff/:rev` | Git-format unified diff for a commit |
| `GET /api/diff-stack` | Combined diff for the entire stack |

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Cmd+Enter` / `Ctrl+Enter` | Submit comment |
| `Escape` | Cancel comment form |

## Stacked Diffs Philosophy

This tool is built around Meta's stacked diffs workflow:

1. Each commit in the stack represents one logical change
2. Commits are reviewed independently, not as a monolithic PR
3. Feedback targets specific commits so Claude Code can `sl goto` + `sl amend` each one
4. The stack is restacked after amendments with `sl rebase`

LocalPR makes this feedback loop fast: review the stack visually, leave targeted comments, generate a prompt, and let Claude Code iterate.
