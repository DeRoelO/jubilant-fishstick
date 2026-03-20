"use client";

import { TaskBoard } from "@/components/TaskBoard";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">
      <header className="p-4 border-b border-border flex justify-between items-center bg-card z-20">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wide drop-shadow-sm">
          Eisenhower Matrix (Local Mode)
        </h1>
        <div className="flex gap-4">
          {/* Future Feature: Add connection toggle */}
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full ring-1 ring-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            LOCAL STORAGE ACTIVE
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <TaskBoard />
      </div>
    </main>
  );
}
