import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "Vialoop Negocios",
  description: "Caja, inventario y decisiones claras para almacenes, botillerías y comercios locales.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Vialoop Negocios",
    description: "Caja, inventario y decisiones claras para almacenes, botillerías y comercios locales.",
    url: "/",
    siteName: "Vialoop Negocios",
    locale: "es_CL",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Vialoop Negocios — caja, inventario y decisiones claras" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vialoop Negocios",
    description: "Caja, inventario y decisiones claras para comercios locales.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
