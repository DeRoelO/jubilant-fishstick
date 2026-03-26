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
  dueDateScore?: number; // 1-10 (X-axis) for due date
  isOverdue: boolean;
  hasMissingData: boolean; // For Col 3: The Waiting Room
}

/**
 * Calculates a dynamic X-axis "Priority" score (1 to 10).
 */
export function calculateTaskPriorities(tasks: Task[], windowDays: number = 7): PlottedTask[] {
  const now = new Date();
  
  // Normalize to 00:00:00 for a stable daily view
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

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
      // Duration 1 means it starts and ends on the exact same day (subtract 0 days)
      const daysToSubtract = Math.max(0, task.estimated_duration - 1);
      tStart = new Date(d.getTime() - daysToSubtract * 86400000);

      // Step 5 (Edge Cases): If T_start is in the past (overdue)
      if (tStart < now) {
        isOverdue = true;
      }
    }

    return { ...task, tStart, isOverdue, hasMissingData };
  });

  const activeTasks = taskWithTStart.filter(t => !t.hasMissingData && t.tStart !== null && !t.is_complete);

  const windowStart = today;
  const windowEnd = today + (windowDays * 86400000);

  // Ensure we have a valid range (min 1ms to avoid divide by zero)
  const range = windowDays * 86400000;

  return taskWithTStart.map((task) => {
    let priorityScore = 10; // Default to least urgent (right)
    let dueDateScore = 10;

    if (!task.hasMissingData && task.tStart) {
      const time = task.tStart.getTime();
      const dueTime = task.deadline ? task.deadline.getTime() : time;

      if (range <= 0) {
        // Fallback
        priorityScore = 10;
        dueDateScore = 10;
      } else {
        // Start date score calculation
        if (time <= windowStart) {
          priorityScore = 1; // Earliest task(s): Most urgent (Left)
        } else if (time >= windowEnd) {
          priorityScore = 10; // Beyond window: Least urgent (Right)
        } else {
          priorityScore = 1 + ((time - windowStart) / range) * 9;
        }

        // Due date score calculation
        if (dueTime <= windowStart) dueDateScore = 1;
        else if (dueTime >= windowEnd) dueDateScore = 10;
        else dueDateScore = 1 + ((dueTime - windowStart) / range) * 9;
      }

      // Safety cap bounds
      if (priorityScore < 1) priorityScore = 1;
      if (priorityScore > 10) priorityScore = 10;
      
      if (dueDateScore < 1) dueDateScore = 1;
      if (dueDateScore > 10) dueDateScore = 10;
    }

    const { tStart, ...rest } = task;
    return {
      ...rest,
      priorityScore: Math.round(priorityScore),
      dueDateScore: Math.round(dueDateScore),
    } as PlottedTask;
  }).sort((a, b) => {
    if (a.hasMissingData) return 1;
    if (b.hasMissingData) return -1;
    return a.priorityScore - b.priorityScore;
  });
}
