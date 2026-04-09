# Lexia AI — Project Briefing for Claude Code

> **Uma plataforma de operação comercial e atendimento jurídico com IA integrada.**
> CRM jurídico com agente de IA integrado — NOT just a chatbot.

Full PRD: [docs/PRD.md](docs/PRD.md)

---

## What This Project Is

Lexia AI is a multi-tenant SaaS for Brazilian law firms (escritórios jurídicos) that combines:

- **Legal CRM** with Kanban pipeline (the core product)
- **AI agent** for WhatsApp/web triage and qualification (the differentiator)
- **Integrated inbox** for centralized conversation history
- **Calendar** synced with Google Calendar
- **Process monitoring** via Escavador/Datajud (Phase 3+)

The AI agent (built in n8n + Claude) already exists. What we're building now is the **SaaS platform layer**.

---

## Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14+ (App Router) | SSR, Server Components by default |
| Language | TypeScript (strict) | Everywhere, no exceptions |
| Styling | Tailwind CSS | No inline styles |
| UI Components | shadcn/ui | Extend, don't reinvent |
| Icons | Lucide React | Consistent icon set |
| Database | Supabase (PostgreSQL) | Auth + Realtime + Storage included |
| ORM | Prisma | Type-safe DB access |
| Automation/AI | n8n | Workflows, WhatsApp agent, integrations |
| LLM | Claude (Anthropic) | Primary; OpenAI as fallback/embeddings |
| Deploy | Vercel | Next.js frontend |
| Backend services | Railway / Render | If needed for separate services |
| Email | Resend | Transactional emails |
| Error tracking | Sentry | |
| Analytics | PostHog | Product analytics |
| Font | Inter (Google Fonts) | All UI text |
| Monospace font | Fira Code | Code/mono contexts |

---

## Folder Structure

```
lexia-ai/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Public: login, forgot-password
│   │   ├── login/
│   │   └── forgot-password/
│   ├── (dashboard)/            # Protected: requires auth
│   │   ├── layout.tsx          # Sidebar + Header layout
│   │   ├── dashboard/
│   │   ├── leads/              # Kanban CRM
│   │   ├── inbox/              # Conversation history
│   │   ├── calendar/
│   │   ├── settings/
│   │   └── users/
│   └── api/                    # API routes (webhooks, etc.)
├── components/
│   ├── ui/                     # shadcn/ui primitives (auto-generated)
│   ├── layout/                 # Sidebar, Header, Nav
│   ├── kanban/                 # KanbanBoard, KanbanCard, KanbanColumn
│   ├── inbox/                  # ConversationList, ChatView, MessageBubble
│   └── shared/                 # Reusable domain components
├── lib/
│   ├── supabase/               # createClient, server/client helpers
│   ├── hooks/                  # Custom React hooks
│   └── utils/                  # cn(), formatters, helpers
├── types/                      # TypeScript interfaces (Lead, Tenant, User…)
├── docs/                       # PRD and project documentation
└── supabase/
    └── migrations/             # SQL migration files
```

---

## Conventions

### TypeScript
- Strict mode always on
- Define domain types in `types/` — never use `any`
- Prefer `interface` for objects, `type` for unions/primitives

### Next.js App Router
- **Server Components by default** — only add `"use client"` when you need browser APIs, event handlers, or React hooks
- Route groups: `(auth)` for public pages, `(dashboard)` for protected pages with sidebar layout
- Data fetching in Server Components; mutations via Server Actions or API routes

### Database / Supabase
- **Every table has `tenant_id UUID`** — this is non-negotiable for multi-tenancy
- **RLS (Row Level Security) enforced** on all tables — `tenant_id = auth.jwt()->>'tenant_id'`
- Use **Prisma** for all DB queries (type-safe)
- Use **Supabase Realtime** for live updates (inbox, notifications)

### Styling
- Tailwind CSS only — no inline styles, no CSS modules
- Follow shadcn/ui patterns for component variants
- Use `cn()` from `lib/utils` for conditional class merging

### Components
- shadcn/ui for all primitives (Button, Dialog, Input, Card, etc.) — install via CLI, don't copy-paste manually
- Lucide React for icons — consistent, tree-shakeable
- Keep components small and focused; co-locate related logic

### Multi-Tenancy
- `tenant_id` is always derived from the authenticated session, never from URL params or user input
- All queries filter by `tenant_id` at the DB level (RLS) AND application level
- Users belong to exactly one tenant

---

## Domain Concepts

| Concept | Description |
|---|---|
| **Tenant** | A law firm (escritório jurídico) using the platform |
| **Lead** | A prospect or client in the sales pipeline |
| **Stage** | Pipeline position: Novo → Qualificado → Proposta → Contrato → Cliente → Perdido |
| **Conversation** | Chat history (WhatsApp or website) linked to a lead |
| **Handoff** | AI agent escalation to a human lawyer |
| **Agent** | n8n + Claude automation that triages leads via WhatsApp/site |
| **Role** | User permission level within a tenant |

### User Roles

| Role | Access |
|---|---|
| `admin` | Full access |
| `manager` | Full visibility, team management |
| `lawyer` | Own leads, chat, documents |
| `secretary` | Create/edit leads, basic chat |
| `viewer` | Read-only |

### Pipeline Stages (default)

| Stage | Color |
|---|---|
| Novo | `#3B82F6` |
| Qualificado | `#8B5CF6` |
| Proposta | `#FBBF24` |
| Contrato | `#34D399` |
| Cliente | `#10B981` |
| Perdido | `#9CA3AF` |

---

## Visual Identity

### Colors

```css
/* Primary */
--blue:       #2563EB;   /* buttons, links, highlights */
--blue-dark:  #1E40AF;   /* hover, active states */

/* Backgrounds */
--bg-main:    #FFFFFF;
--bg-secondary: #F9FAFB;

/* Semantic */
--success:    #10B981;
--warning:    #F97316;
--error:      #EF4444;
--neutral:    #6B7280;   /* secondary text */

/* Borders */
--border:     #E5E7EB;
--input-border: #D1D5DB;
```

### Typography

```
H1: Inter 32px / 700
H2: Inter 24px / 600
H3: Inter 20px / 600
Body: Inter 14px / 400
Body Small: Inter 12px / 400
Monospace: Fira Code 13px / 400
```

### Spacing & Shape

```
Padding base:    16px
Gap (elements):  12px
Gap (sections):  24px
Border radius:   8px (default), 12px (modals)
Shadow:          0 1px 3px rgba(0,0,0,0.1)
```

### Animations

```
Transitions:   200ms ease-in-out
Modals:        fade-in 100ms
Notifications: slide-in 300ms
```

---

## Layout Structure

```
┌──────────────────────────────────────────────────────────┐
│  HEADER — Logo | Search | Notifications | Profile        │
├──────────────┬───────────────────────────────────────────┤
│              │                                           │
│   SIDEBAR    │            MAIN CONTENT                   │
│              │                                           │
│  Dashboard   │   Kanban / Inbox / Calendar / etc.       │
│  Leads       │                                           │
│  Inbox       │                                           │
│  Calendar    │                                           │
│  Settings    │                                           │
│  Users       │                                           │
│              │                                           │
└──────────────┴───────────────────────────────────────────┘
```

Sidebar collapses on mobile (< 640px).

---

## MVP Scope Guard

### In scope (Phase 1)
- Auth (email/password, forgot password)
- Multi-tenant data isolation
- Users + roles + permissions
- Leads CRUD + Kanban with drag-and-drop
- Dashboard with key metrics
- Inbox (conversation history, read-only)
- Calendar (basic, no sync yet)
- Settings (office data, agent config)

### NOT in scope for MVP
- Document generation / e-signature
- Billing (Stripe)
- White-label
- Google Calendar sync (structure only)
- Advanced analytics / ML / predictions
- Multiple n8n workflows per tenant
- ADVBOX / Escavador integrations (Phase 3)

---

## Data Architecture (Core Tables)

```
tenants          — law firms
users            — tenant members (with role)
leads            — prospects/clients
lead_stages      — funnel stages (per tenant)
lead_messages    — conversation history
appointments     — calendar events (linked to leads)
integrations     — external service config (per tenant)
notifications    — in-app alerts (per user)
agent_logs       — AI agent action log
```

All tables: `tenant_id UUID NOT NULL` + Supabase RLS policies.

---

## n8n Integration Points

The n8n automation layer (external) communicates with Supabase directly:

- Writes new leads when a WhatsApp conversation starts
- Appends messages to `lead_messages`
- Moves leads between stages
- Creates notifications
- Flags handoff (sets `handoff = true` on a message/lead)
- Creates `agent_logs` entries

The Next.js app reads this data in real-time via Supabase Realtime subscriptions.

---

## Key External Services

| Service | Purpose | Priority |
|---|---|---|
| WhatsApp (via n8n) | Primary intake channel | P0 |
| Google Calendar | Appointment sync | P0 (prep only in MVP) |
| Escavador | Process monitoring by CPF/CNPJ | P1 (Phase 3) |
| ADVBOX | Client data import | P1 (Phase 3) |

---

## Development Approach

1. **Data model first** — schema and RLS before building UI
2. **Auth before anything** — multi-tenant session required for all features
3. **Kanban/Leads is the core** — build this before inbox or calendar
4. **Server Components default** — only reach for client when needed
5. **shadcn/ui for everything** — don't reinvent UI primitives
6. **No speculative features** — build what the PRD specifies, nothing more
