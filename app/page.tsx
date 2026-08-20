"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  barcode: string | null;
  accent: string;
};

type CartItem = Product & { quantity: number };

const products: Product[] = [
  { id: 1, name: "Cerveza Cristal lata 473cc", category: "Cervezas", price: 1290, cost: 840, stock: 8, minStock: 12, barcode: "7802100001181", accent: "#f4b721" },
  { id: 2, name: "Coca-Cola 1,5 L", category: "Bebidas", price: 2190, cost: 1510, stock: 22, minStock: 10, barcode: "7801610001162", accent: "#ef4444" },
  { id: 3, name: "Pisco Mistral 35° 750cc", category: "Licores", price: 8990, cost: 6820, stock: 5, minStock: 6, barcode: "7802110000754", accent: "#7c3aed" },
  { id: 4, name: "Pan hallulla", category: "Panadería", price: 1800, cost: 1120, stock: 34, minStock: 20, barcode: "2000000001015", accent: "#d97706" },
  { id: 5, name: "Leche entera Soprole 1 L", category: "Lácteos", price: 1350, cost: 920, stock: 16, minStock: 8, barcode: "7802900005020", accent: "#2563eb" },
  { id: 6, name: "Papas fritas Marco Polo 180g", category: "Snacks", price: 2490, cost: 1670, stock: 11, minStock: 8, barcode: "7802200003665", accent: "#16a34a" },
];

const currency = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

const navItems = ["Resumen", "Caja", "Productos", "Inventario", "Compras", "Reportes"];

export default function Home() {
  const [active, setActive] = useState("Resumen");
  const [query, setQuery] = useState("");
  const [catalog, setCatalog] = useState<Product[]>(products);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("products unavailable")))
      .then((payload: { products?: Array<Omit<Product, "accent">> }) => {
        if (!payload.products?.length) return;
        const palette = ["#f4b721", "#ef4444", "#7c3aed", "#d97706", "#2563eb", "#16a34a"];
        setCatalog(payload.products.map((product, index) => ({ ...product, accent: palette[index % palette.length] })));
      })
      .catch(() => undefined);
  }, []);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return catalog;
    return catalog.filter((product) =>
      `${product.name} ${product.category} ${product.barcode}`.toLowerCase().includes(normalized),
    );
  }, [catalog, query]);

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }

  async function completeSale(paymentMethod: "cash" | "card" | "transfer" | "credit") {
    if (!cart.length) return;
    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paymentMethod, items: cart.map((item) => ({ productId: item.id, name: item.name, quantity: item.quantity, unitPrice: item.price, unitCost: item.cost })) }),
      });
      if (!response.ok) throw new Error("sale failed");
      setCatalog((current) => current.map((product) => {
        const sold = cart.find((item) => item.id === product.id);
        return sold ? { ...product, stock: Math.max(0, product.stock - sold.quantity) } : product;
      }));
      setToast(`Venta registrada por ${currency.format(cartTotal)}`);
      setCart([]);
    } catch {
      setToast("No pudimos registrar la venta. Intenta nuevamente.");
    }
    window.setTimeout(() => setToast(""), 2800);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">V</div>
          <div><strong>vialoop</strong><span>NEGOCIOS</span></div>
        </div>

        <nav aria-label="Navegación principal">
          {navItems.map((item) => (
            <button className={active === item ? "nav-item active" : "nav-item"} key={item} onClick={() => setActive(item)}>
              <span className="nav-dot" />{item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="plan-card">
            <span>PLAN CONTROL</span><strong>Tu negocio está al día</strong>
            <div className="plan-progress"><i /></div><small>Próxima renovación · 20 sep</small>
          </div>
          <button className="profile">
            <span className="avatar">RM</span>
            <span><strong>Roberto Manzo</strong><small>Administrador</small></span><b>•••</b>
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div><p className="eyebrow">BOTILLERÍA DON PEDRO</p><h1>{active === "Resumen" ? "Buenos días, Roberto" : active}</h1></div>
          <div className="header-actions">
            <div className="sync-status"><span /> Sincronizado</div>
            <button className="date-button">Hoy · 20 agosto</button>
            <button className="primary-button" onClick={() => setActive("Caja")}>+ Nueva venta</button>
          </div>
        </header>

        {active === "Resumen" ? (
          <Dashboard onOpenCash={() => setActive("Caja")} />
        ) : active === "Caja" ? (
          <CashRegister products={filteredProducts} query={query} setQuery={setQuery} cart={cart} setCart={setCart} addToCart={addToCart} cartTotal={cartTotal} completeSale={completeSale} />
        ) : active === "Productos" ? (
          <ProductsModule catalog={catalog} setCatalog={setCatalog} onNotify={setToast} />
        ) : active === "Inventario" ? (
          <InventoryModule catalog={catalog} />
        ) : (
          <ModulePlaceholder active={active} onOpenCash={() => setActive("Caja")} />
        )}
      </section>
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}

function Dashboard({ onOpenCash }: { onOpenCash: () => void }) {
  const stats = [
    { label: "Ventas de hoy", value: "$428.600", change: "+12,4%", tone: "green" },
    { label: "Ganancia estimada", value: "$121.240", change: "28,3% margen", tone: "blue" },
    { label: "Ticket promedio", value: "$8.930", change: "+6,1%", tone: "purple" },
    { label: "Ventas registradas", value: "48", change: "3,4 productos/venta", tone: "orange" },
  ];
  return (
    <div className="dashboard-grid">
      <section className="hero-card">
        <div><span className="live-pill"><i /> En vivo</span><h2>Tu caja va bien.<br /><em>Hay 3 cosas que atender.</em></h2><p>Vialoop revisó tus ventas, stock y margen para mostrarte solamente lo importante.</p></div>
        <button className="hero-action" onClick={onOpenCash}>Abrir caja <span>→</span></button>
      </section>

      <section className="stats-grid">
        {stats.map((stat) => <article className="stat-card" key={stat.label}><div className={`stat-icon ${stat.tone}`}><span /></div><p>{stat.label}</p><strong>{stat.value}</strong><small className={stat.tone === "orange" ? "muted" : "positive"}>{stat.change}</small></article>)}
      </section>

      <section className="sales-card panel">
        <PanelHeading kicker="VENTAS" title="Movimiento de hoy" action="Ver reporte" />
        <div className="chart-wrap">
          <div className="chart-axis"><span>$120k</span><span>$80k</span><span>$40k</span><span>$0</span></div>
          <div className="chart-bars">{[18,31,23,45,38,56,49,74,68,88,63,79].map((height,index) => <div className="bar-column" key={index}><i style={{ height: `${height}%` }} /><span>{index + 9}:00</span></div>)}</div>
        </div>
        <div className="chart-footer"><span><i className="legend-current" /> Hoy</span><b>Mejor hora: 18:00–19:00</b></div>
      </section>

      <section className="actions-card panel">
        <div className="panel-heading"><div><span className="section-kicker">ACCIONES</span><h3>Prioridades de hoy</h3></div><span className="count-badge">3</span></div>
        <div className="action-list">
          <Priority icon="!" tone="danger" title="Reponer cerveza Cristal" detail="Quedan 8 unidades; se venden 11 por día." />
          <Priority icon="$" tone="warning" title="Ajustar precio en 4 productos" detail="Tu margen está bajo el 18% recomendado." />
          <Priority icon="↗" tone="info" title="Comprar antes de las 16:00" detail="Evita quiebres durante tu horario de mayor venta." />
        </div>
      </section>

      <section className="stock-card panel">
        <PanelHeading kicker="INVENTARIO" title="Salud del stock" action="Ver inventario" />
        <div className="stock-content"><div className="score-ring"><span><b>86</b>/100</span></div><div className="stock-legend"><p><i className="ok" /><span>Stock saludable</span><b>284</b></p><p><i className="low" /><span>Stock bajo</span><b>12</b></p><p><i className="dead" /><span>Sin rotación</span><b>7</b></p></div></div>
      </section>

      <section className="products-card panel">
        <PanelHeading kicker="RENTABILIDAD" title="Productos destacados" action="Ver todos" />
        <div className="mini-table"><div className="table-row header"><span>Producto</span><span>Ventas</span><span>Margen</span></div><ProductRow tone="purple" name="Pisco Mistral 35°" sales="$124.800" margin="31,4%" /><ProductRow tone="red" name="Coca-Cola 1,5 L" sales="$87.600" margin="29,8%" /><ProductRow tone="amber" name="Pan hallulla" sales="$64.800" margin="37,8%" /></div>
      </section>
    </div>
  );
}

function PanelHeading({ kicker, title, action }: { kicker: string; title: string; action: string }) {
  return <div className="panel-heading"><div><span className="section-kicker">{kicker}</span><h3>{title}</h3></div><button>{action}</button></div>;
}

function Priority({ icon, tone, title, detail }: { icon: string; tone: string; title: string; detail: string }) {
  return <article><span className={`action-icon ${tone}`}>{icon}</span><div><strong>{title}</strong><p>{detail}</p></div><button>Revisar</button></article>;
}

function ProductRow({ tone, name, sales, margin }: { tone: string; name: string; sales: string; margin: string }) {
  return <div className="table-row"><span><i className={`product-dot ${tone}`} />{name}</span><b>{sales}</b><em>{margin}</em></div>;
}

function CashRegister({ products, query, setQuery, cart, setCart, addToCart, cartTotal, completeSale }: {
  products: Product[]; query: string; setQuery: (value: string) => void; cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>; addToCart: (product: Product) => void;
  cartTotal: number; completeSale: (paymentMethod: "cash" | "card" | "transfer" | "credit") => void;
}) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer" | "credit">("cash");
  const paymentOptions: Array<{ value: "cash" | "card" | "transfer" | "credit"; label: string }> = [
    { value: "cash", label: "Efectivo" },
    { value: "card", label: "Tarjeta" },
    { value: "transfer", label: "Transferencia" },
    { value: "credit", label: "Fiado" },
  ];
  return (
    <div className="cash-layout">
      <section className="catalog-panel panel">
        <div className="cash-heading"><div><span className="section-kicker">PUNTO DE VENTA</span><h2>Busca o escanea un producto</h2></div><span className="cash-open"><i /> Caja abierta</span></div>
        <label className="search-box"><span>⌕</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, categoría o código de barra…" /><kbd>F2</kbd></label>
        <div className="product-grid">
          {products.map((product) => <button className="product-card" key={product.id} onClick={() => addToCart(product)}><span className="product-swatch" style={{ background: product.accent }}>{product.category.slice(0, 1)}</span><span className="product-name">{product.name}</span><span className="product-meta"><b>{currency.format(product.price)}</b><small className={product.stock <= product.minStock ? "stock-warning" : ""}>{product.stock} un.</small></span></button>)}
        </div>
      </section>

      <aside className="ticket-panel panel">
        <div className="ticket-heading"><div><span className="section-kicker">VENTA ACTUAL</span><h3>{cart.length ? `${cart.reduce((sum, item) => sum + item.quantity, 0)} productos` : "Sin productos"}</h3></div><button onClick={() => setCart([])}>Limpiar</button></div>
        <div className="ticket-items">
          {!cart.length && <div className="empty-ticket"><span>＋</span><strong>Agrega el primer producto</strong><p>Escanea un código o selecciónalo desde el catálogo.</p></div>}
          {cart.map((item) => <article key={item.id}><span className="ticket-swatch" style={{ background: item.accent }}>{item.category.slice(0, 1)}</span><div><strong>{item.name}</strong><small>{currency.format(item.price)} c/u</small></div><div className="quantity-control"><button onClick={() => setCart((current) => current.flatMap((row) => row.id === item.id ? (row.quantity === 1 ? [] : [{ ...row, quantity: row.quantity - 1 }]) : [row]))}>−</button><b>{item.quantity}</b><button onClick={() => addToCart(item)}>+</button></div><b>{currency.format(item.price * item.quantity)}</b></article>)}
        </div>
        <div className="ticket-summary"><p><span>Subtotal</span><b>{currency.format(cartTotal)}</b></p><p><span>Descuento</span><b>$0</b></p><div><span>Total</span><strong>{currency.format(cartTotal)}</strong></div></div>
        <div className="payment-types">{paymentOptions.map((option) => <button className={paymentMethod === option.value ? "selected" : ""} key={option.value} onClick={() => setPaymentMethod(option.value)}>{option.label}</button>)}</div>
        <button className="charge-button" disabled={!cart.length} onClick={() => completeSale(paymentMethod)}>Cobrar {currency.format(cartTotal)} <span>→</span></button>
      </aside>
    </div>
  );
}

function ProductsModule({ catalog, setCatalog, onNotify }: {
  catalog: Product[];
  setCatalog: React.Dispatch<React.SetStateAction<Product[]>>;
  onNotify: (message: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ name: "", barcode: "", category: "General", price: "", cost: "", stock: "", minStock: "" });
  const visible = catalog.filter((product) => `${product.name} ${product.category} ${product.barcode ?? ""}`.toLowerCase().includes(filter.toLowerCase()));

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          cost: Number(form.cost),
          stock: Number(form.stock),
          minStock: Number(form.minStock),
        }),
      });
      const payload = await response.json() as { product?: Omit<Product, "accent">; error?: string };
      if (!response.ok || !payload.product) throw new Error(payload.error || "No fue posible guardar el producto");
      setCatalog((current) => [...current, { ...payload.product!, accent: "#1d6b55" }].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: "", barcode: "", category: "General", price: "", cost: "", stock: "", minStock: "" });
      setShowForm(false);
      onNotify("Producto creado y disponible en caja");
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "No fue posible guardar el producto");
    } finally {
      setSaving(false);
      window.setTimeout(() => onNotify(""), 2800);
    }
  }

  return (
    <div className="management-layout">
      <section className="management-panel panel">
        <div className="management-heading"><div><span className="section-kicker">CATÁLOGO</span><h2>{catalog.length} productos activos</h2><p>Precios, costos y códigos listos para vender.</p></div><button className="primary-button" onClick={() => setShowForm((current) => !current)}>{showForm ? "Cerrar" : "+ Nuevo producto"}</button></div>
        <label className="table-search"><span>⌕</span><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Buscar por nombre, categoría o código…" /></label>
        <div className="management-table">
          <div className="management-row management-header"><span>Producto</span><span>Categoría</span><span>Precio</span><span>Margen</span><span>Stock</span></div>
          {visible.map((product) => {
            const margin = product.price ? Math.round(((product.price - product.cost) / product.price) * 100) : 0;
            return <div className="management-row" key={product.id}><span className="product-cell"><i style={{ background: product.accent }}>{product.category.slice(0, 1)}</i><span><b>{product.name}</b><small>{product.barcode || "Sin código"}</small></span></span><span>{product.category}</span><strong>{currency.format(product.price)}</strong><em className={margin < 20 ? "margin-low" : "margin-good"}>{margin}%</em><span className={product.stock <= product.minStock ? "stock-pill low" : "stock-pill"}>{product.stock} un.</span></div>;
          })}
        </div>
      </section>

      {showForm && <aside className="product-form-card panel"><div><span className="section-kicker">NUEVO PRODUCTO</span><h3>Agrégalo una sola vez</h3><p>Quedará disponible inmediatamente en la caja.</p></div><form onSubmit={saveProduct}><label>Nombre<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Agua mineral 1,5 L" /></label><div className="form-grid"><label>Categoría<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label><label>Código de barra<input value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} placeholder="Opcional" /></label><label>Precio de venta<input required min="0" step="1" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label><label>Costo<input min="0" step="1" type="number" value={form.cost} onChange={(event) => setForm({ ...form, cost: event.target.value })} /></label><label>Stock inicial<input min="0" step="1" type="number" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></label><label>Stock mínimo<input min="0" step="1" type="number" value={form.minStock} onChange={(event) => setForm({ ...form, minStock: event.target.value })} /></label></div><button className="primary-button" disabled={saving}>{saving ? "Guardando…" : "Guardar producto"}</button></form></aside>}
    </div>
  );
}

function InventoryModule({ catalog }: { catalog: Product[] }) {
  const lowStock = catalog.filter((product) => product.stock <= product.minStock);
  const inventoryCost = catalog.reduce((sum, product) => sum + product.cost * product.stock, 0);
  const inventorySale = catalog.reduce((sum, product) => sum + product.price * product.stock, 0);
  return (
    <div className="inventory-page">
      <section className="inventory-summary">
        <article className="panel"><span>Productos activos</span><strong>{catalog.length}</strong><small>Catálogo disponible</small></article>
        <article className="panel"><span>Stock bajo</span><strong>{lowStock.length}</strong><small>Requieren reposición</small></article>
        <article className="panel"><span>Capital en stock</span><strong>{currency.format(inventoryCost)}</strong><small>Valorizado al costo</small></article>
        <article className="panel"><span>Venta potencial</span><strong>{currency.format(inventorySale)}</strong><small>Al precio actual</small></article>
      </section>
      <section className="panel inventory-list"><div className="management-heading"><div><span className="section-kicker">REPOSICIÓN</span><h2>Productos que debes revisar</h2><p>Ordenados por urgencia según tu mínimo definido.</p></div><span className="count-badge">{lowStock.length}</span></div>{lowStock.length ? lowStock.map((product) => <article key={product.id}><span className="inventory-product" style={{ background: product.accent }}>{product.category.slice(0, 1)}</span><div><strong>{product.name}</strong><small>{product.category} · mínimo {product.minStock} unidades</small></div><span className="stock-pill low">{product.stock} disponibles</span><button>Preparar compra</button></article>) : <div className="empty-inventory"><strong>Todo el stock está saludable</strong><p>No hay productos bajo su mínimo.</p></div>}</section>
    </div>
  );
}

function ModulePlaceholder({ active, onOpenCash }: { active: string; onOpenCash: () => void }) {
  const descriptions: Record<string, string> = { Productos: "Administra códigos, precios, costos, categorías y formatos de venta.", Inventario: "Controla existencias, mínimos, vencimientos y movimientos de stock.", Compras: "Registra recepciones y prepara pedidos según la rotación real.", Reportes: "Revisa ventas, margen, caja y rentabilidad por producto." };
  return <section className="module-placeholder panel"><span className="module-icon">{active.slice(0,1)}</span><p className="eyebrow">MÓDULO VIALOOP</p><h2>{active}</h2><p>{descriptions[active] ?? "Gestiona tu negocio desde un solo lugar."}</p><button className="primary-button" onClick={onOpenCash}>Ir a una venta</button></section>;
}
