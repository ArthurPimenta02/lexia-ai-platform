# Lexia AI — Plano de Execução

> **Estratégia:** Interface primeiro com dados mock → Backend real → Integração n8n → Deploy
>
> Cada milestone é uma branch isolada. O merge para `main` acontece só com o objetivo cumprido.
>
> **Posicionamento:** Lexia AI é uma plataforma operacional com IA para escritórios de advocacia — não um CRM genérico.
> A jornada do produto é: **Leads → Pipeline → Casos → Radar → Calendário**.

---

## Visão Geral

| # | Milestone | Branch | Fase |
|---|---|---|---|
| M0 | Project Setup ✅ | `setup/bootstrap` | Fundação |
| M1 | Design System & Layout Shell ✅ | `ui/design-system` | Interface |
| M2 | Auth Pages (estático) ✅ | `ui/auth` | Interface |
| M3 | Dashboard UI ✅ | `ui/dashboard` | Interface |
| M4 | Leads UI (Tabela) ✅ | `ui/leads-table` | Interface |
| M4b | Kanban UI ✅ | `ui/kanban` | Interface |
| M5 | Casos UI ✅ | `ui/casos` | Interface |
| M6 | Radar UI ✅ | `ui/radar` | Interface |
| M7 | Calendar UI ✅ | `ui/calendar` | Interface |
| M8 | Settings & Users UI ✅ | `ui/settings` | Interface |
| M9 | Database, Auth & Supabase Setup ✅ | `backend/foundation` | Backend |
| M10 | Leads & Kanban Backend ✅ | `backend/leads` | Backend |
| M11 | Casos Backend ✅ | `backend/casos` | Backend |
| M12 | Radar Backend ✅ | `backend/radar` | Backend |
| M13 | Dashboard Backend ✅ | `backend/dashboard` | Backend |
| M14 | Calendar Backend ✅ | `backend/calendar` | Backend |
| M15 | Settings & Users Backend ✅ | `backend/settings` | Backend |
| M16 | Integração n8n | `backend/n8n` | Integração |
| M17 | Deploy & Observabilidade | `deploy/production` | Deploy |

---

## FASE 1 — FUNDAÇÃO

---

### M0 · Project Setup

**Branch:** `setup/bootstrap`
**Objetivo:** Repositório configurado, stack instalada, projeto rodando localmente com deploy inicial no Vercel.

#### Entregas

- [x] Criar repositório no GitHub
- [x] `npx create-next-app@latest` com TypeScript, Tailwind CSS, App Router, src/ off
- [x] Configurar TypeScript strict (`"strict": true` no tsconfig)
- [x] Instalar e configurar shadcn/ui (`npx shadcn@latest init`)
- [x] Instalar Lucide React
- [x] Configurar `tailwind.config.ts` com design tokens (cores, fontes, border-radius)
- [x] Adicionar fonte Inter via `next/font/google`
- [x] Criar estrutura de pastas conforme CLAUDE.md (`app/`, `components/`, `lib/`, `types/`, `docs/`, `supabase/`)
- [x] Criar `lib/utils.ts` com função `cn()` (clsx + tailwind-merge)
- [x] Configurar ESLint + Prettier
- [x] Criar `.env.local` e `.env.example` com variáveis placeholder
- [ ] Linkar projeto ao Vercel e fazer primeiro deploy (página em branco OK)
- [x] Confirmar que build passa sem erros (`next build`)

**Commit final:**
```
feat: project bootstrap — Next.js 16, TypeScript strict, Tailwind, shadcn/ui, Vercel deploy
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
- [x] Definir CSS custom properties em `app/globals.css` (cores primárias, semânticas, bordas)
- [x] Mapear cores no `tailwind.config.ts` (`primary`, `success`, `warning`, `error`, `neutral`)
- [x] Configurar tipografia (Inter como font-sans padrão)

**Componentes primitivos (shadcn/ui)**
- [x] Instalar: `button`, `card`, `input`, `label`, `badge`, `avatar`, `dialog`, `dropdown-menu`, `separator`, `skeleton`, `tooltip`, `sheet`
- [x] Criar `components/ui/` — deixar shadcn gerenciar

**Layout do dashboard**
- [x] Criar `app/(dashboard)/layout.tsx` com estrutura sidebar + main content
- [x] Criar `components/layout/Sidebar.tsx` — itens de navegação, logo, item ativo destacado, collapse em mobile
- [x] Criar `components/layout/Header.tsx` — título da página, sino de notificações, avatar com dropdown
- [x] Criar `components/layout/NavItem.tsx` — link com ícone + label + estado ativo
- [x] Sidebar colapsa em mobile (< 640px) usando `Sheet` do shadcn

**Página placeholder**
- [x] Criar `app/(dashboard)/dashboard/page.tsx` com "Dashboard — em construção" para validar o layout

**Verificação**
- [x] Layout renderiza corretamente em mobile, tablet e desktop
- [x] Navegação entre rotas funciona sem erro de hidratação
- [x] Build passa limpo

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
- [x] Criar `app/(auth)/layout.tsx` — layout centralizado, sem sidebar
- [x] Criar `components/layout/AuthCard.tsx` — card com logo Lexia, título, subtítulo

**Tela de Login**
- [x] Criar `app/(auth)/login/page.tsx`
- [x] Campos: Email, Senha
- [x] Botão "Entrar" (estado loading simulado)
- [x] Link "Esqueci minha senha"
- [x] Validação visual de campos obrigatórios (HTML5 + estilos de erro)
- [x] Responsivo em mobile

**Tela de Recuperação de Senha**
- [x] Criar `app/(auth)/forgot-password/page.tsx`
- [x] Campo: Email
- [x] Botão "Enviar instruções"
- [x] Estado de sucesso: "Verifique seu e-mail"
- [x] Link "Voltar para o login"

**Extras entregues (além do plano)**
- [x] Criar `app/(auth)/signup/page.tsx` — cadastro de nova conta
- [x] Criar `app/(onboarding)/onboarding/page.tsx` — fluxo de onboarding do workspace

**Verificação**
- [x] Ambas as telas renderizam sem erros
- [x] Visual alinhado com design tokens (cores, fontes, espaçamentos)
- [x] Build passa limpo

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
- [x] Criar `lib/mock/dashboard.ts` com dados de métricas, atividades e funil

**Cards de métricas**
- [x] Criar `components/shared/MetricCard.tsx` — ícone, label, número, variação (↑↓)
- [x] Métricas: Novos Leads (24h), Total de Leads, Taxa de Conversão, Atendimentos Hoje

**Funil visual**
- [x] Criar `components/shared/FunnelChart.tsx` — barras horizontais por estágio com contagem e cor
- [x] Usar as cores de status do PRD: Novo `#3B82F6`, Qualificado `#8B5CF6`, etc.

**Feed de atividades**
- [x] Criar `components/shared/ActivityFeed.tsx` — lista de eventos recentes (lead criado, mensagem recebida, handoff)
- [x] Timestamp relativo ("há 5 min", "há 2h")

**Notificações pendentes**
- [x] Criar `components/layout/NotificationBell.tsx` no header com badge de contagem

**Página**
- [x] Criar `app/(dashboard)/dashboard/page.tsx` compondo os componentes acima
- [x] Grid responsivo: 2 colunas em desktop, 1 em mobile

**Verificação**
- [x] Dashboard renderiza com dados mock sem erros
- [x] Grid responsivo funciona em todos os breakpoints
- [x] Build passa limpo

**Commit final:**
```
feat(ui): dashboard — metric cards, funnel chart, activity feed, notifications
```

---

### M4 · Leads UI (Tabela)

**Branch:** `ui/leads-table` ✅ merged → `master`
**Objetivo:** Gestão completa de leads com tabela, filtros, busca em tempo real, CRUD via dialogs e página de detalhe com timeline de atividades — tudo com dados mock.

> **Nota:** Kanban com drag-and-drop foi adiado para M4b (ver abaixo). O usuário priorizou a visão de tabela por ser mais útil no curto prazo.

#### Entregas

**Dados mock**
- [x] Criar `lib/mock/leads.ts` — 15 leads brasileiros (3 Novo, 2 Qualificado, 3 Proposta, 2 Contrato, 3 Cliente, 2 Perdido), STATUS_COLORS, MOCK_LEAD_ACTIVITIES (3–5 eventos por lead)
- [x] Criar `types/lead.ts` — interfaces `Lead`, `LeadActivity`, union `LeadStatus`

**Componentes**
- [x] Criar `components/leads/StatusBadge.tsx` — badge com dot colorido via inline style
- [x] Criar `components/leads/LeadFormDialog.tsx` — dialog dual-mode (criar/editar), validação com `aria-invalid`, reset ao fechar
- [x] Criar `components/leads/DeleteLeadDialog.tsx` — confirmação de exclusão
- [x] Criar `components/leads/LeadsTable.tsx` — tabela semântica, DropdownMenu de ações, link para detalhe, empty state, colunas responsivas
- [x] Criar `components/leads/LeadsClient.tsx` — state owner (leads, search, statusFilter, dialogs), toolbar com busca + filtro + "Novo Lead"

**Página de lista**
- [x] Modificar `app/(dashboard)/leads/page.tsx` — thin shell montando `<LeadsClient />`

**Página de detalhe**
- [x] Criar `components/leads/LeadDetailClient.tsx` — hero card, grid de contato/observações, timeline de atividades com ícones por tipo, dialog de edição inline
- [x] Criar `app/(dashboard)/leads/[id]/page.tsx` — Server Component, `await params`, `notFound()` para IDs inválidos

**Triagem Inteligente de Leads (IA — UI com dados mock)**
- [x] Criar `components/leads/LeadTriagePanel.tsx` — painel colapsável na página de detalhe do lead com:
  - [x] Classificação da área jurídica (ex: Trabalhista, Cível, Família)
  - [x] Resumo da demanda gerado por IA
  - [x] Nível de urgência (badge: Alta / Média / Baixa)
  - [x] Sugestão de encaminhamento interno
  - [x] Ficha estruturada gerada a partir da conversa/entrada
- [x] Dados mockados — integração real com OpenAI GPT-4o na Fase 3

**Verificação**
- [x] Tabela com 15 leads sem erros de console
- [x] Busca por nome/empresa em tempo real
- [x] Filtro por status combinado com busca
- [x] Criar lead: validação de campos obrigatórios (aria-invalid)
- [x] Editar lead: dialog pré-preenchido, tabela atualiza
- [x] Excluir lead: confirmation dialog, linha removida
- [x] Navegação para `/leads/[id]` e página de detalhe completa
- [x] Edição inline na página de detalhe
- [x] `notFound()` para ID inválido
- [x] Build limpo (`tsc --noEmit` + `next build` — 0 erros)

**Commit final:**
```
feat(ui/leads): tabela de leads, filtros, CRUD e página de detalhe
```

---

### M4b · Kanban UI ✅ merged → `master`

**Branch:** `ui/kanban` ✅ merged → `master`
**Objetivo:** Visão alternativa em Kanban com drag-and-drop para os mesmos dados de leads.

#### Entregas

- [x] Criar `components/kanban/KanbanBoard.tsx` — container de colunas com scroll horizontal
- [x] Criar `components/kanban/KanbanColumn.tsx` — cabeçalho com nome do estágio, cor e contagem
- [x] Criar `components/kanban/KanbanCard.tsx` — dados do lead no card
- [x] Implementar drag-and-drop com `@hello-pangea/dnd`
- [x] Toggle "Tabela / Kanban" na página de leads
- [x] Build limpo

---

### M5 · Casos UI

**Branch:** `ui/casos`
**Objetivo:** Módulo de operação jurídica — listagem e detalhe de casos ativos, separando a operação comercial (Leads/Pipeline) da operação jurídica (Casos). Inclui Dossiê do caso com resumo por IA.

> Casos representam a etapa pós-contratação: lead convertido → caso aberto. A jornada é: Leads → Pipeline → **Casos** → Radar → Calendário.

#### Entregas

**Dados mock**
- [x] Criar `lib/mock/casos.ts` — 8 casos em andamento com campos: título, área jurídica, responsável, cliente, status (ativo/suspenso/encerrado), data de abertura, última movimentação, processos vinculados
- [x] Criar `types/caso.ts` — interfaces `Caso`, `CasoStatus`, `ProcessoVinculado`, `DossieData`

**Lista de Casos**
- [x] Criar `components/casos/CasosTable.tsx` — tabela com: título, área, cliente, responsável, status, última movimentação
- [x] Criar `components/casos/CasoStatusBadge.tsx` — badge por status
- [x] Criar `components/casos/CasoFormDialog.tsx` — criar/editar caso (título, área jurídica, cliente, responsável, observações)
- [x] Criar `components/casos/CasosClient.tsx` — state owner com busca e filtros
- [x] Criar `app/(dashboard)/casos/page.tsx`

**Página de Detalhe do Caso (Dossiê)**
- [x] Criar `app/(dashboard)/casos/[id]/page.tsx` — Server Component com `notFound()` para IDs inválidos
- [x] Criar `components/casos/DossieClient.tsx` — layout de duas colunas: conteúdo principal + painel lateral
- [x] **Seção: Visão Geral** — dados do caso, responsável, área jurídica, status, datas
- [x] **Seção: Linha do Tempo** — eventos cronológicos do caso (audiências, petições, movimentações, marcos)
- [x] **Seção: Processos Vinculados** — lista de processos com número, tribunal, última movimentação
- [x] **Seção: Próximos Prazos** — lista de prazos ordenados por data
- [x] **Seção: Documentos** — lista de documentos (estrutura apenas; upload na Fase 3)
- [x] **Painel: Dossiê Inteligente (IA — UI com dados mock)**
  - [x] Criar `components/casos/DossieInteligente.tsx` — painel colapsável com:
    - [x] Resumo vivo do caso (narrativa consolidada)
    - [x] Pontos críticos em aberto
    - [x] Pendências identificadas
    - [x] Próximos marcos esperados
    - [x] Última movimentação relevante
    - [x] Contexto consolidado para retomada rápida
  - [x] Dados mockados — integração real com OpenAI GPT-4o na Fase 3

**Verificação**
- [x] Lista de casos renderiza com dados mock sem erros
- [x] Filtros e busca funcionam
- [x] Página de detalhe carrega com dossiê completo
- [x] Dossiê Inteligente exibe dados mock formatados
- [ ] Build passa limpo

**Commit final:**
```
feat(ui/casos): listagem de casos, dossiê com linha do tempo e painel de IA mock
```

---

### M6 · Radar UI ✅

**Branch:** `ui/radar` → mergeado em `main`
**Objetivo:** Central de monitoramento jurídico — publicações, movimentações processuais, alertas, prazos gerados por movimentações. Cada item tem classificação de urgência e indicação se exige ação.

#### Entregas

**Dados mock**
- [x] Criar `lib/mock/radar.ts` — 20 itens de radar: publicações, movimentações, alertas de prazo, com campos: tipo, caso vinculado, cliente, data, urgência, exige ação, resumo IA, próximo passo sugerido
- [x] Criar `types/radar.ts` — interfaces `RadarItem`, `RadarTipo`, `RadarUrgencia` (+ `RadarStatus`, `RadarOrigem`, constantes de cor e label)

**Lista do Radar**
- [x] Criar `components/radar/RadarList.tsx` — lista com agrupamento por data (hoje, esta semana, anteriores)
- [x] Criar `components/radar/RadarCard.tsx` — card com: tipo (badge), caso, cliente, data, urgência (badge colorido), indicador "Exige ação" (ícone destacado)
- [x] Criar `components/radar/RadarFilters.tsx` — filtros: tipo, urgência, caso, exige ação + filtro de período
- [x] Criar `components/radar/RadarClient.tsx` — state owner com `useState<RadarItem[]>` para suportar mutações locais
- [x] Criar `app/(dashboard)/radar/page.tsx`

**Painel de Detalhe do Item**
- [x] Criar `components/radar/RadarItemDetail.tsx` — Sheet lateral que abre ao clicar num item:
  - [x] Cabeçalho: título → caso vinculado → cliente → metadados → badges (tipo, urgência, status, exige ação)
  - [x] **Resumo Inteligente (IA — UI com dados mock)**:
    - [x] Resumo claro do andamento processual
    - [x] Explicação prática do que aconteceu
    - [x] Classificação de urgência/prioridade
    - [x] Indicação se exige ação e qual
    - [x] Sugestão de próximo passo
    - [x] Impacto no caso *(adicional)*
    - [x] Risco se não agir *(adicional)*
  - [x] Ações rápidas: "Ver caso" (navega), "Criar prazo" (dialog real), "Atualizar caso" (navega), "Adicionar à timeline" (feedback visual), "Marcar como resolvido" (confirm + atualiza state)
- [x] Criar `components/radar/RadarCriarPrazoDialog.tsx` — dialog com campos: descrição, tipo, data limite, responsável, observações *(adicional)*

**Campos extras em `RadarItem`**
- [x] `dataResolucao?` — registrada ao marcar como resolvido
- [x] `referenciaExterna?` — para futura integração com Escavador/Datajud
- [x] `impactoNoCaso` — exibido no Resumo Inteligente

**Verificação**
- [x] Lista renderiza com dados mock, agrupada por data
- [x] Filtros funcionam corretamente
- [x] Sheet de detalhe abre e exibe Resumo Inteligente mockado
- [x] Badges de urgência com cores corretas (vermelho/alto, amarelo/médio, cinza/baixo)
- [x] Build passa limpo

---

### M7 · Calendar UI ✅

**Branch:** `ui/calendar` → mergeado em `main`
**Objetivo:** Agenda operacional jurídica — compromissos, prazos, audiências, tarefas e lembretes com views mês/semana/dia e integração preparada para Google Calendar.

#### Entregas

**Dados mock**
- [x] Criar `lib/mock/appointments.ts` — 20 eventos cobrindo todos os tipos, status, prioridades e origens
- [x] Criar `types/calendar.ts` — interfaces `CalendarEvent`, `CalendarAttendee`, `GoogleEventPayload`; tipos `EventType` (6), `EventStatus` (4, inclui `completed`), `EventPriority`, `EventOrigin`; constantes de config; funções `toGooglePayload()` e `fromGoogleEvent()`

**Calendário custom (sem libs externas)**
- [x] Criar `components/calendar/MonthView.tsx` — grid 7×6, overflow `+N mais`, allDay destacado, dia atual circulado
- [x] Criar `components/calendar/WeekView.tsx` — 7 colunas × 7h–21h, allDay strip, eventos posicionados por horário
- [x] Criar `components/calendar/DayView.tsx` — coluna única, borda colorida lateral por status (classes estáticas Tailwind)
- [x] Criar `components/calendar/CalendarView.tsx` — roteador de views
- [x] Toggle entre views (Mês / Semana / Dia) no header
- [x] Navegar entre períodos (← / Hoje / →)
- [x] Botão "Hoje" desabilitado e destacado quando período atual já é hoje
- [x] Filtros rápidos por tipo de evento (chips: Todos / Audiências / Prazos / Reuniões / Tarefas / Lembretes)
- [x] Cores por status: `scheduled` azul, `confirmed` verde, `completed` verde escuro, `cancelled` cinza

**Componentes**
- [x] Criar `components/calendar/EventPill.tsx` — pill com ícone por tipo, ponto vermelho para prioridade alta
- [x] Criar `components/calendar/CalendarHeader.tsx` — navegação, toggle de views, filtros, botão Novo Evento
- [x] Criar `components/calendar/EventDetailModal.tsx` — detalhe completo: status, prioridade, origem, vínculos com botões "Abrir caso" / "Abrir lead", ações marcar como concluído / cancelar / editar
- [x] Criar `components/calendar/EventCreateModal.tsx` — criação/edição com allDay toggle, vínculos a caso e lead, dark mode corrigido
- [x] Criar `components/calendar/CalendarClient.tsx` — state owner com barra de status Google Calendar sync

**Google Calendar (preparado para Fase 3)**
- [x] Criar `lib/hooks/useGoogleCalendar.ts` — hook com `fetchEvents`, `pushEvent`, `deleteEvent`, `syncRange`; merge bidirecional por `googleEventId`
- [x] Barra de status na UI: conectado/desconectado, última sync, botões Sincronizar / Desconectar / Conectar

**Página**
- [x] Criar `app/(dashboard)/calendar/page.tsx` — Server Component, remove placeholder

**Verificação**
- [x] Month view renderiza eventos nos dias corretos com pills coloridas
- [x] Células com muitos eventos exibem `+N mais`
- [x] Week e Day views posicionam eventos por horário (com clamp para eventos antes das 7h)
- [x] allDay events em faixa dedicada (week/day) e destacados (month)
- [x] Navegação ← / Hoje / → funciona nas 3 views
- [x] Filtros por tipo funcionam
- [x] EventDetailModal exibe vínculos com botões "Abrir caso" / "Abrir lead"
- [x] Marcar como concluído e cancelar atualizam state local
- [x] Dark mode: selects e textarea legíveis
- [x] Build passa limpo

---

### M8 · Settings & Users UI ✅

**Branch:** `ui/settings`
**Objetivo:** Área de configurações completa com dados do escritório, parâmetros do agente e gestão de usuários.

#### Entregas

**Dados mock**
- [x] Criar `lib/mock/settings.ts` com dados do escritório e configurações do agente
- [x] Criar `lib/mock/users.ts` com lista de usuários de exemplo
- [x] Criar `types/user.ts` com interfaces: `User`, `UserRole`, `UserStatus`, `UserInvite`
- [x] Criar `types/settings.ts` com interfaces: `OfficeSettings`, `AgentSettings`, `HandoffRules`, `Integration`

**Layout de Settings**
- [x] Criar `app/(dashboard)/settings/layout.tsx` — sidebar interna discreta com 4 seções
- [x] Criar `components/settings/SettingsSidebar.tsx` — nav secundária com ícones e estado ativo via pathname
- [x] Navegação por seção via URL: `/settings/office`, `/settings/agent`, `/settings/integrations`, `/settings/users`
- [x] `/settings` → redirect para `/settings/office`; `/users` → redirect para `/settings/users`

**Settings — Escritório**
- [x] Criar `app/(dashboard)/settings/office/page.tsx`
- [x] Criar `components/settings/OfficeForm.tsx` — identidade (nome, displayName, área, timezone, logo placeholder) + contato e endereço completo
- [x] Validação inline (aria-invalid), feedback de sucesso com timeout

**Settings — Agente**
- [x] Criar `app/(dashboard)/settings/agent/page.tsx`
- [x] Criar `components/settings/AgentForm.tsx` — 6 blocos em Card: horário de atendimento (toggle/dia + start/end), tom (3 opções visuais), especialidades (chips), mensagens padrão (4 textareas), regras de handoff (keywords, limite mensagens, toggles fallback), canais ativos

**Settings — Integrações**
- [x] Criar `app/(dashboard)/settings/integrations/page.tsx`
- [x] Criar `components/settings/IntegrationCard.tsx` — card com logo, nome, descrição, status badge, lastSyncAt, toggle, CTA
- [x] Criar `components/settings/IntegrationsClient.tsx` — grid 2×2 com estado local dos toggles
- [x] 4 integrações: WhatsApp (conectado), Google Calendar (desconectado), Escavador (em breve), ADVBOX (em breve)

**Settings — Usuários**
- [x] Criar `app/(dashboard)/settings/users/page.tsx`
- [x] Criar `components/settings/UsersClient.tsx` — tabela com avatar, nome/email, role badge, status, último acesso, ações (editar, desativar)
- [x] Seção de convites pendentes/expirados separada abaixo da tabela
- [x] Busca por nome/email + filtro por role
- [x] Criar `components/shared/RoleBadge.tsx` — badge com cor por role (admin=azul, manager=roxo, lawyer=verde, secretary=amarelo, viewer=cinza)
- [x] Criar `components/shared/UserInviteModal.tsx` — dialog: email, nome, role (select) + validação aria-invalid
- [x] Criar `components/shared/UserEditModal.tsx` — dialog: editar role e status pré-preenchidos

**Verificação**
- [x] Navegação entre seções de settings funciona
- [x] Tabela de usuários renderiza 6 usuários + 2 convites
- [x] Modais abrem e fecham sem erro
- [x] `/settings` e `/users` redirecionam corretamente
- [x] Sem browser-level scroll — scroll contido no painel interno de cada página
- [x] Build passa limpo sem erros TypeScript

**Commit final:**
```
feat(ui/settings): M8 — settings & users UI com escritório, agente, integrações e gestão de equipe
```

---

## FASE 3 — BACKEND

> Com a UI completa e aprovada, conectamos dados reais substituindo os mocks.
> Ordem obrigatória: schema → auth → onboarding → features por domínio.
>
> **Decisão arquitetural registrada:** Prisma removido do MVP. O uso de JWT claims customizados
> (`tenant_id`, `role`) para RLS cria atrito real com o Prisma ORM. Usamos `@supabase/supabase-js`
> direto com tipos TypeScript gerados do schema. Pode ser revisado após M16 se a complexidade de
> queries justificar a adição do ORM.

---

### M9 · Database, Auth & Supabase Setup ✅

**Branch:** `backend/foundation` → merged em `master` (PR #14)
**Objetivo:** Schema completo modelado para a arquitetura real da Lexia — Caso ≠ Processo,
cliente como entidade própria, OABs dos advogados, campos de sync Escavador/CNJ. RLS ativo.
Supabase clients prontos para uso no App Router. Auth backend real com onboarding OAB.

#### Contexto arquitetural

- `clients` é uma entidade permanente separada de `leads` (pipeline comercial)
- `processos` são espelhos de processos externos — têm `external_id`, `external_source`, `cnj_number`, `last_synced_at`, `sync_status`
- `case_process_links` é a join table N:N entre `casos` e `processos` (um processo pode existir sem caso)
- `lawyer_oabs` armazena os números de OAB de cada advogado (base para descoberta via Escavador)
- Sem Prisma — Supabase client direto + tipos TypeScript

#### Entregas

**Supabase Setup**
- [x] Instalar `@supabase/supabase-js` e `@supabase/ssr`
- [ ] Criar projeto no Supabase Dashboard
- [ ] Copiar `SUPABASE_URL` e `SUPABASE_ANON_KEY` para `.env.local`
- [x] Criar `lib/supabase/client.ts` — browser client (Client Components + Realtime)
- [x] Criar `lib/supabase/server.ts` — server client (Server Components, Actions, API routes)

**Migrations SQL — Enums e Infraestrutura**
- [x] `001_enums.sql` — todos os enums do sistema em um lugar:
  `user_role`, `user_status`, `lead_origin`, `lead_urgency`,
  `caso_status`, `caso_area`, `timeline_event_type`,
  `processo_status`, `sync_source`, `sync_status`,
  `radar_tipo`, `radar_urgencia`, `radar_status`,
  `appointment_status`, `notification_type`, `integration_type`, `integration_status`

**Migrations SQL — Tabelas Core**
- [x] `002_tenants.sql` — `tenants` (escritórios): nome, config JSONB, agent_config JSONB, timestamps
- [x] `003_users.sql` — `users`: vínculo com `auth.users`, tenant_id, role, status, last_sign_in_at
- [x] `004_lawyer_oabs.sql` — `lawyer_oabs`: user_id, oab_number, oab_state, is_primary, discovery_done
- [x] `005_clients.sql` — `clients`: nome, cpf, cnpj, email, phone, tenant_id (entidade permanente)
- [x] `006_lead_stages.sql` — `lead_stages`: nome, cor, ordem, is_default, tenant_id
- [x] `007_leads.sql` — `leads`: client_id (opcional), stage_id, responsible_id, origin, urgency, ai_triage JSONB
- [x] `008_lead_messages.sql` — `lead_messages`: lead_id, content, sender_type, is_handoff, metadata JSONB
- [x] `009_casos.sql` — `casos`: client_id, responsible_id, area, status, numero_interno, dossie_ia JSONB
- [x] `010_caso_timeline.sql` — `caso_timeline`: caso_id, tipo, titulo, descricao, autor_id, metadata JSONB
- [x] `011_processos.sql` — `processos`: cnj_number, tribunal, vara, external_id, external_source, sync_status, last_synced_at, payload_raw JSONB
- [x] `012_case_process_links.sql` — `case_process_links`: caso_id, processo_id, vinculado_em, vinculado_por
- [x] `013_process_parties.sql` — `process_parties`: processo_id, nome, tipo (autor/réu/advogado), cpf_cnpj, oab
- [x] `014_process_updates.sql` — `process_updates`: processo_id, tipo, descricao, data_movimentacao, external_id, ai_summary JSONB
- [x] `015_radar_items.sql` — `radar_items`: tenant_id, caso_id, processo_id, tipo, urgencia, status, origem, ai_summary JSONB, exige_acao
- [x] `016_appointments.sql` — `appointments`: tenant_id, caso_id (opcional), lead_id (opcional), responsible_id, titulo, status, starts_at, ends_at
- [x] `017_integrations.sql` — `integrations`: tenant_id, type, status, config JSONB, last_sync_at
- [x] `018_notifications.sql` — `notifications`: user_id, tenant_id, tipo, titulo, body, read, entity_type, entity_id
- [x] `019_agent_logs.sql` — `agent_logs`: tenant_id, lead_id, action_type, input JSONB, output JSONB, model, tokens_used

**Migrations SQL — RLS**
- [x] `020_rls.sql` — políticas RLS para todas as tabelas:
  - Política base: `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`
  - `users`: isolamento por tenant + usuário só vê a si mesmo para dados sensíveis
  - `processos`: sem tenant_id direto — acesso via `case_process_links` + `casos.tenant_id`
  - `process_parties` e `process_updates`: acesso via `processos`
  - `notifications`: isolamento por `user_id`

**Migrations SQL — Auth Hooks e Índices**
- [x] `021_auth_hooks.sql` — trigger `on_auth_user_created` que popula `users` após signup Supabase
- [x] `022_indexes.sql` — índices em foreign keys e campos de busca frequente

**Seeds**
- [ ] `supabase/seed.sql` — 1 tenant, 2 usuários (admin + lawyer), 6 estágios padrão, 3 clientes, 5 leads, 2 casos, 2 processos vinculados, 5 radar items

**Verificação**
- [x] `supabase db push` aplica todas as migrations sem erro
- [x] RLS bloqueia select sem token autenticado
- [x] RLS bloqueia acesso entre tenants diferentes
- [ ] Seeds inseridos com sucesso
- [x] Build Next.js passa limpo

**Commit final:**
```
feat(backend/database): schema completo — tenants, clients, leads, casos, processos, radar, RLS, auth hooks
```

---

### M10 · Auth Backend ✅ — Incorporado ao M9

> Auth backend entregue junto com o M9 no PR #14 (`backend/foundation`).
> Ver seção M9 acima para detalhes completos das entregas.

---

### M10 · Leads & Kanban Backend ✅ merged → `master`

**Branch:** `backend/leads` ✅ merged → `master`
**Objetivo:** Leads e Kanban 100% reais — dados do banco, drag-and-drop persiste no Supabase, CRUD completo, triagem IA com OpenAI GPT-4o.

#### Entregas

**Server Actions**
- [x] Criar `actions/leads.ts`:
  - [x] `getLeads(filters)` — busca leads do tenant com filtros (stage, search)
  - [x] `getLead(id)` — lead individual com joins
  - [x] `getLeadActivities(id)` — histórico de mensagens como atividades
  - [x] `createLead(data)` — cria novo lead com `tenant_id` da sessão
  - [x] `updateLead(id, data)` — edita lead (patch parcial)
  - [x] `deleteLead(id)` — soft delete (`deleted_at`)
  - [x] `moveLeadStage(id, stageId)` — atualiza `stage_id`
- [x] Criar `actions/stages.ts`:
  - [x] `getStages()` — lista estágios do tenant ordenados por position
  - [x] `createDefaultStages(tenantId)` — seed dos 6 estágios padrão

**Leads conectados**
- [x] `app/(dashboard)/leads/page.tsx` — Server Component com fetch real
- [x] `app/(dashboard)/leads/[id]/page.tsx` — lead individual real, `notFound()` quando não existe
- [x] `LeadsClient.tsx` — optimistic updates + Server Actions
- [x] `LeadFormDialog.tsx` — stages dinâmicos do banco
- [x] `LeadDetailClient.tsx` — dados reais do lead com edição inline
- [x] `LeadTriagePanel.tsx` — botão "Gerar triagem" chama OpenAI GPT-4o real

**Kanban conectado**
- [x] `app/(dashboard)/kanban/page.tsx` — Server Component com fetch real
- [x] `KanbanBoard.tsx` — recebe `initialLeads` e `stages` do servidor
- [x] Drag-and-drop chama `moveLeadStage()` via Server Action
- [x] Optimistic update: card move imediatamente, reverte se falhar
- [x] Colunas construídas dinamicamente a partir de `lead_stages` do banco
- [x] `KanbanFormDialog.tsx` e `KanbanDetailDialog.tsx` — stages e origins reais
- [x] `lib/mock/kanban.ts` — stubado, sem dados em runtime

**Triagem IA**
- [x] Criar `actions/ai/lead-triage.ts`:
  - [x] `triageLead(leadId)` — chama OpenAI GPT-4o com contexto do lead
  - [x] Retorna: área jurídica, resumo da demanda, urgência, sugestão de encaminhamento
  - [x] Salva resultado em `leads.ai_triage` (JSONB)

**Segurança**
- [x] Criar `proxy.ts` (Next.js 16) — proteção de rotas + refresh de sessão Supabase
- [x] Corrigir JWT claims: `role` → `app_role` em todas as RLS policies (migration `023_fix_app_role_claims.sql`)
- [x] `lib/permissions.ts` — helpers `getAppClaims()`, `hasRole()`, `canWrite()`, `canManage()`, `isAdmin()`

**Tipos**
- [x] `types/lead.ts` — reescrito: `Lead`, `LeadStage`, `LeadFormData`, `LeadTriage`
- [x] `types/kanban.ts` — `KanbanLead.stageId` (UUID), `KanbanColumnConfig.id` (string), origem usa `LeadOrigin`

**Verificação**
- [x] Lead criado no modal aparece na tabela/kanban sem refresh manual
- [x] Drag-and-drop persiste após recarregar a página
- [x] Triagem retorna resultado real do OpenAI GPT-4o e salva no banco
- [x] Usuário sem sessão em `/leads` ou `/kanban` → redirecionado para `/login`
- [x] Build `next build` passa limpo

**Commit final:**
```
feat(backend/leads): M10 — Leads & Kanban 100% real, proxy.ts, JWT fix, AI triage
```

---

### M11 · Casos Backend ✅ merged → `master`

**Branch:** `backend/casos` ✅ merged → `master`
**Objetivo:** Casos e dossiê 100% reais — dados do banco, linha do tempo persistida, Dossiê Inteligente alimentado pelo OpenAI GPT-4o.

#### Entregas

**Migrations**
- [x] `024_caso_pendencias.sql` — tabela de pendências com RLS, índices e trigger `updated_at`
- [x] `025_caso_documentos.sql` — tabela de documentos com RLS e índices
- [x] `026_fix_soft_delete_rls.sql` — corrige WITH CHECK implícito nas políticas UPDATE de leads e casos
- [x] `027_debug_jwt_claims.sql` — função diagnóstico temporária (remover na limpeza)

**Server Actions**
- [x] `actions/casos.ts`:
  - [x] `getCasos(filters)` — lista casos do tenant com joins (client, responsável, lead)
  - [x] `getCaso(id)` — dados completos: timeline, processos, pendências, documentos, proximoPrazo
  - [x] `createCaso(data)` — upsert client por nome + INSERT caso + evento de criação na timeline
  - [x] `updateCaso(id, data)` — patch parcial + evento de atualização de status na timeline
  - [x] `deleteCaso(id)` — soft delete via service_role com filtro manual de tenant_id
  - [x] `addTimelineEvent(casoId, event)` — append-only na caso_timeline
  - [x] `createPendencia(casoId, data)` — insere em caso_pendencias
  - [x] `updatePendencia(id, casoId, resolvida)` — marca pendência como resolvida
  - [x] `getUsers()` — lista usuários ativos do tenant para select de responsável
  - [x] `getLeadsSummary()` — lista leads para vínculo no form de caso
- [x] `actions/ai/dossie.ts`:
  - [x] `generateDossie(casoId)` — chama OpenAI GPT-4o com contexto completo do caso
  - [x] Contexto: timeline, processos, pendências, próxima ação, área jurídica
  - [x] Salva em `casos.dossie_ia` (JSONB) com `dossie_gerado_em`
- [x] `actions/leads.ts#deleteLead()` — corrigido: service_role + filtro manual de tenant_id

**Páginas conectadas**
- [x] `app/(dashboard)/casos/page.tsx` — Server Component com fetch real
- [x] `app/(dashboard)/casos/[id]/page.tsx` — Server Component com `notFound()` se não encontrado

**Componentes atualizados**
- [x] `CasosClient.tsx` — recebe `initialCasos`, `users` e `leads` do servidor; optimistic CRUD
- [x] `CasoFormDialog.tsx` — users como select dinâmico; campo lead de origem opcional
- [x] `DossieClient.tsx` — timeline real, pendências reais, processos reais, documentos reais
- [x] `DossieInteligente.tsx` — botão "Gerar Dossiê" com `useTransition`, chama `generateDossie()`
- [x] `lib/mock/casos.ts` — stub (sem dados em runtime)

**Tipos**
- [x] `types/caso.ts` — reescrito: `Caso`, `CasoSummary`, `TimelineEvent`, `Pendencia`, `Documento`, `ProcessoVinculado`, `DossieInteligente`

**Correções de bugs**
- [x] Soft delete de leads e casos — corrigido via service_role (RLS bloqueava UPDATE com deleted_at)
- [x] Dark mode em selects nativos — `text-foreground` adicionado em todos os `<select>` do projeto

**Verificação**
- [x] Caso criado aparece na lista sem refresh manual
- [x] Editar caso — dados pré-preenchidos com valores reais do banco
- [x] Deletar caso — soft delete, some da lista após reload
- [x] `/casos/[id]` com ID inválido → 404
- [x] Timeline real, pendências reais, processos reais
- [x] Botão "Resolver" em pendência persiste após reload
- [x] Botão "Gerar Dossiê" → resultado real do OpenAI GPT-4o exibido e salvo
- [x] Build `next build` passa limpo (TypeScript strict)

**Commit final:**
```
feat(backend/casos): M11 — CRUD, timeline, pendências, Dossiê IA, soft delete fix, dark mode selects
```

---

### M12 · Radar Backend ✅ merged → `master` (PR #20)

**Branch:** `backend/radar` ✅ merged → `master`
**Objetivo:** Radar 100% real — dados do banco, Resumo Inteligente via GPT-4o, webhook de ingestão para n8n, Realtime, exclusão de itens.

#### Entregas

**Server Actions — `actions/radar.ts`**
- [x] `getRadarItems(filters)` — lista com filtros: tipo, urgência, exige ação, período, caso, busca textual
- [x] `markResolved(itemId)` — status → `resolvido`, `resolvido_em` = now() via service_role
- [x] `markInAnalysis(itemId)` — status → `em_analise` via service_role
- [x] `deleteRadarItem(itemId)` — DELETE com filtro de tenant via service_role
- [x] `createPrazo(data)` — insere em `appointments` com rastreabilidade `[radar:uuid]` no campo `descricao`
- [x] `getTenantUsers()` — lista usuários ativos para select de responsável

**Resumo Inteligente (IA) — `actions/ai/radar-summary.ts`**
- [x] `summarizeRadarItem(itemId)` — Server Action para Client Components (valida sessão)
- [x] `summarizeRadarItemInternal(itemId)` — versão plain async para Route Handlers (sem perder request context)
- [x] Chama OpenAI GPT-4o com contexto: item + caso + processo vinculado
- [x] Retorna: `resumo`, `explicacaoPratica`, `proximoPasso`, `riscoSeNaoAgir`, `impactoNoCaso`
- [x] Salva em `radar_items.ai_summary` (JSONB) via service_role (UPDATE exige app_role)
- [x] Strip de markdown fences antes de `JSON.parse` (GPT-4o envolve JSON em ` ```json ``` `)

**Webhook de ingestão — `app/api/webhooks/radar/route.ts`**
- [x] POST `/api/webhooks/radar` com validação de `X-Webhook-Secret` (env: `N8N_WEBHOOK_SECRET`)
- [x] Derivação segura de `tenant_id`: via `caso_id` → query `casos`; via `processo_id` → query `processos`; fallback `tenant_id` com validação no banco
- [x] Cria `radar_item` (status: `novo`) e notificação para responsável do caso
- [x] Dispara `summarizeRadarItemInternal` de forma assíncrona (fire-and-forget com catch)

**Realtime — `lib/hooks/useRealtimeRadar.ts`**
- [x] Subscribe em INSERT em `radar_items` filtrado por `tenant_id`
- [x] Deduplicação via `existingIds: Set<string>` (inicializado com IDs do SSR)
- [x] Channel name único por mount (`radar:${tenantId}:${Date.now()}`) — evita conflito em remount

**Componentes atualizados**
- [x] `app/(dashboard)/radar/page.tsx` — Server Component com SSR: busca `initialItems` + `tenantId`
- [x] `RadarClient.tsx` — recebe props SSR, `handleDelete`, optimistic updates com rollback correto para `handleResolve` e `handleMarkInAnalysis`
- [x] `RadarItemDetail.tsx` — botão "Excluir" (chama `deleteRadarItem` diretamente), botão "Gerar Resumo Inteligente" on-demand, "Adicionar à timeline"
- [x] `RadarCard.tsx` — trash icon no hover, chama `deleteRadarItem` + `onDelete`
- [x] `RadarList.tsx` — prop `onDeleteItem` passada para `RadarCard`
- [x] `RadarCriarPrazoDialog.tsx` — chama `createPrazo` Server Action, busca usuários via `getTenantUsers`

**Correções de bugs (infraestrutura)**
- [x] `proxy.ts` — `export default async function proxy` (era named export → causava 404 em todas as rotas)
- [x] `app/layout.tsx` — `<Script strategy="beforeInteractive">` (React 19 não aceita `<script>` em `<head>`)
- [x] `actions/stages.ts` — `createDefaultStages` usa `createServiceClient()` com try/catch (RLS + FK)
- [x] `types/radar.ts` — `RadarOrigem` inclui `'cnj'`, `RADAR_ORIGEM_LABELS` atualizado

**Verificação**
- [x] Lista carrega do banco via SSR sem dados mock
- [x] POST no webhook → item aparece em tempo real (Realtime)
- [x] Resumo Inteligente gerado on-demand via GPT-4o
- [x] Excluir via card (hover) e via sheet — não reaparece após reload
- [x] Marcar como resolvido → badge muda, persiste após reload
- [x] Criar prazo → salvo em `appointments`
- [x] `npx tsc --noEmit` passa limpo

**Commit final:**
```
feat(backend/radar): M12 — Radar backend completo com actions reais, Resumo IA, webhook e Realtime
```

---

### M13 · Dashboard Backend ✅ merged → `master`

**Branch:** `backend/dashboard` ✅ merged → `master`
**Objetivo:** Dashboard 100% real — métricas do banco, funil de leads real, feed de atividade combinado, bloco executivo "Precisa de atenção agora".

#### Entregas

**Tipos — `types/dashboard.ts`** (criado)
- [x] `ActivityType` — 7 tipos incluindo `radar_alert` e `timeline_event`
- [x] `Activity` — interface compartilhada entre queries e `ActivityFeed`
- [x] `FunnelStage`, `DashboardMetrics` — tipagem das métricas
- [x] `AttentionNowData`, `AttentionRadarItem`, `AttentionPendencia` — bloco executivo

**Queries — `lib/queries/dashboard.ts`** (criado)
- [x] `getNewLeadsToday(tenantId)` — leads 24h + delta vs 24h anteriores
- [x] `getLeadsByStage(tenantId)` — contagem por estágio real com nome e cor do banco
- [x] `getConversionRate(tenantId)` — leads no estágio "Cliente" / total (1 casa decimal)
- [x] `getActiveCasos(tenantId)` — casos não encerrados e não deletados
- [x] `getOpenPendencias(tenantId)` — pendências abertas em todos os casos
- [x] `getUrgentRadarItems(tenantId)` — radar_items urgência Alta não resolvidos
- [x] `getRecentActivity(tenantId, limit)` — feed combinado: `caso_timeline` + `radar_items`, ordenado por data
- [x] `getAttentionNow(tenantId)` — até 3 radar urgentes + até 3 pendências abertas críticas
- [x] `getDashboardMetrics(tenantId)` — agrega todas as métricas em `Promise.all`

**Componente — `components/dashboard/AttentionNow.tsx`** (criado)
- [x] Bloco executivo com radar urgente e pendências abertas
- [x] Links diretos para `/radar` e `/casos/[id]`
- [x] Estado vazio amigável quando não há itens críticos

**Dashboard conectado — `app/(dashboard)/dashboard/page.tsx`**
- [x] Server Component async com `Promise.all` para todas as queries
- [x] `tenantId` extraído de `user.user_metadata?.tenant_id` (padrão do projeto)
- [x] 6 MetricCards: Novos Leads (24h), Total Leads, Taxa de Conversão, Casos Ativos, Pendências em Aberto, Alertas Urgentes
- [x] FunnelChart com dados reais dos estágios do tenant
- [x] ActivityFeed com feed combinado (timeline + radar)
- [x] Bloco AttentionNow com itens críticos do momento

**`components/dashboard/DashboardClient.tsx`** (criado)
- [x] State owner dos 3 sheets (novos leads, conversão, pendências)
- [x] `ORIGIN_LABELS` alinhado com `LeadOrigin` real do banco

**`components/shared/MetricCard.tsx`**
- [x] Props `href` (Link) e `onClick` (sheet) — card interativo com `ChevronRight` no hover
- [x] Acessibilidade: `role="button"`, `tabIndex={0}`, `onKeyDown` no path onClick

**`components/shared/ActivityFeed.tsx`**
- [x] Import de tipos migrado de `lib/mock/dashboard` → `types/dashboard`
- [x] `iconMap` e `colorMap` estendidos com `radar_alert` e `timeline_event`
- [x] Empty state quando não há atividades

**Bugs corrigidos no code review**
- [x] `Activity.timestamp` era `Date` — crash de hidratação SSR→client; corrigido para ISO string
- [x] Sort de urgência era alfabético (`Media > Alta`) — corrigido para semântico (Alta=0, Media=1, Baixa=2)
- [x] `getConversionRate` usava `ilike` podendo bater em "Ex-Cliente" — corrigido para `eq + is_terminal`
- [x] `ORIGIN_LABELS` tinha chaves inexistentes (`site`, `indicacao`) — alinhado com `LeadOrigin`
- [x] `MetricCard` onClick sem acessibilidade por teclado — corrigido
- [x] Variável `leads24h` nomeada errada (era total) — renomeada para `totalLeads`
- [x] `converted_at` nullable sem `nullsFirst: false` — corrigido
- [x] `tenantId` ausente renderizava spinner infinito — agora faz `redirect('/onboarding')`
- [x] `suppressHydrationWarning` no `<body>` para extensões de browser (ColorZilla)

**Queries adicionais para os sheets**
- [x] `getNewLeadsDetail(tenantId)` — lista leads das últimas 24h com estágio
- [x] `getConversionDetail(tenantId)` — lista leads convertidos
- [x] `getPendenciasDetail(tenantId)` — lista pendências abertas com caso vinculado

**Verificação**
- [x] `npx tsc --noEmit` passa limpo
- [x] PR #21 mergeado → `master`, branch `backend/dashboard` deletada

**Commit final:**
```
feat(backend/dashboard): M13 — dashboard real com metricas, funil, feed e blocos interativos
```

---

### M14 · Calendar Backend ✅ merged → master

**Branch:** backend/calendar ✅ merged → master
**Objetivo:** Conectar o calendario ao backend real e entregar a fase 1 da integracao com Google Calendar sem expandir escopo.

#### Entregas

**Server Actions**
- [x] Criar actions/appointments.ts com:
  - [x] getAppointments(filters)
  - [x] createAppointment(data)
  - [x] updateAppointment(id, data)
  - [x] cancelAppointment(id)
  - [x] syncAppointmentsWithGoogle() (forca sincronizacao manual Lexia -> Google)
- [x] Multi-tenant e seguranca:
  - [x] tenant_id derivado da sessao
  - [x] validacao de vinculos caso, lead, responsavel
  - [x] sem confiar em tenant_id do client

**Calendar conectado (SSR + UI real)**
- [x] app/(dashboard)/calendar/page.tsx com SSR real
- [x] components/calendar/CalendarClient.tsx conectado a dados reais
- [x] EventCreateModalReal e EventDetailModalReal persistindo no banco
- [x] Criar/editar/cancelar compromisso funcionando via Server Actions

**Compatibilidade operacional**
- [x] Vinculo opcional com caso e lead
- [x] Compatibilidade com prazos criados pelo Radar em appointments
- [x] Suporte a compromissos comuns e prazos no mesmo fluxo
- [x] Appointments vinculados passaram a aparecer na tela de detalhe de Lead
- [x] Appointments vinculados passaram a aparecer na tela de detalhe de Caso
- [x] Empty state limpo quando lead/caso nao possuem compromissos vinculados

**Integracao Google Calendar (fase 1)**
- [x] OAuth inicial:
  - [x] app/api/integrations/google/start/route.ts
  - [x] app/api/integrations/google/callback/route.ts
- [x] Persistencia segura:
  - [x] migration supabase/migrations/028_google_calendar_phase1.sql
  - [x] metadados em integrations
  - [x] tokens criptografados em integration_secrets
- [x] Sync Lexia -> Google:
  - [x] create cria evento no Google
  - [x] update atualiza evento no Google
  - [x] cancel reflete cancelamento no Google
- [x] Botao Sincronizar no Calendar executa sync manual (nao redireciona mais)

**Permissoes (corrigido nesta entrega)**
- [x] Guard de permissao alinhado ao role atual em public.users.role
- [x] admin e manager podem gerenciar/sincronizar Google Calendar
- [x] Outros roles bloqueados (UI + backend coerentes)

**Bugs da entrega encontrados e corrigidos**
- [x] Fonte de permissao corrigida (metadata stale -> public.users.role)
- [x] Encoding invalido que quebrava parse/build em actions/google-calendar.ts
- [x] Botao Sincronizar corrigido (redirecionamento -> sync real)
- [x] Guard no sync manual corrigido (admin/manager + integracao conectada)
- [x] Lint no EventCreateModalReal corrigido (estado em efeito)
- [x] Dropdowns, selects e superficies claras no dark mode revisados nas telas afetadas
- [x] Bug visivel de contraste no formulario de criar lead corrigido
- [x] Bug visivel de contraste no formulario de criar evento corrigido

**Validacao executada**
- [x] npx tsc --noEmit
- [x] npx eslint direcionado aos arquivos alterados na feature
- [x] next build em workspace isolado de validacao

**Entrega Git**
- [x] Branch: feat/calendar-google-phase1
- [x] Commit: bc947dd
- [x] PR: #22
- [x] Merge em master: 9911d34
- [x] Branch remota removida

**Fora de escopo (preexistente / ambiental)**
- [ ] Lint global do repositorio ainda possui erros preexistentes fora do escopo desta entrega
- [ ] Build no workspace principal pode falhar quando .next esta lockado por processo local

---

### M15 · Settings & Users Backend ✅

**Branch:** `backend/settings`
**Objetivo:** Settings e gestao de usuarios 100% funcionais, com dados reais do escritorio, convites operacionais, roles aplicados, bloqueios de permissao coerentes e workspace refletindo o tenant real.

#### Entregas

**Server Actions — Settings**
- [x] Criar `actions/settings.ts`
- [x] `getTenantSettings()` — carrega dados reais de `tenants`, `agent_config` e claims do usuario autenticado
- [x] `updateTenantSettings(data)` — persiste nome, display_name, contato, endereco, timezone, area principal e `logo_url`
- [x] `updateAgentSettings(data)` — salva configuracoes do agente em `tenants.agent_config`
- [x] `getSettingsIntegrations()` — le integracoes reais do tenant
- [x] `setIntegrationEnabled(type, enabled)` — persiste toggle em `integrations`
- [x] `uploadTenantLogo(formData)` — upload seguro da logo do escritorio
- [x] Hardening de storage — cria/garante bucket `tenant-assets` quando necessario
- [x] Hardening de office code — tenta gerar `office_code` quando ausente e devolve erro explicito quando a migration ainda nao existe no banco remoto

**Server Actions — Users**
- [x] Criar `actions/users.ts`
- [x] `getUsersAndInvites()` — lista usuarios reais + convites reais do tenant
- [x] `inviteUser({ name, email, role })` — gera link via Supabase Admin + registra convite + envia email por Resend
- [x] `updateUserRole(userId, role)` — atualiza role com guard server-side
- [x] `deactivateUser(userId)` — muda status para `inactive`
- [x] `deleteUser(userId)` — remove identidade do Auth e limpa convites remanescentes do mesmo email
- [x] `deleteInvite(inviteId)` — remove convite pendente e limpa usuario pendente correspondente para permitir reenviar convite

**Settings conectados**
- [x] `/settings/office` conectado ao banco real
- [x] `/settings/agent` conectado a `tenants.agent_config`
- [x] `/settings/integrations` conectado a `integrations`
- [x] `OfficeForm` salva dados reais e exibe feedback claro
- [x] `AgentForm` salva configuracoes reais do agente
- [x] `IntegrationsClient` persiste toggles reais
- [x] Google Calendar em settings passou a respeitar permissao lida do papel real do usuario no banco, nao apenas de claims stale da sessao

**Gestao de usuarios conectada**
- [x] `/settings/users` carrega usuarios reais do banco
- [x] Lista separada de convites reais logo abaixo da tabela de usuarios
- [x] Convite por email via Resend usando remetente do dominio `uselexia.app`
- [x] Edicao de role salva imediatamente
- [x] Desativacao remove acesso em nova navegacao via `proxy.ts`
- [x] Exclusao de usuario implementada
- [x] Exclusao de convite implementada
- [x] Reenvio de convite para email previamente excluido corrigido com limpeza de identidade pendente no Supabase Auth

**Convites e aceite**
- [x] Convite usa `service.auth.admin.generateLink({ type: 'invite' })`
- [x] Registro em `user_invites` com status `pending`, expiracao em 7 dias e `invited_by`
- [x] Usuario convidado fica `pending` ate aceitar o convite
- [x] Fluxo de aceite passa por `/accept-invite` / `reset-password`
- [x] Ao concluir aceite/senha, usuario vira `active`
- [x] Convite aceito sai da lista de convites e passa a aparecer na lista de usuarios
- [x] Usuario convidado permanece relacionado ao tenant que o convidou

**Permissoes**
- [x] `lib/permissions.ts` expandido com `canManageSettings`, `canManageUsers`, `canManageTargetUser`
- [x] Criar `lib/hooks/usePermissions.ts`
- [x] Todas as Server Actions de settings/users validam sessao + tenant + papel real do usuario
- [x] Regra travada: `admin` e `manager` gerenciam configuracoes e usuarios
- [x] Regra travada: `manager` nao pode convidar, promover, desativar ou excluir usuario `admin`
- [x] Roles `lawyer`, `secretary` e `viewer` bloqueados nas telas `/settings/office`, `/settings/agent` e `/settings/integrations`
- [x] Em vez de redirect seco, paginas sem permissao mostram mensagem explicita de acesso negado

**Header, perfil e logout**
- [x] Menu do avatar do header passou a mostrar nome e perfil reais do usuario
- [x] Avatar usa imagem real (`users.avatar_url`) ou iniciais do usuario
- [x] Corrigido erro de runtime do dropdown (`MenuGroupRootContext is missing`)
- [x] Navegacao do menu do perfil corrigida para `/profile` e `/settings/office`
- [x] Logout corrigido no client com retorno para `/login`

**Workspace real = escritorio**
- [x] Workspace fake removido da UI
- [x] Sidebar passa a refletir o tenant/escritorio real do usuario autenticado
- [x] Nome do workspace vem de `tenants.display_name`
- [x] Logo do workspace vem de `tenants.logo_url`
- [x] Botao `Gerenciar escritorio` no seletor lateral corrigido
- [x] Codigo do escritorio exibido e copiavel no seletor lateral e em `/settings/office`

**Signup / onboarding evoluido**
- [x] Signup com 2 modos:
  - [x] `create_office`
  - [x] `join_office`
- [x] Criar escritorio:
  - [x] cria tenant
  - [x] tenta gerar `office_code`
  - [x] cria usuario inicial com role `admin`
  - [x] redireciona para `/onboarding`
- [x] Entrar com codigo:
  - [x] busca `tenants.office_code`
  - [x] cria usuario no tenant localizado
  - [x] role inicial minima segura: `viewer`
  - [x] redireciona para `/dashboard`
- [x] `emailRedirectTo` configurado no `signUp()` para links de confirmacao/auth
- [x] Erros de signup mapeados com mensagens mais claras

**Workspace/Profile/Assets — extensao incremental entregue junto ao M15**
- [x] Migration `supabase/migrations/029_workspace_profile_assets.sql`
- [x] `tenants.office_code`
- [x] indice unico para `office_code`
- [x] buckets `tenant-assets` e `user-avatars`
- [x] `/settings/office` exibe o codigo do escritorio
- [x] Upload da logo do escritorio salvo em Storage + URL em `tenants.logo_url`
- [x] Criar `actions/profile.ts`
- [x] Criar `/profile`
- [x] `ProfileForm` com:
  - [x] nome editavel
  - [x] email visivel
  - [x] role visivel
  - [x] escritorio atual visivel
  - [x] upload de avatar
- [x] Avatar salvo em Storage + URL em `users.avatar_url`
- [x] Header e sidebar atualizam com dados reais apos mudancas de perfil/escritorio

**Dark mode / UX hardening feita durante o M15**
- [x] Correcoes de contraste em dropdowns/selects/popovers das telas afetadas
- [x] Formulario de criar evento no calendario corrigido no dark mode
- [x] Formulario de criar lead corrigido no dark mode

**Verificacao executada**
- [x] Salvar dados do escritorio persiste apos reload
- [x] Salvar configuracoes do agente persiste apos reload
- [x] Toggle de integracoes persiste em `integrations`
- [x] Convite cria `user_invites`
- [x] Email de convite via Resend foi integrado ao fluxo
- [x] `admin` e `manager` acessam gestao; demais roles sao bloqueados
- [x] `manager` nao consegue gerenciar `admin`
- [x] Usuario `inactive` perde acesso em nova navegacao via `proxy.ts`
- [x] `npx tsc --noEmit`
- [x] `npx eslint` direcionado aos arquivos alterados

**Limitacoes / observacoes registradas**
- [x] O schema de `office_code` e os buckets de Storage dependem da migration `029_workspace_profile_assets.sql`
- [ ] Se a migration `029_workspace_profile_assets.sql` nao estiver aplicada no banco remoto, o escritorio nao recebe codigo real e a UI passa a mostrar erro explicito orientando aplicar a migration
- [ ] Emails de confirmacao de signup dependem da configuracao de Auth/SMTP do Supabase, nao do Resend usado para convites
- [ ] `next build` no workspace principal ainda pode sofrer com lock local de `.next` ou indisponibilidade de Google Fonts, sem relacao direta com a feature

**Commit final:**
```
feat(backend): settings and users — tenant config, user management, role-based permissions
```

---

## FASE 4 — INTEGRAÇÃO

---

### M16 · Integração n8n

**Branch:** `backend/n8n`
**Objetivo:** Travar a base de integração jurídica antes dos workflows amplos do n8n — discovery de processos por OAB, sync incremental de updates processuais, ingestão segura via endpoints inbound da Lexia e camada operacional manual para transformar processo importado em caso quando fizer sentido.

> **Status atual do M16:** fase 1 concluída.
> A Lexia já validou tecnicamente a ingestão jurídica via OAB/update, com idempotência e isolamento por tenant, antes de expandir para automações maiores de agente, leads e notificações.

#### Entregas

**Hardening de schema e RLS**
- [x] Criar `supabase/migrations/030_n8n_process_sync_hardening.sql`
  - [x] Hardening de `processos` para sync jurídico por tenant
  - [x] Chaves de deduplicação por `tenant_id + external_source + external_id`
  - [x] Chaves de deduplicação por `tenant_id + cnj_number`
  - [x] Campo `source_update_id` em `radar_items` para impedir radar duplicado por update
  - [x] Campos auxiliares de sync, incluindo `sync_error`
- [x] Criar `supabase/migrations/031_n8n_rls_hardening.sql`
  - [x] Garantir visibilidade de `processos`, `process_parties` e `process_updates` por tenant mesmo sem `case_process_links`
  - [x] Preservar isolamento estrito entre tenants

**Camada outbound da Lexia → n8n**
- [x] Criar `lib/integrations/n8n.ts`
- [x] `sendOabDiscoveryRequest(...)`
- [x] `sendProcessSyncRequest(...)`
- [x] `sendBatchProcessSyncRequest(...)`
- [x] Validação de secret com comparação segura (`timingSafeEqual`)
- [x] Helpers de normalização e deduplicação determinística para updates

**Server Actions da fase 1**
- [x] Criar `actions/processos.ts`
- [x] `requestOabDiscovery(lawyerOabId)`
- [x] `requestProcessSync(processoId)`
- [x] `requestBatchProcessSync()`
- [x] Todas validam sessão, tenant derivado server-side e acesso apenas a registros do tenant autenticado

**Endpoints inbound do n8n → Lexia**
- [x] Criar `POST /api/webhooks/n8n/process-discovery`
- [x] Criar `POST /api/webhooks/n8n/process-update`
- [x] Criar `POST /api/webhooks/n8n/agent-log` (stub preparado)
- [x] Todos validam `X-Webhook-Secret` com `N8N_WEBHOOK_SECRET`
- [x] Todos retornam `200` com payload de resultado, inclusive em erro funcional controlado
- [x] Ingestão feita pela Lexia com service role e validações internas de tenant

**Ingestão jurídica validada**
- [x] Discovery por OAB antes da criação de caso está suportada
- [x] `process-discovery` faz upsert seguro e idempotente de:
  - [x] `processos`
  - [x] `process_parties`
- [x] `process-update` faz ingestão segura e idempotente de:
  - [x] `process_updates`
  - [x] `radar_items`
- [x] `process_parties` não apaga mais dados quando o payload recebido é parcial
- [x] `processos` descobertos sem `case_process_links` continuam visíveis ao tenant autenticado
- [x] Radar continua funcionando mesmo sem caso vinculado
- [x] Deduplicação determinística validada para:
  - [x] `processos`
  - [x] `process_updates`
  - [x] `radar_items`

**Validação manual da fase 1**
- [x] Payload fake/manual validado para `process-discovery`
- [x] Payload fake/manual validado para `process-update`
- [x] Reprocessar o mesmo payload não gera sujeira
- [x] Idempotência validada manualmente nos dois fluxos

**Camada operacional manual pós-fase 1**
- [x] Nova página `/processos` para processos importados e ainda não convertidos em caso
- [x] Criar `actions/processos-importados.ts`
  - [x] `getImportedProcesses()`
  - [x] `createCasoFromImportedProcess(processoId)`
- [x] Melhoria operacional: processo importado pode virar caso manualmente, sem auto-create em massa
- [x] Estado visual claro para:
  - [x] processo pendente
  - [x] processo já vinculado
  - [x] ação disponível / indisponível

**Hardening da criação manual de caso**
- [x] Criar `supabase/migrations/032_manual_case_from_imported_process.sql`
  - [x] `casos.origin_processo_id`
  - [x] RPC transacional `create_case_from_imported_process(...)`
  - [x] `FOR UPDATE` no processo durante a criação
  - [x] índice único parcial em `casos(origin_processo_id)` quando não nulo e não deletado
- [x] Criar `supabase/migrations/033_imported_process_case_defaults_hardening.sql`
  - [x] `casos.client_id` deixa de ser obrigatório nesse fluxo
  - [x] enum `caso_area` passa a suportar `A definir`
- [x] Remover `client_id` fake/placeholder da criação manual
- [x] Casos criados por esse fluxo agora podem nascer com `client_id = null`
- [x] Remover área falsa `Cível`
- [x] Casos criados por esse fluxo agora usam `area = 'A definir'`
- [x] Caso criado deixa explícito em `observacoes` que cliente e área ainda dependem de classificação operacional
- [x] Anti-duplicação validada com:
  - [x] validação de negócio
  - [x] RPC transacional
  - [x] `FOR UPDATE`
  - [x] índice único parcial

**Radar / UX operacional relacionados ao eixo jurídico**
- [x] Cards do Radar passaram a exibir linha de contexto do processo monitorado
- [x] Prioridade da linha de contexto:
  - [x] CNJ
  - [x] cliente confiável
  - [x] título do caso
  - [x] `external_id` só como fallback sem CNJ
- [x] Mesmo contexto reforçado no detalhe lateral do Radar

**O que permanece para a etapa 2 do M16**
- [ ] Workflows amplos de agente, leads e handoff via n8n
- [ ] Webhooks outbound de `lead-created`, `lead-converted` e `caso-updated`
- [ ] `stage-move` inbound para mover lead automaticamente
- [ ] `caso-timeline` inbound genérico para automações futuras
- [ ] Notificações em tempo real disparadas por workflows n8n além do eixo jurídico
- [ ] Fluxo completo WhatsApp → Kanban → triagem IA → notificação

**Verificação**
- [x] `npx tsc --noEmit`
- [x] Lint direcionado aos arquivos alterados da feature
- [ ] `next build` no workspace principal permanece sujeito a lock local em `.next`; classificado como limitação ambiental, não como falha atribuída ao M16 sem evidência adicional

**Commit final:**
```
feat(integration): M16 fase 1 — n8n + Escavador com discovery por OAB, process-update e criacao manual de caso a partir de processo importado
```

---

## FASE 5 — DEPLOY

---

### M17 · Deploy & Observabilidade

**Branch:** `deploy/production`
**Objetivo:** Plataforma em produção, monitorada, com CI/CD configurado e variáveis de ambiente seguras.

#### Entregas

**Variáveis de ambiente (produção)**
- [ ] Configurar no Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `N8N_WEBHOOK_SECRET`, `RESEND_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, `INTEGRATIONS_ENCRYPTION_KEY`
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
- [ ] Rastrear: login, lead criado, lead movido, caso criado, item radar resolvido
- [ ] Identificar usuário por `userId` e `tenantId`

**Performance & SEO**
- [ ] Confirmar `next/font` carregando Inter corretamente (sem FOUT)
- [ ] Confirmar que rotas `(auth)` não carregam bundle do dashboard
- [ ] Rodar Lighthouse no dashboard: meta Performance > 85

**QA final**
- [ ] Testar fluxo completo em produção: cadastro → login → criar lead → mover estágio → converter em caso → ver dossiê IA → item no radar com resumo IA → criar agendamento
- [ ] Testar em mobile (Chrome DevTools)
- [ ] Confirmar RLS: dois tenants não veem dados um do outro

**Commit final:**
```
feat(deploy): production deploy — Vercel config, CI/CD, Sentry, PostHog, domain, QA sign-off
```
