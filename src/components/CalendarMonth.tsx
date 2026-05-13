"use client";

import type { Task } from "@/lib/types";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

interface Props {
  month: Date;
  tasks: Task[];
  onDayClick: (date: Date) => void;
  onTaskClick: (task: Task) => void;
}

const PRIORITY_BORDER: Record<string, string> = {
  high: "border-l-urgent",
  medium: "border-l-important",
  low: "border-l-noise",
};

const STATUS_OPACITY: Record<string, string> = {
  done: "opacity-50 line-through",
  doing: "",
  todo: "",
};

export default function CalendarMonth({ month, tasks, onDayClick, onTaskClick }: Props) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });

  // Build day grid (siempre 6 filas x 7 cols = 42 días)
  const days: Date[] = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }
  while (days.length < 42) {
    days.push(addDays(days[days.length - 1], 1));
  }

  const weekDays = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

  function tasksForDay(day: Date) {
    return tasks.filter((t) => {
      const td = new Date(t.task_date + "T00:00:00");
      return isSameDay(td, day);
    });
  }

  return (
    <div className="card">
      {/* Header de días */}
      <div className="grid grid-cols-7 border-b border-border-soft">
        {weekDays.map((d) => (
          <div
            key={d}
            className="px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-muted text-center"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grilla */}
      <div className="grid grid-cols-7 grid-rows-6">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, month);
          const dayTasks = tasksForDay(day);
          const isLastRow = i >= 35;
          const isLastCol = (i + 1) % 7 === 0;
          return (
            <div
              key={i}
              onClick={() => onDayClick(day)}
              className={`
                min-h-[110px] p-1.5 cursor-pointer transition-colors hover:bg-[#fbf8f1]
                ${!isLastCol ? "border-r border-border-soft" : ""}
                ${!isLastRow ? "border-b border-border-soft" : ""}
                ${!inMonth ? "bg-[#faf7f0]/50" : ""}
              `}
            >
              <div className="flex items-center justify-between mb-1 px-1">
                <span
                  className={`
                    text-[12px] font-medium leading-none
                    ${!inMonth ? "text-ink-muted" : "text-ink-soft"}
                    ${isToday(day) ? "bg-ink text-white rounded-full w-6 h-6 flex items-center justify-center font-semibold" : ""}
                  `}
                >
                  {format(day, "d", { locale: es })}
                </span>
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-ink-muted font-medium">
                    +{dayTasks.length - 3}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(t);
                    }}
                    className={`
                      w-full text-left text-[11px] leading-tight px-1.5 py-1 rounded
                      bg-white border-l-2 ${PRIORITY_BORDER[t.priority]}
                      border border-border-soft hover:border-ink-soft transition-colors
                      truncate ${STATUS_OPACITY[t.status]}
                    `}
                    style={
                      t.assignee
                        ? { backgroundColor: `${t.assignee.color}12` }
                        : undefined
                    }
                    title={t.title}
                  >
                    {t.task_time && (
                      <span className="text-ink-muted mr-1 font-medium">
                        {t.task_time.slice(0, 5)}
                      </span>
                    )}
                    <span className="font-medium text-ink">{t.title}</span>
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
