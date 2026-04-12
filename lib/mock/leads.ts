// lib/mock/leads.ts
// Dados mock mantidos para referência durante desenvolvimento.
// As páginas de leads agora buscam dados reais do Supabase.
// Este arquivo é usado apenas por componentes do Kanban que ainda não foram migrados.

import type { LeadTriage, UrgencyLevel } from '@/types/lead'

// Exportado para uso no LeadTriagePanel (fallback visual durante dev)
export const URGENCY_COLORS: Record<UrgencyLevel, string> = {
  Alta:  '#EF4444',
  Média: '#F97316',
  Baixa: '#10B981',
}

// Triagem mock — mantida para referência, não usada em runtime
export const MOCK_LEAD_TRIAGE: Record<string, LeadTriage> = {
  'lead-001': {
    legalArea: 'Família',
    demandSummary: 'Divórcio amigável com partilha de bens imóveis. Cliente apresenta documentação completa e ambas as partes estão de acordo.',
    urgency: 'Baixa',
    routingSuggestion: 'Dr. Carlos Mendes — Especialista em Direito de Família',
    intakeCards: [
      { id: 'tc-001-1', title: 'Documentação recebida', content: 'RG, CPF, certidão de casamento, comprovante de residência, matrícula dos imóveis.' },
      { id: 'tc-001-2', title: 'Próximos passos', content: 'Elaborar minuta do acordo de divórcio e agendar reunião para assinatura.' },
    ],
  },
  'lead-002': {
    legalArea: 'Trabalhista',
    demandSummary: 'Disputa trabalhista com ex-funcionário que alega horas extras não pagas e rescisão indevida.',
    urgency: 'Alta',
    routingSuggestion: 'Dra. Mariana Costa — Especialista em Direito Trabalhista',
    intakeCards: [
      { id: 'tc-002-1', title: 'Documentação necessária', content: 'Cartão de ponto, contracheques dos últimos 12 meses, TRCT assinado.' },
      { id: 'tc-002-2', title: 'Prazo identificado', content: 'Notificação trabalhista com prazo de resposta em 10 dias úteis.' },
    ],
  },
}
