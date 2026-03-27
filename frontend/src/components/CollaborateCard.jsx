import React from 'react';

function CollaborateCard() {
  return (
    <article className="group rounded-2xl border border-fuchsia-500/60 bg-slate-950/40 p-5 shadow-[0_0_14px_rgba(160,32,240,0.25)] backdrop-blur-xl transition hover:shadow-[0_0_28px_rgba(160,32,240,0.45)]">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-fuchsia-300">Collaborate</h2>
        <div className="relative" title="Easter Egg found!">
          <span className="text-xl">⏳</span>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-slate-200">
        Jump into live pair sessions and preview the upcoming
        <span className="text-fuchsia-300"> time-travel debugging feature</span> that lets your team scrub
        through execution history together.
      </p>
    </article>
  );
}

export default CollaborateCard;
