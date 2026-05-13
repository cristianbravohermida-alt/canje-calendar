"use client";

import type { Task } from "@/lib/types";
import {
  addDays,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  weekStart: Date;
  tasks: Task[];
  onDayClick: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

const PRIORITY_DOT: Record<string, string> = {
  high: "bg-urgent",
  medium: "bg-important",
  low: "bg-noise",
};

const STATUS_OPACITY: Record<string, string> = {
  done: "opacity-50 line-through",
  doing: "",
  todo: "",
};

export default function CalendarWeek({ weekStart, tasks, onDayClick, onTaskClick }: Props) {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

  function tasksForDay(day: Date) {
    return tasks
      .filter((t) => isSameDay(new Date(t.task_date + "T00:00:00"), day))
      .sort((a, b) => {
        // Sin hora al final
        if (!a.task_time && b.task_time) return 1;
        if (a.task_time && !b.task_time) return -1;
        if (!a.task_time && !b.task_time) return 0;
        return (a.task_time || "").localeCompare(b.task_time || "");
      });
  }

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7">
        {days.map((day, i) => {
          const dayTasks = tasksForDay(day);
          const isLastCol = i === 6;
          return (
            <div
              key={i}
              className={`min-h-[420px] ${!isLastCol ? "border-r border-border-soft" : ""}`}
            >
              <button
                type="button"
                onClick={() => onDayClick(day)}
                className="w-full px-3 py-3 border-b border-border-soft text-left hover:bg-[#fbf8f1] transition-colors"
              >
                <div className="text-[11px] uppercase tracking-wider text-ink-muted font-semibold">
                  {format(day, "EEE", { locale: es })}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    className={`text-[20px] font-bold leading-none ${
                      isToday(day)
                        ? "bg-ink text-white rounded-full w-8 h-8 flex items-center justify-center text-[15px]"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>
                  <span className="text-[12px] text-ink-muted">
                    {format(day, "MMM", { locale: es })}
                  </span>
                </div>
              </button>

              <div className="p-2 space-y-1.5">
                {dayTasks.length === 0 && (
                  <div className="text-[11px] text-ink-muted italic px-1.5 py-3 text-center">
                    sin tareas
                  </div>
                )}
                {dayTasks.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onTaskClick(t)}
                    className={`
                      w-full text-left px-2.5 py-2 rounded-lg border border-border-soft
                      bg-white hover:border-ink-soft transition-colors
                      ${STATUS_OPACITY[t.status]}
                    `}
                    style={
                      t.assignee
                        ? { backgroundColor: `${t.assignee.color}10`, borderLeftColor: t.assignee.color, borderLeftWidth: "3px" }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`pill-dot ${PRIORITY_DOT[t.priority]}`}></span>
                      {t.task_time && (
                        <span className="text-[11px] font-semibold text-ink-soft">
                          {t.task_time.slice(0, 5)}
                        </span>
                      )}
                    </div>
                    <div className="text-[12.5px] font-medium leading-snug text-ink">
                      {t.title}
                    </div>
                    {t.assignee && (
                      <div className="text-[10.5px] text-ink-muted mt-1 truncate">
                        {t.assignee.display_name}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
