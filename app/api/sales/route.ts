import { getBusinessContext } from "@/lib/business-context";

type SalePayload = { paymentMethod?: "cash" | "card" | "transfer" | "credit"; items?: Array<{ productId: string; name: string; quantity: number; unitPrice: number; unitCost?: number }> };

export async function GET() {
  try {
    const context = await getBusinessContext();
    if (!context?.membership) return Response.json({ error: "No autorizado" }, { status: 401 });
    const { data, error } = await context.supabase.from("sales").select("*").eq("business_id", context.membership.business_id).order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return Response.json({ sales: data });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No fue posible cargar las ventas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getBusinessContext();
    if (!context?.membership) return Response.json({ error: "No autorizado" }, { status: 401 });
    const payload = await request.json() as SalePayload;
    const items = payload.items?.filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0 && Number.isInteger(item.unitPrice) && item.unitPrice >= 0) ?? [];
    if (!items.length || !payload.paymentMethod) return Response.json({ error: "La venta requiere productos y forma de pago" }, { status: 400 });
    const { data, error } = await context.supabase.rpc("register_sale", { p_business_id: context.membership.business_id, p_payment_method: payload.paymentMethod, p_items: items.map((item) => ({ product_id: item.productId, name: item.name, quantity: item.quantity, unit_price: item.unitPrice, unit_cost: item.unitCost || 0 })) });
    if (error) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ saleId: data }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No fue posible registrar la venta" }, { status: 500 });
  }
}
