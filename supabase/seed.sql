-- ============================================================
-- seed.sql
-- Dados de desenvolvimento para o projeto Lexia AI.
-- Aplicar APÓS as migrations (supabase db reset ou db push).
-- Cria: 1 tenant, 2 usuários, 6 estágios, 2 clientes,
--        3 leads, 1 caso, 2 processos, 3 radar items.
--
-- ATENÇÃO: Este seed usa UUIDs fixos para facilitar referências
-- cruzadas durante o desenvolvimento. Não usar em produção.
-- ============================================================

-- ── IDs fixos de desenvolvimento ─────────────────────────────────────────────
do $$
declare
  v_tenant_id   uuid := 'a1b2c3d4-0000-0000-0000-000000000001';
  v_admin_id    uuid := 'a1b2c3d4-0000-0000-0000-000000000002';
  v_lawyer_id   uuid := 'a1b2c3d4-0000-0000-0000-000000000003';
  v_stage_novo  uuid := 'a1b2c3d4-0000-0000-0000-000000000010';
  v_stage_qual  uuid := 'a1b2c3d4-0000-0000-0000-000000000011';
  v_stage_prop  uuid := 'a1b2c3d4-0000-0000-0000-000000000012';
  v_stage_cont  uuid := 'a1b2c3d4-0000-0000-0000-000000000013';
  v_stage_cli   uuid := 'a1b2c3d4-0000-0000-0000-000000000014';
  v_stage_perd  uuid := 'a1b2c3d4-0000-0000-0000-000000000015';
  v_client1_id  uuid := 'a1b2c3d4-0000-0000-0000-000000000020';
  v_client2_id  uuid := 'a1b2c3d4-0000-0000-0000-000000000021';
  v_lead1_id    uuid := 'a1b2c3d4-0000-0000-0000-000000000030';
  v_lead2_id    uuid := 'a1b2c3d4-0000-0000-0000-000000000031';
  v_lead3_id    uuid := 'a1b2c3d4-0000-0000-0000-000000000032';
  v_caso1_id    uuid := 'a1b2c3d4-0000-0000-0000-000000000040';
  v_processo1_id uuid := 'a1b2c3d4-0000-0000-0000-000000000050';
  v_processo2_id uuid := 'a1b2c3d4-0000-0000-0000-000000000051';
begin

-- ── Tenant ───────────────────────────────────────────────────────────────────
insert into tenants (id, name, display_name, cnpj, email, phone, timezone, primary_practice_area, onboarding_completed, address, agent_config)
values (
  v_tenant_id,
  'Ferreira & Oliveira Advogados Associados',
  'Ferreira & Oliveira',
  '12.345.678/0001-90',
  'contato@ferreiraoliveira.adv.br',
  '(11) 3456-7890',
  'America/Sao_Paulo',
  'Trabalhista',
  true,
  '{"street":"Av. Paulista","number":"1578","complement":"Sala 42","city":"São Paulo","state":"SP","zip":"01310-200"}'::jsonb,
  '{"tone":"neutral","practiceAreas":["Trabalhista","Cível"],"greetingMessage":"Olá! Sou a assistente virtual do escritório Ferreira & Oliveira. Como posso ajudar?","businessHours":[{"dayOfWeek":1,"enabled":true,"start":"08:00","end":"18:00"},{"dayOfWeek":2,"enabled":true,"start":"08:00","end":"18:00"},{"dayOfWeek":3,"enabled":true,"start":"08:00","end":"18:00"},{"dayOfWeek":4,"enabled":true,"start":"08:00","end":"18:00"},{"dayOfWeek":5,"enabled":true,"start":"08:00","end":"18:00"},{"dayOfWeek":6,"enabled":false,"start":"08:00","end":"12:00"},{"dayOfWeek":0,"enabled":false,"start":"08:00","end":"12:00"}]}'::jsonb
);

-- ── Usuários (referências a auth.users — devem existir no Supabase Auth) ─────
-- Em desenvolvimento, criar via Supabase Dashboard ou CLI antes de rodar este seed.
-- Os IDs devem bater com os do auth.users criados manualmente.
-- Comentado para evitar erro de FK em ambiente limpo:
/*
insert into users (id, tenant_id, name, email, role, status)
values
  (v_admin_id,  v_tenant_id, 'Rodrigo Ferreira', 'rodrigo@ferreiraoliveira.adv.br', 'admin', 'active'),
  (v_lawyer_id, v_tenant_id, 'Ana Oliveira',     'ana@ferreiraoliveira.adv.br',     'lawyer', 'active');
*/

-- ── Estágios padrão do funil ─────────────────────────────────────────────────
insert into lead_stages (id, tenant_id, name, color, position, is_default, is_terminal)
values
  (v_stage_novo, v_tenant_id, 'Novo',        '#3B82F6', 0, true, false),
  (v_stage_qual, v_tenant_id, 'Qualificado', '#8B5CF6', 1, true, false),
  (v_stage_prop, v_tenant_id, 'Proposta',    '#FBBF24', 2, true, false),
  (v_stage_cont, v_tenant_id, 'Contrato',    '#34D399', 3, true, false),
  (v_stage_cli,  v_tenant_id, 'Cliente',     '#10B981', 4, true, true),
  (v_stage_perd, v_tenant_id, 'Perdido',     '#9CA3AF', 5, true, true);

-- ── OABs dos advogados ───────────────────────────────────────────────────────
-- (sem user_id pois users comentados acima — ajustar em ambiente com auth)
/*
insert into lawyer_oabs (tenant_id, user_id, oab_number, oab_state, is_primary)
values
  (v_tenant_id, v_admin_id,  '345678', 'SP', true),
  (v_tenant_id, v_lawyer_id, '456789', 'SP', true);
*/

-- ── Clientes ─────────────────────────────────────────────────────────────────
insert into clients (id, tenant_id, name, cpf, email, phone)
values
  (v_client1_id, v_tenant_id, 'José da Silva Santos',  '123.456.789-00', 'jose.silva@gmail.com',     '(11) 98765-4321'),
  (v_client2_id, v_tenant_id, 'Maria Fernanda Costa',  '987.654.321-00', 'maria.costa@hotmail.com',  '(11) 91234-5678');

-- ── Leads ────────────────────────────────────────────────────────────────────
insert into leads (id, tenant_id, name, email, phone, stage_id, origin, urgency, subject, area)
values
  (v_lead1_id, v_tenant_id, 'João Pedro Almeida',   'joao@email.com',  '(11) 94444-1111', v_stage_qual, 'whatsapp', 'Alta',  'Fui demitido sem justa causa após 8 anos de empresa', 'Trabalhista'),
  (v_lead2_id, v_tenant_id, 'Carla Mendes Lima',    'carla@email.com', '(11) 95555-2222', v_stage_novo, 'web',      'Baixa', 'Divórcio consensual, temos filhos menores',           'Família'),
  (v_lead3_id, v_tenant_id, 'Roberto Nascimento',   'rob@email.com',   '(11) 96666-3333', v_stage_prop, 'manual',   'Media', 'Acidente de trabalho com afastamento pelo INSS',       'Trabalhista');

-- ── Caso ─────────────────────────────────────────────────────────────────────
insert into casos (id, tenant_id, client_id, titulo, area, status, numero_interno, lead_id, descricao, data_abertura)
values (
  v_caso1_id,
  v_tenant_id,
  v_client1_id,
  'Rescisão Indireta — José da Silva Santos',
  'Trabalhista',
  'Ativo',
  '2024-TRB-001',
  v_lead1_id,
  'Cliente trabalhou por 8 anos e foi demitido sem justa causa. Apurar verbas rescisórias e possível rescisão indireta por irregularidades no FGTS.',
  now() - interval '45 days'
);

-- ── Caso Timeline ─────────────────────────────────────────────────────────────
insert into caso_timeline (tenant_id, caso_id, tipo, titulo, descricao, is_automated)
values
  (v_tenant_id, v_caso1_id, 'criacao',          'Caso aberto',                        'Caso criado a partir do lead João Pedro Almeida.', true),
  (v_tenant_id, v_caso1_id, 'nota_interna',     'Reunião inicial realizada',           'Reunião com cliente para coleta de documentos. Solicitados: CTPS, holerites dos últimos 12 meses, TRCT.', false),
  (v_tenant_id, v_caso1_id, 'documento_anexado','Documentos recebidos',                'CTPS e holerites entregues pelo cliente.', false),
  (v_tenant_id, v_caso1_id, 'prazo_criado',     'Prazo: ajuizamento da reclamação',   'Prazo interno para protocolo da petição inicial.', false);

-- ── Processos (espelhos externos) ────────────────────────────────────────────
insert into processos (id, tenant_id, cnj_number, tribunal, vara, status, external_source, sync_status, classe, assunto, data_distribuicao)
values
  (v_processo1_id, v_tenant_id,
   '0012345-67.2024.5.02.0001',
   'TRT 2ª Região',
   '1ª Vara do Trabalho de São Paulo',
   'Em andamento',
   'cnj',
   'synced',
   'Reclamação Trabalhista',
   'Rescisão do contrato de trabalho',
   '2024-03-15'
  ),
  (v_processo2_id, v_tenant_id,
   '0098765-43.2023.8.26.0100',
   'TJSP',
   '12ª Vara Cível de São Paulo',
   'Em andamento',
   'escavador',
   'stale',
   'Ação de Cobrança',
   'Contrato',
   '2023-11-20'
  );

-- ── Vínculo Caso → Processo ───────────────────────────────────────────────────
insert into case_process_links (tenant_id, caso_id, processo_id, is_primary)
values (v_tenant_id, v_caso1_id, v_processo1_id, true);

-- ── Radar Items ───────────────────────────────────────────────────────────────
insert into radar_items (tenant_id, caso_id, processo_id, tipo, urgencia, status, origem, titulo, descricao, exige_acao, caso_titulo, cliente_nome)
values
  (v_tenant_id, v_caso1_id, v_processo1_id,
   'movimentacao', 'Alta', 'novo', 'cnj',
   'Despacho de pauta de audiência',
   'O processo foi pautado para audiência de instrução e julgamento no dia 15/06/2025.',
   true,
   'Rescisão Indireta — José da Silva Santos',
   'José da Silva Santos'
  ),
  (v_tenant_id, v_caso1_id, null,
   'alerta_prazo', 'Alta', 'novo', 'interno',
   'Prazo: protocolo da petição inicial',
   'Prazo interno para protocolo da petição inicial vence em 5 dias.',
   true,
   'Rescisão Indireta — José da Silva Santos',
   'José da Silva Santos'
  ),
  (v_tenant_id, null, v_processo2_id,
   'publicacao', 'Media', 'em_analise', 'escavador',
   'Publicação no DJe — intimação para manifestação',
   'Publicação no Diário de Justiça Eletrônico com intimação para apresentar manifestação em 15 dias.',
   true,
   null,
   null
  );

end $$;
