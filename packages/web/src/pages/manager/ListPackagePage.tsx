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
  const { user, activeRole } = useAuth()
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
  //
  // can_partner_operate returns a bare boolean, so it cannot tell us WHY. verification_status can:
  // every partner is born 'incomplete' (switch_user_role), and telling that cohort "we're reviewing
  // you, nothing is needed from you" is simply false — nothing is under review, and they would wait
  // forever on a queue entry that does not exist. Branch on the real state and give each the
  // action that actually applies.
  if (canOperate === false) {
    const status = activeRole?.verification_status
    const copy =
      status === 'incomplete'
        ? {
            title: 'Finish your verification',
            body: 'Before you can list packages, we need to verify your business. It takes a few minutes — you’ll need your ID and your business registration.',
            cta: { to: '/manager/verification', label: 'Start verification' },
          }
        : status === 'rejected'
          ? {
              title: 'Verification not approved',
              body: 'Your verification was reviewed and could not be approved. Open your verification page for the details and to resubmit.',
              cta: { to: '/manager/verification', label: 'Review and resubmit' },
            }
          : status === 'pending'
            ? {
                title: 'Approval pending',
                body: 'Your documents are in and being reviewed by the TripAvail team. You can list packages as soon as it’s approved — nothing else is needed from you right now.',
                cta: { to: '/manager/verification', label: 'View verification status' },
              }
            : {
                // verification_status is 'approved' but the gate still said no — the profile is
                // suspended/deleted, or the row is missing. Not something the manager can fix.
                title: 'Your account can’t list packages',
                body: 'Your hotel manager account isn’t currently active, so package listing is turned off. Please contact TripAvail support to sort this out.',
                cta: { to: '/manager/dashboard', label: 'Back to dashboard' },
              }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10">
            <Clock className="h-7 w-7 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{copy.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.body}</p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-2xl">
              <Link to={copy.cta.to}>{copy.cta.label}</Link>
            </Button>
            {copy.cta.to !== '/manager/dashboard' && (
              <Button asChild variant="outline" className="rounded-2xl">
                <Link to="/manager/dashboard">Back to dashboard</Link>
              </Button>
            )}
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
