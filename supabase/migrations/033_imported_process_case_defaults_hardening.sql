-- ============================================================
-- 033_imported_process_case_defaults_hardening.sql
-- Hardening dos defaults da criacao manual de caso a partir de
-- processo importado.
--
-- Objetivos:
-- - nao inventar client_id quando nao houver cliente confiavel
-- - nao classificar juridicamente como "Civel" por default tecnico
-- ============================================================

alter type caso_area add value if not exists 'A definir';

alter table casos
  alter column client_id drop not null;
