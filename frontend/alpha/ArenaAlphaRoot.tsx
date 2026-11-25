import { ArrowLeft, Sparkles } from 'lucide-react';
import ArenaApp from '@arena/App';

export default function ArenaAlphaRoot({ onExit }: { onExit: () => void }) {
  return (
    <div className="arena-scope flex h-screen w-screen flex-col overflow-hidden bg-[#060D1F]">
      <div className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-[#FF7A18]/40 bg-[#0B1020] px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#FF7A18]" />
          <span className="font-orbitron truncate text-[11px] font-bold tracking-wider text-[#FF7A18]">
            AGAPE SOVEREIGN ALPHA BUILD · ARENA PROTOTYPE
          </span>
          <span className="font-mono-tech hidden text-[10px] text-[#00D4FF] sm:inline">
            (ISOLATED SANDBOX · SIMULATED DEMO DATA)
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="font-orbitron inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#00D4FF]/50 bg-[#00D4FF]/15 px-3 py-1 text-[10px] font-bold tracking-wider text-[#00D4FF] transition hover:bg-[#00D4FF]/25"
        >
          <ArrowLeft className="h-3 w-3" />
          EXIT TO LIVE ENCLAVE
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto [&>div]:!h-full [&>div]:!min-h-full [&>div]:!w-full">
        <ArenaApp />
      </div>
    </div>
  );
}
