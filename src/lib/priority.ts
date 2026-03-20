export interface Task {
  id: string;
  title: string;
  deadline: Date | null;
  importance: number | null; // 0-10
  notes: string | null;
  estimated_duration: number | null; // in days
  is_recurring: boolean;
  recurrence_interval: number | null; // in days
  is_complete: boolean;
  completed_at: Date | null;
  subtasks: Subtask[];
  created_at: Date;
  updated_at: Date;
}

export interface Subtask {
  id: string;
  title: string;
  is_complete: boolean;
  task_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface PlottedTask extends Task {
  priorityScore: number; // 1-10 (X-axis)
  isOverdue: boolean;
  hasMissingData: boolean; // For Col 3: The Waiting Room
}

/**
 * Calculates a dynamic X-axis "Priority" score (1 to 100).
 */
export function calculateTaskPriorities(tasks: Task[]): PlottedTask[] {
  const now = new Date();

  const taskWithTStart = tasks.map(task => {
    let hasMissingData = false;
    let tStart: Date | null = null;
    let isOverdue = false;

    // Step 1: Check for missing data
    if (!task.deadline || task.estimated_duration == null || task.importance == null) {
      hasMissingData = true;
    } else {
      // Step 1: Calculate theoretical start time (T_start)
      const d = new Date(task.deadline);
      // estimated_duration is in days. Convert to milliseconds: * 24 * 60 * 60 * 1000 = * 86400000
      tStart = new Date(d.getTime() - task.estimated_duration * 86400000);

      // Step 5 (Edge Cases): If T_start is in the past (overdue)
      if (tStart < now) {
        isOverdue = true;
      }
    }

    return { ...task, tStart, isOverdue, hasMissingData };
  });

  const activeTasks = taskWithTStart.filter(t => !t.hasMissingData && t.tStart !== null && !t.is_complete);

  const today = now.getTime();
  const first_start_date = activeTasks.length > 0 ? Math.min(...activeTasks.map(t => t.tStart!.getTime())) : today;
  const last_start_date = activeTasks.length > 0 ? Math.max(...activeTasks.map(t => t.tStart!.getTime())) : today;

  const windowStart = Math.min(first_start_date, today);
  const windowEnd = Math.min(last_start_date, today + 7 * 86400000);

  // Ensure we have a valid range (min 1ms to avoid divide by zero)
  const range = Math.max(1, windowEnd - windowStart);

  return taskWithTStart.map((task) => {
    let priorityScore = 10; // Default to least urgent (right)

    if (!task.hasMissingData && task.tStart) {
      const time = task.tStart.getTime();

      if (range <= 0) {
        // Fallback if earliest task is already beyond today+7
        priorityScore = 10;
      } else if (time <= windowStart) {
        priorityScore = 1; // Earliest task(s): Most urgent (Left)
      } else if (time >= windowEnd) {
        priorityScore = 10; // Beyond 7 days from now: Least urgent (Right)
      } else {
        // Linear mapping between 1 and 10 over the [earliest, today+7] window
        priorityScore = 1 + ((time - windowStart) / range) * 9;
      }

      // Safety cap bounds
      if (priorityScore < 1) priorityScore = 1;
      if (priorityScore > 10) priorityScore = 10;
    }

    const { tStart, ...rest } = task;
    return {
      ...rest,
      priorityScore: Math.round(priorityScore),
    } as PlottedTask;
  }).sort((a, b) => {
    if (a.hasMissingData) return 1;
    if (b.hasMissingData) return -1;
    return a.priorityScore - b.priorityScore;
  });
}
