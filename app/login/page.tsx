"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Revisa tu correo para confirmar la cuenta.");
    else window.location.href = "/";
    setLoading(false);
  }

  return <main className="auth-page"><section className="auth-card"><div className="auth-brand"><span>V</span><div><strong>vialoop</strong><small>NEGOCIOS</small></div></div><p className="eyebrow">GESTIÓN SIMPLE PARA COMERCIOS</p><h1>{mode === "login" ? "Ingresa a tu negocio" : "Crea tu cuenta"}</h1><p>{mode === "login" ? "Tus ventas, productos e inventario en un solo lugar." : "Comienza configurando tu primer comercio."}</p><form onSubmit={submit}>{mode === "signup" && <label>Nombre completo<input required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>}<label>Correo<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Contraseña<input required minLength={8} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>{message && <div className="auth-message">{message}</div>}<button className="auth-submit" disabled={loading}>{loading ? "Procesando…" : mode === "login" ? "Ingresar" : "Crear cuenta"}</button></form><button className="auth-switch" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "¿Primera vez? Crear una cuenta" : "Ya tengo cuenta"}</button></section></main>;
}
