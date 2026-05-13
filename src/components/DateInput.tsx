"use client";

import { useEffect, useState } from "react";

interface Props {
  value: string; // ISO YYYY-MM-DD
  onChange: (iso: string) => void;
  required?: boolean;
  id?: string;
  min?: string;
}

function isoToDDMM(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function ddmmToIso(text: string): string | null {
  const m = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mm, y] = m;
  const day = parseInt(d, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(y, 10);
  if (day < 1 || day > 31) return null;
  if (month < 1 || month > 12) return null;
  if (year < 1900 || year > 2200) return null;
  return `${y}-${mm.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export default function DateInput({ value, onChange, required, id, min }: Props) {
  const [text, setText] = useState(isoToDDMM(value));

  useEffect(() => {
    setText(isoToDDMM(value));
  }, [value]);

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        required={required}
        className="input pr-10"
        placeholder="dd/mm/aaaa"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const iso = ddmmToIso(e.target.value);
          if (iso) onChange(iso);
        }}
        onBlur={() => {
          if (!ddmmToIso(text)) setText(isoToDDMM(value));
        }}
        inputMode="numeric"
      />
      {/* Ícono visual (no interactivo) */}
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ink-muted">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
      {/* Date input nativo invisible sobre el ícono — clic abre el picker del sistema */}
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="absolute right-0 top-0 h-full w-10 opacity-0 cursor-pointer"
        aria-label="Seleccionar fecha con calendario"
        tabIndex={-1}
      />
    </div>
  );
}
