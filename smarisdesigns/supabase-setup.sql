-- S'Maris Designs order management schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 order_number text not null unique default ('SM-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,8))),
 customer_name text not null check (char_length(customer_name) between 2 and 120),
 customer_email text not null check (char_length(customer_email) <= 254),
 customer_phone text not null check (char_length(customer_phone) between 5 and 40),
 category text not null,
 event_name text,
 date_needed date,
 preferred_colours text,
 budget text,
 usual_size text,
 fabric_preference text,
 measurements text,
 design_details text not null,
 status text not null default 'new' check (status in ('new','reviewing','awaiting_deposit','in_production','completed','cancelled')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.staff_roles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 role text not null check (role in ('admin'))
);
alter table public.orders enable row level security;
alter table public.staff_roles enable row level security;
-- Customers can submit an order, but cannot read or alter orders after submission.
create policy "Public can submit orders" on public.orders for insert to anon, authenticated with check (true);
-- Only explicitly assigned staff admins can read and manage orders.
create policy "Admins can view orders" on public.orders for select to authenticated using (exists(select 1 from public.staff_roles r where r.user_id=auth.uid() and r.role='admin'));
create policy "Admins can update orders" on public.orders for update to authenticated using (exists(select 1 from public.staff_roles r where r.user_id=auth.uid() and r.role='admin')) with check (exists(select 1 from public.staff_roles r where r.user_id=auth.uid() and r.role='admin'));
create policy "Admins can view own role" on public.staff_roles for select to authenticated using (user_id=auth.uid());
-- Private bucket for customer inspiration/reference images.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('order-references','order-references',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
-- Customers may upload references into a folder named after their order number.
create policy "Allow order reference uploads" on storage.objects for insert to anon, authenticated with check (bucket_id='order-references');
create policy "Admins can view order references" on storage.objects for select to authenticated using (bucket_id='order-references' and exists(select 1 from public.staff_roles r where r.user_id=auth.uid() and r.role='admin'));
