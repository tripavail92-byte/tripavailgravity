import { supabase } from '@/lib/supabase'

export type BookingConversationScope = 'tour_booking' | 'package_booking'
export type BookingParticipantRole = 'traveler' | 'operator' | 'owner' | 'co_host' | 'support'

export interface ConversationSummary {
  conversation_id: string
  booking_scope: BookingConversationScope
  booking_id: string
  subject: string | null
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  is_archived: boolean
  participant_role: BookingParticipantRole
  partner_name: string
  traveler_name: string
  booking_label: string
}

export interface ConversationMessage {
  message_id: string
  conversation_id: string
  sender_id: string
  sender_role: BookingParticipantRole
  message_kind: string
  body: string | null
  created_at: string
  edited_at: string | null
  unsent_at: string | null
}

export async function listConversations(includeArchived = false): Promise<ConversationSummary[]> {
  const { data, error } = await supabase.rpc('messaging_list_conversations', {
    p_include_archived: includeArchived,
    p_limit: 50,
    p_offset: 0,
  })
  if (error) throw error
  return (data ?? []) as ConversationSummary[]
}

export async function getMessages(
  conversationId: string,
  before?: string | null,
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase.rpc('messaging_get_conversation_messages', {
    p_conversation_id: conversationId,
    p_limit: 100,
    p_before: before ?? null,
  })
  if (error) throw error
  return (data ?? []) as ConversationMessage[]
}

export async function sendMessage(
  conversationId: string,
  body: string,
): Promise<{ messageId: string; createdAt: string }> {
  const { data, error } = await supabase.rpc('messaging_send_message', {
    p_conversation_id: conversationId,
    p_body: body,
    p_message_kind: 'text',
    p_reply_to_message_id: null,
    p_body_rich: {},
    p_metadata: {},
  })
  if (error) throw error
  const row: any = Array.isArray(data) ? data[0] : data
  return { messageId: row?.message_id, createdAt: row?.created_at }
}

export async function markConversationRead(
  conversationId: string,
  throughMessageId?: string | null,
): Promise<number> {
  const { data, error } = await supabase.rpc('messaging_mark_conversation_read', {
    p_conversation_id: conversationId,
    p_through_message_id: throughMessageId ?? null,
  })
  if (error) throw error
  return Number(data ?? 0)
}

export async function getOrCreateConversation(
  scope: BookingConversationScope,
  bookingId: string,
): Promise<{ conversationId: string; created: boolean }> {
  const { data, error } = await supabase.rpc('messaging_get_or_create_booking_conversation', {
    p_booking_scope: scope,
    p_booking_id: bookingId,
  })
  if (error) throw error
  const row: any = Array.isArray(data) ? data[0] : data
  return { conversationId: row?.conversation_id, created: Boolean(row?.created) }
}
