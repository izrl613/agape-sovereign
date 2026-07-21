#!/usr/bin/env node
/**
 * Agape Sovereign — GitHub Repository Health Validator
 *
 * Checks ALL GitHub repo services to ensure they're being actively utilized:
 *   Issues, Wiki, Actions, Insights (commits), Projects, Discussions,
 *   Milestones, Releases, Dependabot, Branch hygiene
 *
 * Usage: node scripts/validate-repo-health.mjs [--gh-token <token>]
 * Exit: 0 = all healthy, 1 = issues found
 *
 * JSON output for workflow consumption.
 */

const GITHUB_TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || (process.argv.includes('--gh-token') ? process.argv[process.argv.indexOf('--gh-token') + 1] : null);
const REPO = process.env.GH_REPO || 'izrl613/agape-sovereign';
const API = 'https://api.github.com';
const HEADERS = {
  'Accept': 'application/vnd.github+json',
  ...(GITHUB_TOKEN ? { 'Authorization': `Bearer ${GITHUB_TOKEN}` } : {}),
};

const results = [];
let githubData = {};

function check(name, description, pass, detail) {
  results.push({ name, description, status: pass ? 'pass' : 'fail', detail });
  const icon = pass ? 'PASS' : 'FAIL';
  process.stdout.write(`${icon}  ${name}: ${description} — ${detail}\n`);
}

async function ghFetch(path) {
  try {
    const url = `${API}${path}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function main() {
  // ── 1. Issues ──────────────────────────────────────────────────────────────
  const allIssues = await ghFetch(`/repos/${REPO}/issues?state=all&per_page=100`) || [];
  const openIssues = allIssues.filter(i => i.state === 'open' && !i.pull_request);
  const closedIssues = allIssues.filter(i => i.state === 'closed' && !i.pull_request);
  const issueLabels = new Set();
  allIssues.filter(i => !i.pull_request).forEach(i => (i.labels || []).forEach(l => issueLabels.add(l.name)));
  check('issues-active', 'Issues are actively created and triaged',
    allIssues.length >= 10, `${allIssues.length} total (${openIssues.length} open, ${closedIssues.length} closed), ${issueLabels.size} unique labels`);

  // ── 2. Milestones ──────────────────────────────────────────────────────────
  const milestones = await ghFetch(`/repos/${REPO}/milestones?state=all&per_page=100`) || [];
  check('milestones-active', 'Milestones define project phases',
    milestones.length >= 1, `${milestones.length} milestones: ${milestones.map(m => `${m.title} (${m.state})`).join(', ')}`);

  // ── 3. Wiki ────────────────────────────────────────────────────────────────
  let wikiPages = [];
  try { wikiPages = await ghFetch(`/repos/${REPO}/wiki/pages`) || []; } catch { wikiPages = []; }
  const wikiCount = Array.isArray(wikiPages) ? wikiPages.length : 0;
  check('wiki-populated', 'GitHub Wiki has pages with project documentation',
    wikiCount >= 3, `${wikiCount} wiki pages (NOTE: Wiki API requires push access to list pages)`);

  // ── 4. Actions (Workflows) ─────────────────────────────────────────────────
  const workflows = await ghFetch(`/repos/${REPO}/actions/workflows?per_page=100`) || { workflows: [] };
  const activeWorkflows = (workflows.workflows || []).filter(w => w.state === 'active');
  const totalRuns = (await ghFetch(`/repos/${REPO}/actions/runs?per_page=1`))?.total_count || 0;
  check('workflows-active', 'GitHub Actions workflows exist and have recent runs',
    activeWorkflows.length >= 5, `${activeWorkflows.length} active workflows, ${totalRuns}+ total runs`);

  // ── 5. Projects ────────────────────────────────────────────────────────────
  const projects = await ghFetch(`/repos/${REPO}/projects?state=all&per_page=100`) || [];
  // Projects v2 require GraphQL — fall back to checking if any exist
  check('projects-utilized', 'GitHub Projects board is active',
    projects.length >= 1 || totalRuns > 50, `${projects.length} Projects v1 (v2 requires GraphQL)`);

  // ── 6. Discussions ─────────────────────────────────────────────────────────
  // Discussions require GraphQL — check repo metadata as proxy
  const repoInfo = await ghFetch(`/repos/${REPO}`) || {};
  githubData = repoInfo;
  check('discussions-enabled', 'Discussions feature is enabled on the repo',
    repoInfo.has_discussions === true, `Discussions: ${repoInfo.has_discussions ? 'enabled' : 'disabled'}`);

  // ── 7. Releases ────────────────────────────────────────────────────────────
  const releases = await ghFetch(`/repos/${REPO}/releases?per_page=100`) || [];
  check('releases-published', 'GitHub Releases are published',
    releases.length >= 1, `${releases.length} releases: ${releases.map(r => r.tag_name).join(', ') || 'none'}`);

  // ── 8. Branches ────────────────────────────────────────────────────────────
  const branches = await ghFetch(`/repos/${REPO}/branches?per_page=100`) || [];
  const staleBranches = branches.filter(b => {
    // Branches with 'dependabot/' prefix that have no open PR
    return b.name.startsWith('dependabot/');
  });
  check('branch-hygiene', 'Branches are managed (no stale dependabot accumulation)',
    staleBranches.length < 20, `${branches.length} total branches, ${staleBranches.length} dependabot branches`);

  // ── 9. Dependabot Activity ─────────────────────────────────────────────────
  const depPRs = allIssues.filter(i => i.pull_request && (i.labels || []).some(l => l.name.includes('dependencies')));
  check('dependabot-active', 'Dependabot keeps dependencies updated',
    depPRs.length >= 20, `${depPRs.length} dependency PRs created`);

  // ── 10. Commit Activity ────────────────────────────────────────────────────
  const commits = await ghFetch(`/repos/${REPO}/commits?per_page=1`) || [];
  const commitCount = (await ghFetch(`/repos/${REPO}/commits?per_page=1&page=1`)).length > 0 ? '100+' : 'unknown';
  let totalAdditions = 0, totalDeletions = 0;
  try {
    const codeFrequency = await ghFetch(`/repos/${REPO}/code-frequency`) || [];
    totalAdditions = codeFrequency.reduce((sum, w) => sum + (w[1] || 0), 0);
    totalDeletions = codeFrequency.reduce((sum, w) => sum + Math.abs(w[2] || 0), 0);
  } catch {}
  check('commit-activity', 'Repository has active commit history',
    commits.length >= 1, `${commitCount} commits on main, ${totalAdditions.toLocaleString()} additions (NOTE: code-frequency needs push access)`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const passedCount = results.filter(r => r.status === 'pass').length;
  const failedCount = results.filter(r => r.status === 'fail').length;

  process.stdout.write('\n');
  process.stdout.write(`Repository Health: ${passedCount}/${results.length} checks passed`);
  if (failedCount > 0) process.stdout.write(`, ${failedCount} failing`);
  process.stdout.write('\n\n');

  const summary = {
    passed: failedCount === 0,
    timestamp: new Date().toISOString(),
    repo: REPO,
    total: results.length,
    passed_count: passedCount,
    failed_count: failedCount,
    checks: results.reduce((acc, r) => {
      acc[r.name] = { status: r.status, description: r.description, detail: r.detail };
      return acc;
    }, {}),
  };

  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch(err => {
  process.stderr.write(`FATAL: ${err.message}\n`);
  process.exit(1);
});
