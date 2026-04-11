# Lexia AI — Project Briefing for Claude Code

> **Uma plataforma operacional jurídica com IA integrada.**
> Não é um CRM genérico. Não é um chatbot. É o sistema operacional de escritórios de advocacia.

Full PRD: [docs/PRD.md](docs/PRD.md)
Plano de execução: [docs/PLAN.md](docs/PLAN.md)

---

## O Que É a Lexia

A Lexia tem **duas camadas** que compartilham a **mesma fonte de verdade** (banco Supabase):

### Camada 1 — Plataforma SaaS Web
Interface operacional para o escritório. Construída em Next.js 14+.
- Dashboard executivo (métricas, funil, alertas)
- Leads + Kanban (pipeline comercial)
- Casos (dossiê jurídico completo)
- Radar (monitoramento de prazos e processos)
- Calendário (agenda integrada)
- Settings (escritório, agente, integrações, equipe)

### Camada 2 — Agente de IA
Agente autônomo para atendimento via WhatsApp/web, construído em n8n + Claude.
- Triagem e qualificação de leads
- Atendimento inicial padronizado por escritório
- Consulta ao banco da Lexia antes de qualquer API externa
- Handoff para advogado quando necessário
- No MVP: **1 agente por escritório** (isolamento por configuração/prompt, não por workflow separado)

**Princípio de integração:** Agente e plataforma leem e escrevem no mesmo banco. O agente não mantém estado próprio.

---

## Current Status

**Fase 2 (Interface com dados mock) — COMPLETA ✅**
**Fase 3 (Backend) — EM ANDAMENTO 🔄**

| Milestone | Status |
|---|---|
| M0 · Project Setup | ✅ |
| M1 · Design System & Layout Shell | ✅ |
| M2 · Auth Pages | ✅ |
| M3 · Dashboard UI | ✅ |
| M4 · Leads UI + Kanban | ✅ |
| M5 · Casos UI | ✅ |
| M6 · Radar UI | ✅ |
| M7 · Calendar UI | ✅ |
| M8 · Settings & Users UI | ✅ |
| M9 · Database & Supabase Setup | 🔄 em andamento |
| M10 · Auth Backend | ⬜ |
| M11+ · Features Backend | ⬜ |

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR, Server Components by default |
| Language | TypeScript (strict) | Everywhere, no exceptions |
| Styling | Tailwind CSS v4 | No inline styles |
| UI Components | shadcn/ui | Extend, don't reinvent |
| Icons | Lucide React | Consistent icon set |
| Fonts | Inter + Fira Code | Via `next/font/google` |
| Database | Supabase (PostgreSQL) | Auth + Realtime + Storage |
| DB Client | `@supabase/supabase-js` + `@supabase/ssr` | Direto, sem Prisma no MVP* |
| Automation/AI | n8n | Workflows, WhatsApp agent, integrations |
| LLM | Claude (Anthropic) | Primary; OpenAI as fallback/embeddings |
| Deploy | Vercel | Next.js frontend |
| Email | Resend | Transactional emails |
| Error tracking | Sentry | |
| Analytics | PostHog | |

> **Nota sobre Prisma:** Prisma foi removido do escopo do MVP. O RLS do Supabase com JWT claims customizados (`tenant_id`, `role`) cria atrito real com o Prisma ORM. Usamos `@supabase/supabase-js` direto com tipos TypeScript gerados do schema. Prisma pode ser adicionado em fase posterior se a complexidade de queries justificar.

---

## Regras Arquiteturais — Inegociáveis

### 1. O banco da Lexia é a fonte de verdade
- Escavador e CNJ são fontes **externas de descoberta e sincronização**
- Software e agente consultam o banco da Lexia **primeiro**
- Só aciona consulta externa quando o dado não existe ou precisa de refresh
- Dados externos são espelhados no banco com `external_id`, `external_source`, `last_synced_at`

### 2. Caso ≠ Processo
| Entidade | O que é | Origem | Quem cria |
|---|---|---|---|
| **Caso** | Entidade operacional interna do escritório | Lexia | Advogado/secretária |
| **Processo** | Espelho jurídico de fonte externa (Escavador/CNJ) | OAB discovery / CNJ sync | Sistema automaticamente |

- Um caso pode ter **zero ou mais processos** vinculados (`case_process_links`)
- Um processo pode existir **sem caso** (descoberto pela OAB mas não operacionalizado ainda)
- A conversão processo → caso é **sempre uma decisão humana**

### 3. OAB para descoberta, CNJ para operação
| Ferramenta | Quando usar | Frequência |
|---|---|---|
| **OAB (Escavador)** | Onboarding — descobrir todos os processos dos advogados do escritório | Uma vez no setup + sob demanda |
| **CNJ (Datajud)** | Operação diária — sync incremental de movimentações e publicações | Contínuo (webhook/polling) |

### 4. Multi-tenant obrigatório
- Toda entidade tem `tenant_id UUID NOT NULL`
- `tenant_id` nunca vem de input do usuário — sempre da sessão autenticada
- RLS ativo em todas as tabelas sensíveis
- Política base: `tenant_id = (auth.jwt() ->> 'tenant_id')::uuid`

### 5. O agente não depende de consulta externa a cada mensagem
- Consulta o banco da Lexia (processos, casos, pendências, histórico)
- Só força refresh do Escavador/CNJ quando explicitamente necessário
- Resultado de consultas externas é **sempre salvo no banco** antes de responder

### 6. Onboarding com OAB obrigatória
- Todo escritório que se cadastra deve informar pelo menos 1 número de OAB
- OAB dispara a busca inicial de processos via Escavador
- Estrutura: tabela `lawyer_oabs` com `oab_number`, `oab_state`, `lawyer_id`

---

## Folder Structure

```
lexia-ai/
├── app/
│   ├── (auth)/                     # Public: login, signup, forgot-password, reset-password
│   ├── (onboarding)/               # Onboarding flow (post-signup, pré-dashboard)
│   ├── (dashboard)/                # Protected: sidebar + header layout
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── leads/
│   │   │   └── [id]/
│   │   ├── kanban/
│   │   ├── casos/
│   │   │   └── [id]/
│   │   ├── radar/
│   │   ├── calendar/
│   │   ├── settings/
│   │   │   ├── layout.tsx
│   │   │   ├── office/
│   │   │   ├── agent/
│   │   │   ├── integrations/
│   │   │   └── users/
│   │   └── users/                  # redirect → /settings/users
│   └── api/
│       └── webhooks/               # n8n → plataforma
│           ├── radar/
│           ├── agent-log/
│           └── stage-move/
├── actions/                        # Server Actions (por domínio)
│   ├── auth.ts
│   ├── leads.ts
│   ├── casos.ts
│   ├── processos.ts
│   ├── radar.ts
│   ├── appointments.ts
│   ├── settings.ts
│   ├── users.ts
│   └── ai/
│       ├── lead-triage.ts
│       ├── dossie.ts
│       └── radar-summary.ts
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── layout/                     # Sidebar, Header, NavItem, NotificationBell
│   ├── kanban/
│   ├── leads/
│   ├── casos/
│   ├── radar/
│   ├── calendar/
│   ├── settings/
│   └── shared/                     # RoleBadge, UserInviteModal, UserEditModal, FunnelChart
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client (Client Components)
│   │   └── server.ts               # Server client (Server Components + Actions)
│   ├── hooks/                      # useUser, usePermissions, useRealtimeRadar
│   ├── permissions.ts              # Mapa de permissões por role
│   ├── mock/                       # Dados mock (mantidos até backend estar 100%)
│   └── utils.ts
├── middleware.ts                   # Proteção de rotas + refresh de sessão
├── types/
│   ├── database.ts                 # Tipos gerados do schema Supabase
│   ├── calendar.ts
│   ├── caso.ts
│   ├── kanban.ts
│   ├── radar.ts
│   ├── settings.ts
│   └── user.ts
├── docs/
│   ├── PRD.md
│   └── PLAN.md
└── supabase/
    ├── migrations/                 # SQL migrations numeradas
    └── seed.sql                    # Dados de desenvolvimento
```

---

## Schema do Banco — Entidades Principais

```
tenants              — escritórios (1 por conta SaaS)
users                — membros do tenant (auth.users vinculados)
lawyer_oabs          — OABs dos advogados do escritório
clients              — pessoas físicas/jurídicas atendidas
leads                — prospects no pipeline comercial
lead_stages          — etapas do funil (por tenant)
lead_messages        — histórico de conversa do lead
casos                — processos jurídicos operacionais (entidade interna)
caso_timeline        — linha do tempo de eventos do caso
case_process_links   — vínculo N:N entre casos e processos
processos            — espelhos de processos externos (Escavador/CNJ)
process_parties      — partes do processo (autor, réu, advogados)
process_updates      — movimentações e publicações do processo
radar_items          — alertas, prazos e movimentações para ação
appointments         — compromissos e audiências
integrations         — configurações de integrações por tenant
notifications        — alertas in-app por usuário
agent_logs           — registro de ações do agente de IA
```

**Campos de sync em `processos` e `process_updates`:**
- `external_id` — ID na fonte externa (Escavador, CNJ)
- `external_source` — `'escavador' | 'cnj' | 'manual'`
- `cnj_number` — número CNJ formatado (0000000-00.0000.0.00.0000)
- `last_synced_at` — última sincronização com fonte externa
- `sync_status` — `'pending' | 'synced' | 'error' | 'stale'`

---

## Conventions

### TypeScript
- Strict mode sempre ativo
- Tipos de domínio em `types/` — nunca `any`
- `interface` para objetos, `type` para unions/primitivos
- Todos os tipos de domínio carregam `tenantId: string`
- `types/database.ts` gerado do schema — use para queries, não para UI

### Next.js App Router
- **Server Components por padrão** — `"use client"` só quando necessário
- Padrão: `XyzClient.tsx` (`"use client"`) como state owner; `page.tsx` = Server Component fino
- Data fetching em Server Components via Supabase server client
- Mutações via Server Actions em `actions/`
- Nunca passar o Supabase client para Client Components — use Server Actions

### Supabase Client
```typescript
// Server Components, Server Actions, API routes:
import { createServerClient } from '@/lib/supabase/server'

// Client Components (apenas para Realtime):
import { createBrowserClient } from '@/lib/supabase/client'
```

### RLS e Segurança
- `tenant_id` sempre vem da sessão: `auth.jwt() ->> 'tenant_id'`
- RLS ativo em todas as tabelas — nunca desabilitar
- Server Actions validam tenant_id da sessão antes de qualquer query
- Webhooks externos validam `X-Webhook-Secret`

### Styling
- Tailwind CSS v4 only — sem inline styles
- `cn()` de `lib/utils` para classes condicionais
- `html, body` com `height: 100%; overflow: hidden` — scroll sempre no painel interno
- Dark mode via `ThemeProvider` + script inline anti-flash

### Components
- shadcn/ui para todos os primitivos
- `DropdownMenuTrigger` usa `render={<Button />}`, não `asChild`
- Lucide React para ícones

---

## Domain Concepts

| Conceito | Descrição |
|---|---|
| **Tenant** | Um escritório de advocacia usando a plataforma |
| **Client** | Pessoa física ou jurídica atendida pelo escritório (entidade permanente) |
| **Lead** | Prospect no pipeline comercial (pode virar Client) |
| **Stage** | Etapa do pipeline: Novo → Qualificado → Proposta → Contrato → Cliente → Perdido |
| **Caso** | Entidade operacional interna — o trabalho jurídico do escritório para um cliente |
| **Processo** | Espelho de um processo judicial externo (Escavador/CNJ) — pode estar vinculado a um Caso |
| **Radar** | Central de monitoramento — agrupa alertas, movimentações e prazos que exigem atenção |
| **Handoff** | Escalada do agente de IA para um advogado humano |
| **Agent** | n8n + Claude — triage, atendimento e qualificação automática |

### User Roles

| Role | Acesso |
|---|---|
| `admin` | Acesso total |
| `manager` | Visibilidade total, gestão de equipe |
| `lawyer` | Próprios leads, chat, documentos |
| `secretary` | Criar/editar leads, atendimento básico |
| `viewer` | Somente leitura |

### Pipeline Stages

| Stage | Cor |
|---|---|
| Novo | `#3B82F6` |
| Qualificado | `#8B5CF6` |
| Proposta | `#FBBF24` |
| Contrato | `#34D399` |
| Cliente | `#10B981` |
| Perdido | `#9CA3AF` |

---

## Visual Identity

### Cores

```css
--brand:      #2563EB;    /* botões, links, destaques */
--brand-dark: #1E40AF;    /* hover, estados ativos */
--background:    #FFFFFF;
--bg-secondary:  #F9FAFB;
--success: #10B981;
--warning: #F97316;
--error:   #EF4444;
--neutral: #6B7280;
--border:       #E5E7EB;
--input-border: #D1D5DB;
```

Aliases Tailwind: `bg-brand`, `text-brand`, `border-brand`, `bg-bg-secondary`, etc.

### Tipografia

```
H1: Inter 32px / 700    H2: Inter 24px / 600    H3: Inter 20px / 600
Body: Inter 14px / 400  Body Small: 12px / 400  Mono: Fira Code 13px / 400
```

### Layout

```
html (h-full, overflow-hidden)
└── body (h-full, overflow-hidden)
    └── (dashboard) layout — flex h-screen overflow-hidden
        ├── Sidebar
        └── div flex-col flex-1 overflow-hidden
            ├── Header
            └── main (flex-1 min-h-0 overflow-y-auto p-6)
                └── page content
```

**Regra de scroll:** sempre dentro dos painéis da aplicação, nunca no browser/documento.

---

## Fluxo de Dados — Agente ↔ Plataforma

```
Cliente → WhatsApp
  → n8n recebe (webhook)
  → Agente consulta banco da Lexia (lead, histórico, contexto)
  → Se necessário: consulta Escavador/CNJ e salva resultado no banco
  → Agente responde / triagem / qualificação
  → Salva lead + mensagem no Supabase
  → Supabase Realtime notifica plataforma web
  → Advogado vê no Kanban + Inbox
  → Advogado responde via plataforma
  → n8n envia resposta via WhatsApp
```

---

## Fluxo de Descoberta via OAB

```
Onboarding → advogado informa OAB
  → Escavador busca todos processos do advogado
  → Processos salvos em `processos` com external_source='escavador'
  → Advogado revisa lista e decide quais viram Casos
  → Casos criados com vínculo em `case_process_links`
  → CNJ sync inicia para os processos vinculados a casos ativos
```

---

## Fluxo de Sync CNJ (Operação Diária)

```
CNJ/Datajud detecta movimentação
  → n8n recebe webhook / faz polling
  → Salva em `process_updates` (external_id, external_source='cnj')
  → Cria `radar_item` vinculado ao caso
  → Claude resume a movimentação (ai_summary em JSONB)
  → Notificação para responsável do caso
  → Advogado vê no Radar com resumo prático
```

---

## MVP Scope Guard

### Em escopo — Fase 3 (Backend)
- Auth real (Supabase Auth, JWT claims, RLS)
- Multi-tenant com isolamento via RLS
- Leads + Kanban com dados reais
- Casos com timeline e vínculo a processos
- Radar com ingestão via webhook
- Calendar com compromissos persistidos
- Settings e gestão de usuários reais
- Onboarding com captura de OAB (estrutura pronta)
- Webhooks n8n ↔ plataforma

### Fora do escopo por enquanto
- Escavador integrado em produção (schema pronto, chamada real na Fase 4)
- CNJ sync automático (webhook pronto, polling na Fase 4)
- Document generation / e-signature
- Billing (Stripe)
- White-label
- Analytics avançado
- Múltiplos workflows n8n por tenant

---

## Development Approach

1. **Interface primeiro, aprovada** — Fase 2 completa, UI aprovada com dados mock
2. **Schema antes do código** — migrations SQL antes de qualquer Server Action
3. **RLS antes de tudo mais** — isolamento no banco é não-negociável
4. **Auth antes de features** — tenant_id na sessão é pré-requisito de tudo
5. **XyzClient pattern** — `"use client"` como state owner; pages = Server Components finos
6. **Server Actions para mutações** — nunca API routes para CRUD interno
7. **Não quebrar a UI existente** — substituir mocks por dados reais de forma incremental
8. **Sem Prisma no MVP** — Supabase direto com tipos TypeScript gerados
