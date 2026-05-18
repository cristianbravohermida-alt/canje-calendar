"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Task } from "@/lib/types";
import { getContrastingTextColor, getInitials } from "@/lib/utils";

interface Props {
  open: boolean;
  day: Date | null;
  tasks: Task[];
  onClose: () => void;
  onTaskClick: (task: Task) => void;
  onNewTask: (day: Date) => void;
}

const PRIORITY_BORDER: Record<string, string> = {
  high: "border-l-urgent",
  medium: "border-l-important",
  low: "border-l-noise",
};

const STATUS_LABEL: Record<string, string> = {
  todo: "Pendiente",
  doing: "En curso",
  done: "Lista",
};

const STATUS_OPACITY: Record<string, string> = {
  done: "opacity-50 line-through",
  doing: "",
  todo: "",
};

export default function DayTasksModal({
  open,
  day,
  tasks,
  onClose,
  onTaskClick,
  onNewTask,
}: Props) {
  if (!open || !day) return null;

  const dayTasks = tasks
    .slice()
    .sort((a, b) => {
      if (!a.task_time && b.task_time) return 1;
      if (a.task_time && !b.task_time) return -1;
      if (!a.task_time && !b.task_time) return 0;
      return (a.task_time || "").localeCompare(b.task_time || "");
    });

  const titleDate = format(day, "EEEE d 'de' MMMM yyyy", { locale: es });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-[520px] max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-border-soft flex items-center justify-between sticky top-0 bg-surface z-10">
          <div>
            <h2 className="text-[16px] font-semibold capitalize leading-tight">
              {titleDate}
            </h2>
            <p className="text-[12.5px] text-ink-muted mt-0.5">
              {dayTasks.length === 0
                ? "Sin tareas"
                : `${dayTasks.length} ${
                    dayTasks.length === 1 ? "tarea" : "tareas"
                  }`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink text-[20px] leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="p-4 space-y-2">
          {dayTasks.length === 0 && (
            <div className="text-center text-[13px] text-ink-muted py-8">
              No hay tareas para este día.
            </div>
          )}

          {dayTasks.map((t) => {
            const isRecurring =
              t.recurrence_type && t.recurrence_type !== "none";
            return (
              <button
                key={`${t.id}-${t.task_date}`}
                type="button"
                onClick={() => onTaskClick(t)}
                className={`
                  w-full text-left px-3.5 py-3 rounded-lg border border-border-soft
                  bg-white border-l-[3px] ${PRIORITY_BORDER[t.priority]}
                  hover:border-ink-soft transition-colors
                  ${STATUS_OPACITY[t.status]}
                `}
                style={
                  t.assignee
                    ? { backgroundColor: `${t.assignee.color}10` }
                    : undefined
                }
              >
                <div className="flex items-start gap-2.5">
                  {t.assignee && (
                    <span
                      className="flex-shrink-0 inline-flex items-center justify-center w-[24px] h-[24px] rounded-full text-[10px] font-bold leading-none mt-0.5"
                      style={{
                        backgroundColor: t.assignee.color,
                        color: getContrastingTextColor(t.assignee.color),
                      }}
                      title={t.assignee.display_name}
                    >
                      {getInitials(t.assignee.display_name)}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {t.task_time && (
                        <span className="text-[11px] font-semibold text-ink-soft">
                          {t.task_time.slice(0, 5)}
                        </span>
                      )}
                      {isRecurring && (
                        <span className="text-[11px] opacity-70">🔁</span>
                      )}
                      <span className="text-[14px] font-semibold text-ink">
                        {t.title}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-[12.5px] text-ink-soft mt-1 line-clamp-2">
                        {t.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10.5px] uppercase tracking-wide font-semibold text-ink-muted">
                        {STATUS_LABEL[t.status]}
                      </span>
                      {t.assignee && (
                        <span className="text-[11px] text-ink-muted">
                          · {t.assignee.display_name}
                        </span>
                      )}
                      {t.tags &&
                        t.tags.length > 0 &&
                        t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10.5px] px-2 py-0.5 rounded-full bg-[#ececec] text-ink-soft"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-border-soft sticky bottom-0 bg-surface">
          <button
            type="button"
            onClick={() => onNewTask(day)}
            className="btn btn-primary w-full justify-center py-2.5"
          >
            + Nueva tarea este día
          </button>
        </div>
      </div>
    </div>
  );
}
