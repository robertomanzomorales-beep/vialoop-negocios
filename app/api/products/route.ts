import { and, asc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { businesses, products } from "../../../db/schema";

const defaultBusinessSlug = "botilleria-don-pedro";

async function getDefaultBusinessId() {
  const db = getDb();
  const [existing] = await db.select({ id: businesses.id }).from(businesses).where(eq(businesses.slug, defaultBusinessSlug)).limit(1);
  if (existing) return existing.id;
  const [created] = await db.insert(businesses).values({ name: "Botillería Don Pedro", slug: defaultBusinessSlug, businessType: "botilleria" }).returning({ id: businesses.id });
  return created.id;
}

export async function GET() {
  try {
    const db = getDb();
    const businessId = await getDefaultBusinessId();
    let rows = await db.select().from(products).where(and(eq(products.businessId, businessId), eq(products.active, true))).orderBy(asc(products.name));
    if (!rows.length) {
      await db.insert(products).values([
        { businessId, name: "Cerveza Cristal lata 473cc", category: "Cervezas", price: 1290, cost: 840, stock: 8, minStock: 12, barcode: "7802100001181" },
        { businessId, name: "Coca-Cola 1,5 L", category: "Bebidas", price: 2190, cost: 1510, stock: 22, minStock: 10, barcode: "7801610001162" },
        { businessId, name: "Pisco Mistral 35° 750cc", category: "Licores", price: 8990, cost: 6820, stock: 5, minStock: 6, barcode: "7802110000754" },
        { businessId, name: "Pan hallulla", category: "Panadería", price: 1800, cost: 1120, stock: 34, minStock: 20, barcode: "2000000001015" },
        { businessId, name: "Leche entera Soprole 1 L", category: "Lácteos", price: 1350, cost: 920, stock: 16, minStock: 8, barcode: "7802900005020" },
        { businessId, name: "Papas fritas Marco Polo 180g", category: "Snacks", price: 2490, cost: 1670, stock: 11, minStock: 8, barcode: "7802200003665" },
      ]);
      rows = await db.select().from(products).where(and(eq(products.businessId, businessId), eq(products.active, true))).orderBy(asc(products.name));
    }
    return Response.json({ products: rows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No fue posible cargar los productos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { name?: string; barcode?: string; category?: string; price?: number; cost?: number; stock?: number; minStock?: number };
    if (!payload.name?.trim() || !Number.isInteger(payload.price) || Number(payload.price) < 0) {
      return Response.json({ error: "Nombre y precio válido son obligatorios" }, { status: 400 });
    }
    const db = getDb();
    const businessId = await getDefaultBusinessId();
    const [product] = await db.insert(products).values({ businessId, name: payload.name.trim(), barcode: payload.barcode?.trim() || null, category: payload.category?.trim() || "General", price: Number(payload.price), cost: Number(payload.cost) || 0, stock: Number(payload.stock) || 0, minStock: Number(payload.minStock) || 0 }).returning();
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "No fue posible crear el producto" }, { status: 500 });
  }
}
