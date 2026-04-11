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
| M10 | Leads & Kanban Backend | `backend/leads` | Backend |
| M11 | Casos Backend | `backend/casos` | Backend |
| M12 | Radar Backend | `backend/radar` | Backend |
| M13 | Dashboard Backend | `backend/dashboard` | Backend |
| M14 | Calendar Backend | `backend/calendar` | Backend |
| M15 | Settings & Users Backend | `backend/settings` | Backend |
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
- [x] Dados mockados — integração real com Claude na Fase 3

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
  - [x] Dados mockados — integração real com Claude na Fase 3

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
- [ ] `supabase db push` aplica todas as migrations sem erro
- [ ] RLS bloqueia select sem token autenticado
- [ ] RLS bloqueia acesso entre tenants diferentes
- [ ] Seeds inseridos com sucesso
- [ ] Build Next.js passa limpo

**Commit final:**
```
feat(backend/database): schema completo — tenants, clients, leads, casos, processos, radar, RLS, auth hooks
```

---

### M10 · Auth Backend ✅ — Incorporado ao M9

> Auth backend entregue junto com o M9 no PR #14 (`backend/foundation`).
> Ver seção M9 acima para detalhes completos das entregas.

---

### M11 · Leads & Kanban Backend

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

**Triagem Inteligente de Leads (IA — backend real)**
- [ ] Criar `app/actions/ai/lead-triage.ts`:
  - [ ] `triageLead(leadId)` — chama Claude API com contexto do lead/conversa
  - [ ] Retorna: área jurídica, resumo da demanda, urgência, sugestão de encaminhamento
  - [ ] Salva resultado em `leads.ai_triage` (JSONB)
- [ ] Conectar `LeadTriagePanel` ao backend real
- [ ] Acionar triagem automaticamente quando lead é criado via webhook

**Verificação**
- [ ] Lead criado no modal aparece no board sem refresh manual
- [ ] Drag-and-drop persiste após recarregar a página
- [ ] Filtros reduzem corretamente os resultados do banco
- [ ] Triagem retorna resultado real do Claude
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): leads — CRUD, stage management, drag-and-drop persistence, AI triage
```

---

### M12 · Casos Backend

**Branch:** `backend/casos`
**Objetivo:** Casos e dossiê 100% reais — dados do banco, linha do tempo persistida, Dossiê Inteligente alimentado pelo Claude.

#### Entregas

**Server Actions**
- [ ] Criar `app/actions/casos.ts`:
  - [ ] `getCasos(filters)` — lista casos do tenant
  - [ ] `getCaso(id)` — dados completos do caso com timeline e processos
  - [ ] `createCaso(data)` — cria novo caso (pode ser disparado ao converter lead)
  - [ ] `updateCaso(id, data)` — edita caso
  - [ ] `addTimelineEvent(casoId, event)` — adiciona evento à linha do tempo
- [ ] Criar `app/actions/processos.ts`:
  - [ ] `getProcessosByCaso(casoId)` — lista processos vinculados
  - [ ] `addProcesso(casoId, data)` — vincula processo ao caso

**Dossiê Inteligente (IA — backend real)**
- [ ] Criar `app/actions/ai/dossie.ts`:
  - [ ] `generateDossie(casoId)` — chama Claude API com contexto consolidado do caso
  - [ ] Contexto: timeline, processos, prazos, responsável, área jurídica
  - [ ] Retorna: resumo vivo, pontos críticos, pendências, próximos marcos, última movimentação relevante
  - [ ] Salva resultado em `casos.dossie_ia` (JSONB) com timestamp
  - [ ] Cache inteligente: regenera apenas quando há novos eventos na timeline
- [ ] Conectar `DossieInteligente` ao backend real
- [ ] Botão "Atualizar Dossiê" para regenerar manualmente

**Conversão Lead → Caso**
- [ ] Criar `app/actions/leads.ts#convertToCase()` — cria caso a partir de lead convertido
- [ ] Trigger: ao mover lead para estágio "Cliente", oferecer criação do caso

**Verificação**
- [ ] Caso criado aparece na lista sem refresh
- [ ] Linha do tempo persiste após reload
- [ ] Dossiê Inteligente retorna resumo real do Claude
- [ ] Cache impede rechamada desnecessária da API
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): casos — CRUD, timeline, processo vínculo, Dossiê Inteligente com Claude
```

---

### M13 · Radar Backend

**Branch:** `backend/radar`
**Objetivo:** Radar 100% real — publicações e movimentações vindas de Escavador/Datajud via n8n, Resumo Inteligente gerado pelo Claude, prazos criados automaticamente.

#### Entregas

**Server Actions**
- [ ] Criar `app/actions/radar.ts`:
  - [ ] `getRadarItems(filters)` — lista itens com filtros (tipo, urgência, exige ação, caso)
  - [ ] `markResolved(itemId)` — marca item como resolvido
  - [ ] `createPrazo(itemId, data)` — cria prazo a partir de item do radar
  - [ ] `updateCasoFromRadar(itemId, casoId)` — atualiza caso com movimentação

**Resumo Inteligente (IA — backend real)**
- [ ] Criar `app/actions/ai/radar-summary.ts`:
  - [ ] `summarizeRadarItem(itemId)` — chama Claude API com conteúdo da publicação/movimentação
  - [ ] Retorna: resumo prático, explicação do acontecimento, urgência classificada, se exige ação, próximo passo sugerido
  - [ ] Salva resultado em `radar_items.ai_summary` (JSONB)
  - [ ] Gerado automaticamente na ingestão do item via webhook

**Webhook de ingestão (n8n → plataforma)**
- [ ] Criar `app/api/webhooks/radar/route.ts` — endpoint POST que n8n chama ao detectar movimentação
  - [ ] Valida `X-Webhook-Secret`
  - [ ] Cria `radar_item` no banco
  - [ ] Aciona `summarizeRadarItem()` de forma assíncrona
  - [ ] Cria notificação para o responsável pelo caso
- [ ] Criar `app/api/webhooks/publicacao/route.ts` — ingestão de publicações (DOU, DEJT, TJs)

**Realtime**
- [ ] Criar `lib/hooks/useRealtimeRadar.ts` — subscribe em `radar_items` do tenant
- [ ] Novo item aparece no topo da lista automaticamente com badge "Novo"

**Notificações**
- [ ] Itens de urgência Alta geram notificação push imediata no sino do header
- [ ] Itens que exigem ação têm badge destacado na navegação do Radar

**Verificação**
- [ ] POST no webhook cria item no radar e dispara resumo IA
- [ ] Item aparece no radar em tempo real (Realtime)
- [ ] Resumo Inteligente exibe resultado real do Claude
- [ ] Criar prazo a partir de item do radar persiste no banco
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): radar — webhook ingestão, Resumo Inteligente com Claude, Realtime, prazos
```

---

### M14 · Dashboard Backend

**Branch:** `backend/dashboard`
**Objetivo:** Métricas e feeds do dashboard com dados reais do banco.

#### Entregas

**Queries**
- [ ] Criar `lib/queries/dashboard.ts`:
  - [ ] `getNewLeadsToday(tenantId)` — leads criados nas últimas 24h
  - [ ] `getLeadsByStage(tenantId)` — contagem por estágio para o funil
  - [ ] `getConversionRate(tenantId)` — leads em "Cliente" / total de leads (exceto "Perdido")
  - [ ] `getActiveCasos(tenantId)` — casos ativos no momento
  - [ ] `getRadarUrgentItems(tenantId)` — itens do radar com urgência Alta não resolvidos
  - [ ] `getRecentActivity(tenantId, limit)` — últimos eventos de `agent_logs` + `caso_timeline`
  - [ ] `getPendingNotifications(userId)` — notificações não lidas

**Dashboard conectado**
- [ ] `app/(dashboard)/dashboard/page.tsx` vira Server Component que chama as queries em paralelo (`Promise.all`)
- [ ] MetricCards recebem dados reais (incluindo casos ativos e alertas do radar)
- [ ] FunnelChart recebe contagens reais por estágio
- [ ] ActivityFeed recebe eventos reais

**Verificação**
- [ ] Criar um lead → número no dashboard incrementa
- [ ] Mover lead para "Cliente" → taxa de conversão atualiza
- [ ] Item urgente no Radar → aparece no dashboard como alerta
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): dashboard — real metrics, funnel data, radar alerts, activity feed from database
```

---

### M15 · Calendar Backend

**Branch:** `backend/calendar`
**Objetivo:** Agendamentos persistindo no banco, vinculados a casos e leads, com estrutura pronta para sync Google Calendar.

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

**Select de caso/lead no modal**
- [ ] Campo "Caso" no `EventCreateModal` faz search em `casos` do tenant
- [ ] Campo "Lead" opcional para compromissos na etapa comercial

**Verificação**
- [ ] Criar evento → aparece no calendário no dia correto
- [ ] Cancelar evento → muda de cor para cinza
- [ ] Build passa limpo

**Commit final:**
```
feat(backend): calendar — appointments CRUD, caso/lead association, status management
```

---

### M16 · Settings & Users Backend

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

### M17 · Integração n8n

**Branch:** `backend/n8n`
**Objetivo:** n8n e a plataforma se comunicando de forma bidirecional — agente cria leads, move estágios, ingere movimentações no Radar, cria itens na timeline de Casos e dispara notificações.

#### Entregas

**Endpoints de webhook (Next.js → n8n)**
- [ ] Criar `app/api/webhooks/lead-created/route.ts` — n8n recebe quando lead é criado manualmente no painel
- [ ] Criar `app/api/webhooks/lead-converted/route.ts` — n8n recebe quando lead vira caso
- [ ] Criar `app/api/webhooks/caso-updated/route.ts` — n8n recebe quando caso é atualizado
- [ ] Todos os endpoints validam `X-Webhook-Secret`

**Endpoints de ingestão (n8n → plataforma)**
- [ ] Confirmar que `app/api/webhooks/radar/route.ts` (M13) funciona end-to-end com n8n real
- [ ] Criar `app/api/webhooks/agent-log/route.ts` — n8n registra ação do agente (triagem, qualificação)
- [ ] Criar `app/api/webhooks/stage-move/route.ts` — n8n move lead de estágio automaticamente
- [ ] Criar `app/api/webhooks/caso-timeline/route.ts` — n8n adiciona evento à timeline do caso

**Notificações em tempo real**
- [ ] Quando n8n cria notificação no banco, `useRealtimeNotifications` a exibe no header
- [ ] Badge de sino incrementa automaticamente
- [ ] Clicar na notificação navega para o caso ou radar correspondente

**Teste end-to-end**
- [ ] Simular mensagem de WhatsApp → n8n processa → lead aparece no Kanban → triagem IA gera ficha → notificação no sino
- [ ] Simular movimentação processual → n8n detecta → item aparece no Radar → resumo IA gerado → notificação para responsável
- [ ] Simular lead convertido → caso criado → dossiê IA gerado

**Verificação**
- [ ] Fluxo completo WhatsApp → Kanban → triagem IA funciona sem intervenção manual
- [ ] Fluxo completo movimentação → Radar → resumo IA funciona
- [ ] Todos os webhooks respondem 200 em produção
- [ ] Build passa limpo

**Commit final:**
```
feat(integration): n8n ↔ platform — webhooks, lead sync, radar ingest, realtime notifications
```

---

## FASE 5 — DEPLOY

---

### M18 · Deploy & Observabilidade

**Branch:** `deploy/production`
**Objetivo:** Plataforma em produção, monitorada, com CI/CD configurado e variáveis de ambiente seguras.

#### Entregas

**Variáveis de ambiente (produção)**
- [ ] Configurar no Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `WEBHOOK_SECRET`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`
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
