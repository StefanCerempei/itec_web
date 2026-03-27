import React from 'react';

function TopNav({ breadcrumbs = [], userName }) {
  return (
    <header className="rounded-2xl border border-cyan-400/30 bg-slate-950/50 px-4 py-3 shadow-[0_0_24px_rgba(0,255,255,0.15)] backdrop-blur-xl md:px-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-content-center rounded-xl border border-fuchsia-500/40 bg-slate-900/70 font-black text-cyan-300 shadow-[0_0_14px_rgba(160,32,240,0.45)]">
            iF
          </div>
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb}>
              <span className="transition-colors hover:text-cyan-300">{crumb}</span>
              {index < breadcrumbs.length - 1 && (
                <span className="text-slate-500">/</span>
              )}
            </React.Fragment>
          ))}
        </nav>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="h-9 w-9 rounded-full border border-green-300/60 bg-gradient-to-br from-cyan-300/30 to-fuchsia-400/30" />
          <div className="leading-tight">
            <p className="text-sm font-medium text-slate-100">{userName}</p>
            <p className="text-xs font-semibold text-cyan-300 drop-shadow-[0_0_10px_rgba(0,255,255,0.7)]">
              &lt;itec&gt;
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default TopNav;
