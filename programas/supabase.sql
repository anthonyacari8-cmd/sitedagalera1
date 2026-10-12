-- Cloud Space: execute no SQL Editor do Supabase.
create extension if not exists pgcrypto;
create table if not exists public.profiles(id uuid primary key references auth.users(id) on delete cascade,display_name text not null check(char_length(display_name) between 2 and 40),friend_code text not null unique,created_at timestamptz not null default now());
create table if not exists public.friend_requests(id uuid primary key default gen_random_uuid(),from_user uuid not null references public.profiles(id) on delete cascade,to_user uuid not null references public.profiles(id) on delete cascade,status text not null default 'pending' check(status in('pending','accepted','rejected')),created_at timestamptz not null default now(),check(from_user<>to_user),unique(from_user,to_user));
create table if not exists public.friendships(id uuid primary key default gen_random_uuid(),user_a uuid not null references public.profiles(id) on delete cascade,user_b uuid not null references public.profiles(id) on delete cascade,created_at timestamptz not null default now(),check(user_a<user_b),unique(user_a,user_b));
create table if not exists public.groups(id uuid primary key default gen_random_uuid(),name text not null check(char_length(name) between 2 and 50),created_by uuid not null references public.profiles(id) on delete cascade,created_at timestamptz not null default now());
create table if not exists public.group_members(group_id uuid not null references public.groups(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,joined_at timestamptz not null default now(),primary key(group_id,user_id));
create table if not exists public.photos(id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles(id) on delete cascade,group_id uuid references public.groups(id) on delete cascade,storage_path text not null unique,file_name text not null,mime_type text not null,size_bytes bigint not null default 0,created_at timestamptz not null default now());
create index if not exists photos_owner_created_idx on public.photos(owner_id,created_at desc);
create index if not exists photos_group_created_idx on public.photos(group_id,created_at desc);
alter table public.profiles enable row level security; alter table public.friend_requests enable row level security; alter table public.friendships enable row level security; alter table public.groups enable row level security; alter table public.group_members enable row level security; alter table public.photos enable row level security;
create policy "profiles authenticated read" on public.profiles for select to authenticated using(true);
create policy "profile insert self" on public.profiles for insert to authenticated with check(auth.uid()=id);
create policy "profile update self" on public.profiles for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);
create policy "requests participant read" on public.friend_requests for select to authenticated using(auth.uid()=from_user or auth.uid()=to_user);
create policy "send request self" on public.friend_requests for insert to authenticated with check(auth.uid()=from_user);
create policy "receiver updates request" on public.friend_requests for update to authenticated using(auth.uid()=to_user) with check(auth.uid()=to_user);
create policy "friendship participant read" on public.friendships for select to authenticated using(auth.uid()=user_a or auth.uid()=user_b);
create policy "friendship after request" on public.friendships for insert to authenticated with check((auth.uid()=user_a or auth.uid()=user_b) and exists(select 1 from public.friend_requests r where r.status='pending' and ((r.from_user=user_a and r.to_user=user_b) or (r.from_user=user_b and r.to_user=user_a))));
create policy "group member read" on public.groups for select to authenticated using(created_by=auth.uid() or exists(select 1 from public.group_members m where m.group_id=id and m.user_id=auth.uid()));
create policy "create own group" on public.groups for insert to authenticated with check(created_by=auth.uid());
create policy "group creator update" on public.groups for update to authenticated using(created_by=auth.uid()) with check(created_by=auth.uid());
create policy "group creator delete" on public.groups for delete to authenticated using(created_by=auth.uid());
create policy "members read membership" on public.group_members for select to authenticated using(user_id=auth.uid() or exists(select 1 from public.group_members m where m.group_id=group_members.group_id and m.user_id=auth.uid()));
create policy "creator adds members" on public.group_members for insert to authenticated with check(exists(select 1 from public.groups g where g.id=group_id and g.created_by=auth.uid()));
create policy "creator removes members" on public.group_members for delete to authenticated using(exists(select 1 from public.groups g where g.id=group_id and g.created_by=auth.uid()));
create policy "read own or group photos" on public.photos for select to authenticated using(owner_id=auth.uid() or (group_id is not null and exists(select 1 from public.group_members m where m.group_id=photos.group_id and m.user_id=auth.uid())));
create policy "insert own photos" on public.photos for insert to authenticated with check(owner_id=auth.uid() and (group_id is null or exists(select 1 from public.group_members m where m.group_id=photos.group_id and m.user_id=auth.uid())));
create policy "delete own photos" on public.photos for delete to authenticated using(owner_id=auth.uid());
-- Crie manualmente Storage > New bucket: cloud-photos, PRIVADO.
create policy "read own or group photo files" on storage.objects for select to authenticated using(bucket_id='cloud-photos' and ((storage.foldername(name))[1]=auth.uid()::text or exists(select 1 from public.photos p join public.group_members m on m.group_id=p.group_id where p.storage_path=name and m.user_id=auth.uid())));
create policy "upload own photo files" on storage.objects for insert to authenticated with check(bucket_id='cloud-photos' and (storage.foldername(name))[1]=auth.uid()::text);
create policy "delete own photo files" on storage.objects for delete to authenticated using(bucket_id='cloud-photos' and (storage.foldername(name))[1]=auth.uid()::text);
-- Para realtime: Database > Publications > supabase_realtime, habilite friend_requests, friendships, groups, group_members e photos.
