# Lexia AI — Plano de Execução

> **Estratégia:** Interface primeiro com dados mock → Backend real → Integração n8n → Deploy
>
> Cada milestone é uma branch isolada. O merge para `main` acontece só com o objetivo cumprido.

---

## Visão Geral

| # | Milestone | Branch | Fase |
|---|---|---|---|
| M0 | Project Setup | `setup/bootstrap` | Fundação |
| M1 | Design System & Layout Shell | `ui/design-system` | Interface |
| M2 | Auth Pages (estático) | `ui/auth` | Interface |
| M3 | Dashboard UI | `ui/dashboard` | Interface |
| M4 | Kanban & Leads UI | `ui/kanban` | Interface |
| M5 | Inbox UI | `ui/inbox` | Interface |
| M6 | Calendar UI | `ui/calendar` | Interface |
| M7 | Settings & Users UI | `ui/settings` | Interface |
| M8 | Database & Supabase Setup | `backend/database` | Backend |
| M9 | Auth Backend | `backend/auth` | Backend |
| M10 | Leads & Kanban Backend | `backend/leads` | Backend |
| M11 | Inbox Backend + Realtime | `backend/inbox` | Backend |
| M12 | Dashboard Backend | `backend/dashboard` | Backend |
| M13 | Calendar Backend | `backend/calendar` | Backend |
| M14 | Settings & Users Backend | `backend/settings` | Backend |
| M15 | Integração n8n | `backend/n8n` | Integração |
| M16 | Deploy & Observabilidade | `deploy/production` | Deploy |

---

## FASE 1 — FUNDAÇÃO

---

### M0 · Project Setup

**Branch:** `setup/bootstrap`
**Objetivo:** Repositório configurado, stack instalada, projeto rodando localmente com deploy inicial no Vercel.

#### Entregas

- [ ] Criar repositório no GitHub
- [ ] `npx create-next-app@latest` com TypeScript, Tailwind CSS, App Router, src/ off
- [ ] Configurar TypeScript strict (`"strict": true` no tsconfig)
- [ ] Instalar e configurar shadcn/ui (`npx shadcn@latest init`)
- [ ] Instalar Lucide React
- [ ] Configurar `tailwind.config.ts` com design tokens (cores, fontes, border-radius)
- [ ] Adicionar fonte Inter via `next/font/google`
- [ ] Criar estrutura de pastas conforme CLAUDE.md (`app/`, `components/`, `lib/`, `types/`, `docs/`, `supabase/`)
- [ ] Criar `lib/utils.ts` com função `cn()` (clsx + tailwind-merge)
- [ ] Configurar ESLint + Prettier
- [ ] Criar `.env.local` e `.env.example` com variáveis placeholder
- [ ] Linkar projeto ao Vercel e fazer primeiro deploy (página em branco OK)
- [ ] Confirmar que build passa sem erros (`next build`)

**Commit final:**
```
feat: project bootstrap — Next.js 14, TypeScript strict, Tailwind, shadcn/ui, Vercel deploy
```

---

## FASE 2 — INTERFACE (com dados mock)

> Todas as telas são construídas com dados estáticos (`const mockLeads = [...]`).
> Nenhuma chamada real a banco ou API. O objetivo é ter a UI completa e aprovada antes de conectar o backend.

---

### M1 · Design System & Layout Shell

**Branch:** `ui/design-system`
**Objetivo:** Sistema visual completo e layout base (sidebar + header) funcionando em todas as páginas protegidas.

#### Entregas

**Design tokens**
- [ ] Definir CSS custom properties em `app/globals.css` (cores primárias, semânticas, bordas)
- [ ] Mapear cores no `tailwind.config.ts` (`primary`, `success`, `warning`, `error`, `neutral`)
- [ ] Configurar tipografia (Inter como font-sans padrão)

**Componentes primitivos (shadcn/ui)**
- [ ] Instalar: `button`, `card`, `input`, `label`, `badge`, `avatar`, `dialog`, `dropdown-menu`, `separator`, `skeleton`, `tooltip`, `sheet`
- [ ] Criar `components/ui/` — deixar shadcn gerenciar

**Layout do dashboard**
- [ ] Criar `app/(dashboard)/layout.tsx` com estrutura sidebar + main content
- [ ] Criar `components/layout/Sidebar.tsx` — itens de navegação, logo, item ativo destacado, collapse em mobile
- [ ] Criar `components/layout/Header.tsx` — título da página, sino de notificações, avatar com dropdown
- [ ] Criar `components/layout/NavItem.tsx` — link com ícone + label + estado ativo
- [ ] Sidebar colapsa em mobile (< 640px) usando `Sheet` do shadcn

**Página placeholder**
- [ ] Criar `app/(dashboard)/dashboard/page.tsx` com "Dashboard — em construção" para validar o layout

**Verificação**
- [ ] Layout renderiza corretamente em mobile, tablet e desktop
- [ ] Navegação entre rotas funciona sem erro de hidratação
- [ ] Build passa limpo

**Commit final:**
```
feat(ui): design system, layout shell — sidebar, header, nav, tokens
```

---

### M2 · Auth Pages (estático)

**Branch:** `ui/auth`
**Objetivo:** Telas de login e recuperação de senha com visual final — sem funcionalidade real ainda.

#### Entregas

**Layout de auth**
- [ ] Criar `app/(auth)/layout.tsx` — layout centralizado, sem sidebar
- [ ] Criar `components/layout/AuthCard.tsx` — card com logo Lexia, título, subtítulo

**Tela de Login**
- [ ] Criar `app/(auth)/login/page.tsx`
- [ ] Campos: Email, Senha
- [ ] Botão "Entrar" (estado loading simulado)
- [ ] Link "Esqueci minha senha"
- [ ] Validação visual de campos obrigatórios (HTML5 + estilos de erro)
- [ ] Responsivo em mobile

**Tela de Recuperação de Senha**
- [ ] Criar `app/(auth)/forgot-password/page.tsx`
- [ ] Campo: Email
- [ ] Botão "Enviar instruções"
- [ ] Estado de sucesso: "Verifique seu e-mail"
- [ ] Link "Voltar para o login"

**Verificação**
- [ ] Ambas as telas renderizam sem erros
- [ ] Visual alinhado com design tokens (cores, fontes, espaçamentos)
- [ ] Build passa limpo

**Commit final:**
```
feat(ui): auth pages — login, forgot-password, auth layout
```

---

### M3 · Dashboard UI

**Branch:** `ui/dashboard`
**Objetivo:** Página de dashboard com métricas, funil e feed de atividades usando dados mock.

#### Entregas

**Dados mock**
- [ ] Criar `lib/mock/dashboard.ts` com dados de métricas, atividades e funil

**Cards de métricas**
- [ ] Criar `components/shared/MetricCard.tsx` — ícone, label, número, variação (↑↓)
- [ ] Métricas: Novos Leads (24h), Total de Leads, Taxa de Conversão, Atendimentos Hoje

**Funil visual**
- [ ] Criar `components/shared/FunnelChart.tsx` — barras horizontais por estágio com contagem e cor
- [ ] Usar as cores de status do PRD: Novo `#3B82F6`, Qualificado `#8B5CF6`, etc.

**Feed de atividades**
- [ ] Criar `components/shared/ActivityFeed.tsx` — lista de eventos recentes (lead criado, mensagem recebida, handoff)
- [ ] Timestamp relativo ("há 5 min", "há 2h")

**Notificações pendentes**
- [ ] Criar `components/shared/NotificationBell.tsx` no header com badge de contagem

**Página**
- [ ] Criar `app/(dashboard)/dashboard/page.tsx` compondo os componentes acima
- [ ] Grid responsivo: 2 colunas em desktop, 1 em mobile

**Verificação**
- [ ] Dashboard renderiza com dados mock sem erros
- [ ] Grid responsivo funciona em todos os breakpoints
- [ ] Build passa limpo

**Commit final:**
```
feat(ui): dashboard — metric cards, funnel chart, activity feed, notifications
```

---

### M4 · Kanban & Leads UI

**Branch:** `ui/kanban`
**Objetivo:** Board Kanban completo com drag-and-drop, cartões de lead, modal de detalhes e filtros — tudo com dados mock.

#### Entregas

**Dados mock**
- [ ] Criar `lib/mock/leads.ts` com leads de exemplo em cada estágio
- [ ] Criar `types/lead.ts` com interfaces: `Lead`, `LeadStage`, `LeadOrigin`, `LeadUrgency`

**Board Kanban**
- [ ] Criar `components/kanban/KanbanBoard.tsx` — container das colunas com scroll horizontal
- [ ] Criar `components/kanban/KanbanColumn.tsx` — cabeçalho com nome do estágio, cor e contagem; lista de cards
- [ ] Criar `components/kanban/KanbanCard.tsx` — nome do lead, tipo de caso, origem (badge), urgência (badge), responsável (avatar), data de criação
- [ ] Implementar drag-and-drop entre colunas com `@hello-pangea/dnd` (fork do `react-beautiful-dnd`)
- [ ] Estado visual durante drag: card com opacity reduzida, coluna de destino destacada

**Filtros e busca**
- [ ] Criar `components/kanban/KanbanFilters.tsx` — busca por nome, filtro por responsável, filtro por origem
- [ ] Botão "Novo Lead" abre modal de criação

**Modal de detalhes do Lead**
- [ ] Criar `components/kanban/LeadDetailModal.tsx` com `Dialog` do shadcn
- [ ] Seções: Dados pessoais (nome, CPF, email, telefone), Caso (tipo, urgência, notas), Responsável, Histórico de estágio, Ações (mover estágio, editar)
- [ ] Abrir ao clicar em qualquer card

**Modal de criação de Lead**
- [ ] Criar `components/kanban/LeadCreateModal.tsx`
- [ ] Campos: Nome, Email, Telefone, CPF, Tipo de caso, Urgência, Origem, Responsável, Notas

**Página**
- [ ] Criar `app/(dashboard)/leads/page.tsx`

**Verificação**
- [ ] Drag-and-drop funciona entre colunas sem erros
- [ ] Modal abre e fecha corretamente
- [ ] Filtro reduz os cards visivelmente
- [ ] Build passa limpo

**Commit final:**
```
feat(ui): kanban board — drag-and-drop, lead cards, detail modal, create modal, filters
```

---

### M5 · Inbox UI

**Branch:** `ui/inbox`
**Objetivo:** Interface de inbox centralizada com lista de conversas, view do chat e painel de contexto do lead.

#### Entregas

**Dados mock**
- [ ] Criar `lib/mock/conversations.ts` com conversas e mensagens de exemplo
- [ ] Criar `types/conversation.ts` com interfaces: `Conversation`, `Message`, `MessageSender`, `MessageSource`

**Lista de conversas**
- [ ] Criar `components/inbox/ConversationList.tsx` — lista lateral com preview da última mensagem, nome do lead, origem (WhatsApp/site), timestamp, badge "não lida"
- [ ] Conversa selecionada tem fundo destacado
- [ ] Campo de busca no topo da lista

**View do chat**
- [ ] Criar `components/inbox/ChatView.tsx` — timeline de mensagens em ordem cronológica
- [ ] Criar `components/inbox/MessageBubble.tsx` — bolha diferenciada por remetente: `client` (esquerda, cinza), `agent` (esquerda, roxo claro, com label "Agente IA"), `user` (direita, azul)
- [ ] Indicador de handoff: banner "Atendimento passado para humano" com timestamp
- [ ] Scroll automático para última mensagem

**Painel de contexto do lead**
- [ ] Criar `components/inbox/LeadContextPanel.tsx` — painel lateral direito com dados do lead: nome, email, telefone, tipo de caso, estágio atual, responsável
- [ ] Link "Ver no Kanban" → navega para a rota `/leads`

**Layout de três colunas**
- [ ] `app/(dashboard)/inbox/page.tsx` com layout: lista (280px fixo) | chat (flex) | contexto (320px fixo)
- [ ] Em tablet: contexto some, fica em Sheet abrível
- [ ] Em mobile: navegação entre views (lista → chat → contexto)

**Verificação**
- [ ] Clicar na conversa exibe as mensagens corretas
- [ ] Bolhas renderizam com diferenciação visual clara
- [ ] Layout responsivo funciona
- [ ] Build passa limpo

**Commit final:**
```
feat(ui): inbox — conversation list, chat view, message bubbles, lead context panel
```

---

### M6 · Calendar UI

**Branch:** `ui/calendar`
**Objetivo:** Visualização de calendário com eventos de agendamento, modal de criação e conexão visual com leads.

#### Entregas

**Dados mock**
- [ ] Criar `lib/mock/appointments.ts` com compromissos de exemplo
- [ ] Criar `types/appointment.ts` com interface: `Appointment`, `AppointmentStatus`

**Calendário**
- [ ] Instalar `react-big-calendar` ou `@fullcalendar/react` para a view de calendário
- [ ] Criar `components/calendar/CalendarView.tsx` — views: mês, semana, dia
- [ ] Toggle entre views no header do calendário
- [ ] Navegar entre períodos (anterior / próximo)
- [ ] Cor do evento por status: `scheduled` azul, `confirmed` verde, `cancelled` cinza

**Cards de evento**
- [ ] Criar `components/calendar/EventCard.tsx` — título, horário, nome do lead vinculado
- [ ] Clicar no evento abre modal de detalhes

**Modal de detalhes do evento**
- [ ] Criar `components/calendar/EventDetailModal.tsx` — título, data/hora início e fim, descrição, lead vinculado, status, ações (editar, cancelar)

**Modal de criação de evento**
- [ ] Criar `components/calendar/EventCreateModal.tsx` — título, data/hora, duração, lead (select), advogado, notas

**Página**
- [ ] Criar `app/(dashboard)/calendar/page.tsx`
- [ ] Botão "Novo Agendamento" no header da página

**Verificação**
- [ ] Calendário renderiza eventos nos dias corretos
- [ ] Modal de criação abre/fecha sem erro
- [ ] Build passa limpo

**Commit final:**
```
feat(ui): calendar — month/week/day views, event cards, create/detail modals
```

---

### M7 · Settings & Users UI

**Branch:** `ui/settings`
**Objetivo:** Área de configurações completa com dados do escritório, parâmetros do agente e gestão de usuários.

#### Entregas

**Dados mock**
- [ ] Criar `lib/mock/settings.ts` com dados do escritório e configurações do agente
- [ ] Criar `lib/mock/users.ts` com lista de usuários de exemplo
- [ ] Criar `types/user.ts` com interfaces: `User`, `UserRole`, `UserStatus`

**Layout de Settings**
- [ ] Criar `app/(dashboard)/settings/layout.tsx` — sidebar interna com seções: Escritório, Agente, Integrações, Usuários
- [ ] Navegação por seção via URL: `/settings/office`, `/settings/agent`, `/settings/integrations`, `/settings/users`

**Settings — Escritório**
- [ ] Criar `app/(dashboard)/settings/office/page.tsx`
- [ ] Formulário: Nome do escritório, CNPJ, Email de contato, Telefone, Endereço
- [ ] Botão "Salvar alterações"

**Settings — Agente**
- [ ] Criar `app/(dashboard)/settings/agent/page.tsx`
- [ ] Campos: Horário de atendimento (início/fim por dia), Tom do agente (select: formal, neutro, amigável), Especialidades jurídicas (checkboxes), Mensagem de saudação, Mensagem de encerramento, Mensagem fora do horário

**Settings — Integrações**
- [ ] Criar `app/(dashboard)/settings/integrations/page.tsx`
- [ ] Cards de integração: WhatsApp, Google Calendar, Escavador, ADVBOX
- [ ] Toggle on/off por integração
- [ ] Status badge: Conectado / Desconectado / Em breve

**Settings — Usuários**
- [ ] Criar `app/(dashboard)/settings/users/page.tsx`
- [ ] Tabela com: avatar, nome, email, role (badge colorido), status, ações (editar, desativar)
- [ ] Botão "Convidar usuário"
- [ ] Criar `components/shared/UserInviteModal.tsx` — email, nome, role (select)
- [ ] Criar `components/shared/UserEditModal.tsx` — editar role e status
- [ ] Criar `components/shared/RoleBadge.tsx` — badge com cor por role

**Verificação**
- [ ] Navegação entre seções de settings funciona
- [ ] Tabela de usuários renderiza corretamente
- [ ] Modais abrem e fecham sem erro
- [ ] Build passa limpo

**Commit final:**
```
feat(ui): settings — office form, agent config, integrations panel, user management
```

---

## FASE 3 — BACKEND

> Com a UI completa e aprovada, conectamos dados reais substituindo os mocks.
> Ordem: banco → auth → feature por feature, do core para o periférico.

---

### M8 · Database & Supabase Setup

**Branch:** `backend/database`
**Objetivo:** Projeto Supabase criado, schema completo aplicado, RLS ativo em todas as tabelas, Prisma conectado.

#### Entregas

**Supabase**
- [ ] Criar projeto no Supabase
- [ ] Copiar `SUPABASE_URL` e `SUPABASE_ANON_KEY` para `.env.local`
- [ ] Instalar `@supabase/supabase-js` e `@supabase/ssr`
- [ ] Criar `lib/supabase/client.ts` — cliente para uso em Client Components
- [ ] Criar `lib/supabase/server.ts` — cliente para uso em Server Components (via cookies)

**Migrations SQL**
- [ ] Criar `supabase/migrations/001_tenants.sql` — tabela `tenants`
- [ ] Criar `supabase/migrations/002_users.sql` — tabela `users` + enum `role` + enum `status`
- [ ] Criar `supabase/migrations/003_lead_stages.sql` — tabela `lead_stages`
- [ ] Criar `supabase/migrations/004_leads.sql` — tabela `leads` + enum `urgency` + enum `origin`
- [ ] Criar `supabase/migrations/005_lead_messages.sql` — tabela `lead_messages`
- [ ] Criar `supabase/migrations/006_appointments.sql` — tabela `appointments`
- [ ] Criar `supabase/migrations/007_integrations.sql` — tabela `integrations`
- [ ] Criar `supabase/migrations/008_notifications.sql` — tabela `notifications`
- [ ] Criar `supabase/migrations/009_agent_logs.sql` — tabela `agent_logs`
- [ ] Aplicar migrations via Supabase CLI (`supabase db push`)

**RLS Policies**
- [ ] Criar `supabase/migrations/010_rls.sql` com políticas para todas as tabelas
- [ ] Política base: `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`
- [ ] Testar isolamento: usuário de tenant A não enxerga dados do tenant B

**Prisma**
- [ ] Instalar Prisma (`prisma`, `@prisma/client`)
- [ ] Gerar `prisma/schema.prisma` com todos os models
- [ ] Rodar `prisma db pull` para sincronizar com Supabase
- [ ] Criar `lib/prisma.ts` — singleton do PrismaClient

**Seeds**
- [ ] Criar `supabase/seed.sql` com 1 tenant, 2 usuários, 6 estágios padrão e 5 leads de exemplo

**Verificação**
- [ ] `prisma db pull` não gera erros
- [ ] RLS bloqueia acesso sem token
- [ ] Seeds aplicados com sucesso
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): database schema — all tables, RLS policies, Prisma setup, seed data
```

---

### M9 · Auth Backend

**Branch:** `backend/auth`
**Objetivo:** Login real com Supabase Auth, sessão persistente, rotas protegidas por middleware, tenant vinculado ao usuário.

#### Entregas

**Supabase Auth**
- [ ] Habilitar Auth por email/senha no Supabase Dashboard
- [ ] Criar `supabase/migrations/011_auth_hooks.sql` — trigger que popula `users` após signup
- [ ] Configurar custom JWT claims para incluir `tenant_id` e `role`

**Middleware de proteção**
- [ ] Criar `middleware.ts` na raiz — redireciona `/` e rotas `(dashboard)` para `/login` se não autenticado
- [ ] Redireciona `/login` para `/dashboard` se já autenticado

**Login funcional**
- [ ] Conectar `app/(auth)/login/page.tsx` ao Supabase Auth
- [ ] `signInWithPassword()` com tratamento de erros (credencial inválida, email não confirmado)
- [ ] Redirecionar para `/dashboard` após login

**Logout**
- [ ] Criar Server Action `app/actions/auth.ts` com `signOut()`
- [ ] Vincular ao botão de logout no Header

**Forgot Password funcional**
- [ ] Conectar `app/(auth)/forgot-password/page.tsx` ao `resetPasswordForEmail()`
- [ ] Email de recuperação disparado (configurar Resend no Supabase)
- [ ] Criar `app/(auth)/reset-password/page.tsx` — nova senha após clicar no link do email

**Session no servidor**
- [ ] Confirmar que Server Components leem `session` corretamente via `supabase/server.ts`
- [ ] Criar `lib/hooks/useUser.ts` — hook client-side para acesso ao usuário autenticado

**Verificação**
- [ ] Login com credenciais válidas redireciona para dashboard
- [ ] Acesso direto a `/dashboard` sem auth redireciona para `/login`
- [ ] Logout funciona e limpa a sessão
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): auth — Supabase Auth, session management, route protection, password reset
```

---

### M10 · Leads & Kanban Backend

**Branch:** `backend/leads`
**Objetivo:** Kanban 100% real — leads vindos do banco, drag-and-drop persiste no Supabase, CRUD completo.

#### Entregas

**Server Actions**
- [ ] Criar `app/actions/leads.ts`:
  - [ ] `getLeads(filters)` — busca leads do tenant com filtros
  - [ ] `createLead(data)` — cria novo lead
  - [ ] `updateLead(id, data)` — edita lead
  - [ ] `deleteLead(id)` — remove lead
  - [ ] `moveLeadStage(id, stageId)` — atualiza `stage_id`
- [ ] Criar `app/actions/stages.ts`:
  - [ ] `getStages()` — lista estágios do tenant
  - [ ] `createDefaultStages(tenantId)` — seed dos 6 estágios padrão

**Kanban conectado**
- [ ] Substituir mock em `app/(dashboard)/leads/page.tsx` pelo fetch real (Server Component)
- [ ] Drag-and-drop chama `moveLeadStage()` via Server Action
- [ ] Otimistic update: card move imediatamente, reverte se falhar

**Modal de criação/edição**
- [ ] Formulário chama `createLead()` / `updateLead()`
- [ ] Revalidação de cache após mutação (`revalidatePath`)
- [ ] Toast de sucesso/erro

**Busca e filtros**
- [ ] Filtro por responsável, origem e estágio passa parâmetros para `getLeads()`
- [ ] Busca por nome é debounced (300ms)

**Verificação**
- [ ] Lead criado no modal aparece no board sem refresh manual
- [ ] Drag-and-drop persiste após recarregar a página
- [ ] Filtros reduzem corretamente os resultados do banco
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): leads — CRUD, stage management, drag-and-drop persistence, filters
```

---

### M11 · Inbox Backend + Realtime

**Branch:** `backend/inbox`
**Objetivo:** Inbox com conversas e mensagens reais, atualização em tempo real via Supabase Realtime, endpoint para n8n escrever mensagens.

#### Entregas

**Server Actions**
- [ ] Criar `app/actions/conversations.ts`:
  - [ ] `getConversations()` — lista leads com última mensagem e contagem de não lidas
  - [ ] `getMessages(leadId)` — busca mensagens de uma conversa
  - [ ] `markHandoff(leadId)` — flag de transbordo para humano

**Inbox conectado**
- [ ] Substituir mock em `app/(dashboard)/inbox/page.tsx` pelo fetch real
- [ ] `ConversationList` carrega conversas reais
- [ ] `ChatView` carrega mensagens reais do lead selecionado

**Realtime**
- [ ] Criar `lib/hooks/useRealtimeMessages.ts` — subscribe em `lead_messages` filtrado por `lead_id`
- [ ] Nova mensagem chega → append automático na ChatView sem refresh
- [ ] Criar `lib/hooks/useRealtimeNotifications.ts` — subscribe em `notifications` do usuário

**Webhook para n8n**
- [ ] Criar `app/api/webhooks/message/route.ts` — endpoint POST que n8n chama para registrar nova mensagem
- [ ] Validar origem com secret header (`X-Webhook-Secret`)
- [ ] Criar ou atualizar lead, inserir em `lead_messages`, criar notificação

**Verificação**
- [ ] Abrir inbox em duas abas: mensagem inserida no banco aparece em ambas sem refresh
- [ ] Handoff banner aparece quando flag está ativa
- [ ] POST no endpoint webhook insere mensagem no banco
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): inbox — real conversations, Supabase Realtime, n8n webhook endpoint
```

---

### M12 · Dashboard Backend

**Branch:** `backend/dashboard`
**Objetivo:** Métricas e feeds do dashboard com dados reais do banco.

#### Entregas

**Queries**
- [ ] Criar `lib/queries/dashboard.ts`:
  - [ ] `getNewLeadsToday(tenantId)` — leads criados nas últimas 24h
  - [ ] `getLeadsByStage(tenantId)` — contagem por estágio para o funil
  - [ ] `getConversionRate(tenantId)` — leads em "Cliente" / total de leads (exceto "Perdido")
  - [ ] `getRecentActivity(tenantId, limit)` — últimos eventos de `agent_logs` + `lead_messages`
  - [ ] `getPendingNotifications(userId)` — notificações não lidas

**Dashboard conectado**
- [ ] `app/(dashboard)/dashboard/page.tsx` vira Server Component que chama as queries em paralelo (`Promise.all`)
- [ ] MetricCards recebem dados reais
- [ ] FunnelChart recebe contagens reais por estágio
- [ ] ActivityFeed recebe eventos reais

**Verificação**
- [ ] Criar um lead → número no dashboard incrementa
- [ ] Mover lead para "Cliente" → taxa de conversão atualiza
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): dashboard — real metrics, funnel data, activity feed from database
```

---

### M13 · Calendar Backend

**Branch:** `backend/calendar`
**Objetivo:** Agendamentos persistindo no banco, vinculados a leads e usuários.

#### Entregas

**Server Actions**
- [ ] Criar `app/actions/appointments.ts`:
  - [ ] `getAppointments(filters)` — busca por período e usuário
  - [ ] `createAppointment(data)` — cria compromisso
  - [ ] `updateAppointment(id, data)` — edita
  - [ ] `cancelAppointment(id)` — muda status para `cancelled`

**Calendar conectado**
- [ ] `app/(dashboard)/calendar/page.tsx` carrega eventos reais do banco
- [ ] Criar evento no modal chama `createAppointment()`
- [ ] Cancelar evento no modal chama `cancelAppointment()`
- [ ] Cor do evento reflete status real

**Select de lead no modal**
- [ ] Campo "Lead" no `EventCreateModal` faz search em `leads` do tenant

**Verificação**
- [ ] Criar evento → aparece no calendário no dia correto
- [ ] Cancelar evento → muda de cor para cinza
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): calendar — appointments CRUD, lead association, status management
```

---

### M14 · Settings & Users Backend

**Branch:** `backend/settings`
**Objetivo:** Settings e gestão de usuários 100% funcionais — dados do escritório persistidos, convites enviados, roles aplicados.

#### Entregas

**Server Actions**
- [ ] Criar `app/actions/settings.ts`:
  - [ ] `getTenantSettings(tenantId)` — busca dados do escritório e config do agente
  - [ ] `updateTenantSettings(data)` — salva
- [ ] Criar `app/actions/users.ts`:
  - [ ] `getUsers(tenantId)` — lista usuários do tenant
  - [ ] `inviteUser(email, name, role)` — cria usuário via Supabase Admin API + envia email
  - [ ] `updateUserRole(userId, role)` — atualiza role
  - [ ] `deactivateUser(userId)` — muda status para `inactive`

**Settings conectados**
- [ ] Formulário de escritório carrega e salva dados reais
- [ ] Configurações do agente carregam e salvam em `tenants.config` (JSONB)
- [ ] Toggle de integrações salva em `integrations`

**Gestão de usuários conectada**
- [ ] Tabela carrega usuários reais do banco
- [ ] Convidar usuário dispara email via Resend
- [ ] Editar role salva imediatamente
- [ ] Desativar usuário remove acesso (middleware checa `status`)

**Permissões**
- [ ] Criar `lib/permissions.ts` — mapa de features por role
- [ ] Criar `lib/hooks/usePermissions.ts` — hook que retorna permissões do usuário atual
- [ ] Guards nas Server Actions para validar role antes de executar

**Verificação**
- [ ] Salvar dados do escritório persiste após reload
- [ ] Usuário convidado recebe email e consegue fazer login
- [ ] Usuário com role `viewer` não vê botão "Novo Lead" (guarded no UI)
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): settings and users — tenant config, user management, role-based permissions
```

---

## FASE 4 — INTEGRAÇÃO

---

### M15 · Integração n8n

**Branch:** `backend/n8n`
**Objetivo:** n8n e a plataforma se comunicando de forma bidirecional — agente cria leads, envia mensagens, move estágios e dispara notificações pelo painel.

#### Entregas

**Endpoints de webhook (Next.js → n8n)**
- [ ] Criar `app/api/webhooks/lead-created/route.ts` — n8n recebe quando lead é criado manualmente no painel
- [ ] Criar `app/api/webhooks/handoff/route.ts` — n8n recebe quando advogado marca handoff no inbox
- [ ] Todos os endpoints validam `X-Webhook-Secret`

**Endpoints de ingestão (n8n → Next.js / Supabase direto)**
- [ ] Confirmar que `app/api/webhooks/message/route.ts` (M11) funciona end-to-end com n8n real
- [ ] Criar `app/api/webhooks/agent-log/route.ts` — n8n registra ação do agente (triagem, qualificação)
- [ ] Criar `app/api/webhooks/stage-move/route.ts` — n8n move lead de estágio automaticamente

**Notificações em tempo real**
- [ ] Quando n8n cria notificação no banco, `useRealtimeNotifications` a exibe no header
- [ ] Badge de sino incrementa automaticamente
- [ ] Clicar na notificação navega para o lead ou conversa correspondente

**Teste end-to-end**
- [ ] Simular mensagem de WhatsApp → n8n processa → lead aparece no Kanban → mensagem no Inbox → notificação no sino
- [ ] Simular handoff no painel → n8n recebe webhook → registra no agent_log

**Verificação**
- [ ] Fluxo completo WhatsApp → Kanban funciona sem intervenção manual
- [ ] Todos os webhooks respondem 200 em produção
- [ ] Build passa limpo

**Commit final:**
```
feat(integration): n8n ↔ platform — webhooks, lead sync, realtime notifications, end-to-end flow
```

---

## FASE 5 — DEPLOY

---

### M16 · Deploy & Observabilidade

**Branch:** `deploy/production`
**Objetivo:** Plataforma em produção, monitorada, com CI/CD configurado e variáveis de ambiente seguras.

#### Entregas

**Variáveis de ambiente (produção)**
- [ ] Configurar no Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `WEBHOOK_SECRET`, `RESEND_API_KEY`
- [ ] Remover todos os dados mock do código (substituídos por dados reais)
- [ ] Confirmar que `.env.example` está atualizado e `.env.local` não está no git

**Vercel Production**
- [ ] Configurar domínio personalizado (ex: `app.lexia.ai`)
- [ ] Configurar HTTPS automático
- [ ] Confirmar que deploy de `main` vai automaticamente para produção

**CI/CD (GitHub Actions)**
- [ ] Criar `.github/workflows/ci.yml`:
  - [ ] Trigger: pull request para `main`
  - [ ] Steps: `npm ci` → `tsc --noEmit` → `next build`
  - [ ] Build falho bloqueia merge

**Sentry**
- [ ] Instalar `@sentry/nextjs`
- [ ] Configurar `SENTRY_DSN` no Vercel
- [ ] Captura de erros em Server Components e Client Components
- [ ] Source maps enviados na build

**PostHog**
- [ ] Instalar `posthog-js`
- [ ] Criar `components/layout/PostHogProvider.tsx`
- [ ] Rastrear: login, lead criado, lead movido, handoff marcado
- [ ] Identificar usuário por `userId` e `tenantId`

**Performance & SEO**
- [ ] Confirmar `next/font` carregando Inter corretamente (sem FOUT)
- [ ] Confirmar que rotas `(auth)` não carregam bundle do dashboard
- [ ] Rodar Lighthouse no dashboard: meta Performance > 85

**QA final**
- [ ] Testar fluxo completo em produção: cadastro → login → criar lead → mover estágio → ver no inbox → criar agendamento
- [ ] Testar em mobile (Chrome DevTools)
- [ ] Confirmar RLS: dois tenants não veem dados um do outro

**Commit final:**
```
feat(deploy): production deploy — Vercel config, CI/CD, Sentry, PostHog, domain, QA sign-off
```

---

## Resumo de Branches

```
main
├── setup/bootstrap          → M0
├── ui/design-system         → M1
├── ui/auth                  → M2
├── ui/dashboard             → M3
├── ui/kanban                → M4
├── ui/inbox                 → M5
├── ui/calendar              → M6
├── ui/settings              → M7
├── backend/database         → M8
├── backend/auth             → M9
├── backend/leads            → M10
├── backend/inbox            → M11
├── backend/dashboard        → M12
├── backend/calendar         → M13
├── backend/settings         → M14
├── backend/n8n              → M15
└── deploy/production        → M16
```

---

## Regras de Merge

1. Cada branch sai de `main` e volta para `main` via Pull Request
2. PR requer build passando (CI verifica TypeScript + next build)
3. Dados mock são permitidos até M8 — a partir de M9 nenhum mock vai para `main`
4. RLS deve ser verificada manualmente antes de merge de qualquer branch `backend/`
5. Deploy de produção só acontece após QA do M15 (integração n8n) aprovado

---

## Estimativa

| Fase | Milestones | Semanas estimadas |
|---|---|---|
| Fundação | M0 | 0.5 |
| Interface | M1–M7 | 4–5 |
| Backend | M8–M14 | 4–5 |
| Integração | M15 | 1–2 |
| Deploy | M16 | 0.5–1 |
| **Total** | **16 milestones** | **~10–14 semanas** |
