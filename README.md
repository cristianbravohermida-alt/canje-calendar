# Canje Calendar

Calendario de tareas para el equipo · **Next.js 15 + Supabase + Tailwind**.

## Qué tiene
- Auth real (Supabase: bcrypt + JWT)
- Vista **mes** y **semana** alternables
- Tareas: título, descripción, fecha, hora, estado, prioridad, etiquetas, asignado
- Color por usuario, filtros por asignado
- RLS en Postgres: edita solo lo tuyo o lo asignado a ti

---

## Pasos asumiendo que ya tienes Supabase + GitHub + Vercel

### 1. Supabase — correr el schema (2 min)

Decidí si usas un **proyecto Supabase nuevo** o uno existente. Recomiendo nuevo porque el schema crea triggers en `auth.users` (al crear cuenta, dispara la inserción en `profiles`), y mezclarlo con datos existentes puede complicar.

1. En el dashboard del proyecto → **SQL Editor → New Query**.
2. Copia todo `supabase/schema.sql` y dale **Run**.
3. Copia desde **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Authentication → Providers → Email**: desactiva *Confirm email* para empezar (luego lo prendes para producción seria).

### 2. Local — probar antes de deployar

```bash
cp .env.example .env.local
# pega URL y ANON_KEY
npm install
npm run dev
```

Abre `localhost:3000`, regístrate, prueba crear tareas. Si todo funciona, sigue.

### 3. GitHub + Vercel — deploy (3 min)

```bash
git init && git add . && git commit -m "init canje-calendar"
# crear repo y push (usa gh CLI o la web)
```

En Vercel:
1. **Add New Project** → importa el repo.
2. **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy.

Vuelve a Supabase → **Authentication → URL Configuration**:
- **Site URL**: `https://tu-app.vercel.app`
- **Redirect URLs**: `https://tu-app.vercel.app/**` (más localhost si quieres seguir desarrollando)

---

## Modelo de permisos (RLS)

| Acción | Quién puede |
|---|---|
| Ver tareas | Cualquier autenticado |
| Crear tarea | Cualquier autenticado |
| Editar tarea | Creador o asignado |
| Eliminar tarea | Solo el creador |
| Editar perfil | Solo el propio |

Editable en `supabase/schema.sql` si quieres más estricto.

---

## Estructura

```
src/
├── app/
│   ├── login/             ← Login
│   ├── register/          ← Registro con selector de color
│   ├── calendar/          ← Página protegida
│   ├── api/tasks/         ← CRUD de tareas
│   ├── api/users/         ← Lista del equipo
│   └── page.tsx           ← Redirige según sesión
├── components/
│   ├── CalendarApp.tsx    ← Orquesta todo
│   ├── CalendarMonth.tsx  ← Vista mes
│   ├── CalendarWeek.tsx   ← Vista semana
│   └── TaskModal.tsx      ← Crear/editar tarea
├── lib/
│   ├── supabase/          ← Clientes (browser, server, middleware)
│   └── types.ts
└── middleware.ts          ← Protege rutas

supabase/schema.sql        ← Correr una vez
```

---

## Stack

- Next.js 15 (App Router)
- React 19 · TypeScript
- Supabase (Postgres + Auth + RLS)
- Tailwind CSS 3
- date-fns con locale español

## Próximos pasos (cuando quieras iterar)

- Tareas recurrentes
- Notificaciones por email al asignar
- Vista día con horas
- Drag & drop
- Comentarios en tareas
- Export iCal → Google Calendar
