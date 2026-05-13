"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const COLOR_OPTIONS = [
  "#d64545", "#d9962a", "#c9a82b", "#1f7a3e",
  "#3b7dd9", "#6a3aa8", "#c93a8e", "#5c5c5c",
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [color, setColor] = useState(COLOR_OPTIONS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName, color },
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    // Si Supabase tiene email confirmation activado, no hay sesión inmediata.
    // Lo manejamos mostrando un mensaje de éxito.
    setSuccess(true);
    setLoading(false);
    setTimeout(() => {
      router.push("/calendar");
      router.refresh();
    }, 1200);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-[460px] p-8">
        <h1 className="text-[28px] font-bold tracking-tight mb-1.5">
          Crear cuenta
        </h1>
        <p className="text-[13.5px] text-ink-soft mb-7">
          Únete al calendario del equipo
        </p>

        {success ? (
          <div className="rounded-lg bg-[#e8f4ec] border border-ok/30 px-4 py-3 text-[14px] text-ok">
            ✓ Cuenta creada · entrando…
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">
                Nombre visible
              </label>
              <input
                id="name"
                type="text"
                required
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Cristián Bravo"
              />
            </div>
            <div>
              <label className="label" htmlFor="email">
                Correo
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@canje.cl"
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                Contraseña <span className="font-normal text-ink-muted normal-case tracking-normal">(mín. 6 caracteres)</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <span className="label">Tu color en el calendario</span>
              <div className="flex gap-2 flex-wrap">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-9 h-9 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? "#1a1a1a" : "transparent",
                      transform: color === c ? "scale(1.1)" : "scale(1)",
                    }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-urgent-bg border border-urgent/30 px-3.5 py-2.5 text-[13px] text-urgent-fg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full justify-center py-2.5"
            >
              {loading ? (
                <>
                  <span className="spinner"></span> Creando cuenta…
                </>
              ) : (
                "Crear cuenta"
              )}
            </button>
          </form>
        )}

        <p className="text-[13px] text-ink-soft text-center mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-ink underline underline-offset-2 hover:text-ink-soft"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
