-- ========================================================
-- PADYEZD* // SUPABASE DATABASE SETUP SCRIPT
-- Bu skripti Supabase Dashboard -> SQL Editor bölməsində icra edin.
-- ========================================================

-- 1. Orders cədvəli yaradılır
create table if not exists public.orders (
  id bigint primary key,
  mehsul text not null,
  musteri text not null,
  telefon text,
  baglama_nomre text,
  izleme_kodu text unique not null,
  maya_cny numeric default 0,
  maya_azn numeric default 0,
  kargo numeric default 0,
  satis numeric default 0,
  status text not null default 'Sifariş verilib',
  unvan text,
  tarix date default current_date,
  qeyd text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Sürətli axtarış üçün indekslər
create index if not exists idx_orders_izleme_kodu on public.orders (izleme_kodu);
create index if not exists idx_orders_baglama_nomre on public.orders (baglama_nomre);

-- 3. Row Level Security (RLS) aktivləşdirilir
alter table public.orders enable row level security;

-- 4. İzləmə üçün hamıya oxuma icazəsi
drop policy if exists "Allow public read access for tracking" on public.orders;
create policy "Allow public read access for tracking"
  on public.orders
  for select
  using (true);

-- 5. Admin üçün tam icazə (Anon açarı ilə)
drop policy if exists "Allow admin full access" on public.orders;
create policy "Allow admin full access"
  on public.orders
  for all
  using (true)
  with check (true);

-- 6. İlkin nümunə sifarişlər əlavə edilir
insert into public.orders (id, mehsul, musteri, telefon, baglama_nomre, izleme_kodu, maya_cny, maya_azn, kargo, satis, status, unvan, tarix, qeyd)
values
  (1732185600001, 'Nike Dunk Low Retro Panda', 'Əli Məmmədov', '+994 50 345 67 89', 'CN-8820491', 'PD-88421', 420, 105.55, 18.00, 190.00, 'Gömrük yoxlanışındadır', 'Bakı Baş Gömrük İdarəsi (Post Terminalı №2)', '2026-11-15', 'Ölçü 43 EU, orijinal qutu ilə'),
  (1732185600002, 'Stüssy Basic Pigment Dyed Hoodie (Black)', 'Ayan İsmayılova', '+994 55 890 12 34', 'CN-9912048', 'PD-92015', 380, 95.50, 15.00, 185.00, 'Azərbaycana göndərilib', 'Beynəlxalq Hava Dəhlizi (Uçuş CZ-6047)', '2026-11-17', 'Ölçü M, oversize model'),
  (1732185600003, 'Sp5der 555555 Worldwide Tracksuit', 'Kamran Hüseynov', '+994 70 234 56 78', 'CN-7730219', 'PD-77302', 580, 145.75, 22.00, 260.00, 'Təhvil məntəqəsindədir', 'Padyezd Təhvil Məntəqəsi (Bakı, Nizami küç. 44)', '2026-11-10', 'Ölçü L, müştəriyə SMS göndərildi'),
  (1732185600004, 'Bape Sta Low White Black Camo', 'Elmir Əliyev', '+994 99 456 78 90', 'CN-6411802', 'PD-64118', 490, 123.14, 20.00, 225.00, 'Xarici anbar', 'Urumqi Çeşidləmə Mərkəzi (Konteyner #08)', '2026-11-19', 'Ölçü 41 EU')
on conflict (izleme_kodu) do nothing;
