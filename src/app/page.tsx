"use client";

import { TaskBoard } from "@/components/TaskBoard";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">
      <header className="p-4 border-b border-border flex justify-between items-center bg-card z-20">
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wide drop-shadow-sm">
          Eisenhower Matrix
        </h1>

      </header>

      <div className="flex-1 overflow-hidden relative">
        <TaskBoard />
      </div>
    </main>
  );
}
