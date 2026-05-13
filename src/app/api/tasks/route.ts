import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const TASK_SELECT = `*,
  assignee:profiles!tasks_assigned_to_fkey(id, display_name, color, email),
  creator:profiles!tasks_created_by_fkey(id, display_name, color, email)`;

// GET /api/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  // Tareas no recurrentes en rango
  let oneOffQuery = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("recurrence_type", "none");
  if (from) oneOffQuery = oneOffQuery.gte("task_date", from);
  if (to) oneOffQuery = oneOffQuery.lte("task_date", to);
  const { data: oneOff, error: oneOffErr } = await oneOffQuery;
  if (oneOffErr)
    return NextResponse.json({ error: oneOffErr.message }, { status: 400 });

  // Tareas recurrentes que pueden tener instancias en el rango.
  // Filtramos por anchor <= to. El "until" sólo aplica a presets simples;
  // las custom con endType=count terminan por número de ocurrencias, lo
  // cual sólo se sabe en el cliente al expandir. Por eso traemos todas
  // las recurrentes que cumplen anchor<=to y dejamos que el cliente decida.
  let recQuery = supabase
    .from("tasks")
    .select(TASK_SELECT)
    .neq("recurrence_type", "none");
  if (to) recQuery = recQuery.lte("task_date", to);
  if (from)
    recQuery = recQuery.or(
      `recurrence_until.is.null,recurrence_until.gte.${from}`
    );
  const { data: recurring, error: recErr } = await recQuery;
  if (recErr)
    return NextResponse.json({ error: recErr.message }, { status: 400 });

  return NextResponse.json({ tasks: [...(oneOff || []), ...(recurring || [])] });
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    title,
    description = null,
    task_date,
    task_time = null,
    status = "todo",
    priority = "medium",
    tags = [],
    assigned_to = null,
    recurrence_type = "none",
    recurrence_until = null,
    recurrence_interval = 1,
    recurrence_freq = null,
    recurrence_weekdays = null,
    recurrence_count = null,
  } = body || {};

  if (!title || !task_date) {
    return NextResponse.json(
      { error: "Faltan campos: title y task_date son obligatorios" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      title,
      description,
      task_date,
      task_time,
      status,
      priority,
      tags,
      assigned_to,
      recurrence_type,
      recurrence_until,
      recurrence_interval,
      recurrence_freq,
      recurrence_weekdays,
      recurrence_count,
      created_by: user.id,
    })
    .select(TASK_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ task: data }, { status: 201 });
}
