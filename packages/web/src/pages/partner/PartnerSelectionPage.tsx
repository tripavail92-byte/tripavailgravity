import { ArrowRight, Star, TrendingUp, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Modern3DHotelIcon } from '@/components/icons/Modern3DHotelIcon'
import { Modern3DTourIcon } from '@/components/icons/Modern3DTourIcon'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/hooks/useAuth'

export default function PartnerSelectionPage() {
  const { switchRole, activeRole, partnerType } = useAuth()
  const navigate = useNavigate()
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [pendingMode, setPendingMode] = useState<'hotel_manager' | 'tour_operator' | null>(null)

  const allPartnerOptions = [
    {
      id: 'hotel_manager',
      title: 'Hotel Manager',
      description: 'Perfect for hotels, resorts, and vacation rentals',
      icon: Modern3DHotelIcon,
      stats: '50K+ hotels partnered',
    },
    {
      id: 'tour_operator',
      title: 'Tour Operator',
      description: 'Best for guided tours, activities, and experiences',
      icon: Modern3DTourIcon,
      stats: '15K+ operators active',
    },
  ]

  // Permanent partner selection: once set, hide the opposite option everywhere.
  const hasPartnerRole = partnerType === 'hotel_manager' || partnerType === 'tour_operator'

  const availablePartnerOptions = allPartnerOptions.filter((option) => {
    if (!hasPartnerRole) return true
    // Only show the already-selected role (enterprise clarity). Never show both.
    return option.id === partnerType
  })

  const partnerLabel =
    partnerType === 'hotel_manager'
      ? 'Hotel Manager'
      : partnerType === 'tour_operator'
        ? 'Tour Operator'
        : null

  const pendingLabel =
    pendingMode === 'hotel_manager'
      ? 'Hotel Manager'
      : pendingMode === 'tour_operator'
        ? 'Tour Operator'
        : ''

  // Step 1: user taps a partner card. Validate, then open a friendly confirmation
  // so a mis-tap never silently commits the permanent choice.
  const requestSelectPartner = (mode: 'hotel_manager' | 'tour_operator') => {
    // If not logged in, redirect to auth with selected role
    if (!activeRole) {
      navigate('/auth?redirect=/partner/onboarding')
      return
    }

    // Hard lock (Option A): if partnerType is already set, block switching.
    if (partnerType && partnerType !== mode) {
      alert(
        `You are already a ${partnerType.replace('_', ' ')}. Partner role selection is permanent.`,
      )
      return
    }

    setPendingMode(mode)
  }

  // Step 2: user confirms in the dialog — now commit the role and route into setup.
  const confirmSelectPartner = async () => {
    if (!pendingMode) return
    setIsLoading(true)
    try {
      await switchRole(pendingMode)
      // After becoming a partner, redirect into the required setup flow.
      // - Tour Operator -> Setup
      // - Hotel Manager  -> Hotel listing
      navigate(pendingMode === 'tour_operator' ? '/operator/setup' : '/manager/list-hotel')
    } catch (error) {
      console.error('Failed to switch role:', error)
      setPendingMode(null)
      alert('Something went wrong setting up your partner account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToDashboard = async () => {
    if (!partnerType) return
    setIsLoading(true)
    try {
      // Ensure the active role matches the partner type before routing.
      await switchRole(partnerType)
      // Use /dashboard so the redirect logic can send them to setup/listing if needed.
      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to open partner dashboard:', error)
      alert('Failed to open dashboard. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-muted/30 flex items-center justify-center p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-3">Choose Your Partner Type</h1>
          <p className="text-lg text-muted-foreground">
            Select how you want to earn with TripAvail
          </p>
          {hasPartnerRole && (
            <p className="mt-4 text-warning font-medium">
              ⚠️ You have already selected {partnerLabel}. This choice is permanent.
            </p>
          )}
        </div>

        {/* Partner Options - Clean Design */}
        {hasPartnerRole ? (
          <div className="text-center p-12 bg-card rounded-2xl border border-border">
            <h3 className="text-2xl font-bold text-foreground mb-4">You're Already a Partner!</h3>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background/50 backdrop-blur-sm mb-5">
              <span className="text-base" aria-hidden>
                {partnerType === 'hotel_manager' ? '🏨' : '🏔️'}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {partnerType === 'hotel_manager' ? 'Hotel Manager' : 'Tour Operator'}
              </span>
              <span className="text-xs text-muted-foreground">
                {partnerType === 'hotel_manager'
                  ? 'Manage your hotel listings'
                  : 'Manage your tour packages'}
              </span>
            </div>
            <p className="text-muted-foreground mb-6">
              You have selected{' '}
              <span className="font-bold text-primary">
                {partnerType?.replace('_', ' ')}
              </span>{' '}
              as your partner role.
              <br />
              Partner role selection is permanent and cannot be changed.
            </p>
            <button
              onClick={handleGoToDashboard}
              disabled={isLoading}
              className="px-6 py-3 bg-primary hover:bg-primary/90 rounded-xl text-white transition-all duration-300 font-medium disabled:opacity-50"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {availablePartnerOptions.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
              >
                <Card
                  className="p-8 bg-card border border-border rounded-2xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredOption(option.id)}
                  onMouseLeave={() => setHoveredOption(null)}
                  onClick={() =>
                    requestSelectPartner(option.id as 'hotel_manager' | 'tour_operator')
                  }
                >
                  {/* Clean Modern Icon */}
                  <motion.div
                    className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <option.icon size={64} isSelected={hoveredOption === option.id} />
                  </motion.div>

                  {/* Title and Description */}
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-foreground mb-2">{option.title}</h3>
                    <p className="text-muted-foreground">{option.description}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-center mb-6">
                    <p className="text-primary text-sm font-medium">{option.stats}</p>
                  </div>

                  {/* Get Started Button */}
                  <div className="flex justify-center">
                    <motion.button
                      className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-xl text-white transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading || (!!activeRole && activeRole.role_type !== 'traveller')}
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Why Partner with TripAvail */}
        <motion.div
          className="p-8 bg-primary/5 rounded-2xl border border-primary/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-foreground mb-6">Why Partner with TripAvail?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-foreground font-semibold mb-1">Grow Your Business</h4>
                <p className="text-sm text-muted-foreground">
                  Reach millions of travelers worldwide
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-foreground font-semibold mb-1">Build Your Brand</h4>
                <p className="text-sm text-muted-foreground">Showcase your unique offerings</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-foreground font-semibold mb-1">Manage Everything</h4>
                <p className="text-sm text-muted-foreground">
                  Powerful tools for seamless operations
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Friendly permanent-choice confirmation — prevents a mis-tap from locking the role */}
      <Dialog
        open={pendingMode !== null}
        onOpenChange={(open) => {
          if (!open && !isLoading) setPendingMode(null)
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl">
              <span aria-hidden>{pendingMode === 'hotel_manager' ? '🏨' : '🏔️'}</span>
            </div>
            <DialogTitle className="text-center text-xl">
              Ready to become a {pendingLabel}?
            </DialogTitle>
            <DialogDescription className="text-center">
              We&apos;ll set up your{' '}
              <span className="font-semibold text-foreground">{pendingLabel}</span> workspace. You
              can always keep browsing as a traveller — but your partner type stays {pendingLabel}{' '}
              and can&apos;t be switched to the other one later.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl bg-muted/50 p-3 text-center text-sm text-muted-foreground">
            Not fully sure yet? No pressure — nothing is locked in until you tap confirm.
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setPendingMode(null)}
              disabled={isLoading}
            >
              Not yet
            </Button>
            <Button className="rounded-full" onClick={confirmSelectPartner} disabled={isLoading}>
              {isLoading ? 'Setting up…' : "Yes, I'm ready"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
