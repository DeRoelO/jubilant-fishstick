"use client";

import React, { useEffect, useState } from "react";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { useTaskStore } from "@/lib/store";
import { Task } from "@/lib/priority";

export function TaskBoard() {
    const { plottedTasks, selectedTaskId, selectTask, updateTaskImportance, updateTaskDetails, addTask, columnWidths, actionPlanHeight, setColumnWidths, setActionPlanHeight, uncompleteTask, theme, setTheme } = useTaskStore();
    const { masterlist, matrix, actionPlan } = columnWidths;

    const masterList = plottedTasks.filter(t => !t.hasMissingData && !t.is_complete);
    const waitingRoom = plottedTasks.filter(t => t.hasMissingData && !t.is_complete);
    const completedTasks = plottedTasks.filter(t => t.is_complete).sort((a, b) => (b.completed_at?.getTime() || 0) - (a.completed_at?.getTime() || 0));

    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Group active Masterlist tasks by Quadrant (Priority is now 1-10 instead of 1-100)
    // 1-5 = Left side, 6-10 = Right side
    // Group active Masterlist tasks by Quadrant using static thresholds (5)
    // Inclusive: 5 is part of the "Active" (Important/Urgent) zones
    // Sorting: P+I logic -> (11 - priorityScore) + importance
    const getSortScore = (t: any) => ((11 - t.priorityScore) + (t.importance ?? 0));

    const doFirst = masterList.filter(t => t.priorityScore <= 5 && (t.importance ?? 0) >= 5).sort((a, b) => getSortScore(b) - getSortScore(a));
    const schedule = masterList.filter(t => t.priorityScore > 5 && (t.importance ?? 0) >= 5).sort((a, b) => getSortScore(b) - getSortScore(a));
    const delegate = masterList.filter(t => t.priorityScore <= 5 && (t.importance ?? 0) < 5).sort((a, b) => getSortScore(b) - getSortScore(a));
    const dontDo = masterList.filter(t => t.priorityScore > 5 && (t.importance ?? 0) < 5).sort((a, b) => getSortScore(b) - getSortScore(a));

    const selectedTask = plottedTasks.find(t => t.id === selectedTaskId);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [showCompleted, setShowCompleted] = useState(false);
    const [resizingCol, setResizingCol] = useState<'masterlist' | 'matrix' | 'actionPlan' | null>(null);
    const [resizingRow, setResizingRow] = useState<boolean>(false);

    const handleResize = (e: React.MouseEvent) => {
        if (resizingRow) {
            setActionPlanHeight(Math.max(100, actionPlanHeight + e.movementY));
            return;
        }
        if (!resizingCol) return;
        const delta = e.movementX;
        if (resizingCol === 'masterlist') {
            // Splitter: +Masterlist, -Matrix
            const newMasterlist = Math.max(150, masterlist + delta);
            const newMatrix = Math.max(300, matrix - (newMasterlist - masterlist));
            setColumnWidths({ masterlist: newMasterlist, matrix: newMatrix });
        } else if (resizingCol === 'matrix') {
            // Splitter: +Matrix, -ActionPlan
            const newMatrix = Math.max(300, matrix + delta);
            const newActionPlan = Math.max(150, actionPlan - (newMatrix - matrix));
            setColumnWidths({ matrix: newMatrix, actionPlan: newActionPlan });
        } else if (resizingCol === 'actionPlan') {
            // Detail pane is flex-1, so it absorbs the change naturally
            setColumnWidths({ actionPlan: Math.max(150, actionPlan + delta) });
        }
    };

    if (!isHydrated) return null; // Avoid hydration mismatch

    return (
        <DndContext
            modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
            onDragEnd={(e) => {
                const { active, delta } = e;
                if (active && delta) {
                    // Calculate new importance based on vertical delta
                    const task = plottedTasks.find(t => t.id === active.id);
                    if (task && task.importance) {
                        // Rough mapping: 10 units = 1 importance step
                        const change = Math.round(delta.y / -40); // Up is negative Y, meaning higher importance
                        let newImportance = task.importance + change;
                        if (newImportance > 10) newImportance = 10;
                        if (newImportance < 0) newImportance = 0;

                        if (newImportance !== task.importance) {
                            updateTaskImportance(task.id, newImportance);
                        }
                    }
                }
            }}
        >
            <div
                className={`flex h-screen w-full bg-background text-foreground overflow-hidden text-sm select-none ${theme === 'dark' ? 'dark' : ''}`}
                onClick={() => selectTask(null)}
                onMouseMove={handleResize}
                onMouseUp={() => { setResizingCol(null); setResizingRow(false); }}
            >
                {/* Col 1: Masterlist */}
                <div
                    className="border-r border-border p-4 overflow-y-auto flex flex-col gap-2 bg-muted/30 relative"
                    style={{ width: masterlist }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-emerald-400">Masterlist</h2>
                        <button
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent deselecting when clicking add
                                const newTask = {
                                    id: crypto.randomUUID(),
                                    title: "New Task",
                                    importance: 5,
                                    estimated_duration: 1,
                                    is_complete: false,
                                    completed_at: null,
                                    subtasks: [],
                                    notes: "",
                                    deadline: new Date(Date.now() + 2 * 86400000), // Default 2 days from now
                                    is_recurring: false,
                                    recurrence_interval: null,
                                    created_at: new Date(),
                                    updated_at: new Date()
                                } as Task;
                                addTask(newTask);
                                selectTask(newTask.id);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white w-6 h-6 rounded-md flex items-center justify-center font-bold text-lg leading-none shadow-md transition-all active:scale-95"
                            title="Add Task"
                        >
                            +
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {showCompleted ? (
                            completedTasks.length > 0 ? completedTasks.map(task => (
                                <div
                                    key={task.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        selectTask(task.id);
                                    }}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTaskId === task.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-card/50 hover:border-muted-foreground/30 opacity-60'
                                        }`}
                                >
                                    <div className="font-medium truncate line-through text-muted-foreground">{task.title}</div>
                                    <div className="text-[10px] text-emerald-500/70 mt-1">
                                        Done: {task.completed_at ? new Date(task.completed_at).toLocaleDateString() : 'Unknown'}
                                    </div>
                                </div>
                            )) : <div className="text-xs text-muted-foreground italic p-2">No completed tasks yet.</div>
                        ) : (
                            masterList.map((task, index) => (
                                <div
                                    key={task.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        selectTask(task.id);
                                    }}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTaskId === task.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-card hover:border-muted-foreground/30'
                                        }`}
                                >
                                    <div className="font-medium truncate"><span className="text-emerald-500/70 mr-1">#{index + 1}</span>{task.title}</div>
                                    <div className="text-xs text-muted-foreground mt-1 flex justify-between">
                                        <span>P: {task.priorityScore}</span>
                                        <span>I: {task.importance}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <button
                        onClick={() => setShowCompleted(!showCompleted)}
                        className="mt-4 w-full py-2 text-xs font-medium text-muted-foreground bg-muted/50 hover:bg-muted rounded-md transition-colors"
                    >
                        {showCompleted ? "View Active Tasks" : `View Completed (${completedTasks.length})`}
                    </button>

                    {/* Preferences Bolletje */}
                    <div className="absolute bottom-20 left-4 z-50">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setTheme(theme === 'dark' ? 'light' : 'dark');
                                document.documentElement.classList.toggle('dark');
                            }}
                            className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95 group"
                            title="Toggle Theme"
                        >
                            {theme === 'dark' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Resize Handle 1 */}
                <div
                    className="w-1 hover:bg-accent/50 cursor-col-resize z-50 transition-colors"
                    onMouseDown={(e) => { e.stopPropagation(); setResizingCol('masterlist'); }}
                />

                {/* Col 2: The Matrix (Scatter Plot) */}
                <div
                    className="border-r border-border p-8 relative flex flex-col bg-background overflow-hidden"
                    style={{ width: matrix }}
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-cyan-400">The Matrix</h2>
                        <div className="text-xs text-muted-foreground">X: Priority (1-10) • Y: Importance (1-10)</div>
                    </div>

                    <div className="flex-1 relative flex pl-6 pb-6">
                        {/* Y-axis text */}
                        <div className="absolute left-0 top-0 bottom-6 w-6 flex justify-center items-center pointer-events-none">
                            <span className="text-[10px] text-muted-foreground tracking-widest uppercase -rotate-90 whitespace-nowrap font-medium">Importance ➔</span>
                        </div>

                        {/* X-axis text */}
                        <div className="absolute bottom-0 left-6 right-0 h-6 flex justify-center items-center pointer-events-none">
                            <span className="text-[10px] text-muted-foreground tracking-widest uppercase font-medium">Priority (Urgency) ➔</span>
                        </div>

                        <div className="flex-1 relative border border-border rounded-xl bg-card/20">
                            {/* Eisenhower Quadrants */}
                            <div className="absolute top-0 left-0 right-1/2 bottom-1/2 bg-emerald-500/10 border-r border-b border-border/30 flex justify-center items-center pointer-events-none rounded-tl-xl overflow-hidden">
                                <span className="text-emerald-500/20 font-bold text-3xl uppercase tracking-widest text-center whitespace-nowrap">Do First</span>
                            </div>
                            <div className="absolute top-0 left-1/2 right-0 bottom-1/2 bg-blue-500/10 border-b border-border/30 flex justify-center items-center pointer-events-none rounded-tr-xl overflow-hidden">
                                <span className="text-blue-500/20 font-bold text-3xl uppercase tracking-widest text-center whitespace-nowrap">Schedule</span>
                            </div>
                            <div className="absolute top-1/2 left-0 right-1/2 bottom-0 bg-amber-500/10 border-r border-border/30 flex justify-center items-center pointer-events-none rounded-bl-xl overflow-hidden">
                                <span className="text-amber-500/20 font-bold text-3xl uppercase tracking-widest text-center whitespace-nowrap">Delegate</span>
                            </div>
                            <div className="absolute top-1/2 left-1/2 right-0 bottom-0 bg-rose-500/10 flex justify-center items-center pointer-events-none rounded-br-xl overflow-hidden">
                                <span className="text-rose-500/20 font-bold text-3xl uppercase tracking-widest text-center whitespace-nowrap">Don&apos;t Do</span>
                            </div>

                            {/* Grid lines */}
                            <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-20 pointer-events-none overflow-hidden rounded-xl">
                                {Array.from({ length: 100 }).map((_, i) => <div key={i} className="border-[0.5px] border-border"></div>)}
                            </div>

                            {(() => {
                                const posCounts: Record<string, number> = {};
                                return masterList.map((task, index) => {
                                    const posKey = `${task.priorityScore}-${task.importance}`;
                                    const offsetIndex = posCounts[posKey] || 0;
                                    posCounts[posKey] = offsetIndex + 1;

                                    return (
                                        <DraggableNode
                                            key={task.id}
                                            task={task}
                                            index={index + 1}
                                            offsetIndex={offsetIndex}
                                            isSelected={selectedTaskId === task.id}
                                            onSelect={() => selectTask(task.id)}
                                        />
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>

                {/* Resize Handle 2 */}
                <div
                    className="w-1 hover:bg-accent/50 cursor-col-resize z-50 transition-colors"
                    onMouseDown={(e) => { e.stopPropagation(); setResizingCol('matrix'); }}
                />

                {/* Col 3: Priority Lists & Waiting Room */}
                <div
                    className="border-r border-border flex flex-col bg-muted/30 overflow-hidden"
                    style={{ width: actionPlan }}
                >
                    {/* Top Half: Priority List grouped by Quadrant */}
                    <div
                        className="p-4 overflow-y-auto border-b border-border flex flex-col gap-4 relative"
                        style={{ height: actionPlanHeight }}
                    >
                        <h2 className="text-lg font-semibold text-indigo-400">Action Plan</h2>

                        {/* Group: Do First */}
                        {doFirst.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider border-b border-emerald-500/30 pb-1">Do First</h3>
                                {doFirst.map(task => (
                                    <div key={task.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selectTask(task.id);
                                        }}
                                        className={`p-2 rounded-md border cursor-pointer text-xs ${selectedTaskId === task.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-border bg-card hover:border-accent'}`}
                                    >
                                        <div className="font-medium truncate">{task.title}</div>
                                        <div className="text-[10px] text-muted-foreground mt-1">Score: {getSortScore(task)}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Group: Schedule */}
                        {schedule.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-blue-500 uppercase tracking-wider border-b border-blue-500/30 pb-1">Schedule</h3>
                                {schedule.map(task => (
                                    <div key={task.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selectTask(task.id);
                                        }}
                                        className={`p-2 rounded-md border cursor-pointer text-xs ${selectedTaskId === task.id ? 'border-blue-500 bg-blue-500/10' : 'border-border bg-card hover:border-accent'}`}
                                    >
                                        <div className="font-medium truncate">{task.title}</div>
                                        <div className="text-[10px] text-muted-foreground mt-1">Score: {getSortScore(task)}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Group: Delegate */}
                        {delegate.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider border-b border-amber-500/30 pb-1">Delegate</h3>
                                {delegate.map(task => (
                                    <div key={task.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selectTask(task.id);
                                        }}
                                        className={`p-2 rounded-md border cursor-pointer text-xs ${selectedTaskId === task.id ? 'border-amber-500 bg-amber-500/10' : 'border-border bg-card hover:border-accent'}`}
                                    >
                                        <div className="font-medium truncate">{task.title}</div>
                                        <div className="text-[10px] text-muted-foreground mt-1">Score: {getSortScore(task)}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Group: Don't Do */}
                        {dontDo.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="text-xs font-bold text-rose-500 uppercase tracking-wider border-b border-rose-500/30 pb-1">Don&apos;t Do</h3>
                                {dontDo.map(task => (
                                    <div key={task.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            selectTask(task.id);
                                        }}
                                        className={`p-2 rounded-md border cursor-pointer text-xs ${selectedTaskId === task.id ? 'border-rose-500 bg-rose-500/10' : 'border-border bg-card hover:border-accent'}`}
                                    >
                                        <div className="font-medium truncate">{task.title}</div>
                                        <div className="text-[10px] text-muted-foreground mt-1">Score: {getSortScore(task)}</div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {masterList.length === 0 && <div className="text-muted-foreground text-xs italic">No plotted tasks.</div>}

                        {/* Resize Handle 4 (Vertical) */}
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1 hover:bg-accent/50 cursor-row-resize z-50 transition-colors"
                            onMouseDown={(e) => { e.stopPropagation(); setResizingRow(true); }}
                        />
                    </div>

                    {/* Bottom Half: Waiting Room */}
                    <div className="flex-1 p-4 overflow-y-auto bg-card/20">
                        <h2 className="text-sm font-semibold mb-3 text-amber-500 flex items-center justify-between">
                            Waiting Room
                            <span className="bg-amber-950/80 text-amber-400 text-[10px] px-2 py-0.5 rounded-full">{waitingRoom.length}</span>
                        </h2>
                        <div className="flex flex-col gap-2">
                            {waitingRoom.map(task => (
                                <div
                                    key={task.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        selectTask(task.id);
                                    }}
                                    className={`p-2 rounded-lg border cursor-pointer text-xs ${selectedTaskId === task.id ? 'border-amber-500 bg-amber-500/10' : 'border-border bg-card hover:border-accent'
                                        }`}
                                >
                                    <div className="font-medium truncate">{task.title}</div>
                                    <div className="text-[10px] text-rose-400 mt-1">Missing Data</div>
                                </div>
                            ))}
                            {waitingRoom.length === 0 && <div className="text-muted-foreground text-xs italic">All clear!</div>}
                        </div>
                    </div>
                </div>

                {/* Resize Handle 3 */}
                <div
                    className="w-1 hover:bg-accent/50 cursor-col-resize z-50 transition-colors"
                    onMouseDown={(e) => { e.stopPropagation(); setResizingCol('actionPlan'); }}
                />

                {/* Col 4: Detail Pane */}
                <div
                    className="flex-1 min-w-[300px] p-6 bg-background overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <h2 className="text-lg font-semibold mb-6 text-indigo-400">Detail Pane</h2>
                    {selectedTask ? (
                        <div className="flex flex-col gap-5">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Title</label>
                                <input
                                    type="text"
                                    value={selectedTask.title}
                                    onChange={(e) => updateTaskDetails(selectedTask.id, { title: e.target.value })}
                                    className="w-full bg-input border border-input-border rounded-md p-2 text-foreground focus:outline-none focus:border-accent transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Importance (0-10)</label>
                                <input
                                    type="number"
                                    min={0} max={10}
                                    value={selectedTask.importance === null ? '' : selectedTask.importance}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) {
                                            updateTaskDetails(selectedTask.id, { importance: Math.max(0, Math.min(10, val)) });
                                        } else {
                                            updateTaskDetails(selectedTask.id, { importance: null as any });
                                        }
                                    }}
                                    className="w-full bg-input border border-input-border rounded-md p-2 text-foreground focus:outline-none focus:border-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Duration (days)</label>
                                <input
                                    type="number"
                                    value={selectedTask.estimated_duration || ''}
                                    onChange={(e) => updateTaskDetails(selectedTask.id, { estimated_duration: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-input border border-input-border rounded-md p-2 text-foreground focus:outline-none focus:border-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Deadline Date</label>
                                <input
                                    type="date"
                                    value={selectedTask.deadline ? new Date(selectedTask.deadline).toISOString().split('T')[0] : ''}
                                    onChange={(e) => updateTaskDetails(selectedTask.id, { deadline: e.target.value ? new Date(e.target.value) : null })}
                                    className="w-full bg-input border border-input-border rounded-md p-2 text-foreground focus:outline-none focus:border-accent appearance-none max-w-full [color-scheme:light] dark:[color-scheme:dark]"
                                />
                            </div>
                            <div className="flex flex-col gap-3 p-3 bg-card/50 rounded-lg border border-border">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-muted-foreground">Recurring Task</label>
                                    <button
                                        onClick={() => updateTaskDetails(selectedTask.id, { is_recurring: !selectedTask.is_recurring, recurrence_interval: selectedTask.is_recurring ? null : 7 })}
                                        className={`w-10 h-5 rounded-full relative transition-colors ${selectedTask.is_recurring ? 'bg-accent' : 'bg-muted'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${selectedTask.is_recurring ? 'translate-x-5' : ''}`} />
                                    </button>
                                </div>
                                {selectedTask.is_recurring && (
                                    <div className="flex items-center gap-2">
                                        <label className="text-[10px] text-muted-foreground whitespace-nowrap">Repeat every</label>
                                        <input
                                            type="number"
                                            min={1}
                                            value={selectedTask.recurrence_interval || 7}
                                            onChange={(e) => updateTaskDetails(selectedTask.id, { recurrence_interval: parseInt(e.target.value) || 1 })}
                                            className="w-16 bg-input border border-input-border rounded p-1 text-xs text-center"
                                        />
                                        <span className="text-[10px] text-muted-foreground font-medium">days</span>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes</label>
                                <textarea
                                    value={selectedTask.notes || ''}
                                    onChange={(e) => updateTaskDetails(selectedTask.id, { notes: e.target.value })}
                                    className="w-full bg-input border border-input-border rounded-md p-2 text-foreground focus:outline-none focus:border-accent min-h-24 resize-y"
                                    placeholder="Add detailed task notes here..."
                                />
                            </div>

                            <div className="border-t border-slate-800 pt-4 mt-2">
                                <label className="block text-xs font-semibold text-slate-400 mb-2">Subtasks</label>
                                <div className="space-y-2 mb-3">
                                    {selectedTask.subtasks?.map(sub => (
                                        <div key={sub.id} className="flex gap-2 items-center text-sm group">
                                            <input
                                                type="checkbox"
                                                checked={sub.is_complete}
                                                onChange={() => useTaskStore.getState().toggleSubtask(selectedTask.id, sub.id)}
                                                className="w-4 h-4 rounded border-input-border bg-input text-accent focus:ring-accent focus:ring-offset-background cursor-pointer"
                                            />
                                            <span className={`flex-1 ${sub.is_complete ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                                {sub.title}
                                            </span>
                                            <button
                                                onClick={() => useTaskStore.getState().deleteSubtask(selectedTask.id, sub.id)}
                                                className="text-muted-foreground hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                    {(!selectedTask.subtasks || selectedTask.subtasks.length === 0) && (
                                        <div className="text-xs text-slate-500 italic">No subtasks added yet.</div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newSubtaskTitle.trim() !== '') {
                                                useTaskStore.getState().addSubtask(selectedTask.id, newSubtaskTitle.trim());
                                                setNewSubtaskTitle("");
                                            }
                                        }}
                                        placeholder="Add new subtask..."
                                        className="flex-1 bg-input border border-input-border rounded-md py-1 px-2 text-xs text-foreground focus:outline-none focus:border-accent"
                                    />
                                    <button
                                        onClick={() => {
                                            if (newSubtaskTitle.trim() !== '') {
                                                useTaskStore.getState().addSubtask(selectedTask.id, newSubtaskTitle.trim());
                                                setNewSubtaskTitle("");
                                            }
                                        }}
                                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 rounded-md transition-colors text-xs font-medium"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                {selectedTask.is_complete ? (
                                    <button
                                        onClick={() => {
                                            uncompleteTask(selectedTask.id);
                                        }}
                                        className="flex-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/50 font-medium py-2 px-4 rounded-md transition-all text-sm shadow-[0_0_10px_rgba(217,119,6,0.1)]"
                                    >
                                        Mark Incomplete
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => {
                                            useTaskStore.getState().completeTask(selectedTask.id);
                                        }}
                                        className="flex-1 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50 font-medium py-2 px-4 rounded-md transition-all text-sm"
                                    >
                                        Mark Complete
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        // Local DB Save Placeholder
                                        console.log("Saving to local SQLite DB: ", selectedTask);
                                    }}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-md transition-all text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                >
                                    Save
                                </button>
                            </div>
                            <button
                                onClick={() => {
                                    if (confirm("Are you sure you want to delete this task?")) {
                                        useTaskStore.getState().deleteTask(selectedTask.id);
                                    }
                                }}
                                className="w-full mt-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-medium py-2 px-4 rounded-md transition-all text-sm"
                            >
                                Delete Task
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                            Select a task to edit
                        </div>
                    )}
                </div>
            </div>
        </DndContext>
    );
}

// Draggable node representation in the Matrix Scatter Plot
function DraggableNode({ task, index, offsetIndex, isSelected, onSelect }: { task: any, index: number, offsetIndex: number, isSelected: boolean, onSelect: () => void }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: task.id,
    });

    const isImportant = (task.importance ?? 0) >= 5;
    const isUrgent = (task.priorityScore ?? 0) <= 5;

    const getQuadrantColorClasses = () => {
        if (isImportant && isUrgent) return 'bg-emerald-500 hover:bg-emerald-400';
        if (isImportant && !isUrgent) return 'bg-blue-500 hover:bg-blue-400';
        if (!isImportant && isUrgent) return 'bg-amber-500 hover:bg-amber-400';
        return 'bg-rose-500 hover:bg-rose-400';
    };

    // Calculate a small offset to prevent perfect overlapping
    const jitter = offsetIndex * 6;

    const style = {
        transform: transform ? `translate3d(0px, ${transform.y}px, 0)` : undefined,
        // X priority (1-10) -> left %
        left: `calc(${((task.priorityScore - 1) / 9) * 100}% - ${12 - jitter}px)`,
        // Y importance (0-10) -> bottom %
        bottom: `calc(${(task.importance / 10) * 100}% - ${12 - jitter}px)`,
        zIndex: isSelected ? 200 : 100 + offsetIndex, // Selected always on top, others stack
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onPointerDown={(e) => {
                e.stopPropagation();
                onSelect();
                listeners?.onPointerDown?.(e);
            }}
            className={`absolute w-6 h-6 flex items-center justify-center rounded-full text-[11px] font-bold shadow-[0_0_10px_rgba(0,0,0,0.5)] outline outline-2 transition-all cursor-grab active:cursor-grabbing text-slate-950
        ${getQuadrantColorClasses()}
        ${isSelected ? 'ring-2 ring-white scale-125 outline-white' : 'outline-slate-950'}`}
        >
            {index}
        </div>
    );
}
