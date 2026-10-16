# Lili's Recipes — Login social com Google

## O que foi adicionado
- Login social Google usando `supabase.auth.signInWithOAuth`.
- `AuthProvider` com sessão global via React Context.
- Recuperação da sessão com `getSession()` e acompanhamento de mudanças com `onAuthStateChange()`.
- Exibição de nome, e-mail e avatar do perfil.
- Logout com `supabase.auth.signOut()`.
- Tela de criação de receita protegida: é necessário entrar com Google.
- `user_id` e autoria vinculados ao usuário autenticado na publicação.
- `.env.local` ignorado pelo Git e `.env.example` para configuração.

## 1. Configurar variáveis
Copie `.env.example` para `.env.local` e preencha:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY` (chave publicável/anon do projeto; nunca use `service_role` no frontend)

## 2. Configurar Google OAuth
1. No Google Cloud Console, crie credenciais OAuth 2.0 do tipo **Aplicativo da Web**.
2. Em **URIs de redirecionamento autorizados**, adicione exatamente:
   `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback`
3. No Supabase, vá a **Authentication → Providers → Google**, ative e informe Client ID e Client Secret.
4. Em **Authentication → URL Configuration**, configure a Site URL e adicione Redirect URLs, incluindo `http://localhost:5173/**` para desenvolvimento e a URL real publicada.
5. Salve as alterações. Não compartilhe o Client Secret e nunca o coloque no frontend.

## 3. Configurar políticas do banco
Execute `supabase-auth-policies.sql` no **SQL Editor** do Supabase. Isso adiciona `user_id` e ativa políticas de Row Level Security para permitir leitura pública e limitar publicação/edição/exclusão ao autor autenticado.
Verifique se o projeto já possui políticas próprias antes de executar em produção. As políticas devem corresponder ao esquema real da tabela.

## 4. Rodar localmente
```bash
npm install
npm run dev
```
Abra o endereço informado pelo Vite, normalmente `http://localhost:5173`.

## 5. Validar a entrega
- Clique em **Entrar** → **Entrar com Google**.
- Conclua o consentimento e confirme o retorno ao site.
- Confira nome, e-mail e avatar no cabeçalho/perfil.
- Publique uma receita após autenticar.
- No Supabase, confira **Authentication → Users**.
- Registre capturas da tela de login, perfil autenticado e usuário no painel.

## Observações
- A proteção no React melhora o fluxo de navegação, mas a segurança real dos dados depende também das políticas RLS no Supabase.
- A leitura de receitas permanece pública. A tela de criação e o envio são protegidos.
- Se houver erro `redirect_uri_mismatch`, confira a URL de callback exata do projeto Supabase no Google Cloud.
