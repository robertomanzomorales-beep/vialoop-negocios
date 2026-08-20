import { getBusinessContext } from "@/lib/business-context";

function productDto(row: Record<string, unknown>) {
  return { id: row.id, name: row.name, barcode: row.barcode, category: row.category, price: row.price, cost: row.cost, stock: row.stock, minStock: row.min_stock };
}

export async function GET() {
  try {
    const context = await getBusinessContext();
    if (!context) return Response.json({ error: "No autorizado" }, { status: 401 });
    if (!context.membership) return Response.json({ products: [] });
    const { data, error } = await context.supabase.from("products").select("id,name,barcode,category,price,cost,stock,min_stock").eq("business_id", context.membership.business_id).eq("active", true).order("name");
    if (error) throw error;
    return Response.json({ products: (data || []).map(productDto) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No fue posible cargar los productos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const context = await getBusinessContext();
    if (!context?.membership) return Response.json({ error: "No autorizado" }, { status: 401 });
    const payload = await request.json() as { name?: string; barcode?: string; category?: string; price?: number; cost?: number; stock?: number; minStock?: number };
    if (!payload.name?.trim() || !Number.isInteger(payload.price) || Number(payload.price) < 0) return Response.json({ error: "Nombre y precio válido son obligatorios" }, { status: 400 });
    const { data, error } = await context.supabase.from("products").insert({ business_id: context.membership.business_id, name: payload.name.trim(), barcode: payload.barcode?.trim() || null, category: payload.category?.trim() || "General", price: Number(payload.price), cost: Number(payload.cost) || 0, stock: Number(payload.stock) || 0, min_stock: Number(payload.minStock) || 0 }).select("id,name,barcode,category,price,cost,stock,min_stock").single();
    if (error) throw error;
    return Response.json({ product: productDto(data) }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No fue posible crear el producto" }, { status: 500 });
  }
}
