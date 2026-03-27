import React from 'react';

function StartSessionCard() {
  const tech = [
    { label: 'Node.js', icon: '🟢' },
    { label: 'Python', icon: '🐍' },
    { label: 'Rust', icon: '🦀' },
  ];

  return (
    <article className="rounded-2xl border border-green-400/60 bg-slate-950/40 p-5 shadow-[0_0_14px_rgba(0,255,0,0.2)] backdrop-blur-xl transition hover:shadow-[0_0_28px_rgba(0,255,0,0.38)]">
      <h2 className="mb-4 text-lg font-semibold text-green-300">Start Session</h2>
      <div className="flex items-center justify-between gap-3">
        {tech.map((item) => (
          <div
            key={item.label}
            className="flex w-full flex-col items-center justify-center rounded-xl border border-green-300/30 bg-slate-900/60 py-4"
          >
            <span className="text-3xl">{item.icon}</span>
            <span className="mt-1 text-sm text-slate-200">{item.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export default StartSessionCard;
