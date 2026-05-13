"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push("/calendar");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-[420px] p-8">
        <h1 className="text-[28px] font-bold tracking-tight mb-1.5">
          Canje Calendar
        </h1>
        <p className="text-[13.5px] text-ink-soft mb-7">
          Ingresa con tu cuenta del equipo
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
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
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
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
                <span className="spinner"></span> Entrando…
              </>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p className="text-[13px] text-ink-soft text-center mt-6">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-semibold text-ink underline underline-offset-2 hover:text-ink-soft"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
