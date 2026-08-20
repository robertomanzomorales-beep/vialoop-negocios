create extension if not exists pgcrypto;
create extension if not exists unaccent;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  business_type text not null default 'almacen',
  plan text not null default 'control',
  created_at timestamptz not null default now()
);

create table public.memberships (
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','admin','cashier')),
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  barcode text,
  category text not null default 'General',
  price integer not null check (price >= 0),
  cost integer not null default 0 check (cost >= 0),
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_business_id_idx on public.products(business_id);
create unique index products_business_barcode_idx on public.products(business_id, barcode) where barcode is not null;

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  payment_method text not null check (payment_method in ('cash','card','transfer','credit')),
  subtotal integer not null check (subtotal >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  status text not null default 'completed' check (status in ('completed','voided')),
  created_at timestamptz not null default now()
);

create index sales_business_created_idx on public.sales(business_id, created_at desc);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  unit_cost integer not null default 0 check (unit_cost >= 0),
  line_total integer not null check (line_total >= 0)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  product_id uuid not null references public.products(id),
  type text not null,
  quantity integer not null,
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.is_business_member(p_business_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.memberships where business_id = p_business_id and user_id = auth.uid()); $$;

alter table public.businesses enable row level security;
alter table public.memberships enable row level security;
alter table public.products enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;

create policy "members read businesses" on public.businesses for select using (public.is_business_member(id));
create policy "users read own memberships" on public.memberships for select using (user_id = auth.uid());
create policy "members read products" on public.products for select using (public.is_business_member(business_id));
create policy "members create products" on public.products for insert with check (public.is_business_member(business_id));
create policy "members update products" on public.products for update using (public.is_business_member(business_id));
create policy "members read sales" on public.sales for select using (public.is_business_member(business_id));
create policy "members read sale items" on public.sale_items for select using (exists(select 1 from public.sales where sales.id = sale_id and public.is_business_member(sales.business_id)));
create policy "members read movements" on public.stock_movements for select using (public.is_business_member(business_id));

create or replace function public.create_business(p_name text, p_business_type text default 'almacen')
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_business_id uuid;
  v_slug text;
begin
  if auth.uid() is null then raise exception 'No autorizado'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'Nombre obligatorio'; end if;
  v_slug := trim(both '-' from regexp_replace(lower(unaccent(p_name)), '[^a-z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 6);
  insert into public.businesses(name, slug, business_type) values(trim(p_name), v_slug, coalesce(nullif(p_business_type,''),'almacen')) returning id into v_business_id;
  insert into public.memberships(business_id, user_id, role) values(v_business_id, auth.uid(), 'owner');
  insert into public.products(business_id,name,category,price,cost,stock,min_stock,barcode) values
    (v_business_id,'Cerveza Cristal lata 473cc','Cervezas',1290,840,8,12,'7802100001181'),
    (v_business_id,'Coca-Cola 1,5 L','Bebidas',2190,1510,22,10,'7801610001162'),
    (v_business_id,'Pisco Mistral 35° 750cc','Licores',8990,6820,5,6,'7802110000754'),
    (v_business_id,'Pan hallulla','Panadería',1800,1120,34,20,'2000000001015'),
    (v_business_id,'Leche entera Soprole 1 L','Lácteos',1350,920,16,8,'7802900005020'),
    (v_business_id,'Papas fritas Marco Polo 180g','Snacks',2490,1670,11,8,'7802200003665');
  return v_business_id;
end;
$$;

create or replace function public.register_sale(p_business_id uuid, p_payment_method text, p_items jsonb)
returns uuid language plpgsql security definer set search_path = public
as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_price integer;
  v_cost integer;
  v_total integer := 0;
begin
  if not public.is_business_member(p_business_id) then raise exception 'No autorizado'; end if;
  if p_payment_method not in ('cash','card','transfer','credit') then raise exception 'Forma de pago inválida'; end if;
  if jsonb_array_length(p_items) = 0 then raise exception 'La venta no tiene productos'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    v_price := (v_item->>'unit_price')::integer;
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and business_id = p_business_id and active = true for update;
    if not found then raise exception 'Producto inválido'; end if;
    if v_quantity <= 0 or v_product.stock < v_quantity then raise exception 'Stock insuficiente para %', v_product.name; end if;
    v_total := v_total + (v_price * v_quantity);
  end loop;

  insert into public.sales(business_id, created_by, payment_method, subtotal, total) values(p_business_id, auth.uid(), p_payment_method, v_total, v_total) returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    v_price := (v_item->>'unit_price')::integer;
    v_cost := coalesce((v_item->>'unit_cost')::integer, 0);
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid and business_id = p_business_id for update;
    insert into public.sale_items(sale_id,product_id,product_name,quantity,unit_price,unit_cost,line_total) values(v_sale_id,v_product.id,v_product.name,v_quantity,v_price,v_cost,v_price*v_quantity);
    update public.products set stock = stock - v_quantity, updated_at = now() where id = v_product.id;
    insert into public.stock_movements(business_id,product_id,type,quantity,reference_type,reference_id,created_by) values(p_business_id,v_product.id,'sale',-v_quantity,'sale',v_sale_id,auth.uid());
  end loop;
  return v_sale_id;
end;
$$;

revoke all on function public.create_business(text,text) from public;
revoke all on function public.register_sale(uuid,text,jsonb) from public;
grant execute on function public.create_business(text,text) to authenticated;
grant execute on function public.register_sale(uuid,text,jsonb) to authenticated;
