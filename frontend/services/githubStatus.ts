export interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface GitHubLabel {
  id: number;
  name: string;
  color: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  user: GitHubUser | null;
  assignees: GitHubUser[];
  labels: GitHubLabel[];
  pull_request?: unknown;
}

export interface OwnerSummary {
  login: string;
  avatarUrl: string | null;
  openCount: number;
  closedCount: number;
  issues: GitHubIssue[];
}

export interface ProjectStatusSnapshot {
  repo: string;
  fetchedAt: string;
  totalIssues: number;
  openCount: number;
  closedCount: number;
  completionPct: number;
  blockers: GitHubIssue[];
  owners: OwnerSummary[];
  recentChanges: GitHubIssue[];
}

export const DEFAULT_GITHUB_REPO = 'izrl613/agape-sovereign';
export const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

const BLOCKER_LABEL_PATTERN = /^(blocker|blocked|critical|p0|urgent)$/i;

export function isBlockerIssue(issue: GitHubIssue): boolean {
  if (issue.state !== 'open') return false;
  return issue.labels.some((label) => BLOCKER_LABEL_PATTERN.test(label.name.trim()));
}

export function summarizeIssues(repo: string, rawItems: GitHubIssue[]): ProjectStatusSnapshot {
  const issues = rawItems.filter((item) => !item.pull_request);
  const openCount = issues.filter((i) => i.state === 'open').length;
  const closedCount = issues.filter((i) => i.state === 'closed').length;
  const totalIssues = issues.length;
  const completionPct = totalIssues > 0 ? Math.round((closedCount / totalIssues) * 100) : 0;

  const blockers = issues.filter(isBlockerIssue);

  const ownerMap = new Map<string, OwnerSummary>();
  for (const issue of issues) {
    const assignees = issue.assignees.length > 0 ? issue.assignees : [null];
    for (const assignee of assignees) {
      const key = assignee ? assignee.login : 'Unassigned';
      const existing = ownerMap.get(key) ?? {
        login: key,
        avatarUrl: assignee ? assignee.avatar_url : null,
        openCount: 0,
        closedCount: 0,
        issues: [],
      };
      if (issue.state === 'open') existing.openCount += 1;
      else existing.closedCount += 1;
      existing.issues.push(issue);
      ownerMap.set(key, existing);
    }
  }

  const owners = Array.from(ownerMap.values()).sort((a, b) => {
    if (a.login === 'Unassigned') return 1;
    if (b.login === 'Unassigned') return -1;
    return b.openCount - a.openCount || b.closedCount - a.closedCount;
  });

  const recentChanges = [...issues]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 10);

  return {
    repo,
    fetchedAt: new Date().toISOString(),
    totalIssues,
    openCount,
    closedCount,
    completionPct,
    blockers,
    owners,
    recentChanges,
  };
}

export async function fetchGitHubProjectStatus(
  repo: string = DEFAULT_GITHUB_REPO,
  signal?: AbortSignal,
): Promise<ProjectStatusSnapshot> {
  const url = `https://api.github.com/repos/${repo}/issues?state=all&per_page=100&sort=updated&direction=desc`;
  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(`Repository "${repo}" not found or is private.`);
    }
    if (res.status === 403) {
      throw new Error('GitHub API rate limit reached. Try again shortly.');
    }
    throw new Error(`GitHub API error (${res.status})`);
  }

  const data = (await res.json()) as GitHubIssue[];
  return summarizeIssues(repo, data);
}
