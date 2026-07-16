import { Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { CompletePackageCreationFlow } from '@/features/package-creation/components/CompletePackageCreationFlow'
import { useAuth } from '@/hooks/useAuth'

export default function ListPackagePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [gateLoading, setGateLoading] = useState(true)
  // null = not checked yet. false = account not approved to operate yet.
  const [canOperate, setCanOperate] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!user?.id) {
        if (!cancelled) setGateLoading(false)
        return
      }

      try {
        // Approval gate FIRST. The packages RLS policy requires can_partner_operate(), so an
        // unapproved manager used to build the entire 11-step wizard and only hit the wall on the
        // final click — as a raw Postgres "new row violates row-level security policy" error.
        // Check it up front and say plainly that approval is pending.
        const { data: allowed, error: gateError } = await supabase.rpc('can_partner_operate', {
          p_user_id: user.id,
          p_partner_type: 'hotel_manager',
        })
        if (gateError) throw gateError

        // The RPC returns NULL when the profile row is missing — treat anything but an explicit
        // true as "not yet allowed", exactly as the RLS policy does.
        if (allowed !== true) {
          if (!cancelled) setCanOperate(false)
          return
        }
        if (!cancelled) setCanOperate(true)

        const { count, error } = await supabase
          .from('hotels')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .eq('is_published', true)

        if (error) throw error

        if ((count ?? 0) === 0) {
          toast.error('Create a hotel listing before listing packages')
          navigate('/manager/list-hotel', { replace: true })
          return
        }
      } catch (e) {
        console.error('[ListPackagePage] Failed to check hotel listing completion', e)
        toast.error('Unable to verify hotel listing status')
        navigate('/manager/list-hotel', { replace: true })
        return
      } finally {
        if (!cancelled) setGateLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [navigate, user?.id])

  if (gateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="text-muted-foreground font-medium tracking-tight">Checking listings...</p>
        </div>
      </div>
    )
  }

  // Account not approved yet — say so plainly instead of letting them build a whole package and
  // then surfacing a raw row-level-security error at the very last click.
  if (canOperate === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <Clock className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Approval pending</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Your hotel manager account is still being reviewed by the TripAvail team. You can list
            packages as soon as it&rsquo;s approved — nothing else is needed from you right now.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/70">
            If your verification documents are incomplete, finishing them will speed this up.
          </p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="outline" className="rounded-2xl">
              <Link to="/manager/verification">View verification status</Link>
            </Button>
            <Button asChild className="rounded-2xl">
              <Link to="/manager/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Simple Header */}
      <header className="bg-card border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              T
            </div>
            <span className="font-bold text-xl text-foreground">TripAvail</span>
          </div>
          <div className="h-6 w-px bg-border mx-2" />
          <span className="text-muted-foreground font-medium">Package Creator</span>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)}>
          Exit
        </Button>
      </header>

      <main className="flex-1">
        <CompletePackageCreationFlow />
      </main>
    </div>
  )
}
