import {
  addDays,
  addMonths,
  addYears,
  format,
  getDate,
  getDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Task, TaskException } from "./types";

function parseLocalDate(iso: string): Date {
  return new Date(iso + "T00:00:00");
}

function formatISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function nthWeekdayOfMonth(
  year: number,
  monthZeroIdx: number,
  weekday: number,
  nth: number
): Date | null {
  const firstOfMonth = new Date(year, monthZeroIdx, 1);
  const firstWeekday = getDay(firstOfMonth);
  const dayOffset = (weekday - firstWeekday + 7) % 7;
  const dayNumber = 1 + dayOffset + (nth - 1) * 7;
  const candidate = new Date(year, monthZeroIdx, dayNumber);
  if (candidate.getMonth() !== monthZeroIdx) return null;
  return candidate;
}

/**
 * Expande una tarea en sus instancias dentro de [rangeStart, rangeEnd].
 *
 * exMap: mapa "taskId|YYYY-MM-DD" → TaskException. Si una instancia tiene
 * una excepción de estado, se aplica solo a esa instancia (no a la serie).
 */
export function expandTask(
  task: Task,
  rangeStart: Date,
  rangeEnd: Date,
  exMap: Map<string, TaskException>
): Task[] {
  if (!task.recurrence_type || task.recurrence_type === "none") {
    const d = parseLocalDate(task.task_date);
    return d >= rangeStart && d <= rangeEnd ? [task] : [];
  }

  const anchor = parseLocalDate(task.task_date);
  const until = task.recurrence_until ? parseLocalDate(task.recurrence_until) : null;
  const limit = until && until < rangeEnd ? until : rangeEnd;
  const maxCount = task.recurrence_count ?? null;
  const results: Task[] = [];

  const makeInstance = (d: Date): Task => {
    const dateStr = formatISODate(d);
    const ex = exMap.get(`${task.id}|${dateStr}`);
    const hasStatusOverride = !!(ex && ex.status);
    return {
      ...task,
      task_date: dateStr,
      series_anchor_date: task.task_date,
      is_recurring_instance: true,
      status: hasStatusOverride ? ex!.status! : task.status,
      has_status_exception: hasStatusOverride,
    };
  };

  // Loop genérico para recurrencias lineales (anchor + interval × N)
  const linearLoop = (advance: (d: Date) => Date) => {
    let cursor = anchor;
    let count = 0;
    while (cursor <= limit) {
      if (maxCount !== null && count >= maxCount) break;
      if (cursor >= rangeStart) results.push(makeInstance(cursor));
      count++;
      cursor = advance(cursor);
    }
  };

  switch (task.recurrence_type) {
    case "daily": {
      linearLoop((d) => addDays(d, 1));
      break;
    }
    case "weekdays": {
      let cursor = anchor;
      let count = 0;
      while (cursor <= limit) {
        const w = getDay(cursor);
        if (w !== 0 && w !== 6) {
          if (maxCount !== null && count >= maxCount) break;
          if (cursor >= rangeStart) results.push(makeInstance(cursor));
          count++;
        }
        cursor = addDays(cursor, 1);
      }
      break;
    }
    case "weekly": {
      linearLoop((d) => addDays(d, 7));
      break;
    }
    case "monthly_nth_weekday": {
      const weekday = getDay(anchor);
      const nth = Math.floor((getDate(anchor) - 1) / 7) + 1;
      let cursor = startOfMonth(anchor);
      const hardStop = addMonths(limit, 1);
      let count = 0;
      while (cursor <= hardStop) {
        const d = nthWeekdayOfMonth(
          cursor.getFullYear(),
          cursor.getMonth(),
          weekday,
          nth
        );
        if (d && d >= anchor && d <= limit) {
          if (maxCount !== null && count >= maxCount) break;
          if (d >= rangeStart) results.push(makeInstance(d));
          count++;
        }
        cursor = addMonths(cursor, 1);
      }
      break;
    }
    case "yearly": {
      const m = anchor.getMonth();
      const day = getDate(anchor);
      let year = anchor.getFullYear();
      const lastYear = limit.getFullYear();
      let count = 0;
      while (year <= lastYear) {
        const candidate = new Date(year, m, day);
        if (candidate.getMonth() === m && candidate >= anchor && candidate <= limit) {
          if (maxCount !== null && count >= maxCount) break;
          if (candidate >= rangeStart) results.push(makeInstance(candidate));
          count++;
        }
        year++;
      }
      break;
    }
    case "custom": {
      const interval = Math.max(1, task.recurrence_interval || 1);
      const freq = task.recurrence_freq;
      const weekdays = task.recurrence_weekdays || [];

      if (!freq) break;

      if (freq === "week" && weekdays.length > 0) {
        let weekStart = startOfWeek(anchor, { weekStartsOn: 0 });
        const sortedDays = [...weekdays].sort((a, b) => a - b);
        let count = 0;
        let stop = false;
        while (weekStart <= limit && !stop) {
          for (const wd of sortedDays) {
            const d = addDays(weekStart, wd);
            if (d < anchor) continue;
            if (d > limit) {
              stop = true;
              break;
            }
            if (maxCount !== null && count >= maxCount) {
              stop = true;
              break;
            }
            if (d >= rangeStart) results.push(makeInstance(d));
            count++;
          }
          weekStart = addDays(weekStart, 7 * interval);
        }
      } else {
        const advance = (d: Date): Date => {
          if (freq === "day") return addDays(d, interval);
          if (freq === "week") return addDays(d, 7 * interval);
          if (freq === "month") return addMonths(d, interval);
          return addYears(d, interval);
        };
        linearLoop(advance);
      }
      break;
    }
  }

  return results;
}

export function expandAllTasks(
  tasks: Task[],
  rangeStart: Date,
  rangeEnd: Date,
  exceptions: TaskException[] = []
): Task[] {
  // Mapa de búsqueda rápida: "taskId|fecha" → excepción
  const exMap = new Map<string, TaskException>();
  for (const ex of exceptions) {
    exMap.set(`${ex.task_id}|${ex.exception_date}`, ex);
  }
  return tasks.flatMap((t) => expandTask(t, rangeStart, rangeEnd, exMap));
}
