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

type PackageRow = {
  id: string
  name: string
  package_type: string
  is_published: boolean | null
  status: string
  created_at: string
}

type TourRow = {
  id: string
  title: string
  tour_type: string
  is_active: boolean | null
  status: string
  created_at: string
}

type ModerationStatus = 'live' | 'hidden' | 'suspended' | 'deleted'

const MIN_REASON_LEN = 12

export default function AdminListingsPage() {
  const [packages, setPackages] = useState<PackageRow[]>([])
  const [tours, setTours] = useState<TourRow[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [nextStatusByKey, setNextStatusByKey] = useState<Record<string, string>>({})
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
        const [{ data: pkgData, error: pkgError }, { data: tourData, error: tourError }] =
          await Promise.all([
            (supabase.from('packages' as any) as any)
              .select('id, name, package_type, is_published, status, created_at')
              .order('created_at', { ascending: false })
              .limit(50),
            (supabase.from('tours' as any) as any)
              .select('id, title, tour_type, is_active, status, created_at')
              .order('created_at', { ascending: false })
              .limit(50),
          ])

        if (pkgError) throw pkgError
        if (tourError) throw tourError

        if (!isCancelled) {
          setPackages((pkgData || []) as PackageRow[])
          setTours((tourData || []) as TourRow[])
        }
      } catch (err: any) {
        console.error('Error loading listings:', err)
        if (!isCancelled) setErrorMessage(err?.message || 'Failed to load listings')
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    load()

    return () => {
      isCancelled = true
    }
  }, [])

  const reloadListings = async () => {
    setErrorMessage(null)

    try {
      const [{ data: pkgData, error: pkgError }, { data: tourData, error: tourError }] =
        await Promise.all([
          (supabase.from('packages' as any) as any)
            .select('id, name, package_type, is_published, status, created_at')
            .order('created_at', { ascending: false })
            .limit(50),
          (supabase.from('tours' as any) as any)
            .select('id, title, tour_type, is_active, status, created_at')
            .order('created_at', { ascending: false })
            .limit(50),
        ])

      if (pkgError) throw pkgError
      if (tourError) throw tourError

      setPackages((pkgData || []) as PackageRow[])
      setTours((tourData || []) as TourRow[])
    } catch (err: any) {
      console.error('Error reloading listings:', err)
      setErrorMessage(err?.message || 'Failed to load listings')
    }
  }

  const statusOptions = useMemo(() => {
    return [
      { value: 'live', label: 'live' },
      { value: 'hidden', label: 'hidden' },
      { value: 'suspended', label: 'suspended' },
      { value: 'deleted', label: 'deleted' },
    ]
  }, [])

  const applyPackageModeration = async (row: PackageRow) => {
    const key = `package:${row.id}`
    const nextStatus = (nextStatusByKey[key] || row.status) as ModerationStatus
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
        title: 'Soft-delete package?',
        description:
          'This is a soft-delete. The package record remains in the database, but will be treated as deleted/hidden from the marketplace.',
        onConfirm: () => {
          setConfirm((prev) => ({ ...prev, open: false }))
          applyPackageModerationConfirmed(row, nextStatus, reason)
        },
      })
      return
    }

    await applyPackageModerationConfirmed(row, nextStatus, reason)
  }

  const applyPackageModerationConfirmed = async (
    row: PackageRow,
    nextStatus: ModerationStatus,
    reason: string,
  ) => {
    const key = `package:${row.id}`

    setBusyByKey((prev) => ({ ...prev, [key]: true }))
    try {
      const { error } = await rpc('admin_moderate_package', {
        p_package_id: row.id,
        p_status: nextStatus,
        p_reason: reason,
      })

      if (error) throw error

      toast.success('Package updated — see Audit Logs')
      window.dispatchEvent(new CustomEvent('tripavail:admin_action'))
      await reloadListings()
      setReasonByKey((prev) => ({ ...prev, [key]: '' }))
    } catch (err: any) {
      console.error('Error moderating package:', err)
      toast.error(err?.message || 'Failed to update package')
    } finally {
      setBusyByKey((prev) => ({ ...prev, [key]: false }))
    }
  }

  const applyTourModeration = async (row: TourRow) => {
    const key = `tour:${row.id}`
    const nextStatus = (nextStatusByKey[key] || row.status) as ModerationStatus
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
        title: 'Soft-delete tour?',
        description:
          'This is a soft-delete. The tour record remains in the database, but will be treated as deleted/hidden from the marketplace.',
        onConfirm: () => {
          setConfirm((prev) => ({ ...prev, open: false }))
          applyTourModerationConfirmed(row, nextStatus, reason)
        },
      })
      return
    }

    await applyTourModerationConfirmed(row, nextStatus, reason)
  }

  const applyTourModerationConfirmed = async (
    row: TourRow,
    nextStatus: ModerationStatus,
    reason: string,
  ) => {
    const key = `tour:${row.id}`

    setBusyByKey((prev) => ({ ...prev, [key]: true }))
    try {
      const { error } = await rpc('admin_moderate_tour', {
        p_tour_id: row.id,
        p_status: nextStatus,
        p_reason: reason,
      })

      if (error) throw error

      toast.success('Tour updated — see Audit Logs')
      window.dispatchEvent(new CustomEvent('tripavail:admin_action'))
      await reloadListings()
      setReasonByKey((prev) => ({ ...prev, [key]: '' }))
    } catch (err: any) {
      console.error('Error moderating tour:', err)
      toast.error(err?.message || 'Failed to update tour')
    } finally {
      setBusyByKey((prev) => ({ ...prev, [key]: false }))
    }
  }

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card key={`pkg-${idx}`}>
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
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card key={`tour-${idx}`}>
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
            <CardTitle className="text-lg">Couldn’t load listings</CardTitle>
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
          <h2 className="text-lg font-semibold text-foreground">Packages</h2>
          {!packages.length ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                No packages found.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {packages.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">{p.name}</CardTitle>
                        <div className="text-sm text-muted-foreground truncate">
                          {p.package_type}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{p.status}</Badge>
                        <Badge variant="secondary">{p.is_published ? 'published' : 'draft'}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      Created: {p.created_at ? new Date(p.created_at).toLocaleString() : ''}
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Select
                          value={nextStatusByKey[`package:${p.id}`] || p.status}
                          onValueChange={(value) =>
                            setNextStatusByKey((prev) => ({
                              ...prev,
                              [`package:${p.id}`]: value,
                            }))
                          }
                          disabled={!!busyByKey[`package:${p.id}`]}
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
                          value={reasonByKey[`package:${p.id}`] || ''}
                          onChange={(e) =>
                            setReasonByKey((prev) => ({
                              ...prev,
                              [`package:${p.id}`]: e.target.value,
                            }))
                          }
                          disabled={!!busyByKey[`package:${p.id}`]}
                        />

                        <Button
                          onClick={() => applyPackageModeration(p)}
                          disabled={busyByKey[`package:${p.id}`]}
                        >
                          {busyByKey[`package:${p.id}`] ? (
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
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Tours</h2>
          {!tours.length ? (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">No tours found.</CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tours.map((t) => (
                <Card key={t.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-lg truncate">{t.title}</CardTitle>
                        <div className="text-sm text-muted-foreground truncate">{t.tour_type}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{t.status}</Badge>
                        <Badge variant="secondary">{t.is_active ? 'active' : 'inactive'}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xs text-muted-foreground">
                      Created: {t.created_at ? new Date(t.created_at).toLocaleString() : ''}
                    </div>

                    <div className="mt-4 flex flex-col gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Select
                          value={nextStatusByKey[`tour:${t.id}`] || t.status}
                          onValueChange={(value) =>
                            setNextStatusByKey((prev) => ({
                              ...prev,
                              [`tour:${t.id}`]: value,
                            }))
                          }
                          disabled={!!busyByKey[`tour:${t.id}`]}
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
                          value={reasonByKey[`tour:${t.id}`] || ''}
                          onChange={(e) =>
                            setReasonByKey((prev) => ({
                              ...prev,
                              [`tour:${t.id}`]: e.target.value,
                            }))
                          }
                          disabled={!!busyByKey[`tour:${t.id}`]}
                        />

                        <Button onClick={() => applyTourModeration(t)} disabled={busyByKey[`tour:${t.id}`]}>
                          {busyByKey[`tour:${t.id}`] ? (
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
              ))}
            </div>
          )}
        </section>

        <Dialog
          open={confirm.open}
          onOpenChange={(open) => setConfirm((prev) => ({ ...prev, open, onConfirm: open ? prev.onConfirm : null }))}
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
  }, [busyByKey, errorMessage, loading, nextStatusByKey, packages, reasonByKey, statusOptions, tours])

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Listings</h1>
      <p className="text-sm text-muted-foreground mt-2">Packages and tours.</p>

      <div className="mt-6">{content}</div>
    </div>
  )
}
