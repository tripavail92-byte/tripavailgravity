import { CheckCircle2, MessageCircle, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { claimHref } from '@/components/tour/EnquiryCard'
import { Button } from '@/components/ui/button'
import { GlassCard, GlassContent, GlassHeader, GlassTitle } from '@/components/ui/glass'
import { Input } from '@/components/ui/input'
import { useSeo } from '@/hooks/useSeo'

/**
 * Self-serve claim of an unclaimed operator listing. The 6-digit code goes to the WhatsApp number
 * ON THE LISTING (the one the operator publishes), so only the business that answers that number
 * can take it over. The listing-claim edge function does the checking and the hand-over.
 */

interface ClaimInfo {
  ok: boolean
  name: string
  slug: string
  claimable: boolean
  claimed: boolean
  whatsapp: string | null
  trips: number
  last30Days: { whatsappEnquiries: number; profileViews: number; tripClicks: number }
}

async function callClaim<T>(body: Record<string, unknown>): Promise<T & { ok: boolean; message?: string; code?: string }> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/listing-claim`
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  })
  return res.json().catch(() => ({ ok: false, message: 'Something went wrong. Try again.' }))
}

export default function ClaimListingPage() {
  const { slug = '' } = useParams()
  const [info, setInfo] = useState<ClaimInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [step, setStep] = useState<'intro' | 'code' | 'done'>('intro')
  const [sentTo, setSentTo] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ code: '', fullName: '', email: '', password: '' })
  const [claimedEmail, setClaimedEmail] = useState('')

  useSeo({
    title: info ? `Claim ${info.name} on TripAvail` : 'Claim your listing · TripAvail',
    description: 'Tour operators: take over the TripAvail listing built from your public trips.',
    noindex: true,
  })

  useEffect(() => {
    let cancelled = false
    void callClaim<ClaimInfo>({ action: 'info', slug }).then((r) => {
      if (cancelled) return
      if (r.ok) setInfo(r as ClaimInfo)
      else setLoadError(r.message || 'We could not find that listing.')
    })
    return () => {
      cancelled = true
    }
  }, [slug])

  const pageUrl = typeof window !== 'undefined' ? `${window.location.origin}/operators/${slug}` : ''

  async function sendCode() {
    setBusy(true)
    setError(null)
    const r = await callClaim<{ sentTo: string }>({ action: 'start', slug })
    setBusy(false)
    if (r.ok) {
      setSentTo(r.sentTo)
      setStep('code')
    } else setError(r.message || 'Could not send the code.')
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const r = await callClaim<{ email: string }>({ action: 'verify', slug, ...form })
    setBusy(false)
    if (r.ok) {
      setClaimedEmail(r.email)
      setStep('done')
    } else setError(r.message || 'Could not verify the code.')
  }

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-xl space-y-6">
        {loadError ? (
          <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
            <GlassContent className="space-y-3 p-6">
              <p className="font-semibold text-foreground">{loadError}</p>
              <Link to="/" className="text-sm font-semibold text-primary hover:underline">
                Back to TripAvail
              </Link>
            </GlassContent>
          </GlassCard>
        ) : !info ? (
          <div className="h-64 animate-pulse rounded-3xl bg-muted" />
        ) : (
          <GlassCard variant="card" className="rounded-3xl border-none shadow-xl">
            <GlassHeader>
              <GlassTitle className="text-2xl font-bold text-balance">
                {step === 'done' ? `${info.name} is yours` : `Claim ${info.name} on TripAvail`}
              </GlassTitle>
            </GlassHeader>
            <GlassContent className="space-y-5">
              {step !== 'done' ? (
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { label: 'trips listed', value: info.trips },
                    { label: 'WhatsApp enquiries', value: info.last30Days.whatsappEnquiries },
                    { label: 'profile views', value: info.last30Days.profileViews },
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-border/60 bg-background/60 p-3">
                      <p className="text-xl font-black tabular-nums text-foreground">{s.value}</p>
                      <p className="text-[11px] font-medium text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                  <p className="col-span-3 text-xs text-muted-foreground">Enquiries and views in the last 30 days.</p>
                </div>
              ) : null}

              {info.claimed && step !== 'done' ? (
                <p className="text-sm text-foreground">
                  This listing has already been claimed. If that wasn&apos;t you,{' '}
                  <a href={claimHref(info.name, pageUrl)} className="font-semibold text-primary hover:underline">
                    email us
                  </a>
                  .
                </p>
              ) : !info.claimable && step !== 'done' ? (
                <p className="text-sm text-foreground">
                  This listing has no WhatsApp number to verify with.{' '}
                  <a href={claimHref(info.name, pageUrl)} className="font-semibold text-primary hover:underline">
                    Email us to claim it
                  </a>
                  .
                </p>
              ) : step === 'intro' ? (
                <div className="space-y-4">
                  <p className="text-sm leading-6 text-muted-foreground">
                    We built this profile from {info.name}
                    {/s$/i.test(info.name) ? '’' : '’s'} public trips. Claim it to edit your trips,
                    add new dates and see every enquiry. It&apos;s free.
                  </p>
                  <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <p className="text-sm text-foreground">
                      We&apos;ll send a 6-digit code to the WhatsApp number on this listing,{' '}
                      <span className="font-semibold tabular-nums">{info.whatsapp}</span>. Only the business
                      that answers that number can claim it.
                    </p>
                  </div>
                  <Button className="h-12 w-full rounded-2xl" disabled={busy} onClick={sendCode}>
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {busy ? 'Sending…' : 'Send code on WhatsApp'}
                  </Button>
                </div>
              ) : step === 'code' ? (
                <form className="space-y-3" onSubmit={verify}>
                  <p className="text-sm text-muted-foreground">
                    Code sent to <span className="font-semibold tabular-nums text-foreground">{sentTo}</span>.
                    Then choose the email and password you&apos;ll sign in with.
                  </p>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      WhatsApp code
                    </span>
                    <Input
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      required
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.replace(/\D/g, '') })}
                      className="text-lg tracking-[0.4em] tabular-nums"
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Your name
                    </span>
                    <Input
                      autoComplete="name"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Email for your account
                    </span>
                    <Input
                      type="email"
                      autoComplete="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Password (8+ characters)
                    </span>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </label>
                  <Button type="submit" className="h-12 w-full rounded-2xl" disabled={busy}>
                    {busy ? 'Checking…' : 'Claim my listing'}
                  </Button>
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={busy}
                    className="w-full text-center text-xs font-semibold text-primary hover:underline"
                  >
                    Didn&apos;t get it? Send a new code
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl border border-success/25 bg-success/10 p-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                    <p className="text-sm text-foreground">
                      Your listing and trips are now in your account. Sign in with{' '}
                      <span className="font-semibold">{claimedEmail}</span> to edit them and add new dates.
                    </p>
                  </div>
                  <Button asChild className="h-12 w-full rounded-2xl">
                    <Link to={`/auth?redirect=${encodeURIComponent('/operator/dashboard')}`}>Sign in</Link>
                  </Button>
                </div>
              )}

              {error ? (
                <p role="alert" className="text-sm font-medium text-destructive">
                  {error}
                </p>
              ) : null}

              {step !== 'done' && info.claimable ? (
                <p className="text-center text-xs text-muted-foreground">
                  No access to that WhatsApp?{' '}
                  <a href={claimHref(info.name, pageUrl)} className="font-semibold text-primary hover:underline">
                    Email us instead
                  </a>
                  .
                </p>
              ) : null}
            </GlassContent>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
