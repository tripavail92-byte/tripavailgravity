import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase'

type ProfileRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  account_status: string | null
  created_at: string
}

type AccountStatus = 'active' | 'suspended' | 'deleted'

const MIN_REASON_LEN = 12

export default function AdminUsersPage() {
  const [rows, setRows] = useState<ProfileRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [nextStatusById, setNextStatusById] = useState<Record<string, AccountStatus>>({})
  const [reasonById, setReasonById] = useState<Record<string, string>>({})
  const [busyById, setBusyById] = useState<Record<string, boolean>>({})

  const [confirm, setConfirm] = useState<{
    open: boolean
    title: string
    description: string
    onConfirm: null | (() => void)
  }>({ open: false, title: '', description: '', onConfirm: null })

  const rpc = (
    supabase as unknown as {
      rpc: (
        fn: string,
        args: unknown,
      ) => Promise<{ data: unknown; error: { message: string } | null }>
    }
  ).rpc

  useEffect(() => {
    let isCancelled = false

    const load = async () => {
      setLoading(true)
      setErrorMessage(null)

      try {
        const { data, error } = await (supabase.from('profiles' as any) as any)
          .select('id, email, first_name, last_name, account_status, created_at')
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error
        if (!isCancelled) setRows((data || []) as ProfileRow[])
      } catch (err: any) {
        console.error('Error loading users:', err)
        if (!isCancelled) setErrorMessage(err?.message || 'Failed to load users')
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [])

  const reloadUsers = async () => {
    setErrorMessage(null)

    try {
      const { data, error } = await (supabase.from('profiles' as any) as any)
        .select('id, email, first_name, last_name, account_status, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setRows((data || []) as ProfileRow[])
    } catch (err: any) {
      console.error('Error reloading users:', err)
      setErrorMessage(err?.message || 'Failed to load users')
    }
  }

  const statusOptions = useMemo(() => {
    return [
      { value: 'active', label: 'active' },
      { value: 'suspended', label: 'suspended' },
      { value: 'deleted', label: 'deleted' },
    ] as const
  }, [])

  const applyStatus = async (row: ProfileRow) => {
    const nextStatus = (nextStatusById[row.id] || (row.account_status || 'active')) as AccountStatus
    const reason = (reasonById[row.id] || '').trim()

    if (!reason) {
      toast.error('Reason is required', { id: `reason-user-${row.id}` })
      return
    }

    if (reason.length < MIN_REASON_LEN) {
      toast.error(`Reason must be at least ${MIN_REASON_LEN} characters`, {
        id: `reason-user-${row.id}`,
      })
      return
    }

    if (nextStatus === 'deleted') {
      setConfirm({
        open: true,
        title: 'Soft-delete user?'
        ,
        description:
          'This is a soft-delete. The user profile remains in the database, but will be treated as deleted/disabled in the product.',
        onConfirm: () => {
          setConfirm((prev) => ({ ...prev, open: false }))
          applyStatusConfirmed(row, nextStatus, reason)
        },
      })
      return
    }

    await applyStatusConfirmed(row, nextStatus, reason)
  }

  const applyStatusConfirmed = async (
    row: ProfileRow,
    nextStatus: AccountStatus,
    reason: string,
  ) => {

    setBusyById((prev) => ({ ...prev, [row.id]: true }))
    try {
      const { error } = await rpc('admin_set_traveler_status', {
        p_user_id: row.id,
        p_status: nextStatus,
        p_reason: reason,
      })

      if (error) throw error

      toast.success('User status updated — see Audit Logs')
      window.dispatchEvent(new CustomEvent('tripavail:admin_action'))
      await reloadUsers()
      setReasonById((prev) => ({ ...prev, [row.id]: '' }))
    } catch (err: any) {
      console.error('Error updating user status:', err)
      toast.error(err?.message || 'Failed to update user status')
    } finally {
      setBusyById((prev) => ({ ...prev, [row.id]: false }))
    }
  }

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-64" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-80" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (errorMessage) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Couldn’t load users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </CardContent>
        </Card>
      )
    }

    if (!rows.length) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No users found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">No profiles are visible to the admin.</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {rows.map((row) => {
          const fullName = [row.first_name, row.last_name].filter(Boolean).join(' ')
          return (
            <Card key={row.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-lg truncate">{row.email}</CardTitle>
                    {fullName ? (
                      <div className="text-sm text-muted-foreground truncate">{fullName}</div>
                    ) : null}
                  </div>
                  <Badge variant="outline">{row.account_status || 'active'}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Created: {row.created_at ? new Date(row.created_at).toLocaleString() : ''}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      value={nextStatusById[row.id] || ((row.account_status || 'active') as AccountStatus)}
                      onValueChange={(value) =>
                        setNextStatusById((prev) => ({
                          ...prev,
                          [row.id]: value as AccountStatus,
                        }))
                      }
                      disabled={!!busyById[row.id]}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Reason (required)"
                      value={reasonById[row.id] || ''}
                      onChange={(e) =>
                        setReasonById((prev) => ({
                          ...prev,
                          [row.id]: e.target.value,
                        }))
                      }
                      disabled={!!busyById[row.id]}
                    />

                    <Button onClick={() => applyStatus(row)} disabled={busyById[row.id]}>
                      {busyById[row.id] ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                          Applying…
                        </span>
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Reason must be at least {MIN_REASON_LEN} characters. All actions are logged.
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    )
  }, [busyById, errorMessage, loading, nextStatusById, reasonById, rows, statusOptions])

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Users</h1>
      <p className="text-sm text-muted-foreground mt-2">Latest traveler profiles.</p>

      <div className="mt-6">{content}</div>

      <Dialog
        open={confirm.open}
        onOpenChange={(open) =>
          setConfirm((prev) => ({ ...prev, open, onConfirm: open ? prev.onConfirm : null }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm.title}</DialogTitle>
            <DialogDescription>{confirm.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirm((prev) => ({ ...prev, open: false, onConfirm: null }))}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                const fn = confirm.onConfirm
                if (fn) fn()
              }}
            >
              Confirm soft-delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
