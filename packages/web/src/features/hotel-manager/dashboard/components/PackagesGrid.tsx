import { Package as PackageIcon, Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getUserPackages } from '@/features/package-creation/services/packageService'
import { useAuth } from '@/hooks/useAuth'
import { useMoney } from '@/hooks/useMoney'

/**
 * The partner's own packages, on their dashboard.
 *
 * WHY THIS EXISTS. Once a partner published a package it vanished from their account — the
 * dashboard rendered ListingsGrid, which queries `hotels` only, so there was no record of a posted
 * package anywhere. They could not review what they had listed, check its status, or even confirm a
 * publish had worked. That last part compounded the duplicate-publish bug: with no redirect AND no
 * listing to check, clicking Publish again was the reasonable thing to do.
 *
 * getUserPackages() already existed in packageService and had never been called from any UI. This
 * component is mostly wiring rather than new machinery.
 *
 * DRAFTS ARE INCLUDED DELIBERATELY. getUserPackages returns unpublished rows too, and a partner
 * whose package was auto-unpublished for having no price (see 20260722000006) needs to SEE it to
 * fix it. Hiding unpublished rows would leave them wondering where the listing went.
 */
export function PackagesGrid() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const money = useMoney()
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await getUserPackages(user.id)
        if (!cancelled) setPackages(rows ?? [])
      } catch (e) {
        console.error('[PackagesGrid] Failed to load packages', e)
        // Say so rather than rendering an empty state — "you have no packages" is a very different
        // claim from "we could not load them", and the partner acts differently on each.
        if (!cancelled) setError('Could not load your packages. Please refresh to try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Your Packages</h2>
          <p className="text-muted-foreground mt-1">
            {packages.length} {packages.length === 1 ? 'package' : 'packages'}
          </p>
        </div>

        <Button
          onClick={() => navigate('/manager/list-package')}
          className="bg-primary-gradient text-white hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Package
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-xl border-2 border-dashed border-border">
          <PackageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No packages yet</h3>
          <p className="text-muted-foreground mb-6">
            Bundle rooms, meals and activities into a package guests can book in one go.
          </p>
          <Button
            onClick={() => navigate('/manager/list-package')}
            className="bg-primary-gradient text-white hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Package
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map((pkg, index) => {
            const price = Number(pkg.base_price_per_night)
            const hasPrice = Number.isFinite(price) && price > 0
            const priceMoney = hasPrice ? money(price, pkg.currency ?? undefined) : null

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + index * 0.05, duration: 0.35 }}
              >
                <Card className="p-5 h-full flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {pkg.name || 'Untitled package'}
                      </h3>
                      {pkg.package_type ? (
                        <p className="text-xs text-muted-foreground mt-0.5">{pkg.package_type}</p>
                      ) : null}
                    </div>

                    {/* Status the partner can act on, not a decorative chip. "Needs a price" is the
                        state the price guard puts a listing into, and it names the fix. */}
                    {pkg.is_published ? (
                      <Badge className="bg-success/10 text-success border-success/20 shrink-0">
                        Live
                      </Badge>
                    ) : hasPrice ? (
                      <Badge variant="secondary" className="shrink-0">
                        Unpublished
                      </Badge>
                    ) : (
                      <Badge className="bg-warning/10 text-warning border-warning/20 shrink-0">
                        Needs a price
                      </Badge>
                    )}
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {hasPrice ? (
                      <>
                        {priceMoney?.estimate ? '≈ ' : ''}
                        {priceMoney?.text}
                        <span className="text-xs"> / night</span>
                      </>
                    ) : (
                      <span className="text-warning">
                        No price set — guests can’t book this yet
                      </span>
                    )}
                  </div>

                  <div className="mt-auto pt-2">
                    {/* Only a live package has a public page worth opening. An unpublished one is
                        resumable instead — ?draft= reopens the wizard on the first step still
                        missing data, rather than making the partner start over. */}
                    {pkg.is_published ? (
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link to={`/packages/${pkg.slug || pkg.id}`}>View listing</Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link to={`/manager/list-package?draft=${pkg.id}`}>Continue setup</Link>
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
