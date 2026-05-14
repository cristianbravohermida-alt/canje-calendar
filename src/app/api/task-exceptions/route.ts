import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/task-exceptions
// Crea o actualiza el override de estado de UNA instancia recurrente.
// Body: { task_id, exception_date (YYYY-MM-DD), status }
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { task_id, exception_date, status } = body || {};

  if (!task_id || !exception_date) {
    return NextResponse.json(
      { error: "Faltan campos: task_id y exception_date son obligatorios" },
      { status: 400 }
    );
  }
  if (status && !["todo", "doing", "done"].includes(status)) {
    return NextResponse.json({ error: "status inválido" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("task_exceptions")
    .upsert(
      {
        task_id,
        exception_date,
        status: status ?? null,
        created_by: user.id,
      },
      { onConflict: "task_id,exception_date" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ exception: data });
}

// DELETE /api/task-exceptions?task_id=...&exception_date=...
// Quita el override y la instancia vuelve a heredar el estado de la serie.
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const task_id = searchParams.get("task_id");
  const exception_date = searchParams.get("exception_date");

  if (!task_id || !exception_date) {
    return NextResponse.json(
      { error: "Faltan task_id y exception_date" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("task_exceptions")
    .delete()
    .eq("task_id", task_id)
    .eq("exception_date", exception_date);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
