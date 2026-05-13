"use client";

import { useEffect, useState } from "react";
import type { Profile, Task, TaskPriority, TaskStatus } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (task: Task) => void;
  onDeleted?: (id: string) => void;
  users: Profile[];
  currentUserId: string;
  // Si viene editing, edita; si viene initialDate y NO editing, crea
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

export default function TaskModal({
  open, onClose, onSaved, onDeleted, users, currentUserId, editing, initialDate,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskDate, setTaskDate] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [tagsInput, setTagsInput] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(editing.description || "");
      setTaskDate(editing.task_date);
      setTaskTime(editing.task_time ? editing.task_time.slice(0, 5) : "");
      setStatus(editing.status);
      setPriority(editing.priority);
      setTagsInput((editing.tags || []).join(", "));
      setAssignedTo(editing.assigned_to || "");
    } else {
      setTitle("");
      setDescription("");
      setTaskDate(initialDate || new Date().toISOString().slice(0, 10));
      setTaskTime("");
      setStatus("todo");
      setPriority("medium");
      setTagsInput("");
      setAssignedTo(currentUserId);
    }
    setError(null);
  }, [open, editing, initialDate, currentUserId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      task_date: taskDate,
      task_time: taskTime ? `${taskTime}:00` : null,
      status,
      priority,
      tags,
      assigned_to: assignedTo || null,
    };
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
    if (!confirm("¿Eliminar esta tarea? No se puede deshacer.")) return;
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

  return (
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
              <input
                id="date"
                type="date"
                required
                className="input"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label" htmlFor="time">
                Hora <span className="font-normal text-ink-muted normal-case tracking-normal">(opcional)</span>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="label">Estado</span>
              <div className="flex flex-wrap gap-1.5">
                {STATUSES.map((s) => (
                  <button
                    type="button"
                    key={s.v}
                    onClick={() => setStatus(s.v)}
                    className={`pill ${status === s.v ? "active" : ""} text-[12px] px-3 py-1`}
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
                    className={`pill ${priority === p.v ? "active" : ""} text-[12px] px-3 py-1`}
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
              Etiquetas <span className="font-normal text-ink-muted normal-case tracking-normal">(separadas por coma)</span>
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
              {saving ? <span className="spinner"></span> : editing ? "Guardar cambios" : "Crear tarea"}
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
  );
}
