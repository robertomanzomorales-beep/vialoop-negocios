# Vialoop Negocios

Software de caja, productos e inventario para almacenes, botillerías y comercios locales.

## Tecnología

- Next.js 16 y React 19
- Vercel
- Supabase Auth y PostgreSQL
- Row Level Security para separar los datos de cada negocio

## Configuración local

1. Crea un proyecto en Supabase.
2. Abre `SQL Editor` y ejecuta `supabase/migrations/202608200001_initial.sql`.
3. Copia `.env.example` como `.env.local` y completa las variables públicas de Supabase.
4. Instala y ejecuta:

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`, crea una cuenta y configura el primer negocio.

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

La clave `anon` es pública y está protegida por las políticas RLS. Nunca subas la `service_role` al navegador ni al repositorio.

## Despliegue en Vercel

1. Importa el repositorio privado desde GitHub.
2. Configura las tres variables de entorno.
3. Despliega.
4. En Supabase Auth agrega la URL de Vercel como `Site URL` y como redirect permitido.

## Estado del MVP

Incluye autenticación, alta del primer negocio, separación multiempresa, catálogo, inventario y registro transaccional de ventas. Aún falta implementar cierre de caja, edición de productos, proveedores, compras, membresías y facturación electrónica.
