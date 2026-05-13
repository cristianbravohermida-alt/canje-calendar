"use client";

import { useEffect, useState } from "react";
import type { CustomFreq, CustomRecurrenceConfig } from "@/lib/types";
import DateInput from "./DateInput";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (config: CustomRecurrenceConfig) => void;
  anchorDate: string; // YYYY-MM-DD
  initial?: CustomRecurrenceConfig | null;
}

// 0=Dom..6=Sáb — orden y abreviaturas del estándar español (X para miércoles)
const WEEKDAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

export default function CustomRecurrenceModal({
  open,
  onClose,
  onSave,
  anchorDate,
  initial,
}: Props) {
  const [interval, setIntervalVal] = useState(1);
  const [freq, setFreq] = useState<CustomFreq>("week");
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [endType, setEndType] = useState<"never" | "until" | "count">("never");
  const [endDate, setEndDate] = useState<string>("");
  const [endCount, setEndCount] = useState<number>(13);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setIntervalVal(initial.interval);
      setFreq(initial.freq);
      setWeekdays(initial.weekdays || []);
      setEndType(initial.endType);
      setEndDate(initial.endDate || "");
      setEndCount(initial.endCount || 13);
    } else {
      setIntervalVal(1);
      setFreq("week");
      if (anchorDate && /^\d{4}-\d{2}-\d{2}$/.test(anchorDate)) {
        const d = new Date(anchorDate + "T00:00:00");
        setWeekdays([d.getDay()]);
      } else {
        setWeekdays([]);
      }
      setEndType("never");
      setEndDate("");
      setEndCount(13);
    }
  }, [open, anchorDate, initial]);

  function toggleWeekday(d: number) {
    setWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  const unitSingular: Record<CustomFreq, string> = {
    day: "día",
    week: "semana",
    month: "mes",
    year: "año",
  };
  const unitPlural: Record<CustomFreq, string> = {
    day: "días",
    week: "semanas",
    month: "meses",
    year: "años",
  };

  const isValid =
    interval >= 1 &&
    interval <= 999 &&
    (freq !== "week" || weekdays.length > 0) &&
    (endType !== "until" || !!endDate) &&
    (endType !== "count" || (endCount >= 1 && endCount <= 999));

  function handleSave() {
    if (!isValid) return;
    onSave({
      interval,
      freq,
      weekdays: freq === "week" ? weekdays : [],
      endType,
      endDate: endType === "until" ? endDate : undefined,
      endCount: endType === "count" ? endCount : undefined,
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-8 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-xl w-full max-w-[440px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-border-soft">
          <h2 className="text-[17px] font-semibold">
            Recurrencia personalizada
          </h2>
        </div>

        <div className="p-6 space-y-5">
          {/* Repetir cada */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-[13.5px] text-ink-soft min-w-[80px]">
              Repetir cada
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={999}
                value={interval}
                onChange={(e) =>
                  setIntervalVal(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="input w-[70px] text-center"
              />
              <select
                value={freq}
                onChange={(e) => setFreq(e.target.value as CustomFreq)}
                className="input cursor-pointer w-auto"
              >
                {(["day", "week", "month", "year"] as CustomFreq[]).map((f) => (
                  <option key={f} value={f}>
                    {interval === 1 ? unitSingular[f] : unitPlural[f]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Repetir el (solo para semanal) */}
          {freq === "week" && (
            <div>
              <div className="text-[13.5px] text-ink-soft mb-2.5">
                Repetir el
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {WEEKDAY_LABELS.map((lbl, i) => {
                  const active = weekdays.includes(i);
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleWeekday(i)}
                      className={`
                        w-9 h-9 rounded-full text-[13px] font-semibold transition-colors
                        ${
                          active
                            ? "bg-ink text-white"
                            : "bg-[#ececec] text-ink-soft hover:bg-[#dadada]"
                        }
                      `}
                      aria-pressed={active}
                      title={
                        [
                          "Domingo",
                          "Lunes",
                          "Martes",
                          "Miércoles",
                          "Jueves",
                          "Viernes",
                          "Sábado",
                        ][i]
                      }
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
              {weekdays.length === 0 && (
                <div className="text-[11.5px] text-urgent-fg mt-2">
                  Elige al menos un día de la semana
                </div>
              )}
            </div>
          )}

          {/* Finaliza */}
          <div>
            <div className="text-[13.5px] text-ink-soft mb-2.5">Finaliza</div>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === "never"}
                  onChange={() => setEndType("never")}
                  className="w-4 h-4"
                />
                <span className="text-[13.5px]">Nunca</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === "until"}
                  onChange={() => setEndType("until")}
                  className="w-4 h-4 flex-shrink-0"
                />
                <span className="text-[13.5px] min-w-[24px]">El</span>
                <div
                  className={`flex-1 max-w-[180px] ${endType !== "until" ? "opacity-50" : ""}`}
                  onClick={() => setEndType("until")}
                >
                  <DateInput
                    value={endDate}
                    onChange={(v) => {
                      setEndDate(v);
                      setEndType("until");
                    }}
                    min={anchorDate}
                  />
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="radio"
                  name="endType"
                  checked={endType === "count"}
                  onChange={() => setEndType("count")}
                  className="w-4 h-4 flex-shrink-0"
                />
                <span className="text-[13.5px]">Después de</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={endCount}
                  onChange={(e) => {
                    setEndCount(Math.max(1, parseInt(e.target.value) || 1));
                    setEndType("count");
                  }}
                  onFocus={() => setEndType("count")}
                  className={`input w-[70px] text-center ${endType !== "count" ? "opacity-60" : ""}`}
                />
                <span className="text-[13.5px] text-ink-soft">ocurrencias</span>
              </label>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border-soft flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="btn btn-primary"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
