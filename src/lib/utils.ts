/**
 * Devuelve las iniciales de un nombre.
 * - "Cristian Bravo Hermida" → "CB"
 * - "Yuri Thoms" → "YT"
 * - "Cristian" → "CR"
 * - "" → "?"
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const cleaned = name.trim();
  if (!cleaned) return "?";
  const words = cleaned.split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Devuelve "#1a1a1a" o "#ffffff" según convenga sobre el color de fondo.
 * Usa luminancia simple para decidir.
 */
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
