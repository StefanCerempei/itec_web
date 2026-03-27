import { useMemo, useState } from 'react';

function SandboxesCard({ title, containers = [], initialEnabled = false }) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);

  const statusLabel = useMemo(() => (isEnabled ? 'ON' : 'OFF'), [isEnabled]);

  return (
    <article className="group relative h-full min-h-[420px] rounded-2xl border border-cyan-400/60 bg-slate-950/45 p-6 shadow-[0_0_20px_rgba(0,255,255,0.2)] backdrop-blur-xl transition hover:shadow-[0_0_36px_rgba(0,255,255,0.38)]">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-cyan-300">{title}</h2>

        <button
          type="button"
          aria-label="Toggle Docker containers"
          aria-pressed={isEnabled}
          onClick={() => setIsEnabled((prev) => !prev)}
          className={`relative h-8 w-20 rounded-full border transition ${
            isEnabled
              ? 'border-green-400 bg-green-400/20 shadow-[0_0_16px_rgba(0,255,0,0.5)]'
              : 'border-slate-600 bg-slate-800/70'
          }`}
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
              isEnabled ? 'left-12' : 'left-1'
            }`}
          />
          <span className="sr-only">Container status: {statusLabel}</span>
        </button>
      </div>

      <div className="space-y-3 pr-2">
        {containers.map((container) => (
          <div
            key={container.id}
            className="flex items-center justify-between rounded-xl border border-cyan-300/20 bg-slate-900/65 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl" role="img" aria-label="Docker whale icon">
                🐳
              </span>
              <div>
                <p className="text-sm font-medium text-slate-100">{container.name}</p>
                <p className="text-xs text-slate-400">{statusLabel}</p>
              </div>
            </div>

            <div className="text-right text-xs text-slate-300">
              <p>CPU: {container.cpu}</p>
              <p>Memory: {container.memory}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 right-4 rounded-lg border border-green-400/40 bg-green-400/10 p-3 shadow-[0_0_18px_rgba(0,255,0,0.35)]">
        <pre className="text-[10px] leading-[10px] text-green-300">
{`  /\_/\\
 ( o.o )
  > ^ <`}
        </pre>
      </div>
    </article>
  );
}

export default SandboxesCard;
