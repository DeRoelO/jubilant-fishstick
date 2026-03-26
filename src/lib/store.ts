import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, PlottedTask, calculateTaskPriorities } from './priority';

interface TaskStore {
    tasks: Task[];
    plottedTasks: PlottedTask[];
    selectedTaskId: string | null;
    setTasks: (tasks: Task[]) => void;
    updateTaskImportance: (taskId: string, importance: number) => void;
    updateTaskDetails: (taskId: string, updates: Partial<Task>) => void;
    selectTask: (taskId: string | null) => void;
    addTask: (task: Task) => void;
    deleteTask: (taskId: string) => void;
    addSubtask: (taskId: string, title: string) => void;
    toggleSubtask: (taskId: string, subtaskId: string) => void;
    deleteSubtask: (taskId: string, subtaskId: string) => void;
    completeTask: (taskId: string) => void;
    columnWidths: { masterlist: number, matrix: number, actionPlan: number };
    actionPlanHeight: number;
    setColumnWidths: (widths: Partial<{ masterlist: number, matrix: number, actionPlan: number }>) => void;
    setActionPlanHeight: (height: number) => void;
    uncompleteTask: (taskId: string) => void;
    theme: 'light' | 'dark';
    setTheme: (theme: 'light' | 'dark') => void;
    matrixDaysWindow: number;
    setMatrixDaysWindow: (days: number) => void;
    importStore: (jsonData: string) => void;
}

// Initial mock data to show functionality immediately
const MOCK_TASKS: Task[] = [
    { id: '1', title: 'Write presentation', importance: 8, is_complete: false, completed_at: null, notes: null, subtasks: [], estimated_duration: 2, deadline: new Date(Date.now() + 172800000), is_recurring: false, recurrence_interval: null, created_at: new Date(), updated_at: new Date() },
    { id: '2', title: 'Review budget', importance: 5, is_complete: false, completed_at: null, notes: 'Ask financial dept for latest numbers.', subtasks: [{ id: 's1', title: 'Get PDF', is_complete: true, task_id: '2', created_at: new Date(), updated_at: new Date() }, { id: 's2', title: 'Leave notes', is_complete: false, task_id: '2', created_at: new Date(), updated_at: new Date() }], estimated_duration: null, deadline: null, is_recurring: false, recurrence_interval: null, created_at: new Date(), updated_at: new Date() },
    { id: '3', title: 'Call client', importance: 9, is_complete: false, completed_at: null, notes: null, subtasks: [], estimated_duration: 1, deadline: new Date(Date.now() + 3600000), is_recurring: false, recurrence_interval: null, created_at: new Date(), updated_at: new Date() },
];

export const useTaskStore = create<TaskStore>()(
    persist(
        (set) => ({
            tasks: MOCK_TASKS,
            plottedTasks: calculateTaskPriorities(MOCK_TASKS, 7),
            selectedTaskId: null,
            columnWidths: {
                masterlist: 250,
                matrix: 600,
                actionPlan: 250
            },
            actionPlanHeight: 400,
            matrixDaysWindow: 7,
            setMatrixDaysWindow: (days) => set((state) => ({ matrixDaysWindow: days, plottedTasks: calculateTaskPriorities(state.tasks, days) })),

            setColumnWidths: (widths) => {
                set((state) => ({ columnWidths: { ...state.columnWidths, ...widths } }));
            },
            setActionPlanHeight: (height) => {
                set({ actionPlanHeight: height });
            },

            theme: 'dark', // Default to dark as per initial design
            setTheme: (theme) => set({ theme }),

            setTasks: (tasks) => {
                set((state) => ({ tasks, plottedTasks: calculateTaskPriorities(tasks, state.matrixDaysWindow) }));
            },

            addTask: (task) => {
                set((state) => {
                    const tasks = [...state.tasks, task];
                    return { tasks, plottedTasks: calculateTaskPriorities(tasks, state.matrixDaysWindow) };
                });
            },

            updateTaskImportance: (taskId, importance) => {
                set((state) => {
                    const tasks = state.tasks.map(t => t.id === taskId ? { ...t, importance } : t);
                    return { tasks, plottedTasks: calculateTaskPriorities(tasks, state.matrixDaysWindow) };
                });
            },

            updateTaskDetails: (taskId, updates) => {
                set((state) => {
                    const tasks = state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t);
                    return { tasks, plottedTasks: calculateTaskPriorities(tasks, state.matrixDaysWindow) };
                });
            },

            selectTask: (selectedTaskId) => set({ selectedTaskId }),

            deleteTask: (taskId) => {
                set((state) => {
                    const tasks = state.tasks.filter((t) => t.id !== taskId);
                    return { tasks, plottedTasks: calculateTaskPriorities(tasks, state.matrixDaysWindow), selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId };
                });
            },

            addSubtask: (taskId, title) => {
                set((state) => {
                    const tasks = state.tasks.map(t => {
                        if (t.id === taskId) {
                            return {
                                ...t,
                                subtasks: [...(t.subtasks || []), { id: crypto.randomUUID(), title, is_complete: false, task_id: taskId, created_at: new Date(), updated_at: new Date() }]
                            };
                        }
                        return t;
                    });
                    return { tasks, plottedTasks: calculateTaskPriorities(tasks, state.matrixDaysWindow) };
                });
            },

            toggleSubtask: (taskId, subtaskId) => {
                set((state) => {
                    const tasks = state.tasks.map(t => {
                        if (t.id === taskId) {
                            return {
                                ...t,
                                subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, is_complete: !s.is_complete } : s)
                            };
                        }
                        return t;
                    });
                    return { tasks, plottedTasks: calculateTaskPriorities(tasks, state.matrixDaysWindow) };
                });
            },

            deleteSubtask: (taskId, subtaskId) => {
                set((state) => {
                    const tasks = state.tasks.map(t => {
                        if (t.id === taskId) {
                            return {
                                ...t,
                                subtasks: t.subtasks.filter(s => s.id !== subtaskId)
                            };
                        }
                        return t;
                    });
                    return { tasks, plottedTasks: calculateTaskPriorities(tasks, state.matrixDaysWindow) };
                });
            },

            completeTask: (taskId) => {
                set((state) => {
                    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
                    if (taskIndex === -1) return state;

                    const task = state.tasks[taskIndex];
                    let updatedTasks = [...state.tasks];

                    if (task.is_recurring && task.recurrence_interval) {
                        // 1. Create a completed clone for history
                        const completedClone: Task = {
                            ...task,
                            id: crypto.randomUUID(),
                            title: `${task.title} (Completed)`,
                            is_complete: true,
                            completed_at: new Date(),
                            is_recurring: false, // Clone is not recurring
                            recurrence_interval: null,
                            subtasks: task.subtasks.map(s => ({ ...s, id: crypto.randomUUID() }))
                        };

                        // 2. Update the original task to the next interval
                        const nextDeadline = task.deadline ? new Date(task.deadline) : new Date();
                        nextDeadline.setDate(nextDeadline.getDate() + task.recurrence_interval);

                        const rescheduledTask: Task = {
                            ...task,
                            deadline: nextDeadline,
                            is_complete: false,
                            completed_at: null,
                            updated_at: new Date(),
                            // Reset subtasks if needed? Let's keep them as is but maybe reset completion?
                            // Usually for recurring tasks people want a fresh subtask list.
                            subtasks: task.subtasks.map(s => ({ ...s, is_complete: false }))
                        };

                        updatedTasks[taskIndex] = rescheduledTask;
                        updatedTasks.push(completedClone);
                    } else {
                        // Standard non-recurring completion
                        updatedTasks[taskIndex] = {
                            ...task,
                            is_complete: true,
                            completed_at: new Date(),
                            updated_at: new Date()
                        };
                    }

                    return {
                        tasks: updatedTasks,
                        plottedTasks: calculateTaskPriorities(updatedTasks, state.matrixDaysWindow),
                        selectedTaskId: (task.is_recurring && task.recurrence_interval) ? state.selectedTaskId : null
                    };
                });
            },
            uncompleteTask: (taskId) => {
                set((state) => {
                    const tasks = state.tasks.map(t =>
                        t.id === taskId ? { ...t, is_complete: false, completed_at: null, updated_at: new Date() } : t
                    );
                    return { tasks, plottedTasks: calculateTaskPriorities(tasks, state.matrixDaysWindow) };
                });
            },
            importStore: (jsonData) => {
                try {
                    const parsed = JSON.parse(jsonData);
                    // Support both raw state and the wrapper format zustand persist uses
                    const stateToImport = parsed.state || parsed;
                    
                    if (stateToImport.tasks) {
                        set((state) => {
                            const revivedTasks = stateToImport.tasks.map((t: any) => ({
                                ...t,
                                deadline: t.deadline ? new Date(t.deadline) : null,
                                completed_at: t.completed_at ? new Date(t.completed_at) : null,
                                created_at: new Date(t.created_at),
                                updated_at: new Date(t.updated_at),
                                subtasks: t.subtasks?.map((s: any) => ({
                                    ...s,
                                    created_at: new Date(s.created_at),
                                    updated_at: new Date(s.updated_at)
                                })) || []
                            }));

                            return {
                                ...state,
                                ...stateToImport,
                                tasks: revivedTasks,
                                plottedTasks: calculateTaskPriorities(revivedTasks, stateToImport.matrixDaysWindow ?? state.matrixDaysWindow)
                            };
                        });
                    }
                } catch (e) {
                    console.error("Failed to import store:", e);
                }
            }
        }),
        {
            name: 'eisenhower-task-storage', // name of the item in the storage (must be unique)
            // we have Date objects in our state, so we need to revive them
            merge: (persistedState: any, currentState) => {
                if (!persistedState) return currentState;

                const revivedTasks = persistedState.tasks.map((t: any) => ({
                    ...t,
                    deadline: t.deadline ? new Date(t.deadline) : null,
                    completed_at: t.completed_at ? new Date(t.completed_at) : null,
                    created_at: new Date(t.created_at),
                    updated_at: new Date(t.updated_at),
                    subtasks: t.subtasks.map((s: any) => ({
                        ...s,
                        created_at: new Date(s.created_at),
                        updated_at: new Date(s.updated_at)
                    }))
                }));

                return {
                    ...currentState,
                    ...persistedState,
                    tasks: revivedTasks,
                    plottedTasks: calculateTaskPriorities(revivedTasks, persistedState.matrixDaysWindow ?? 7),
                    columnWidths: persistedState.columnWidths ?? {
                        masterlist: 250,
                        matrix: 600,
                        actionPlan: 250
                    },
                    actionPlanHeight: persistedState.actionPlanHeight ?? 400,
                    matrixDaysWindow: persistedState.matrixDaysWindow ?? 7,
                    theme: persistedState.theme ?? 'dark'
                };
            }
        }
    )
);
