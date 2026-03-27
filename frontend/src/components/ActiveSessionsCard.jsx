import React from 'react';

function ActiveSessionsCard({ sessions = [] }) {
  return (
    <article className="group rounded-2xl border border-cyan-400/60 bg-slate-950/40 p-5 shadow-[0_0_14px_rgba(0,255,255,0.25)] backdrop-blur-xl transition hover:shadow-[0_0_28px_rgba(0,255,255,0.45)]">
      <h2 className="mb-4 text-lg font-semibold text-cyan-300">Active Sessions</h2>
      <ul className="space-y-2 text-slate-200">
        {sessions.map((session) => (
          <li
            key={session}
            className="rounded-xl border border-cyan-400/20 bg-slate-900/60 px-3 py-2"
          >
            {session}
          </li>
        ))}
      </ul>

      <div className="pointer-events-none mt-3 translate-y-1 text-xs text-cyan-200 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
        Hahaha, good luck with Git!
      </div>
    </article>
  );
}

export default ActiveSessionsCard;
