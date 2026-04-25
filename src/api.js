const BASE = '/api';

async function fetchJSON(url) {
  const res = await fetch(`${BASE}${url}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export function getRepo() {
  return fetchJSON('/repo');
}

export function getStack() {
  return fetchJSON('/stack');
}

export function getCommitDetail(rev) {
  return fetchJSON(`/commit/${rev}`);
}

export function getDiff(rev) {
  return fetchJSON(`/diff/${rev}`).then((d) => d.diff);
}

export function getStackDiff() {
  return fetchJSON('/diff-stack').then((d) => d.diff);
}
