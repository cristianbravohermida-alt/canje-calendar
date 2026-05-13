import type { CustomRecurrenceConfig } from "./types";

/** "Cristian Bravo Hermida" → "CB" */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const words = cleaned.split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/** Devuelve "#1a1a1a" o "#ffffff" según el color de fondo, para tener buen contraste. */
export function getContrastingTextColor(hex: string | null | undefined): string {
  if (!hex) return "#ffffff";
  const m = hex.match(/^#?([a-fA-F0-9]{6})$/);
  if (!m) return "#ffffff";
  const c = m[1];
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1a1a1a" : "#ffffff";
}

/** Texto humano para una regla custom. Ej: "Cada 2 semanas (lun, mié) · 13 veces". */
export function formatCustomRule(config: CustomRecurrenceConfig): string {
  const { interval, freq, weekdays, endType, endDate, endCount } = config;
  const isPlural = interval !== 1;
  const unit =
    freq === "day"
      ? isPlural
        ? "días"
        : "día"
      : freq === "week"
        ? isPlural
          ? "semanas"
          : "semana"
        : freq === "month"
          ? isPlural
            ? "meses"
            : "mes"
          : isPlural
            ? "años"
            : "año";

  let s = interval === 1 ? `Cada ${unit}` : `Cada ${interval} ${unit}`;

  if (freq === "week" && weekdays && weekdays.length > 0) {
    const dayNames = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
    const selected = [...weekdays]
      .sort((a, b) => a - b)
      .map((d) => dayNames[d])
      .join(", ");
    s += ` (${selected})`;
  }

  if (endType === "until" && endDate) {
    const m = endDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) s += ` · hasta ${m[3]}/${m[2]}/${m[1]}`;
  } else if (endType === "count" && endCount) {
    s += ` · ${endCount} ${endCount === 1 ? "vez" : "veces"}`;
  }

  return s;
}
