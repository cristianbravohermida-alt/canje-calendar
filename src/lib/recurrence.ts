import { addDays, addMonths, format, getDate, getDay, startOfMonth } from "date-fns";
import type { Task } from "./types";

function parseLocalDate(iso: string): Date {
  // Parsea YYYY-MM-DD como medianoche local (sin shift de timezone)
  return new Date(iso + "T00:00:00");
}

function formatISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

/**
 * Devuelve la enésima ocurrencia (1..5) de un día de la semana en un mes dado.
 * weekday: 0=Domingo, 1=Lunes, ..., 6=Sábado
 * Devuelve null si el mes no tiene esa enésima ocurrencia (ej. "5to martes" en un mes corto).
 */
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
  // Si se desbordó al siguiente mes, no existe esa enésima ocurrencia
  if (candidate.getMonth() !== monthZeroIdx) return null;
  return candidate;
}

/**
 * Expande una tarea recurrente en sus instancias dentro de [rangeStart, rangeEnd].
 * Las tareas no recurrentes se devuelven tal cual si caen en el rango.
 */
export function expandTask(task: Task, rangeStart: Date, rangeEnd: Date): Task[] {
  if (!task.recurrence_type || task.recurrence_type === "none") {
    const d = parseLocalDate(task.task_date);
    return d >= rangeStart && d <= rangeEnd ? [task] : [];
  }

  const anchor = parseLocalDate(task.task_date);
  const until = task.recurrence_until ? parseLocalDate(task.recurrence_until) : null;
  const limit = until && until < rangeEnd ? until : rangeEnd;
  const results: Task[] = [];

  const makeInstance = (d: Date): Task => ({
    ...task,
    task_date: formatISODate(d),
    series_anchor_date: task.task_date,
  });

  switch (task.recurrence_type) {
    case "daily": {
      let cursor = anchor;
      while (cursor <= limit) {
        if (cursor >= rangeStart) results.push(makeInstance(cursor));
        cursor = addDays(cursor, 1);
      }
      break;
    }
    case "weekdays": {
      let cursor = anchor;
      while (cursor <= limit) {
        const w = getDay(cursor);
        if (w !== 0 && w !== 6) {
          if (cursor >= rangeStart) results.push(makeInstance(cursor));
        }
        cursor = addDays(cursor, 1);
      }
      break;
    }
    case "weekly": {
      let cursor = anchor;
      while (cursor <= limit) {
        if (cursor >= rangeStart) results.push(makeInstance(cursor));
        cursor = addDays(cursor, 7);
      }
      break;
    }
    case "monthly_nth_weekday": {
      const weekday = getDay(anchor);
      const nth = Math.floor((getDate(anchor) - 1) / 7) + 1;
      let cursor = startOfMonth(anchor);
      // Buffer: iterar hasta un mes después del limit por si limit cae a mitad de mes
      const hardStop = addMonths(limit, 1);
      while (cursor <= hardStop) {
        const d = nthWeekdayOfMonth(cursor.getFullYear(), cursor.getMonth(), weekday, nth);
        if (d && d >= anchor && d <= limit && d >= rangeStart) {
          results.push(makeInstance(d));
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
      while (year <= lastYear) {
        const candidate = new Date(year, m, day);
        // Saltar 29 feb en años no bisiestos (JS rota a 1 mar)
        if (candidate.getMonth() === m) {
          if (candidate >= anchor && candidate <= limit && candidate >= rangeStart) {
            results.push(makeInstance(candidate));
          }
        }
        year++;
      }
      break;
    }
  }

  return results;
}

export function expandAllTasks(tasks: Task[], rangeStart: Date, rangeEnd: Date): Task[] {
  return tasks.flatMap((t) => expandTask(t, rangeStart, rangeEnd));
}
