import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CalendarApp from "@/components/CalendarApp";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, display_name, color, created_at")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Por si el trigger no creó perfil aún (caso raro)
    redirect("/login");
  }

  return <CalendarApp currentUser={profile} />;
}
