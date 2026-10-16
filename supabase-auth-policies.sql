-- Execute no SQL Editor do Supabase.
-- Confirme antes se a tabela recipes já possui uma coluna user_id.
alter table public.recipes
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.recipes enable row level security;

-- Receitas continuam visíveis publicamente; apenas usuários autenticados podem publicar.
drop policy if exists "Receitas visíveis para todos" on public.recipes;
create policy "Receitas visíveis para todos"
on public.recipes for select
using (true);

drop policy if exists "Usuários autenticados podem publicar suas receitas" on public.recipes;
create policy "Usuários autenticados podem publicar suas receitas"
on public.recipes for insert to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Autores podem editar suas receitas" on public.recipes;
create policy "Autores podem editar suas receitas"
on public.recipes for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Autores podem excluir suas receitas" on public.recipes;
create policy "Autores podem excluir suas receitas"
on public.recipes for delete to authenticated
using (auth.uid() = user_id);
