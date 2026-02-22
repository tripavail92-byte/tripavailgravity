import { ArrowRight, Star, TrendingUp, Users } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Modern3DHotelIcon } from '@/components/icons/Modern3DHotelIcon'
import { Modern3DTourIcon } from '@/components/icons/Modern3DTourIcon'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

export default function PartnerSelectionPage() {
  const { switchRole, activeRole, partnerType } = useAuth()
  const navigate = useNavigate()
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

  const handleSelectPartner = async (mode: 'hotel_manager' | 'tour_operator') => {
    // If not logged in, redirect to auth with selected role
    if (!activeRole) {
      navigate(`/auth?role=${mode}`)
      return
    }

    // Hard lock (Option A): if partnerType is already set, block switching.
    if (partnerType && partnerType !== mode) {
      alert(
        `You are already a ${partnerType.replace('_', ' ')}. Partner role selection is permanent.`,
      )
      return
    }

    setIsLoading(true)
    try {
      await switchRole(mode)
      // After becoming a partner, redirect into the required setup flow.
      // - Tour Operator -> Setup
      // - Hotel Manager  -> Hotel listing
      navigate(mode === 'tour_operator' ? '/operator/setup' : '/manager/list-hotel')
    } catch (error) {
      console.error('Failed to switch role:', error)
      alert('Failed to switch role. Please try again.')
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
                    handleSelectPartner(option.id as 'hotel_manager' | 'tour_operator')
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
    </motion.div>
  )
}
