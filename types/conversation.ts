export type MessageSender = 'client' | 'agent' | 'user'
export type MessageSource = 'WhatsApp' | 'site'

export interface Message {
  id: string
  conversationId: string
  sender: MessageSender
  senderName: string // e.g. "Ana Lima", "Agente IA", "Dr. Carlos"
  content: string
  timestamp: string // ISO 8601
  isHandoff?: boolean // true na mensagem que disparou o handoff
}

export interface Conversation {
  id: string
  leadId: string
  leadName: string
  leadEmail: string
  leadPhone: string
  leadStatus: string // estágio no pipeline
  responsible: string
  source: MessageSource
  lastMessage: string // preview
  lastMessageAt: string // ISO 8601
  unreadCount: number
  hasHandoff: boolean
}
