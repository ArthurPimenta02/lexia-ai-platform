# Lexia AI — Product Requirements Document (PRD)

---

## 1. Visão do Produto

### Declaração de Visão

A Lexia AI é uma plataforma SaaS que transforma a forma como escritórios jurídicos gerenciam atendimento, leads e operações comerciais. Ela centraliza inteligência artificial, gestão de relacionamento com clientes (CRM) e automação em uma única experiência integrada.

### Componentes Principais

A Lexia AI une:

- **Atendimento Inicial Automatizado com IA:** Triagem inteligente e qualificação de leads via WhatsApp
- **CRM Jurídico com Funil Visual:** Kanban intuitivo para gerenciar pipeline comercial
- **Histórico Centralizado:** Todas as conversas, leads e contextos em um lugar
- **Agendamento Integrado:** Sincronização com Google Calendar
- **Notificações Inteligentes:** Alertas contextuais para ações importantes
- **Monitoramento Processual:** Integração com APIs de processos jurídicos
- **Geração Assistida de Documentos:** IA ajudando na redação (futuro)

### Mudança Estratégica

A Lexia deixa de ser apenas "um agente no WhatsApp" para se tornar um **sistema operacional comercial e de atendimento para escritórios jurídicos**. Isso alinha com a proposta original de plataforma integrada: CRM + IA + Monitoramento Processual.

---

## 2. Problema e Solução

### Problema Identificado

Escritórios jurídicos sofrem com:

| Problema | Impacto |
|---|---|
| Leads espalhados | WhatsApp, planilhas, email, ferramentas isoladas |
| Atendimento despadronizado | Cada cliente é atendido diferente |
| Baixa capacidade de acompanhamento | Falta de sistema de follow-up |
| Perda de leads | Demora ou falha no retorno |
| Pouca visibilidade comercial | Não sabe quantos clientes tem em cada etapa |
| Excesso de assinaturas | ADVBox, Projuris, Google Agenda, WhatsApp Business |
| Ausência de inteligência | Sem IA para triagem e qualificação |

### Solução Proposta

A Lexia resolve isso centralizando:

- ✅ Atendimento (WhatsApp + site)
- ✅ Organização comercial (Kanban + dashboard)
- ✅ Agenda (Google Calendar integrado)
- ✅ Integrações (processos, CRMs jurídicos, etc.)
- ✅ Inteligência (IA para triagem, qualificação, redação)

**Resultado:** Uma única plataforma que substitui múltiplas ferramentas.

---

## 3. Estado Atual do Projeto

### 3.1 O Que Já Existe

A Lexia não é uma ideia. Ela tem uma base concreta:

- ✅ Agente funcional no n8n: Processamento de mensagens, triagem jurídica
- ✅ Processamento multimodal no WhatsApp: Texto, imagem, áudio
- ✅ Triagem jurídica inicial: Classificação de tipo de demanda
- ✅ Memória/contexto de conversa: Agente lembra histórico
- ✅ Detecção de urgência: Prioriza casos urgentes
- ✅ Transbordo para humano: Passa para advogado quando necessário
- ✅ Site com chat web: Demonstração funcional
- ✅ Onboarding inicial: Estrutura básica de entrada
- ✅ Integrações exploradas: ADVBOX, Astrea, Projuris, Jusbrasil, Google Calendar

> **Ponto crítico:** A Lexia já tem um motor operacional. O que falta é a camada de produto SaaS.

### 3.2 O Que Ainda Não Está Consolidado

- ❌ Plataforma web principal
- ❌ Banco/modelo de dados do SaaS
- ❌ Login e tenancy (multi-cliente)
- ❌ Painel com leads e Kanban
- ❌ Inbox central de conversas
- ❌ Calendário integrado no painel
- ❌ Configurações por escritório
- ❌ Governança de integrações por tenant
- ❌ Billing e operação multi-cliente

---

## 4. Decisão Estratégica

### Posicionamento Oficial

A Lexia será construída como:

> **Um CRM jurídico com agente de IA integrado**

E NÃO como:

> ~~Uma IA solta que talvez vire plataforma depois~~

### Por Que Isso Importa

Essa decisão muda o foco da construção:

- 🎯 O agente continua importante, mas não é o centro
- 🎯 O centro do produto é a plataforma
- 🎯 A IA é um diferencial, não a razão de existir
- 🎯 O CRM é o core, a IA é o que torna melhor

### Implicações

| Aspecto | Antes | Agora |
|---|---|---|
| Foco | "Que tal um chatbot jurídico?" | "Que tal um CRM com IA?" |
| MVP | Agente + algumas telas | Plataforma completa + agente |
| Prioridade | Melhorar IA | Construir plataforma |
| Venda | "Temos IA conversacional" | "Temos CRM + IA + automação" |

---

## 5. Escopo do MVP

O MVP não tenta construir tudo do PRD original de uma vez. Ele foca no **núcleo operacional**.

### 5.1 O Que Entra no MVP

#### A. Autenticação
- Login por email e senha
- Recuperação de acesso
- Estrutura preparada para OAuth (Google, Microsoft)
- Segurança básica (HTTPS, tokens)

#### B. Estrutura de Escritório (Multi-Tenant)
- Conta de escritório
- Dados básicos do tenant
- Configurações iniciais
- Isolamento de dados por tenant

#### C. Usuários e Permissões
- Criação de usuários
- 5 roles: Admin, Dono/Gerente, Advogado, Secretária, Visualizador
- Permissões granulares
- Controle de acesso por feature

#### D. CRM / Leads
- Cadastro de leads
- Funil/Kanban com drag-and-drop
- Detalhes do lead (nome, CPF, email, telefone, tipo de caso)
- Busca e filtros avançados
- Origem do lead (WhatsApp, site, manual)
- Responsável (qual advogado atende)
- Status (Novo, Qualificado, Proposta, Contrato, Cliente, Perdido)

#### E. Conversas / Inbox
- Histórico de mensagens
- Origem (WhatsApp ou site)
- Leitura do contexto do lead
- Visualização do que o agente falou
- Marcação para handoff (transbordo)
- Timeline de interações

#### F. Dashboard
- Leads por estágio (visualização do funil)
- Novos leads (últimas 24h)
- Atendimentos recentes
- Métricas iniciais (taxa de conversão, tempo médio)
- Volume de conversas
- Notificações pendentes

#### G. Calendário
- Compromissos e consultas
- Visualização de eventos
- Conexão com lead
- Status do agendamento
- Estrutura preparada para integração com Google Calendar

#### H. Configurações
- Dados do escritório
- Configurações do agente (horários, mensagens padrão)
- Integrações ativas
- Parâmetros básicos de operação
- Gerenciamento de usuários

### 5.2 Escopo Mantido

Esse escopo mantém o núcleo do PRD inicial:

- ✅ Login
- ✅ Kanban
- ✅ Dashboards
- ✅ Multi-usuário
- ✅ Mensagens
- ✅ Calendário
- ✅ Notificações

---

## 6. O Que Fica Fora do MVP

| Feature | Motivo | Quando |
|---|---|---|
| Gerador completo de documentos | Complexo, requer templates jurídicos | Fase 3 |
| Assinatura eletrônica | Requer integração com terceiros | Fase 3 |
| White-label | Não é prioridade inicial | Fase 4+ |
| Billing completo | MVP pode ser gratuito/teste | Fase 4 |
| Upload multimodal no painel | Fora do escopo inicial | Fase 2+ |
| Analytics avançado | Métricas básicas são suficientes | Fase 4 |
| Previsões de resultado | Requer ML, não é MVP | Fase 4+ |
| Machine learning | Complexo, não é essencial | Fase 4+ |
| Integração profunda com múltiplos softwares | Começa com 2-3 principais | Fase 3+ |
| Parte premium avançada | MVP é MVP | Fase 4 |
| Marketplace de templates | Futuro, não MVP | Fase 4+ |

---

## 7. Arquitetura Técnica

### 7.1 Camadas da Lexia

A Lexia é construída em 3 camadas independentes que se comunicam:

#### Camada 1: Plataforma Web

```
┌─────────────────────────────────────────┐
│         INTERFACE DO USUÁRIO            │
│  (Next.js + React + Tailwind + shadcn)  │
├─────────────────────────────────────────┤
│  Login │ Dashboard │ Kanban │ Inbox │   │
│  Calendário │ Settings │ Usuários        │
└─────────────────────────────────────────┘
```

Responsável por: Interface do sistema, login e autenticação, dashboard executivo, Kanban (CRM), inbox (conversas), calendário, settings, gestão de usuários.

#### Camada 2: Banco e Autenticação

```
┌─────────────────────────────────────────┐
│    DADOS E AUTENTICAÇÃO (Supabase)      │
├─────────────────────────────────────────┤
│  PostgreSQL │ Auth │ Realtime │ Storage │
└─────────────────────────────────────────┘
```

Responsável por: Autenticação segura, multi-tenant (isolamento de dados), tabelas do CRM, usuários e permissões, mensagens, integrações, notificações.

#### Camada 3: Motor de Automação e Agentes

```
┌─────────────────────────────────────────┐
│    AUTOMAÇÃO E IA (n8n)                 │
├─────────────────────────────────────────┤
│  Agente WhatsApp │ Agente Site │        │
│  Integrações │ Workflows │ Callbacks    │
└─────────────────────────────────────────┘
```

Responsável por: Agente do WhatsApp, agente do site, integrações externas, workflows de consulta, notificações automáticas, callbacks de integrações, monitoramento processual, handoff (transbordo), agenda integrada.

### 7.2 Fluxo de Dados

```
Cliente envia mensagem via WhatsApp
         ↓
n8n recebe (webhook)
         ↓
Agente processa (IA, contexto, intenção)
         ↓
Salva no Supabase (lead, mensagem)
         ↓
Notifica plataforma web (Realtime)
         ↓
Advogado vê no painel (Inbox + Kanban)
         ↓
Advogado responde via plataforma
         ↓
n8n envia resposta via WhatsApp
```

---

## 8. Stack Tecnológico

### 8.1 Stack Principal

| Camada | Tecnologia | Função |
|---|---|---|
| Frontend | Next.js 14+ | Framework React com SSR |
| Frontend | React 18+ | Componentes e state |
| Frontend | TypeScript | Type safety |
| Frontend | Tailwind CSS | Estilização |
| Frontend | shadcn/ui | Componentes UI prontos |
| Backend | Supabase | PostgreSQL + Auth + Realtime |
| Backend | PostgreSQL | Banco de dados relacional |
| Backend | Prisma | ORM type-safe |
| Automação | n8n | Workflows e agentes |
| IA | Claude (Anthropic) | Modelo LLM principal |
| IA | OpenAI | Alternativa/embeddings |
| IA | LangChain | Orquestração de IA |
| Deploy | Vercel | Deploy do Next.js |
| Deploy | Railway/Render | Deploy do backend |
| Email | Resend | Emails transacionais |
| Monitoramento | Sentry | Rastreamento de erros |
| Analytics | PostHog | Analytics de produto |
| Dev | Cursor + Claude Code | Desenvolvimento assistido |

### 8.2 Ferramentas Complementares

| Ferramenta | Propósito | Opcional |
|---|---|---|
| Redis/Upstash | Cache, flags, locks, sessões | Sim (Fase 2+) |
| Lovable | Aceleração de frontend | Sim (pode usar) |
| Figma | Design de UI/UX | Sim (design) |
| GitHub | Versionamento | Não |
| GitHub Actions | CI/CD | Não |

### 8.3 Papel do Lovable

O Lovable pode ser usado para:

- ✅ Acelerar desenvolvimento de frontend
- ✅ Prototipar telas rapidamente
- ✅ Gerar componentes e páginas

Mas:

- ❌ Não será a peça central do backend
- ❌ Não comandará a arquitetura
- ❌ Será uma ferramenta auxiliar

**Fonte de verdade:**

- 🎯 Banco: Supabase
- 🎯 Lógica: n8n
- 🎯 App web: Next.js

---

## 9. Estratégia para Agentes e Workflows

### 9.1 Decisão de Simplicidade

No MVP, vamos manter máxima simplicidade operacional:

| Aspecto | MVP | Futuro |
|---|---|---|
| Agentes | 1 agente principal | Múltiplos agentes por especialidade |
| Fluxos | 1 fluxo principal | Fluxos customizados por escritório |
| Integrações | 2-3 principais | Múltiplas integrações |
| Padrão operacional | Único | Customizável |

### 9.2 Multiplicação de Workflows

**Decisão oficial:** No MVP, seguimos com uma linha principal. Depois, com clientes reais, decidimos se o isolamento será por:

- Prompts/configurações por tenant
- Workflows separados por escritório
- Modelo híbrido

> **Por quê?** Evita complexidade operacional demais antes da fundação do produto estar sólida.

---

## 10. Estratégia de Integrações

### 10.1 Princípio de Modularidade

Integrações serão tratadas como **módulos plugáveis**, não como núcleo da plataforma.

- ✅ A app da Lexia existe sem elas
- ✅ As integrações aumentam valor
- ✅ Elas não devem travar a construção do produto principal
- ✅ Começam simples, evoluem depois

### 10.2 Integrações Curto Prazo

| Integração | Prioridade | Função |
|---|---|---|
| WhatsApp | P0 (Core) | Atendimento principal |
| Google Calendar | P0 (Core) | Agendamento |
| Chat do site | P0 (Core) | Atendimento web |
| Escavador | P1 | Monitoramento processual |
| ADVBOX | P1 | Consulta de clientes |

### 10.3 ADVBOX

Como existe cliente real usando ADVBOX, a integração pode sair do campo teórico e virar piloto real.

**Foco:** Primeiro em leitura e consulta, antes de qualquer escrita sensível.

**Implementação:**
1. Ler dados de clientes
2. Sincronizar com Lexia
3. Consultar informações
4. Depois: escrita (criar leads, atualizar dados)

### 10.4 Escavador

A Escavador será usada para:

- Consulta por CPF/CNPJ
- Descoberta de processos
- Monitoramento por callback
- Automação de mensagens sobre atualizações

> **Limitação atual:** Falta de créditos impede validação real. Estratégia: arquitetura preparada primeiro, validação final quando houver saldo.

---

## 11. Módulos do Produto

### 11.1 Login e Autenticação

**Objetivo:** Entrada segura no sistema, associação ao tenant correto, base para multi-usuário.

**Funcionalidades:**
- Login por email/senha
- Recuperação de senha
- OAuth preparado (Google, Microsoft)
- Segurança (HTTPS, tokens JWT)
- Sessão persistente

**Telas:** Login, Recuperação de senha, Confirmação de email (opcional)

---

### 11.2 Dashboard

**Objetivo:** Visão executiva do escritório, resumo comercial e operacional.

**Indicadores Iniciais:**
- Leads novos (últimas 24h)
- Leads por estágio (visual do funil)
- Atendimentos recentes
- Consultas agendadas
- Notificações pendentes
- Taxa de conversão (básica)

**Visualizações:**
- Cards com números principais
- Gráfico de funil
- Timeline de atividades recentes
- Alertas e notificações

---

### 11.3 Kanban / Leads

**Objetivo:** Ser o centro do CRM da Lexia.

**Funcionalidades:**
- Colunas de pipeline (Novo → Cliente)
- Drag-and-drop entre colunas
- Filtros (por responsável, origem, data)
- Detalhes do lead (modal/sidebar)
- Responsável (qual advogado atende)
- Origem (WhatsApp, site, manual)
- Status visual
- Busca rápida

**Colunas Padrão:**

1. **Novo** — Lead acabou de chegar
2. **Qualificado** — Agente triou e qualificou
3. **Proposta** — Advogado enviou proposta
4. **Contrato** — Contrato assinado
5. **Cliente** — Ativo no escritório
6. **Perdido** — Não converteu

---

### 11.4 Inbox / Conversas

**Objetivo:** Centralizar histórico e contexto do atendimento.

**Funcionalidades:**
- Lista de conversas (com preview)
- Mensagens do site
- Mensagens do WhatsApp
- Timeline da conversa
- Ações do agente (o que foi dito)
- Handoff para humano (marcação)
- Contexto do lead (dados ao lado)
- Busca em conversas

**Visualização:**
- Sidebar com lista de conversas
- Chat em destaque
- Contexto do lead à direita
- Histórico completo

---

### 11.5 Calendário

**Objetivo:** Organizar consultas e compromissos.

**Funcionalidades:**
- Visualização de eventos (dia, semana, mês)
- Criar evento
- Editar evento
- Conexão com lead
- Status do agendamento (confirmado, pendente, cancelado)
- Sincronização com Google Calendar (estrutura preparada)

**Integração Futura:**
- Sincronização bidirecional com Google Calendar
- Notificações de eventos
- Envio automático de lembretes

---

### 11.6 Settings / Configurações

**Objetivo:** Permitir configuração operacional da Lexia por escritório.

**Funcionalidades:**
- Dados do escritório (nome, CNPJ, endereço)
- Horários de funcionamento
- Integrações ativas (on/off, credenciais)
- Parâmetros do agente (tom, especialidades)
- Mensagens padrão (saudação, encerramento)
- Webhooks e callbacks

**Seções:** Informações gerais, Integrações, Agente, Usuários, Billing (futuro)

---

### 11.7 Gestão de Usuários

**Objetivo:** Controlar equipe e acessos.

**Funcionalidades:**
- Criar usuários
- Editar usuários
- Deletar usuários
- Atribuir roles (Admin, Advogado, Secretária, etc.)
- Permissões por feature
- Desativar usuário

**Roles Disponíveis:**

1. **Admin** — Tudo
2. **Dono/Gerente** — Visibilidade completa, gestão
3. **Advogado** — Leads próprios, chat, documentos
4. **Secretária** — Criar leads, editar, chat básico
5. **Visualizador** — Apenas leitura

---

## 12. Design e Estética

### 12.1 Filosofia de Design

A Lexia segue uma filosofia de design moderna, limpa e produtiva, inspirada em:

- **Linear** — Interface extremamente limpa, foco em produtividade
- **Pipedrive** — CRM com pipeline visual bem resolvido
- **Notion** — Flexibilidade, customização, database views
- **Slack** — Comunicação integrada, notificações inteligentes

### 12.2 Paleta de Cores

#### Cores Primárias

| Cor | Hex | Uso |
|---|---|---|
| Azul Profissional | `#2563EB` | Botões, links, highlights |
| Azul Escuro | `#1E40AF` | Hover, estados ativos |
| Branco | `#FFFFFF` | Fundo principal |
| Cinza Claro | `#F9FAFB` | Fundo secundário |

#### Cores Secundárias

| Cor | Hex | Uso |
|---|---|---|
| Verde (Sucesso) | `#10B981` | Conversão, ações positivas |
| Laranja (Alerta) | `#F97316` | Atenção, avisos |
| Vermelho (Erro) | `#EF4444` | Erros, cancelamento |
| Cinza (Neutro) | `#6B7280` | Texto secundário |

#### Cores de Status (Kanban)

| Status | Cor | Hex |
|---|---|---|
| Novo | Azul | `#3B82F6` |
| Qualificado | Roxo | `#8B5CF6` |
| Proposta | Amarelo | `#FBBF24` |
| Contrato | Verde claro | `#34D399` |
| Cliente | Verde | `#10B981` |
| Perdido | Cinza | `#9CA3AF` |

### 12.3 Tipografia

| Elemento | Fonte | Tamanho | Peso |
|---|---|---|---|
| Headings (H1) | Inter | 32px | 700 |
| Headings (H2) | Inter | 24px | 600 |
| Headings (H3) | Inter | 20px | 600 |
| Body | Inter | 14px | 400 |
| Body Small | Inter | 12px | 400 |
| Monospace | Fira Code | 13px | 400 |

> Fonte: **Inter** (Google Fonts) — moderna, legível, profissional

### 12.4 Componentes de UI

#### Botões
```
Primário:    Azul (#2563EB),    padding 12px 24px, border-radius 8px
Secundário:  Cinza (#F3F4F6),   padding 12px 24px, border-radius 8px
Perigo:      Vermelho (#EF4444), padding 12px 24px, border-radius 8px
```

#### Cards
```
Fundo:        Branco (#FFFFFF)
Border:       Cinza claro (#E5E7EB)
Border-radius: 8px
Padding:      16px
Shadow:       0 1px 3px rgba(0,0,0,0.1)
```

#### Inputs
```
Border:       Cinza (#D1D5DB)
Border-radius: 6px
Padding:      10px 12px
Font-size:    14px
Focus:        Azul (#2563EB), shadow azul
```

#### Modal
```
Overlay:    rgba(0,0,0,0.5)
Modal:      Branco, border-radius 12px
Padding:    24px
Max-width:  500px
```

### 12.5 Layout e Estrutura

```
┌─────────────────────────────────────────────────────┐
│  HEADER (Navbar)                                    │
│  Logo │ Menu │ Notificações │ Perfil               │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ SIDEBAR  │         MAIN CONTENT                    │
│          │                                          │
│ Menu    │  Dashboard / Kanban / Inbox / etc        │
│ Items   │                                          │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

**Sidebar:** Logo no topo, menu principal (Dashboard, Kanban, Inbox, Calendário, Settings), ícones + texto, collapse em mobile, highlight do item ativo.

**Header:** Logo/marca, busca global (opcional), notificações (bell icon), perfil (avatar + menu), dark mode toggle (opcional).

### 12.6 Espaçamento e Grid

| Elemento | Tamanho |
|---|---|
| Padding base | 16px |
| Margin base | 16px |
| Gap entre elementos | 12px |
| Gap entre seções | 24px |
| Border radius | 8px (padrão), 12px (modal) |
| Sombra | 0 1px 3px rgba(0,0,0,0.1) |

### 12.7 Responsividade

| Breakpoint | Tamanho | Comportamento |
|---|---|---|
| Mobile | < 640px | Sidebar colapsado, stack vertical |
| Tablet | 640px - 1024px | Sidebar pequeno, layout adaptado |
| Desktop | > 1024px | Layout completo |

### 12.8 Ícones

Usar **Lucide React** ou **Heroicons**:

- Dashboard: `LayoutDashboard`
- Kanban: `Trello`
- Inbox: `Mail`
- Calendário: `Calendar`
- Settings: `Settings`
- Usuários: `Users`
- Logout: `LogOut`

### 12.9 Animações

- Transições: 200ms ease-in-out
- Hover: Mudança de cor suave
- Drag-and-drop: Feedback visual (shadow, opacity)
- Modals: Fade in (100ms)
- Notificações: Slide in (300ms)

### 12.10 Acessibilidade

- ✅ Contraste WCAG AA (4.5:1 para texto)
- ✅ Navegação por teclado (Tab, Enter, Escape)
- ✅ ARIA labels para screen readers
- ✅ Focus states visíveis
- ✅ Sem dependência de cor apenas

---

## 13. Modelo de Dados Inicial

### 13.1 Tabelas Mínimas (Fase 1)

```sql
-- Tenants (Escritórios)
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  cnpj VARCHAR(18),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Users (Usuários)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  email VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  role VARCHAR(50), -- admin, manager, lawyer, secretary, viewer
  status VARCHAR(50), -- active, inactive
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Leads (Leads/Clientes)
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  cpf VARCHAR(14),
  case_type VARCHAR(100), -- tipo de caso jurídico
  urgency VARCHAR(50), -- low, medium, high
  origin VARCHAR(50), -- whatsapp, website, manual
  responsible_user_id UUID REFERENCES users(id),
  stage_id UUID REFERENCES lead_stages(id),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Lead Stages (Estágios do Funil)
CREATE TABLE lead_stages (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(100), -- Novo, Qualificado, Proposta, etc
  order INT,
  color VARCHAR(7), -- hex color
  created_at TIMESTAMP
);

-- Lead Messages (Mensagens)
CREATE TABLE lead_messages (
  id UUID PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  tenant_id UUID REFERENCES tenants(id),
  sender VARCHAR(50), -- user, agent, client
  sender_id UUID,
  message TEXT,
  source VARCHAR(50), -- whatsapp, website, internal
  created_at TIMESTAMP
);

-- Appointments (Agendamentos)
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  description TEXT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status VARCHAR(50), -- scheduled, confirmed, cancelled
  google_calendar_id VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Integrations (Integrações)
CREATE TABLE integrations (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(100), -- whatsapp, google_calendar, escavador, etc
  status VARCHAR(50), -- active, inactive
  credentials JSONB, -- dados sensíveis (criptografados)
  config JSONB, -- configurações
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Notifications (Notificações)
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(50), -- lead, message, appointment, etc
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);

-- Agent Logs (Logs do Agente)
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  lead_id UUID REFERENCES leads(id),
  action VARCHAR(100), -- triagem, qualificação, handoff, etc
  details JSONB,
  created_at TIMESTAMP
);
```

### 13.2 Relacionamentos

```
tenants (1) ──→ (N) users
tenants (1) ──→ (N) leads
tenants (1) ──→ (N) lead_stages
tenants (1) ──→ (N) lead_messages
tenants (1) ──→ (N) appointments
tenants (1) ──→ (N) integrations
tenants (1) ──→ (N) notifications
tenants (1) ──→ (N) agent_logs

users (1) ──→ (N) leads (responsible)
users (1) ──→ (N) appointments
users (1) ──→ (N) notifications

leads (1) ──→ (N) lead_messages
leads (1) ──→ (N) appointments
leads (1) ──→ (N) agent_logs

lead_stages (1) ──→ (N) leads
```

---

## 14. Papel do n8n Dentro da Lexia

### 14.1 n8n Não É o Produto Visível

O n8n é o **motor operacional**, não a interface.

### 14.2 Responsabilidades do n8n

- ✅ Receber mensagens (webhook do WhatsApp)
- ✅ Classificar intenção
- ✅ Chamar LLM (Claude/OpenAI)
- ✅ Consultar integrações (Escavador, ADVBOX)
- ✅ Salvar eventos no banco (Supabase)
- ✅ Mover lead de estágio
- ✅ Notificar (criar notificações)
- ✅ Acionar handoff (transbordo para humano)
- ✅ Criar ou atualizar dados do CRM

### 14.3 Fluxo Operacional

```
Cliente envia mensagem via WhatsApp
         ↓
n8n recebe (webhook)
         ↓
n8n classifica intenção (IA)
         ↓
n8n consulta contexto (Supabase)
         ↓
n8n chama Claude/OpenAI
         ↓
n8n salva resposta no banco
         ↓
n8n envia mensagem via WhatsApp
         ↓
n8n notifica plataforma (Realtime Supabase)
         ↓
Advogado vê no painel (Inbox)
```

### 14.4 Separação de Responsabilidades

| Camada | Responsável |
|---|---|
| Interface | Next.js (o que o usuário vê) |
| Dados | Supabase (onde os dados vivem) |
| Automação | n8n (o que faz as coisas acontecerem) |

---

## 15. Posicionamento de Mercado Atualizado

### 15.1 O Que NÃO Vender

A Lexia não será vendida como:

- ❌ "Um chatbot jurídico"
- ❌ "Uma IA conversacional"
- ❌ "Um agente de WhatsApp"

### 15.2 O Que Vender

> **Uma plataforma de operação comercial e atendimento jurídico com IA integrada**

### 15.3 Mensagem Central

- ✅ Centraliza o atendimento (WhatsApp + site)
- ✅ Organiza o funil (Kanban visual)
- ✅ Melhora resposta (IA + automação)
- ✅ Automatiza triagem (qualificação inteligente)
- ✅ Integra agenda (Google Calendar)
- ✅ Prepara monitoramento processual (Escavador, Datajud)

### 15.4 Por Que Isso É Mais Forte

- 🎯 Múltiplos concorrentes têm IA
- 🎯 Poucos têm integração completa
- 🎯 O lock-in é maior (cliente usa tudo)
- 🎯 Margem é melhor (substitui múltiplas ferramentas)

---

## 16. Roadmap Atualizado

### Fase 1: Fundação do SaaS (8–10 semanas)

**Objetivo:** Tirar a Lexia do estágio "agente funcional" e levar para "plataforma mínima utilizável".

**Entregas:**
- ✅ Projeto Next.js configurado
- ✅ Supabase com banco de dados
- ✅ Autenticação (email/senha)
- ✅ Multi-tenant (isolamento de dados)
- ✅ Usuários e permissões
- ✅ Estrutura de leads
- ✅ Estágios do funil
- ✅ Mensagens (histórico)
- ✅ Layout base (sidebar, header)
- ✅ Dashboard v1 (métricas básicas)
- ✅ Kanban v1 (drag-and-drop)
- ✅ Settings básicos

> **Saída:** Plataforma funcional, sem agente integrado ainda.

---

### Fase 2: Operação Central (8–10 semanas)

**Objetivo:** Ligar o motor da IA ao CRM.

**Entregas:**
- ✅ Inbox (conversas centralizadas)
- ✅ Timeline de conversa
- ✅ Gravação de eventos do agente no banco
- ✅ Notificações internas
- ✅ Handoff visível no painel
- ✅ Calendário v1 (visualização)
- ✅ Integração n8n ↔ Supabase
- ✅ Realtime (atualização ao vivo)
- ✅ Permissões granulares

> **Saída:** Plataforma + agente conversando com CRM.

---

### Fase 3: Integrações Reais (8–10 semanas)

**Objetivo:** Sair da plataforma organizada para plataforma conectada.

**Entregas:**
- ✅ Google Calendar (sincronização)
- ✅ ADVBOX (leitura de clientes)
- ✅ Escavador (consulta de processos)
- ✅ Regras de monitoramento
- ✅ Callbacks (webhooks)
- ✅ Consulta de processo por CPF
- ✅ Notificações de movimentações

> **Saída:** Plataforma conectada com principais integrações.

---

### Fase 4: SaaS Comercial Completo (8–10 semanas)

**Objetivo:** Preparar escala e monetização.

**Entregas:**
- ✅ Onboarding mais maduro
- ✅ Billing (Stripe)
- ✅ Planos (Freemium, Starter, Professional, Enterprise)
- ✅ Governança de integrações
- ✅ Observabilidade (Sentry, PostHog)
- ✅ Relatórios melhores
- ✅ Documentação
- ✅ Suporte

> **Saída:** Plataforma pronta para venda e escala.

---

## 17. Riscos Atuais

### 17.1 Risco: Complexidade Prematura

**Risco:** Tentar construir IA + CRM + agenda + monitoramento + documentos + billing + múltiplas integrações ao mesmo tempo.

**Impacto:** Projeto fica lento, nada sai, time fica frustrado.

**Mitigação:** Manter foco no MVP central (Fase 1).

---

### 17.2 Risco: Plataforma Bonita Sem Núcleo

**Risco:** Construir front antes de modelar dados.

**Impacto:** Telas bonitas, mas sem dados por trás. Refatoração massiva depois.

**Mitigação:** Fundação começa por banco, auth e domínio. UI vem depois.

---

### 17.3 Risco: Dependência de Integrações Externas

**Risco:** ADVBOX e Escavador agregam valor, mas bloqueiam o nascimento do SaaS.

**Impacto:** Plataforma não sai porque está esperando integração.

**Mitigação:** Produto nasce independente; integrações entram por fases.

---

### 17.4 Risco: Multiplicação Operacional Cedo Demais

**Risco:** Criar muitos workflows separados por escritório sem necessidade.

**Impacto:** Complexidade operacional explode, n8n fica ingerenciável.

**Mitigação:** No MVP, seguir com 1 fluxo principal.

---

## 18. Considerações Estratégicas

1. O agente já está bom o bastante para deixar de ser o foco principal da construção.
2. A prioridade agora é a camada de produto (plataforma web, banco, multi-tenant).
3. Vamos construir a Lexia como um CRM jurídico com IA embutida, e não como uma IA tentando depois ganhar um painel.
4. A arquitetura escolhida é pragmática: App web em Next.js, banco e auth em Supabase, operações e automações em n8n.
5. Lovable pode acelerar a interface, mas não comandará a arquitetura.
6. Integrações serão tratadas como módulos acopláveis, não como bloqueadores.
7. No MVP, vamos manter simplicidade operacional máxima: 1 fluxo principal, 1 agente principal, 1 arquitetura clara, sem multiplicação desnecessária.
8. O primeiro grande objetivo não é "ter todas as features". É ter Login, Leads, Kanban, Inbox, Dashboard, Calendário e Settings funcionando como produto de verdade.

---

## 19. Próximo Passo Oficial

### Ordem de Execução

1. **Criar o projeto Next.js** — Setup inicial, estrutura de pastas, TypeScript, Tailwind + shadcn/ui
2. **Criar o projeto Supabase** — Banco de dados PostgreSQL, autenticação, políticas de RLS
3. **Modelar o banco inicial** — Criar tabelas (tenants, users, leads, etc.), relacionamentos, índices
4. **Ligar autenticação** — Login/logout, recuperação de senha, sessão persistente
5. **Montar layout base** — Sidebar, header, navegação
6. **Construir Kanban/Leads primeiro** — CRUD de leads, drag-and-drop, filtros

### Estimativa

| Fase | Duração |
|---|---|
| Fase 1 — Fundação | 8–10 semanas |
| Fase 2 — Operação | 8–10 semanas |
| Fase 3 — Integrações | 8–10 semanas |
| Fase 4 — Comercial | 8–10 semanas |
| **Total** | **~6–9 meses** |

---

## Resumo Executivo

| Aspecto | Descrição |
|---|---|
| Nome | Lexia AI |
| Tipo | SaaS — CRM Jurídico com IA |
| Problema | Advogados com leads espalhados, sem organização, sem visibilidade |
| Solução | Plataforma integrada: CRM + IA + Automação + Integrações |
| MVP | Login, Leads, Kanban, Inbox, Dashboard, Calendário, Settings |
| Stack | Next.js + Supabase + n8n + Claude |
| Foco | Plataforma (não apenas IA) |
| Diferencial | Integração completa + IA + Monitoramento processual |
| Roadmap | 4 fases, 6–9 meses |
| Próximo Passo | Criar fundação (Next.js + Supabase) |
