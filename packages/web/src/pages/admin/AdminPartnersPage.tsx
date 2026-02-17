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

type ProfileIdentity = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
}

type HotelManagerRow = {
  user_id: string
  business_name: string | null
  account_status: string | null
  created_at: string
}

type TourOperatorRow = {
  user_id: string
  company_name: string | null
  account_status: string | null
  created_at: string
}

type AccountStatus = 'active' | 'suspended' | 'deleted'

const MIN_REASON_LEN = 12

export default function AdminPartnersPage() {
  const [hotelManagers, setHotelManagers] = useState<HotelManagerRow[]>([])
  const [tourOperators, setTourOperators] = useState<TourOperatorRow[]>([])
  const [usersById, setUsersById] = useState<Record<string, ProfileIdentity>>({})
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [nextStatusByKey, setNextStatusByKey] = useState<Record<string, AccountStatus>>({})
  const [reasonByKey, setReasonByKey] = useState<Record<string, string>>({})
  const [busyByKey, setBusyByKey] = useState<Record<string, boolean>>({})

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
        const [{ data: hmData, error: hmError }, { data: opData, error: opError }] =
          await Promise.all([
            (supabase.from('hotel_manager_profiles' as any) as any)
              .select('user_id, business_name, account_status, created_at')
              .order('created_at', { ascending: false })
              .limit(50),
            (supabase.from('tour_operator_profiles' as any) as any)
              .select('user_id, company_name, account_status, created_at')
              .order('created_at', { ascending: false })
              .limit(50),
          ])

        if (hmError) throw hmError
        if (opError) throw opError

        const hmRows = (hmData || []) as HotelManagerRow[]
        const opRows = (opData || []) as TourOperatorRow[]

        const partnerIds = Array.from(
          new Set([
            ...hmRows.map((r) => r.user_id).filter(Boolean),
            ...opRows.map((r) => r.user_id).filter(Boolean),
          ]),
        )

        let usersMap: Record<string, ProfileIdentity> = {}
        if (partnerIds.length) {
          const { data: userRows, error: usersError } = await (supabase.from('profiles' as any) as any)
            .select('id, email, first_name, last_name')
            .in('id', partnerIds)

          if (usersError) throw usersError
          usersMap = Object.fromEntries(
            ((userRows || []) as ProfileIdentity[]).map((u) => [u.id, u]),
          )
        }

        if (!isCancelled) {
          setHotelManagers(hmRows)
          setTourOperators(opRows)
          setUsersById(usersMap)
        }
      } catch (err: any) {
        console.error('Error loading partners:', err)
        if (!isCancelled) setErrorMessage(err?.message || 'Failed to load partners')
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [])

  const reloadPartners = async () => {
    setErrorMessage(null)

    try {
      const [{ data: hmData, error: hmError }, { data: opData, error: opError }] =
        await Promise.all([
          (supabase.from('hotel_manager_profiles' as any) as any)
            .select('user_id, business_name, account_status, created_at')
            .order('created_at', { ascending: false })
            .limit(50),
          (supabase.from('tour_operator_profiles' as any) as any)
            .select('user_id, company_name, account_status, created_at')
            .order('created_at', { ascending: false })
            .limit(50),
        ])

      if (hmError) throw hmError
      if (opError) throw opError

      const hmRows = (hmData || []) as HotelManagerRow[]
      const opRows = (opData || []) as TourOperatorRow[]

      const partnerIds = Array.from(
        new Set([
          ...hmRows.map((r) => r.user_id).filter(Boolean),
          ...opRows.map((r) => r.user_id).filter(Boolean),
        ]),
      )

      let usersMap: Record<string, ProfileIdentity> = {}
      if (partnerIds.length) {
        const { data: userRows, error: usersError } = await (supabase.from('profiles' as any) as any)
          .select('id, email, first_name, last_name')
          .in('id', partnerIds)

        if (usersError) throw usersError
        usersMap = Object.fromEntries(((userRows || []) as ProfileIdentity[]).map((u) => [u.id, u]))
      }

      setHotelManagers(hmRows)
      setTourOperators(opRows)
      setUsersById(usersMap)
    } catch (err: any) {
      console.error('Error reloading partners:', err)
      setErrorMessage(err?.message || 'Failed to load partners')
    }
  }

  const statusOptions = useMemo(() => {
    return [
      { value: 'active', label: 'active' },
      { value: 'suspended', label: 'suspended' },
      { value: 'deleted', label: 'deleted' },
    ] as const
  }, [])

  const applyHotelManagerStatus = async (row: HotelManagerRow) => {
    const key = `hm:${row.user_id}`
    const nextStatus = (nextStatusByKey[key] || (row.account_status || 'active')) as AccountStatus
    const reason = (reasonByKey[key] || '').trim()

    if (!reason) {
      toast.error('Reason is required', { id: `reason-${key}` })
      return
    }

    if (reason.length < MIN_REASON_LEN) {
      toast.error(`Reason must be at least ${MIN_REASON_LEN} characters`, { id: `reason-${key}` })
      return
    }

    if (nextStatus === 'deleted') {
      setConfirm({
        open: true,
        title: 'Soft-delete hotel manager?'
        ,
        description:
          'This is a soft-delete. The partner profile remains in the database, but will be treated as deleted/disabled in the product.',
        onConfirm: () => {
          setConfirm((prev) => ({ ...prev, open: false }))
          applyHotelManagerStatusConfirmed(row, nextStatus, reason)
        },
      })
      return
    }

    await applyHotelManagerStatusConfirmed(row, nextStatus, reason)
  }

  const applyHotelManagerStatusConfirmed = async (
    row: HotelManagerRow,
    nextStatus: AccountStatus,
    reason: string,
  ) => {
    const key = `hm:${row.user_id}`

    setBusyByKey((prev) => ({ ...prev, [key]: true }))
    try {
      const { error } = await rpc('admin_set_hotel_manager_status', {
        p_user_id: row.user_id,
        p_status: nextStatus,
        p_reason: reason,
      })

      if (error) throw error

      toast.success('Hotel manager updated — see Audit Logs')
      window.dispatchEvent(new CustomEvent('tripavail:admin_action'))
      await reloadPartners()
      setReasonByKey((prev) => ({ ...prev, [key]: '' }))
    } catch (err: any) {
      console.error('Error updating hotel manager status:', err)
      toast.error(err?.message || 'Failed to update hotel manager')
    } finally {
      setBusyByKey((prev) => ({ ...prev, [key]: false }))
    }
  }

  const applyTourOperatorStatus = async (row: TourOperatorRow) => {
    const key = `op:${row.user_id}`
    const nextStatus = (nextStatusByKey[key] || (row.account_status || 'active')) as AccountStatus
    const reason = (reasonByKey[key] || '').trim()

    if (!reason) {
      toast.error('Reason is required', { id: `reason-${key}` })
      return
    }

    if (reason.length < MIN_REASON_LEN) {
      toast.error(`Reason must be at least ${MIN_REASON_LEN} characters`, { id: `reason-${key}` })
      return
    }

    if (nextStatus === 'deleted') {
      setConfirm({
        open: true,
        title: 'Soft-delete tour operator?'
        ,
        description:
          'This is a soft-delete. The partner profile remains in the database, but will be treated as deleted/disabled in the product.',
        onConfirm: () => {
          setConfirm((prev) => ({ ...prev, open: false }))
          applyTourOperatorStatusConfirmed(row, nextStatus, reason)
        },
      })
      return
    }

    await applyTourOperatorStatusConfirmed(row, nextStatus, reason)
  }

  const applyTourOperatorStatusConfirmed = async (
    row: TourOperatorRow,
    nextStatus: AccountStatus,
    reason: string,
  ) => {
    const key = `op:${row.user_id}`

    setBusyByKey((prev) => ({ ...prev, [key]: true }))
    try {
      const { error } = await rpc('admin_set_tour_operator_status', {
        p_user_id: row.user_id,
        p_status: nextStatus,
        p_reason: reason,
      })

      if (error) throw error

      toast.success('Tour operator updated — see Audit Logs')
      window.dispatchEvent(new CustomEvent('tripavail:admin_action'))
      await reloadPartners()
      setReasonByKey((prev) => ({ ...prev, [key]: '' }))
    } catch (err: any) {
      console.error('Error updating tour operator status:', err)
      toast.error(err?.message || 'Failed to update tour operator')
    } finally {
      setBusyByKey((prev) => ({ ...prev, [key]: false }))
    }
  }

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-56" />
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card key={`hm-${idx}`}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-64" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-80" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-3">
            <Skeleton className="h-6 w-56" />
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card key={`op-${idx}`}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-64" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-80" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )
    }

    if (errorMessage) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Couldn’t load partners</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Hotel Managers</h2>
          {!hotelManagers.length ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No hotel managers found.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {hotelManagers.map((p) => {
                const u = usersById[p.user_id]
                const fullName = [u?.first_name, u?.last_name].filter(Boolean).join(' ')
                const key = `hm:${p.user_id}`
                return (
                  <Card key={p.user_id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-lg truncate">
                            {p.business_name || fullName || u?.email || p.user_id}
                          </CardTitle>
                          {u?.email ? (
                            <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                          ) : null}
                        </div>
                        <Badge variant="outline">{p.account_status || 'active'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Created: {p.created_at ? new Date(p.created_at).toLocaleString() : ''}
                      </div>

                      <div className="mt-4 flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Select
                            value={
                              nextStatusByKey[key] || ((p.account_status || 'active') as AccountStatus)
                            }
                            onValueChange={(value) =>
                              setNextStatusByKey((prev) => ({
                                ...prev,
                                [key]: value as AccountStatus,
                              }))
                            }
                            disabled={!!busyByKey[key]}
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
                            value={reasonByKey[key] || ''}
                            onChange={(e) =>
                              setReasonByKey((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            disabled={!!busyByKey[key]}
                          />

                          <Button onClick={() => applyHotelManagerStatus(p)} disabled={busyByKey[key]}>
                            {busyByKey[key] ? (
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
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Tour Operators</h2>
          {!tourOperators.length ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No tour operators found.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tourOperators.map((p) => {
                const u = usersById[p.user_id]
                const fullName = [u?.first_name, u?.last_name].filter(Boolean).join(' ')
                const key = `op:${p.user_id}`
                return (
                  <Card key={p.user_id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-lg truncate">
                            {p.company_name || fullName || u?.email || p.user_id}
                          </CardTitle>
                          {u?.email ? (
                            <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                          ) : null}
                        </div>
                        <Badge variant="outline">{p.account_status || 'active'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Created: {p.created_at ? new Date(p.created_at).toLocaleString() : ''}
                      </div>

                      <div className="mt-4 flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <Select
                            value={
                              nextStatusByKey[key] || ((p.account_status || 'active') as AccountStatus)
                            }
                            onValueChange={(value) =>
                              setNextStatusByKey((prev) => ({
                                ...prev,
                                [key]: value as AccountStatus,
                              }))
                            }
                            disabled={!!busyByKey[key]}
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
                            value={reasonByKey[key] || ''}
                            onChange={(e) =>
                              setReasonByKey((prev) => ({
                                ...prev,
                                [key]: e.target.value,
                              }))
                            }
                            disabled={!!busyByKey[key]}
                          />

                          <Button onClick={() => applyTourOperatorStatus(p)} disabled={busyByKey[key]}>
                            {busyByKey[key] ? (
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
          )}
        </section>
      </div>
    )
  }, [busyByKey, errorMessage, hotelManagers, loading, nextStatusByKey, reasonByKey, tourOperators, usersById])

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Partners</h1>
      <p className="text-sm text-muted-foreground mt-2">Hotel managers and tour operators.</p>

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
