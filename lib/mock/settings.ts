import type { OfficeSettings, AgentSettings, Integration } from '@/types/settings'

export const MOCK_OFFICE: OfficeSettings = {
  id: 'office-1',
  tenantId: 'tenant-1',
  name: 'Ferreira & Associados Advocacia Ltda.',
  displayName: 'Ferreira Advocacia',
  cnpj: '12.345.678/0001-90',
  email: 'contato@ferreiraadvocacia.com.br',
  phone: '(11) 3456-7890',
  address: {
    street: 'Av. Paulista',
    number: '1578',
    complement: 'Cj. 82',
    city: 'São Paulo',
    state: 'SP',
    zip: '01310-200',
  },
  timezone: 'America/Sao_Paulo',
  primaryPracticeArea: 'Trabalhista',
  logoUrl: undefined,
  updatedAt: '2026-04-10T09:00:00Z',
}

export const MOCK_AGENT: AgentSettings = {
  id: 'agent-1',
  tenantId: 'tenant-1',
  tone: 'neutral',
  practiceAreas: ['Trabalhista', 'Cível', 'Previdenciário'],
  businessHours: [
    { dayOfWeek: 0, enabled: false, start: '08:00', end: '18:00' },
    { dayOfWeek: 1, enabled: true,  start: '08:00', end: '18:00' },
    { dayOfWeek: 2, enabled: true,  start: '08:00', end: '18:00' },
    { dayOfWeek: 3, enabled: true,  start: '08:00', end: '18:00' },
    { dayOfWeek: 4, enabled: true,  start: '08:00', end: '18:00' },
    { dayOfWeek: 5, enabled: true,  start: '08:00', end: '17:00' },
    { dayOfWeek: 6, enabled: false, start: '09:00', end: '12:00' },
  ],
  greetingMessage:
    'Olá! Sou o assistente virtual da Ferreira Advocacia. Como posso ajudar você hoje?',
  closingMessage:
    'Obrigado pelo contato! Em breve um de nossos advogados retornará. Tenha um ótimo dia!',
  outOfHoursMessage:
    'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Deixe sua mensagem e retornaremos assim que possível.',
  noContextMessage:
    'Para essa questão precisamos de mais informações. Vou transferir você para um de nossos especialistas.',
  handoffRules: {
    autoHandoffOnKeywords: ['urgente', 'processo', 'prazo', 'intimação', 'advogado', 'reunião'],
    handoffAfterXMessages: 8,
    handoffMessage:
      'Estou te conectando com um advogado da nossa equipe. Aguarde um momento.',
    notifyUserId: 'user-5',
    fallbackOnNoContext: true,
    fallbackOnOutOfHours: false,
  },
  activeChannels: ['whatsapp'],
  updatedAt: '2026-04-10T09:00:00Z',
}

export const MOCK_INTEGRATIONS: Integration[] = [
  {
    id: 'int-whatsapp',
    type: 'whatsapp',
    name: 'WhatsApp',
    description: 'Receba e responda mensagens de clientes via WhatsApp. Canal principal de triagem e qualificação de leads pelo agente IA.',
    status: 'connected',
    connected: true,
    enabled: true,
    lastSyncAt: 'há 3 minutos',
    primaryAction: 'Gerenciar',
    logoIcon: 'MessageCircle',
  },
  {
    id: 'int-gcal',
    type: 'google_calendar',
    name: 'Google Calendar',
    description: 'Sincronize compromissos, audiências e prazos com o Google Calendar. Mantenha sua agenda sempre atualizada.',
    status: 'disconnected',
    connected: false,
    enabled: false,
    lastSyncAt: undefined,
    primaryAction: 'Conectar',
    logoIcon: 'CalendarDays',
  },
  {
    id: 'int-escavador',
    type: 'escavador',
    name: 'Escavador',
    description: 'Monitoramento processual automático por CPF/CNPJ. Receba alertas de novas movimentações diretamente no Radar.',
    status: 'coming_soon',
    connected: false,
    enabled: false,
    lastSyncAt: undefined,
    primaryAction: 'Em breve',
    logoIcon: 'Search',
  },
  {
    id: 'int-advbox',
    type: 'advbox',
    name: 'ADVBOX',
    description: 'Importe clientes, processos e documentos do ADVBOX para a Lexia AI sem precisar redigitar dados existentes.',
    status: 'coming_soon',
    connected: false,
    enabled: false,
    lastSyncAt: undefined,
    primaryAction: 'Em breve',
    logoIcon: 'FolderSync',
  },
]
