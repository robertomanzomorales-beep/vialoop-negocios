"use client";

import { useState } from "react";

export default function OnboardingForm({ userName }: { userName: string }) {
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("almacen");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, businessType }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "No fue posible crear el negocio");
      setSaving(false);
      return;
    }
    window.location.reload();
  }

  return <main className="auth-page"><section className="auth-card onboarding-card"><div className="auth-brand"><span>V</span><div><strong>vialoop</strong><small>NEGOCIOS</small></div></div><p className="eyebrow">BIENVENIDO, {userName.toUpperCase()}</p><h1>Configuremos tu primer negocio</h1><p>Esta información separará tus ventas e inventario de cualquier otro comercio.</p><form onSubmit={submit}><label>Nombre del negocio<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Botillería Don Pedro" /></label><label>Tipo de negocio<select value={businessType} onChange={(event) => setBusinessType(event.target.value)}><option value="almacen">Almacén</option><option value="botilleria">Botillería</option><option value="minimarket">Minimarket</option><option value="otro">Otro comercio</option></select></label>{error && <div className="auth-error">{error}</div>}<button className="auth-submit" disabled={saving}>{saving ? "Creando…" : "Crear mi negocio"}</button></form></section></main>;
}
