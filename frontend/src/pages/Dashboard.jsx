import React from 'react';
import TopNav from '../components/TopNav';
import ActiveSessionsCard from '../components/ActiveSessionsCard';
import StartSessionCard from '../components/StartSessionCard';
import CollaborateCard from '../components/CollaborateCard';
import SandboxesCard from '../components/SandboxesCard';

function Dashboard() {
  const containers = [
    { id: 'c1', name: 'sandbox-node-01', cpu: '24%', memory: '512 MB' },
    { id: 'c2', name: 'sandbox-py-07', cpu: '42%', memory: '768 MB' },
    { id: 'c3', name: 'sandbox-rs-03', cpu: '17%', memory: '384 MB' },
  ];

  return (
    <main className="relative overflow-hidden px-6 py-8 md:px-10 lg:px-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(0,255,255,0.15),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(160,32,240,0.14),transparent_35%),radial-gradient(circle_at_75%_80%,rgba(0,255,0,0.1),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl space-y-8">
        <TopNav
          breadcrumbs={['Dashboard', 'My Projects', 'Collaborate', 'Sandboxes']}
          userName="George Ichim-Andronache"
        />

        <section className="space-y-3">
          <p className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Welcome back, George! iTEC 2026 awaits.
          </p>
          <h1 className="inline-block bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-green-300 bg-clip-text text-5xl font-black leading-tight text-transparent drop-shadow-[0_0_16px_rgba(0,255,255,0.55)] md:text-6xl">
            iTECify
          </h1>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-4">
            <ActiveSessionsCard sessions={['session 1', 'session 2']} />
            <StartSessionCard />
            <CollaborateCard />
          </div>

          <div className="lg:col-span-8">
            <SandboxesCard
              title="Docker containers status"
              initialEnabled
              containers={containers}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

export default Dashboard;
