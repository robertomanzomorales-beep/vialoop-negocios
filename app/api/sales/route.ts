import { desc, eq, sql } from "drizzle-orm";
import { getDb } from "../../../db";
import { businesses, products, saleItems, sales, stockMovements } from "../../../db/schema";

type SalePayload = {
  paymentMethod?: "cash" | "card" | "transfer" | "credit";
  items?: Array<{ productId: number; name: string; quantity: number; unitPrice: number; unitCost?: number }>;
};

async function getBusinessId() {
  const db = getDb();
  const [business] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.slug, "botilleria-don-pedro")).limit(1);
  if (!business) throw new Error("El negocio aún no está configurado");
  return business.id;
}

export async function GET() {
  try {
    const db = getDb();
    const businessId = await getBusinessId();
    const rows = await db.select().from(sales).where(eq(sales.businessId, businessId)).orderBy(desc(sales.createdAt)).limit(50);
    return Response.json({ sales: rows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No fue posible cargar las ventas" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as SalePayload;
    const items = payload.items?.filter((item) => Number.isInteger(item.productId) && Number.isInteger(item.quantity) && item.quantity > 0 && Number.isInteger(item.unitPrice) && item.unitPrice >= 0) ?? [];
    if (!items.length || !payload.paymentMethod) return Response.json({ error: "La venta requiere productos y forma de pago" }, { status: 400 });
    const db = getDb();
    const businessId = await getBusinessId();
    const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const [sale] = await db.insert(sales).values({ businessId, paymentMethod: payload.paymentMethod, subtotal: total, total }).returning();

    for (const item of items) {
      await db.insert(saleItems).values({ saleId: sale.id, productId: item.productId, productName: item.name, quantity: item.quantity, unitPrice: item.unitPrice, unitCost: item.unitCost || 0, lineTotal: item.unitPrice * item.quantity });
      await db.update(products).set({ stock: sql`MAX(0, ${products.stock} - ${item.quantity})`, updatedAt: sql`CURRENT_TIMESTAMP` }).where(eq(products.id, item.productId));
      await db.insert(stockMovements).values({ businessId, productId: item.productId, type: "sale", quantity: -item.quantity, referenceType: "sale", referenceId: sale.id });
    }
    return Response.json({ sale }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No fue posible registrar la venta" }, { status: 500 });
  }
}
