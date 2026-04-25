import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getRepoRoot,
  getStack,
  getCommitDetail,
  getDiff,
  getStackDiff,
  getCurrentRev,
} from './sapling.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;
const REPO_PATH = process.argv[2] || process.env.REPO_PATH || process.cwd();

app.use(cors());
app.use(express.json());

// Serve static files in production
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Validate repo on startup
let repoRoot;

async function validateRepo() {
  try {
    repoRoot = await getRepoRoot(REPO_PATH);
    console.log(`LocalPR server connected to Sapling repo: ${repoRoot}`);
  } catch (err) {
    console.error(`Error: ${REPO_PATH} is not a valid Sapling repository.`);
    console.error('Usage: npm start /path/to/sapling/repo');
    console.error(`  or: REPO_PATH=/path/to/repo npm start`);
    process.exit(1);
  }
}

// API: repo info
app.get('/api/repo', async (req, res) => {
  try {
    const currentRev = await getCurrentRev(REPO_PATH);
    res.json({ root: repoRoot, currentRev });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: get commit stack
app.get('/api/stack', async (req, res) => {
  try {
    const commits = await getStack(REPO_PATH);
    res.json(commits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: get commit detail
app.get('/api/commit/:rev', async (req, res) => {
  try {
    const detail = await getCommitDetail(REPO_PATH, req.params.rev);
    res.json(detail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: get diff for a specific commit
app.get('/api/diff/:rev', async (req, res) => {
  try {
    const diff = await getDiff(REPO_PATH, req.params.rev);
    res.json({ diff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API: get combined diff for the entire stack
app.get('/api/diff-stack', async (req, res) => {
  try {
    const diff = await getStackDiff(REPO_PATH);
    res.json({ diff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

await validateRepo();

app.listen(PORT, () => {
  console.log(`LocalPR running at http://localhost:${PORT}`);
  console.log(`Reviewing: ${repoRoot}`);
});
