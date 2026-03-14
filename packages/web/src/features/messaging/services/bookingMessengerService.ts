import { supabase } from '@/lib/supabase'

export type BookingConversationScope = 'tour_booking' | 'package_booking'
export type BookingConversationStatus = 'active' | 'closed' | 'blocked'
export type BookingParticipantRole = 'traveler' | 'operator' | 'owner' | 'co_host' | 'support'
export type BookingMessageKind =
  | 'text'
  | 'system'
  | 'quick_reply'
  | 'scheduled_quick_reply'
  | 'attachment'
  | 'recommendation'
  | 'support_note'

export interface BookingConversationSummary {
  conversation_id: string
  booking_scope: BookingConversationScope
  booking_id: string
  subject: string | null
  status: BookingConversationStatus
  updated_at: string
  last_message_at: string | null
  last_message_preview: string | null
  unread_count: number
  is_archived: boolean
  is_muted: boolean
  participant_role: BookingParticipantRole
  traveler_id: string
  traveler_name: string
  partner_id: string
  partner_name: string
  booking_label: string
}

export interface BookingConversationPreferencesResult {
  conversationId: string
  isArchived: boolean
  isMuted: boolean
  updatedAt: string
}

export interface BookingConversationMessage {
  message_id: string
  conversation_id: string
  sender_id: string
  sender_role: BookingParticipantRole
  message_kind: BookingMessageKind
  body: string | null
  body_rich: Record<string, unknown>
  translations: Record<string, unknown>
  reply_to_message_id: string | null
  created_at: string
  edited_at: string | null
  unsent_at: string | null
  metadata: Record<string, unknown>
  attachments: Array<Record<string, unknown>>
  reactions: Array<Record<string, unknown>>
  read_by: Array<Record<string, unknown>>
}

function ensureSingleRow<T>(data: T | T[] | null, errorMessage: string): T {
  const row = Array.isArray(data) ? data[0] : data

  if (!row) {
    throw new Error(errorMessage)
  }

  return row
}

export const bookingMessengerService = {
  async getOrCreateConversation(scope: BookingConversationScope, bookingId: string) {
    const { data, error } = await supabase.rpc('messaging_get_or_create_booking_conversation' as any, {
      p_booking_scope: scope,
      p_booking_id: bookingId,
    })

    if (error) throw error

    const row = ensureSingleRow<{ conversation_id: string; created: boolean }>(
      data,
      'Conversation was not returned',
    )

    return {
      conversationId: row.conversation_id,
      created: Boolean(row.created),
    }
  },

  async listConversations(options?: { includeArchived?: boolean; limit?: number; offset?: number }) {
    const { data, error } = await supabase.rpc('messaging_list_conversations' as any, {
      p_include_archived: options?.includeArchived ?? false,
      p_limit: options?.limit ?? 50,
      p_offset: options?.offset ?? 0,
    })

    if (error) throw error
    return (data ?? []) as BookingConversationSummary[]
  },

  async getConversationMessages(conversationId: string, options?: { limit?: number; before?: string | null }) {
    const { data, error } = await supabase.rpc('messaging_get_conversation_messages' as any, {
      p_conversation_id: conversationId,
      p_limit: options?.limit ?? 100,
      p_before: options?.before ?? null,
    })

    if (error) throw error
    return (data ?? []) as BookingConversationMessage[]
  },

  async sendMessage(params: {
    conversationId: string
    body: string
    messageKind?: BookingMessageKind
    replyToMessageId?: string | null
    bodyRich?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }) {
    const { data, error } = await supabase.rpc('messaging_send_message' as any, {
      p_conversation_id: params.conversationId,
      p_body: params.body,
      p_message_kind: params.messageKind ?? 'text',
      p_reply_to_message_id: params.replyToMessageId ?? null,
      p_body_rich: params.bodyRich ?? {},
      p_metadata: params.metadata ?? {},
    })

    if (error) throw error

    const row = ensureSingleRow<{ message_id: string; created_at: string }>(
      data,
      'Message send result was not returned',
    )

    return {
      messageId: row.message_id,
      createdAt: row.created_at,
    }
  },

  async markConversationRead(conversationId: string, throughMessageId?: string | null) {
    const { data, error } = await supabase.rpc('messaging_mark_conversation_read' as any, {
      p_conversation_id: conversationId,
      p_through_message_id: throughMessageId ?? null,
    })

    if (error) throw error
    return Number(data ?? 0)
  },

  async updateConversationPreferences(params: {
    conversationId: string
    isArchived?: boolean | null
    isMuted?: boolean | null
  }) {
    const { data, error } = await supabase.rpc('messaging_update_conversation_preferences' as any, {
      p_conversation_id: params.conversationId,
      p_is_archived: params.isArchived ?? null,
      p_is_muted: params.isMuted ?? null,
    })

    if (error) throw error

    const row = ensureSingleRow<{
      conversation_id: string
      is_archived: boolean
      is_muted: boolean
      updated_at: string
    }>(data, 'Conversation preferences result was not returned')

    return {
      conversationId: row.conversation_id,
      isArchived: row.is_archived,
      isMuted: row.is_muted,
      updatedAt: row.updated_at,
    } satisfies BookingConversationPreferencesResult
  },

  async editMessage(params: {
    messageId: string
    body: string
    bodyRich?: Record<string, unknown>
    metadata?: Record<string, unknown>
  }) {
    const { data, error } = await supabase.rpc('messaging_edit_message' as any, {
      p_message_id: params.messageId,
      p_body: params.body,
      p_body_rich: params.bodyRich ?? {},
      p_metadata: params.metadata ?? {},
    })

    if (error) throw error

    const row = ensureSingleRow<{ message_id: string; edited_at: string }>(
      data,
      'Message edit result was not returned',
    )

    return {
      messageId: row.message_id,
      editedAt: row.edited_at,
    }
  },

  async unsendMessage(messageId: string) {
    const { data, error } = await supabase.rpc('messaging_unsend_message' as any, {
      p_message_id: messageId,
    })

    if (error) throw error

    const row = ensureSingleRow<{ message_id: string; unsent_at: string }>(
      data,
      'Message unsend result was not returned',
    )

    return {
      messageId: row.message_id,
      unsentAt: row.unsent_at,
    }
  },

  async toggleReaction(params: { messageId: string; emoji: string }) {
    const { data, error } = await supabase.rpc('messaging_toggle_message_reaction' as any, {
      p_message_id: params.messageId,
      p_emoji: params.emoji,
    })

    if (error) throw error

    const row = ensureSingleRow<{
      message_id: string
      emoji: string
      active: boolean
      reaction_count: number
    }>(data, 'Reaction toggle result was not returned')

    return {
      messageId: row.message_id,
      emoji: row.emoji,
      active: Boolean(row.active),
      reactionCount: Number(row.reaction_count ?? 0),
    }
  },

  async reportMessage(params: {
    conversationId: string
    messageId?: string | null
    reason: string
    details?: string | null
  }) {
    const { data, error } = await supabase.rpc('messaging_report_conversation' as any, {
      p_conversation_id: params.conversationId,
      p_message_id: params.messageId ?? null,
      p_reason: params.reason,
      p_details: params.details ?? null,
    })

    if (error) throw error

    const row = ensureSingleRow<{ report_id: string; created_at: string }>(
      data,
      'Conversation report result was not returned',
    )

    return {
      reportId: row.report_id,
      createdAt: row.created_at,
    }
  },

  async escalateSupport(params: { conversationId: string; reason?: string | null }) {
    const { data, error } = await supabase.rpc('messaging_escalate_conversation_to_support' as any, {
      p_conversation_id: params.conversationId,
      p_reason: params.reason ?? null,
    })

    if (error) throw error

    const row = ensureSingleRow<{
      conversation_id: string
      support_escalated_at: string
      support_participants_added: number
    }>(data, 'Support escalation result was not returned')

    return {
      conversationId: row.conversation_id,
      supportEscalatedAt: row.support_escalated_at,
      supportParticipantsAdded: Number(row.support_participants_added ?? 0),
    }
  },
}