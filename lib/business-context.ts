import { createClient } from "@/lib/supabase/server";

export async function getBusinessContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership, error } = await supabase
    .from("memberships")
    .select("business_id, role, businesses(name, slug, plan)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return { supabase, user, membership };
}
