import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  GitPullRequestDraft,
  RefreshCw,
  Users,
} from 'lucide-react';
import {
  DEFAULT_GITHUB_REPO,
  REFRESH_INTERVAL_MS,
  fetchGitHubProjectStatus,
  type ProjectStatusSnapshot,
} from '../services/githubStatus';

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ProjectStatusView({ repo = DEFAULT_GITHUB_REPO }: { repo?: string }) {
  const [snapshot, setSnapshot] = useState<ProjectStatusSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchGitHubProjectStatus(repo, signal);
        setSnapshot(data);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load GitHub issues');
      } finally {
        setLoading(false);
      }
    },
    [repo],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const interval = window.setInterval(() => {
      load();
    }, REFRESH_INTERVAL_MS);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [load]);

  return (
    <div className="space-y-5">
      {/* Header / Refresh Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#00D4FF]/20 bg-[#060D1F]/80 px-4 py-3">
        <div>
          <div className="font-orbitron text-xs font-bold tracking-wider text-[#00D4FF]">
            GITHUB ISSUES STATUS · {repo}
          </div>
          <div className="font-mono-tech mt-0.5 flex items-center gap-2 text-[11px] text-[#7B9BB5]">
            <Clock className="h-3 w-3 text-[#00D4FF]" />
            <span>
              {snapshot
                ? `Updated ${formatRelativeTime(snapshot.fetchedAt)} · Auto-refresh every 15m`
                : 'Auto-refresh every 15m'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => load()}
          disabled={loading}
          className="font-orbitron inline-flex items-center gap-1.5 rounded-md border border-[#00D4FF]/40 bg-[#00D4FF]/10 px-3 py-1.5 text-[11px] font-bold tracking-wider text-[#00D4FF] transition-colors hover:bg-[#00D4FF]/20 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'SYNCING…' : 'REFRESH'}
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#FF2E9F]/40 bg-[#FF2E9F]/10 px-4 py-3 text-xs text-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-[#FF2E9F]" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="font-orbitron rounded border border-[#FF2E9F]/40 px-2.5 py-1 text-[10px] font-bold text-[#FF2E9F] hover:bg-[#FF2E9F]/20"
          >
            RETRY
          </button>
        </div>
      )}

      {snapshot && (
        <>
          {/* Progress */}
          <div className="rounded-xl border border-[#00D4FF]/20 bg-[#060D1F]/70 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-orbitron text-xs font-bold tracking-wider text-[#F8FAFC]">
                PROGRESS
              </span>
              <span className="font-mono-tech text-xs font-bold text-[#00D4FF]">
                {snapshot.completionPct}% COMPLETE
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#0B1020] ring-1 ring-[#00D4FF]/25">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#FF2E9F] via-[#00D4FF] to-[#FF7A18] transition-all duration-500"
                style={{ width: `${snapshot.completionPct}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-[#00D4FF]/15 bg-[#0B1020]/80 py-2">
                <div className="font-mono-tech text-base font-bold text-[#F8FAFC]">
                  {snapshot.totalIssues}
                </div>
                <div className="font-orbitron text-[10px] tracking-wider text-[#7B9BB5]">TOTAL</div>
              </div>
              <div className="rounded-lg border border-[#FF7A18]/25 bg-[#0B1020]/80 py-2">
                <div className="font-mono-tech text-base font-bold text-[#FF7A18]">
                  {snapshot.openCount}
                </div>
                <div className="font-orbitron text-[10px] tracking-wider text-[#7B9BB5]">OPEN</div>
              </div>
              <div className="rounded-lg border border-[#00D4FF]/25 bg-[#0B1020]/80 py-2">
                <div className="font-mono-tech text-base font-bold text-[#00D4FF]">
                  {snapshot.closedCount}
                </div>
                <div className="font-orbitron text-[10px] tracking-wider text-[#7B9BB5]">CLOSED</div>
              </div>
            </div>
          </div>

          {/* Blockers & Owners */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Blockers */}
            <div className="rounded-xl border border-[#FF2E9F]/25 bg-[#060D1F]/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#FF2E9F]" />
                  <span className="font-orbitron text-xs font-bold tracking-wider text-[#FF2E9F]">
                    BLOCKERS ({snapshot.blockers.length})
                  </span>
                </div>
              </div>
              {snapshot.blockers.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-[#00D4FF]/15 bg-[#0B1020]/70 px-3 py-2.5 text-xs text-[#7B9BB5]">
                  <CheckCircle2 className="h-4 w-4 text-[#00D4FF]" />
                  <span>No open blocker/critical issues.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshot.blockers.map((issue) => (
                    <a
                      key={issue.id}
                      href={issue.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start justify-between gap-2 rounded-lg border border-[#FF2E9F]/25 bg-[#0B1020]/80 px-3 py-2 text-xs transition-colors hover:border-[#FF2E9F]/60"
                    >
                      <div>
                        <div className="font-semibold text-[#F8FAFC]">
                          #{issue.number} {issue.title}
                        </div>
                        <div className="font-mono-tech mt-0.5 text-[10px] text-[#7B9BB5]">
                          {issue.assignees.length > 0
                            ? issue.assignees.map((a) => `@${a.login}`).join(', ')
                            : 'Unassigned'}
                        </div>
                      </div>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FF2E9F]" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Owners */}
            <div className="rounded-xl border border-[#00D4FF]/20 bg-[#060D1F]/70 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#00D4FF]" />
                <span className="font-orbitron text-xs font-bold tracking-wider text-[#00D4FF]">
                  OWNERS ({snapshot.owners.length})
                </span>
              </div>
              {snapshot.owners.length === 0 ? (
                <div className="rounded-lg border border-[#00D4FF]/15 bg-[#0B1020]/70 px-3 py-2.5 text-xs text-[#7B9BB5]">
                  No issue owners found.
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshot.owners.map((owner) => (
                    <div
                      key={owner.login}
                      className="flex items-center justify-between rounded-lg border border-[#00D4FF]/15 bg-[#0B1020]/80 px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {owner.avatarUrl ? (
                          <img
                            src={owner.avatarUrl}
                            alt={owner.login}
                            className="h-5 w-5 rounded-full border border-[#00D4FF]/40"
                          />
                        ) : (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border border-[#7B9BB5]/40 text-[10px] text-[#7B9BB5]">
                            ?
                          </div>
                        )}
                        <span className="font-mono-tech font-semibold text-[#F8FAFC]">
                          {owner.login === 'Unassigned' ? 'Unassigned' : `@${owner.login}`}
                        </span>
                      </div>
                      <div className="font-mono-tech flex items-center gap-2 text-[11px]">
                        <span className="text-[#FF7A18]">{owner.openCount} open</span>
                        <span className="text-[#7B9BB5]">·</span>
                        <span className="text-[#00D4FF]">{owner.closedCount} closed</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Changes */}
          <div className="rounded-xl border border-[#00D4FF]/20 bg-[#060D1F]/70 p-4">
            <div className="mb-3 flex items-center gap-2">
              <GitPullRequestDraft className="h-4 w-4 text-[#FF7A18]" />
              <span className="font-orbitron text-xs font-bold tracking-wider text-[#FF7A18]">
                RECENT CHANGES
              </span>
            </div>
            {snapshot.recentChanges.length === 0 ? (
              <div className="rounded-lg border border-[#00D4FF]/15 bg-[#0B1020]/70 px-3 py-2.5 text-xs text-[#7B9BB5]">
                No issues found in {repo}.
              </div>
            ) : (
              <div className="space-y-2">
                {snapshot.recentChanges.map((issue) => (
                  <a
                    key={issue.id}
                    href={issue.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#00D4FF]/15 bg-[#0B1020]/80 px-3 py-2 text-xs transition-colors hover:border-[#00D4FF]/45"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`font-orbitron shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                          issue.state === 'open'
                            ? 'border border-[#FF7A18]/40 bg-[#FF7A18]/15 text-[#FF7A18]'
                            : 'border border-[#00D4FF]/40 bg-[#00D4FF]/15 text-[#00D4FF]'
                        }`}
                      >
                        {issue.state.toUpperCase()}
                      </span>
                      <span className="truncate font-medium text-[#F8FAFC]">
                        #{issue.number} {issue.title}
                      </span>
                    </div>
                    <div className="font-mono-tech flex items-center gap-2 text-[11px] text-[#7B9BB5]">
                      <span>
                        {issue.assignees.length > 0
                          ? `@${issue.assignees[0].login}`
                          : 'Unassigned'}
                      </span>
                      <span>·</span>
                      <span>{formatRelativeTime(issue.updated_at)}</span>
                      <ExternalLink className="h-3 w-3 text-[#00D4FF]" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
