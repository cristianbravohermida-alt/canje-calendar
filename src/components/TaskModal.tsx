"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type {
  CustomRecurrenceConfig,
  Profile,
  RecurrenceType,
  Task,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";
import { formatCustomRule } from "@/lib/utils";
import DateInput from "./DateInput";
import CustomRecurrenceModal from "./CustomRecurrenceModal";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted?: (id: string) => void;
  users: Profile[];
  currentUserId: string;
  editing?: Task | null;
  initialDate?: string;
}

const PRIORITIES: { v: TaskPriority; label: string }[] = [
  { v: "low", label: "Baja" },
  { v: "medium", label: "Media" },
  { v: "high", label: "Alta" },
];
const STATUSES: { v: TaskStatus; label: string }[] = [
  { v: "todo", label: "Pendiente" },
  { v: "doing", label: "En curso" },
  { v: "done", label: "Lista" },
];

const NTH_LABELS = ["primer", "segundo", "tercer", "cuarto", "quinto"];

function buildRecurrenceOptions(
  dateStr: string
): { v: RecurrenceType; label: string }[] {
  const base: { v: RecurrenceType; label: string }[] = [
    { v: "none", label: "No se repite" },
    { v: "daily", label: "Todos los días" },
    { v: "weekdays", label: "Todos los días hábiles (lun–vie)" },
  ];
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return [...base, { v: "custom", label: "Personalizado…" }];
  }
  const d = new Date(dateStr + "T00:00:00");
  const weekday = format(d, "EEEE", { locale: es });
  const dayOfMonth = d.getDate();
  const nthIndex = Math.floor((dayOfMonth - 1) / 7);
  const nthLabel = NTH_LABELS[nthIndex] || `${nthIndex + 1}º`;
  const monthName = format(d, "MMMM", { locale: es });
  return [
    ...base,
    { v: "weekly", label: `Cada semana, el ${weekday}` },
    {
      v: "monthly_nth_weekday",
      label: `Todos los meses, el ${nthLabel} ${weekday}`,
    },
    { v: "yearly", label: `Anualmente, el ${dayOfMonth} de ${monthName}` },
    { v: "custom", label: "Personalizado…" },
  ];
}

export default function TaskModal({
  open,
  onClose,
  onSaved,
  onDeleted,
  users,
  currentUserId,
  editing,
  initialDate,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [tagsInput, setTagsInput] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("none");
  const [recurrenceUntil, setRecurrenceUntil] = useState<string>("");
  const [customConfig, setCustomConfig] =
    useState<CustomRecurrenceConfig | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [previousType, setPreviousType] = useState<RecurrenceType | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description || "");
      setTaskDate(editing.series_anchor_date || editing.task_date);
      setTaskTime(editing.task_time ? editing.task_time.slice(0, 5) : "");
      setStatus(editing.status);
      setPriority(editing.priority);
      setTagsInput((editing.tags || []).join(", "));
      setAssignedTo(editing.assigned_to || "");
      setRecurrenceType(editing.recurrence_type || "none");
      setRecurrenceUntil(
        editing.recurrence_type !== "custom" && editing.recurrence_until
          ? editing.recurrence_until
          : ""
      );

      if (editing.recurrence_type === "custom") {
        setCustomConfig({
          interval: editing.recurrence_interval ?? 1,
          freq: editing.recurrence_freq ?? "week",
          weekdays: editing.recurrence_weekdays ?? [],
          endType: editing.recurrence_count
            ? "count"
            : editing.recurrence_until
              ? "until"
              : "never",
          endDate: editing.recurrence_until ?? undefined,
          endCount: editing.recurrence_count ?? undefined,
        });
      } else {
        setCustomConfig(null);
      }
    } else {
      setTitle("");
      setDescription("");
      setTaskDate(initialDate || new Date().toISOString().slice(0, 10));
      setTaskTime("");
      setStatus("todo");
      setPriority("medium");
      setTagsInput("");
      setAssignedTo(currentUserId);
      setRecurrenceType("none");
      setRecurrenceUntil("");
      setCustomConfig(null);
    }
    setError(null);
    setPreviousType(null);
    setShowCustomModal(false);
  }, [open, editing, initialDate, currentUserId]);

  function handleRecurrenceChange(value: string) {
    if (value === "custom") {
      // Si ya estaba en custom, sólo reabrir el modal para editar
      setPreviousType(recurrenceType);
      setRecurrenceType("custom");
      setShowCustomModal(true);
    } else {
      setRecurrenceType(value as RecurrenceType);
      setCustomConfig(null);
    }
  }

  function handleCustomSave(config: CustomRecurrenceConfig) {
    setCustomConfig(config);
    setRecurrenceType("custom");
    setShowCustomModal(false);
    setPreviousType(null);
  }

  function handleCustomCancel() {
    setShowCustomModal(false);
    // Si veníamos de otro tipo y no hay config, revertir
    if (previousType !== null && previousType !== "custom" && !customConfig) {
      setRecurrenceType(previousType);
    }
    setPreviousType(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    // Validación: si es custom, debe tener config
    if (recurrenceType === "custom" && !customConfig) {
      setError("Configura la recurrencia personalizada antes de guardar.");
      return;
    }

    setSaving(true);
    setError(null);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      task_date: taskDate,
      task_time: taskTime ? `${taskTime}:00` : null,
      status,
      priority,
      tags,
      assigned_to: assignedTo || null,
      recurrence_type: recurrenceType,
      recurrence_until: null,
      recurrence_interval: 1,
      recurrence_freq: null,
      recurrence_weekdays: null,
      recurrence_count: null,
    };

    if (recurrenceType !== "none") {
      if (recurrenceType === "custom" && customConfig) {
        payload.recurrence_interval = customConfig.interval;
        payload.recurrence_freq = customConfig.freq;
        payload.recurrence_weekdays =
          customConfig.freq === "week" ? customConfig.weekdays : null;
        if (customConfig.endType === "until" && customConfig.endDate) {
          payload.recurrence_until = customConfig.endDate;
        }
        if (customConfig.endType === "count" && customConfig.endCount) {
          payload.recurrence_count = customConfig.endCount;
        }
      } else if (recurrenceUntil) {
        payload.recurrence_until = recurrenceUntil;
      }
    }

    try {
      const url = editing ? `/api/tasks/${editing.id}` : "/api/tasks";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      onSaved(data.task);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    const wasRecurring =
      editing.recurrence_type && editing.recurrence_type !== "none";
    const msg = wasRecurring
      ? "¿Eliminar esta tarea recurrente?\n\nSe borrarán TODAS las repeticiones (pasadas y futuras). No se puede deshacer."
      : "¿Eliminar esta tarea? No se puede deshacer.";
    if (!confirm(msg)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${editing.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar");
      onDeleted?.(editing.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const recurrenceOptions = buildRecurrenceOptions(taskDate);
  const isRecurringPreset =
    recurrenceType !== "none" && recurrenceType !== "custom";
  const wasEditingRecurring =
    !!editing && !!editing.recurrence_type && editing.recurrence_type !== "none";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="card w-full max-w-[560px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-4 border-b border-border-soft flex items-center justify-between">
            <h2 className="text-[16px] font-semibold">
              {editing ? "Editar tarea" : "Nueva tarea"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-ink-muted hover:text-ink text-[20px] leading-none"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            {wasEditingRecurring && (
              <div className="rounded-lg bg-[#fbeed2] border border-[#e8dcb5] px-3.5 py-2.5 text-[12.5px] text-[#8a5f0e] leading-snug">
                🔁 Esta tarea se repite. Los cambios afectarán toda la serie.
              </div>
            )}

            <div>
              <label className="label" htmlFor="title">
                Título *
              </label>
              <input
                id="title"
                type="text"
                required
                autoFocus
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Revisar facturas pendientes"
              />
            </div>

            <div>
              <label className="label" htmlFor="desc">
                Descripción
              </label>
              <textarea
                id="desc"
                rows={3}
                className="input resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detalles, contexto, links…"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="date">
                  Fecha *
                </label>
                <DateInput
                  id="date"
                  required
                  value={taskDate}
                  onChange={setTaskDate}
                />
              </div>
              <div>
                <label className="label" htmlFor="time">
                  Hora{" "}
                  <span className="font-normal text-ink-muted normal-case tracking-normal">
                    (opcional)
                  </span>
                </label>
                <input
                  id="time"
                  type="time"
                  className="input"
                  value={taskTime}
                  onChange={(e) => setTaskTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="recurrence">
                🔁 Repetición
              </label>
              <select
                id="recurrence"
                className="input cursor-pointer"
                value={recurrenceType}
                onChange={(e) => handleRecurrenceChange(e.target.value)}
              >
                {recurrenceOptions.map((opt) => (
                  <option key={opt.v} value={opt.v}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Resumen + editar para custom */}
              {recurrenceType === "custom" && customConfig && (
                <div className="mt-1.5 flex items-center justify-between gap-2 text-[12.5px] text-ink-soft">
                  <span className="truncate">
                    ↪ {formatCustomRule(customConfig)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(true)}
                    className="text-[11.5px] text-ink underline whitespace-nowrap"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>

            {/* "Repetir hasta" sólo para presets, no para custom (custom ya tiene su propio fin) */}
            {isRecurringPreset && (
              <div>
                <label className="label" htmlFor="until">
                  Repetir hasta{" "}
                  <span className="font-normal text-ink-muted normal-case tracking-normal">
                    (opcional · vacío = sin fin)
                  </span>
                </label>
                <DateInput
                  id="until"
                  value={recurrenceUntil}
                  onChange={setRecurrenceUntil}
                  min={taskDate}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="label">Estado</span>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => (
                    <button
                      type="button"
                      key={s.v}
                      onClick={() => setStatus(s.v)}
                      className={`pill ${
                        status === s.v ? "active" : ""
                      } text-[12px] px-3 py-1`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="label">Prioridad</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITIES.map((p) => (
                    <button
                      type="button"
                      key={p.v}
                      onClick={() => setPriority(p.v)}
                      className={`pill ${
                        priority === p.v ? "active" : ""
                      } text-[12px] px-3 py-1`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="assigned">
                Asignar a
              </label>
              <select
                id="assigned"
                className="input cursor-pointer"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">— Sin asignar —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.display_name} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="tags">
                Etiquetas{" "}
                <span className="font-normal text-ink-muted normal-case tracking-normal">
                  (separadas por coma)
                </span>
              </label>
              <input
                id="tags"
                type="text"
                className="input"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="finanzas, jefe, urgente"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-urgent-bg border border-urgent/30 px-3.5 py-2.5 text-[13px] text-urgent-fg">
                {error}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary flex-1 justify-center py-2.5"
              >
                {saving ? (
                  <span className="spinner"></span>
                ) : editing ? (
                  "Guardar cambios"
                ) : (
                  "Crear tarea"
                )}
              </button>
              {editing && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleDelete}
                  className="btn btn-danger py-2.5"
                >
                  Eliminar
                </button>
              )}
              <button type="button" onClick={onClose} className="btn py-2.5">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>

      <CustomRecurrenceModal
        open={showCustomModal}
        onClose={handleCustomCancel}
        onSave={handleCustomSave}
        anchorDate={taskDate}
        initial={customConfig}
      />
    </>
  );
}
