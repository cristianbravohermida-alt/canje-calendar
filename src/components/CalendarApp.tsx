"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Task, TaskException } from "@/lib/types";
import { expandAllTasks } from "@/lib/recurrence";
import CalendarMonth from "./CalendarMonth";
import CalendarWeek from "./CalendarWeek";
import TaskModal from "./TaskModal";
import DayTasksModal from "./DayTasksModal";

type ViewMode = "month" | "week";
type StatusFilter = "all" | "pending";

// Cada cuánto se refresca solo el calendario (10 minutos)
const AUTO_REFRESH_MS = 10 * 60 * 1000;
// Si vuelves a la pestaña y los datos tienen más de esto, refresca
const STALE_MS = 60 * 1000;

interface Props {
  currentUser: Profile;
}

function formatRelativeTime(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return "recién";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return date.toLocaleDateString("es-CL");
}

export default function CalendarApp({ currentUser }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [exceptions, setExceptions] = useState<TaskException[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [initialDate, setInitialDate] = useState<string | undefined>(undefined);

  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [filterAssignee, setFilterAssignee] = useState<string | "all" | "mine">(
    "all"
  );
  // Nuevo: filtro por estado (Pendientes vs. Todas)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Tick para refrescar el texto "hace X min" cada 30s sin recargar datos
  const [, setNowTick] = useState(0);

  const lastUpdateRef = useRef<Date | null>(null);
  useEffect(() => {
    lastUpdateRef.current = lastUpdate;
  }, [lastUpdate]);

  const range = useMemo(() => {
    if (view === "month") {
      const s = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
      const e = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
      return { from: format(s, "yyyy-MM-dd"), to: format(e, "yyyy-MM-dd") };
    }
    const s = startOfWeek(cursor, { weekStartsOn: 1 });
    const e = addDays(s, 6);
    return { from: format(s, "yyyy-MM-dd"), to: format(e, "yyyy-MM-dd") };
  }, [view, cursor]);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?from=${range.from}&to=${range.to}`);
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks || []);
        setExceptions(data.exceptions || []);
        setLastUpdate(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, [range]);

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    if (res.ok) setUsers(data.users || []);
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Auto-refresco cada 10 min — sólo con la pestaña visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadTasks();
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadTasks]);

  // Al volver a la pestaña, refrescar si los datos están viejos
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      const last = lastUpdateRef.current;
      if (!last || Date.now() - last.getTime() > STALE_MS) {
        loadTasks();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [loadTasks]);

  // Refrescar el texto "hace X min" cada 30s
  useEffect(() => {
    const t = setInterval(() => setNowTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // 1) Filtrar por asignado
  const filteredTasks = useMemo(() => {
    if (filterAssignee === "all") return tasks;
    if (filterAssignee === "mine")
      return tasks.filter((t) => t.assigned_to === currentUser.id);
    return tasks.filter((t) => t.assigned_to === filterAssignee);
  }, [tasks, filterAssignee, currentUser.id]);

  // 2) Expandir recurrencias + aplicar excepciones de estado por instancia
  // 3) Aplicar filtro de estado (Pendientes = ocultar las marcadas "Lista")
  const expandedTasks = useMemo(() => {
    const rangeStart = new Date(range.from + "T00:00:00");
    const rangeEnd = new Date(range.to + "T23:59:59");
    const expanded = expandAllTasks(
      filteredTasks,
      rangeStart,
      rangeEnd,
      exceptions
    );
    if (statusFilter === "pending") {
      return expanded.filter((t) => t.status !== "done");
    }
    return expanded;
  }, [filteredTasks, exceptions, range.from, range.to, statusFilter]);

  function handlePrev() {
    setCursor(view === "month" ? subMonths(cursor, 1) : addDays(cursor, -7));
  }
  function handleNext() {
    setCursor(view === "month" ? addMonths(cursor, 1) : addDays(cursor, 7));
  }
  function handleToday() {
    setCursor(new Date());
  }

  function handleDayClick(day: Date) {
    setSelectedDay(day);
    setDayModalOpen(true);
  }
  function handleTaskClick(task: Task) {
    setEditing(task);
    setInitialDate(undefined);
    setModalOpen(true);
  }
  function handleNewTask() {
    setEditing(null);
    setInitialDate(format(new Date(), "yyyy-MM-dd"));
    setModalOpen(true);
  }
  function handleTaskClickFromDay(task: Task) {
    setDayModalOpen(false);
    setEditing(task);
    setInitialDate(undefined);
    setModalOpen(true);
  }
  function handleNewTaskFromDay(day: Date) {
    setDayModalOpen(false);
    setEditing(null);
    setInitialDate(format(day, "yyyy-MM-dd"));
    setModalOpen(true);
  }

  function handleSaved(task: Task) {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === task.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = task;
        return next;
      }
      return [...prev, task];
    });
  }
  function handleDeleted(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setExceptions((prev) => prev.filter((e) => e.task_id !== id));
  }

  function handleExceptionSaved(exception: TaskException) {
    setExceptions((prev) => {
      const idx = prev.findIndex(
        (e) =>
          e.task_id === exception.task_id &&
          e.exception_date === exception.exception_date
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = exception;
        return next;
      }
      return [...prev, exception];
    });
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const headerLabel =
    view === "month"
      ? format(cursor, "MMMM yyyy", { locale: es })
      : (() => {
          const s = startOfWeek(cursor, { weekStartsOn: 1 });
          const e = addDays(s, 6);
          const sameMonth = s.getMonth() === e.getMonth();
          if (sameMonth) {
            return `${format(s, "d", { locale: es })} – ${format(
              e,
              "d 'de' MMMM yyyy",
              { locale: es }
            )}`;
          }
          return `${format(s, "d MMM", { locale: es })} – ${format(
            e,
            "d MMM yyyy",
            { locale: es }
          )}`;
        })();

  return (
    <main className="max-w-[1280px] mx-auto px-6 py-8 pb-20">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h1 className="text-[28px] font-bold tracking-tight leading-tight">
              Canje Calendar
            </h1>
            <p className="text-[13.5px] text-ink-soft mt-1">
              Tareas del equipo · sesión de{" "}
              <strong className="text-ink">{currentUser.display_name}</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNewTask}
              className="btn btn-primary py-2 px-4"
            >
              + Nueva tarea
            </button>
            <button onClick={handleLogout} className="btn py-2">
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-1.5">
            <button
              onClick={() => setView("month")}
              className={`pill ${view === "month" ? "active" : ""}`}
            >
              Mes
            </button>
            <button
              onClick={() => setView("week")}
              className={`pill ${view === "week" ? "active" : ""}`}
            >
              Semana
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              className="btn px-3 py-1.5"
              aria-label="Anterior"
            >
              ‹
            </button>
            <button onClick={handleToday} className="btn px-3 py-1.5">
              Hoy
            </button>
            <button
              onClick={handleNext}
              className="btn px-3 py-1.5"
              aria-label="Siguiente"
            >
              ›
            </button>
          </div>

          <div className="text-[16px] font-semibold capitalize">
            {headerLabel}
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <button
              onClick={loadTasks}
              disabled={loading}
              className="btn px-3 py-1.5"
              title="Refrescar ahora"
              aria-label="Refrescar"
            >
              <span
                className={`inline-block text-[14px] leading-none ${
                  loading ? "animate-spin" : ""
                }`}
              >
                ↻
              </span>
            </button>
            {lastUpdate && (
              <span className="text-[11.5px] text-ink-muted whitespace-nowrap">
                {loading
                  ? "actualizando…"
                  : `actualizado ${formatRelativeTime(lastUpdate)}`}
              </span>
            )}

            <span className="text-ink-muted">·</span>

            {/* Filtro nuevo: Pendientes / Todas */}
            <span className="text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
              Mostrar:
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setStatusFilter("pending")}
                className={`pill text-[12px] px-3 py-1 ${
                  statusFilter === "pending" ? "active" : ""
                }`}
              >
                Pendientes
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`pill text-[12px] px-3 py-1 ${
                  statusFilter === "all" ? "active" : ""
                }`}
              >
                Todas
              </button>
            </div>

            <span className="text-ink-muted">·</span>

            <span className="text-[11.5px] uppercase tracking-wider text-ink-muted font-semibold">
              Asignado:
            </span>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value as never)}
              className="input py-1.5 px-3 text-[13px] w-auto cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="mine">Solo míos</option>
              <optgroup label="Personas">
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>
      </header>

      {view === "month" ? (
        <CalendarMonth
          month={cursor}
          tasks={expandedTasks}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
        />
      ) : (
        <CalendarWeek
          weekStart={cursor}
          tasks={expandedTasks}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
        />
      )}

      <div className="mt-6 flex items-center gap-4 flex-wrap text-[12px] text-ink-soft">
        <span className="font-semibold uppercase tracking-wider text-[11px] text-ink-muted">
          Prioridad:
        </span>
        <span className="flex items-center gap-1.5">
          <span className="pill-dot bg-urgent"></span> Alta
        </span>
        <span className="flex items-center gap-1.5">
          <span className="pill-dot bg-important"></span> Media
        </span>
        <span className="flex items-center gap-1.5">
          <span className="pill-dot bg-noise"></span> Baja
        </span>
        <span className="text-ink-muted">·</span>
        <span className="text-ink-muted">
          🔁 = tarea recurrente · el color de fondo corresponde al asignado.
        </span>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        onExceptionSaved={handleExceptionSaved}
        users={users}
        currentUserId={currentUser.id}
        editing={editing}
        initialDate={initialDate}
      />

      <DayTasksModal
        open={dayModalOpen}
        day={selectedDay}
        tasks={
          selectedDay
            ? expandedTasks.filter((t) =>
                isSameDay(
                  new Date(t.task_date + "T00:00:00"),
                  selectedDay
                )
              )
            : []
        }
        onClose={() => setDayModalOpen(false)}
        onTaskClick={handleTaskClickFromDay}
        onNewTask={handleNewTaskFromDay}
      />
    </main>
  );
}
