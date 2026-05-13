import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  let query = supabase
    .from("tasks")
    .select(
      `*,
       assignee:profiles!tasks_assigned_to_fkey(id, display_name, color, email),
       creator:profiles!tasks_created_by_fkey(id, display_name, color, email)`
    )
    .order("task_date", { ascending: true })
    .order("task_time", { ascending: true, nullsFirst: false });

  if (from) query = query.gte("task_date", from);
  if (to) query = query.lte("task_date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tasks: data });
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
      created_by: user.id,
    })
    .select(
      `*,
       assignee:profiles!tasks_assigned_to_fkey(id, display_name, color, email),
       creator:profiles!tasks_created_by_fkey(id, display_name, color, email)`
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ task: data }, { status: 201 });
}
