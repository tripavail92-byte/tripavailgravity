/**
 * NotificationBell — in-app notification bell for dashboard headers.
 * Shows unread count badge, drops down a list of notifications.
 * Marks all as read when opened.
 */
import { formatDistanceToNow } from 'date-fns'
import { Bell, CheckCheck, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'
import { useMarkNotificationsRead, useNotifications } from '@/queries/adminQueries'

const TYPE_ICONS: Record<string, string> = {
  verification_approved: '🎉',
  verification_rejected: '❌',
  verification_info_requested: '📋',
  default: '🔔',
}

export function NotificationBell({ inverted = false }: { inverted?: boolean }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const { data: notifications = [] } = useNotifications(user?.id)
  const markRead = useMarkNotificationsRead()

  const unreadCount = notifications.filter((n) => !n.read).length

  // Mark all as read when panel opens
  useEffect(() => {
    if (open && unreadCount > 0) {
      markRead.mutate(undefined)
    }
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative rounded-xl p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40',
          inverted ? 'hover:bg-white/8' : 'hover:bg-muted',
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className={cn('h-5 w-5', inverted ? 'text-white/72' : 'text-muted-foreground')} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shadow"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border shadow-2xl',
              inverted
                ? 'border-white/10 bg-slate-950/96 text-white backdrop-blur-xl'
                : 'border-border bg-background',
            )}
          >
            {/* Header */}
            <div className={cn('flex items-center justify-between border-b px-4 py-3', inverted ? 'border-white/10' : 'border-border')}>
              <span className={cn('text-sm font-semibold', inverted ? 'text-white' : 'text-foreground')}>Notifications</span>
              <button
                onClick={() => setOpen(false)}
                className={cn('rounded-lg p-1 transition-colors', inverted ? 'hover:bg-white/8' : 'hover:bg-muted')}
              >
                <X className={cn('h-4 w-4', inverted ? 'text-white/55' : 'text-muted-foreground')} />
              </button>
            </div>

            {/* List */}
            <div className={cn('max-h-80 overflow-y-auto divide-y', inverted ? 'divide-white/10' : 'divide-border')}>
              {notifications.length === 0 ? (
                <div className={cn('px-4 py-8 text-center text-sm', inverted ? 'text-white/60' : 'text-muted-foreground')}>
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 transition-colors',
                      inverted ? 'hover:bg-white/6' : 'hover:bg-muted/50',
                      !n.read && (inverted ? 'bg-primary/10' : 'bg-primary/5'),
                    )}
                  >
                    <span className="text-lg mt-0.5 shrink-0">
                      {TYPE_ICONS[n.type] ?? TYPE_ICONS.default}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', inverted ? 'text-white' : 'text-foreground')}>{n.title}</p>
                      {n.body && (
                        <p className={cn('mt-0.5 line-clamp-2 text-xs', inverted ? 'text-white/60' : 'text-muted-foreground')}>
                          {n.body}
                        </p>
                      )}
                      <p className={cn('mt-1 text-xs', inverted ? 'text-white/40' : 'text-muted-foreground/60')}>
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className={cn('border-t px-4 py-2', inverted ? 'border-white/10 bg-white/5' : 'border-border bg-muted/30')}>
                <button
                  onClick={() => markRead.mutate(undefined)}
                  className={cn(
                    'flex items-center gap-1.5 text-xs transition-colors',
                    inverted ? 'text-white/60 hover:text-white' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all as read
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
