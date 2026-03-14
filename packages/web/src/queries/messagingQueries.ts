import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'

import {
  bookingMessengerService,
  type BookingConversationMessage,
  type BookingConversationScope,
  type BookingConversationSummary,
} from '@/features/messaging/services/bookingMessengerService'

export const messagingKeys = {
  all: ['messaging'] as const,
  conversations: (includeArchived: boolean, limit: number, offset: number) =>
    [...messagingKeys.all, 'conversations', includeArchived, limit, offset] as const,
  messages: (conversationId: string) => [...messagingKeys.all, 'messages', conversationId] as const,
}

export function useBookingConversations(
  params?: {
    includeArchived?: boolean
    limit?: number
    offset?: number
  },
  options?: Omit<UseQueryOptions<BookingConversationSummary[], Error>, 'queryKey' | 'queryFn'>,
) {
  const includeArchived = params?.includeArchived ?? false
  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  return useQuery({
    queryKey: messagingKeys.conversations(includeArchived, limit, offset),
    queryFn: () => bookingMessengerService.listConversations(params),
    staleTime: 15 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  })
}

export function useBookingConversationMessages(
  conversationId: string | undefined,
  options?: Omit<UseQueryOptions<BookingConversationMessage[], Error>, 'queryKey' | 'queryFn'>,
) {
  return useQuery({
    queryKey: messagingKeys.messages(conversationId || ''),
    queryFn: () => bookingMessengerService.getConversationMessages(conversationId!),
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: Boolean(conversationId),
    ...options,
  })
}

export function useEnsureBookingConversation(
  options?: Omit<
    UseMutationOptions<
      { conversationId: string; created: boolean },
      Error,
      { scope: BookingConversationScope; bookingId: string }
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ scope, bookingId }: { scope: BookingConversationScope; bookingId: string }) =>
      bookingMessengerService.getOrCreateConversation(scope, bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.all })
    },
    ...options,
  })
}

export function useSendBookingMessage(
  options?: Omit<
    UseMutationOptions<
      { messageId: string; createdAt: string },
      Error,
      Parameters<typeof bookingMessengerService.sendMessage>[0]
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: Parameters<typeof bookingMessengerService.sendMessage>[0]) =>
      bookingMessengerService.sendMessage(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages(variables.conversationId) })
      queryClient.invalidateQueries({ queryKey: messagingKeys.all })
    },
    ...options,
  })
}

export function useMarkConversationRead(
  options?: Omit<
    UseMutationOptions<number, Error, { conversationId: string; throughMessageId?: string | null }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ conversationId, throughMessageId }) =>
      bookingMessengerService.markConversationRead(conversationId, throughMessageId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages(variables.conversationId) })
      queryClient.invalidateQueries({ queryKey: messagingKeys.all })
    },
    ...options,
  })
}

export function useUpdateConversationPreferences(
  options?: Omit<
    UseMutationOptions<
      { conversationId: string; isArchived: boolean; isMuted: boolean; updatedAt: string },
      Error,
      { conversationId: string; isArchived?: boolean | null; isMuted?: boolean | null }
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { conversationId: string; isArchived?: boolean | null; isMuted?: boolean | null }) =>
      bookingMessengerService.updateConversationPreferences(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages(variables.conversationId) })
      queryClient.invalidateQueries({ queryKey: messagingKeys.all })
    },
    ...options,
  })
}

export function useEditBookingMessage(
  options?: Omit<
    UseMutationOptions<
      { messageId: string; editedAt: string },
      Error,
      Parameters<typeof bookingMessengerService.editMessage>[0]
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: Parameters<typeof bookingMessengerService.editMessage>[0]) =>
      bookingMessengerService.editMessage(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.all })
    },
    ...options,
  })
}

export function useUnsendBookingMessage(
  options?: Omit<
    UseMutationOptions<{ messageId: string; unsentAt: string }, Error, { messageId: string }>,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ messageId }: { messageId: string }) => bookingMessengerService.unsendMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.all })
    },
    ...options,
  })
}

export function useToggleMessageReaction(
  options?: Omit<
    UseMutationOptions<
      { messageId: string; emoji: string; active: boolean; reactionCount: number },
      Error,
      { messageId: string; emoji: string }
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { messageId: string; emoji: string }) =>
      bookingMessengerService.toggleReaction(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.all })
    },
    ...options,
  })
}

export function useReportConversationMessage(
  options?: Omit<
    UseMutationOptions<
      { reportId: string; createdAt: string },
      Error,
      Parameters<typeof bookingMessengerService.reportMessage>[0]
    >,
    'mutationFn'
  >,
) {
  return useMutation({
    mutationFn: (params: Parameters<typeof bookingMessengerService.reportMessage>[0]) =>
      bookingMessengerService.reportMessage(params),
    ...options,
  })
}

export function useEscalateConversationSupport(
  options?: Omit<
    UseMutationOptions<
      { conversationId: string; supportEscalatedAt: string; supportParticipantsAdded: number },
      Error,
      Parameters<typeof bookingMessengerService.escalateSupport>[0]
    >,
    'mutationFn'
  >,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: Parameters<typeof bookingMessengerService.escalateSupport>[0]) =>
      bookingMessengerService.escalateSupport(params),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages(variables.conversationId) })
      queryClient.invalidateQueries({ queryKey: messagingKeys.all })
    },
    ...options,
  })
}