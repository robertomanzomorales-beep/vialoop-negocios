import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "No autorizado" }, { status: 401 });
  const payload = await request.json() as { name?: string; businessType?: string };
  if (!payload.name?.trim()) return Response.json({ error: "El nombre es obligatorio" }, { status: 400 });
  const { data, error } = await supabase.rpc("create_business", { p_name: payload.name.trim(), p_business_type: payload.businessType || "almacen" });
  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json({ businessId: data }, { status: 201 });
}
