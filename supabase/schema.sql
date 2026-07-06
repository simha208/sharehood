-- ShareHood Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  building text not null,
  karma integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Items table
create table public.items (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text default '',
  category text not null,
  image_url text default '',
  status text not null default 'available' check (status in ('available', 'borrowed', 'reserved')),
  created_at timestamp with time zone default now()
);

-- Borrow requests table
create table public.borrow_requests (
  id uuid primary key default uuid_generate_v4(),
  item_id uuid not null references public.items(id) on delete cascade,
  borrower_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'returned')),
  created_at timestamp with time zone default now()
);

-- Messages table
create table public.messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  message text not null,
  created_at timestamp with time zone default now()
);

-- Indexes for performance
create index items_owner_id_idx on public.items(owner_id);
create index items_status_idx on public.items(status);
create index items_category_idx on public.items(category);
create index borrow_requests_item_id_idx on public.borrow_requests(item_id);
create index borrow_requests_borrower_id_idx on public.borrow_requests(borrower_id);
create index messages_sender_id_idx on public.messages(sender_id);
create index messages_receiver_id_idx on public.messages(receiver_id);

-- Row Level Security
alter table public.users enable row level security;
alter table public.items enable row level security;
alter table public.borrow_requests enable row level security;
alter table public.messages enable row level security;

-- RLS Policies

-- Users: anyone authenticated can read, only own row can update
create policy "Users are viewable by authenticated users" on public.users
  for select using (auth.role() = 'authenticated');
create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

-- Items: authenticated users can read all, owners can modify
create policy "Items viewable by authenticated users" on public.items
  for select using (auth.role() = 'authenticated');
create policy "Users can insert own items" on public.items
  for insert with check (auth.uid() = owner_id);
create policy "Owners can update own items" on public.items
  for update using (auth.uid() = owner_id);
create policy "Owners can delete own items" on public.items
  for delete using (auth.uid() = owner_id);

-- Borrow requests
create policy "Users can view relevant requests" on public.borrow_requests
  for select using (auth.uid() = borrower_id or auth.uid() in (
    select owner_id from public.items where id = item_id
  ));
create policy "Users can create requests" on public.borrow_requests
  for insert with check (auth.uid() = borrower_id);
create policy "Owners can update requests" on public.borrow_requests
  for update using (auth.uid() = borrower_id or auth.uid() in (
    select owner_id from public.items where id = item_id
  ));

-- Messages
create policy "Users can view own messages" on public.messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "Users can send messages" on public.messages
  for insert with check (auth.uid() = sender_id);

-- Storage bucket policy (run after creating 'items' bucket in dashboard)
-- insert into storage.buckets (id, name, public) values ('items', 'items', true);
-- create policy "Anyone can view item images" on storage.objects for select using (bucket_id = 'items');
-- create policy "Authenticated users can upload" on storage.objects for insert with check (bucket_id = 'items' and auth.role() = 'authenticated');

-- Demo data (optional — insert after creating demo users via Auth)
-- Replace the UUIDs with real user IDs from your auth.users table
