import {
  Loader2,
  MessageSquare,
  Pencil,
  Send,
  Star,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import { PageHeader } from '@/components/ui/PageHeader'
import { Textarea } from '@/components/ui/textarea'
import {
  operatorReviewService,
  type TourReviewWithReply,
} from '@/features/booking/services/reviewService'

export default function OperatorReviewsPage() {
  const [reviews, setReviews] = useState<TourReviewWithReply[]>([])
  const [loading, setLoading] = useState(true)

  // Per-review reply state
  const [draftById, setDraftById] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-role', 'tour_operator')
    return () => document.documentElement.removeAttribute('data-role')
  }, [])

  useEffect(() => {
    operatorReviewService
      .listMyReviews()
      .then(setReviews)
      .catch((err) => toast.error(err?.message || 'Failed to load reviews'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmitReply = async (review: TourReviewWithReply) => {
    const body = (draftById[review.id] ?? '').trim()
    if (!body) return

    setSubmittingId(review.id)
    try {
      if (review.reply) {
        const updated = await operatorReviewService.updateReply(review.reply.id, body)
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, reply: updated } : r)),
        )
        toast.success('Reply updated')
      } else {
        const reply = await operatorReviewService.submitReply(review.id, body)
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, reply } : r)),
        )
        toast.success('Reply published')
      }
      setDraftById((prev) => { const n = { ...prev }; delete n[review.id]; return n })
      setEditingId(null)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit reply')
    } finally {
      setSubmittingId(null)
    }
  }

  const startEditing = (review: TourReviewWithReply) => {
    setDraftById((prev) => ({ ...prev, [review.id]: review.reply?.body ?? '' }))
    setEditingId(review.id)
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background pb-16">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] opacity-60" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-amber-500/10 blur-[110px] opacity-60" />
      </div>
      <div className="relative z-10 mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Reviews"
        subtitle="Read traveler feedback and reply publicly to build trust."
        backPath="/operator/reputation"
      />

      {reviews.length === 0 ? (
        <GlassCard variant="card" className="rounded-3xl border-none">
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Star className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-base font-semibold text-foreground">No reviews yet</p>
            <p className="text-sm text-muted-foreground">
              Reviews will appear here after travelers complete trips with you.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isEditing = editingId === review.id
            const draft = draftById[review.id] ?? ''
            const busy = submittingId === review.id

            return (
              <GlassCard key={review.id} variant="card" className="rounded-3xl border-none shadow-sm">
                <div className="space-y-4 p-6">
                  {/* Review header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-foreground">{review.rating}/5</span>
                        {review.reply ? (
                          <Badge variant="secondary" className="text-xs">Replied</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">No reply yet</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {(review as any).tour_title ? `${(review as any).tour_title} · ` : ''}
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {review.title ? (
                    <p className="text-sm font-semibold text-foreground">{review.title}</p>
                  ) : null}
                  {review.body ? (
                    <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
                  ) : null}

                  {/* Existing reply display */}
                  {review.reply && !isEditing ? (
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-3.5 w-3.5 text-primary/60" />
                          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">Your reply</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 rounded-xl text-xs"
                          onClick={() => startEditing(review)}
                        >
                          <Pencil className="mr-1 h-3 w-3" /> Edit
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{review.reply.body}</p>
                    </div>
                  ) : null}

                  {/* Reply composer */}
                  {(!review.reply || isEditing) ? (
                    <div className="space-y-3 pt-1">
                      <Textarea
                        placeholder="Write a public reply to this review…"
                        value={isEditing ? draft : (draftById[review.id] ?? '')}
                        onChange={(e) =>
                          setDraftById((prev) => ({ ...prev, [review.id]: e.target.value }))
                        }
                        rows={3}
                        maxLength={2000}
                        className="rounded-2xl"
                        disabled={busy}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {(draftById[review.id] ?? '').length}/2000
                        </p>
                        <div className="flex gap-2">
                          {isEditing && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-2xl"
                              onClick={() => { setEditingId(null); setDraftById((prev) => { const n = { ...prev }; delete n[review.id]; return n }) }}
                              disabled={busy}
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-2xl"
                            onClick={() => handleSubmitReply(review)}
                            disabled={!(draftById[review.id] ?? '').trim() || busy}
                          >
                            {busy ? (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="mr-2 h-3 w-3" />
                            )}
                            {isEditing ? 'Update reply' : 'Publish reply'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </GlassCard>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
