import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const businesses = sqliteTable("businesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  taxId: text("tax_id"),
  businessType: text("business_type").notNull().default("almacen"),
  plan: text("plan").notNull().default("control"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  name: text("name").notNull(),
  barcode: text("barcode"),
  category: text("category").notNull().default("General"),
  price: integer("price").notNull(),
  cost: integer("cost").notNull().default(0),
  stock: integer("stock").notNull().default(0),
  minStock: integer("min_stock").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const cashSessions = sqliteTable("cash_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  openedBy: text("opened_by").notNull().default("Administrador"),
  openingAmount: integer("opening_amount").notNull().default(0),
  closingAmount: integer("closing_amount"),
  expectedAmount: integer("expected_amount"),
  status: text("status").notNull().default("open"),
  openedAt: text("opened_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  closedAt: text("closed_at"),
});

export const sales = sqliteTable("sales", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  cashSessionId: integer("cash_session_id").references(() => cashSessions.id),
  paymentMethod: text("payment_method").notNull(),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount").notNull().default(0),
  total: integer("total").notNull(),
  documentStatus: text("document_status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const saleItems = sqliteTable("sale_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  saleId: integer("sale_id").notNull().references(() => sales.id),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  unitCost: integer("unit_cost").notNull().default(0),
  lineTotal: integer("line_total").notNull(),
});

export const stockMovements = sqliteTable("stock_movements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  businessId: integer("business_id").notNull().references(() => businesses.id),
  productId: integer("product_id").notNull().references(() => products.id),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  referenceType: text("reference_type"),
  referenceId: integer("reference_id"),
  note: text("note"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
