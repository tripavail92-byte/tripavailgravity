import { motion } from 'motion/react'
import { ArrowRight, Star, TrendingUp, Users } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Modern3DHotelIcon } from '@/components/icons/Modern3DHotelIcon'
import { Modern3DTourIcon } from '@/components/icons/Modern3DTourIcon'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/hooks/useAuth'

export default function PartnerSelectionPage() {
  const { switchRole, activeRole } = useAuth()
  const navigate = useNavigate()
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const partnerOptions = [
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

  const handleSelectPartner = async (mode: 'hotel_manager' | 'tour_operator') => {
    // If not logged in, redirect to auth with selected role
    if (!activeRole) {
      navigate(`/auth?role=${mode}`)
      return
    }

    // Check if user already has a partner role
    if (activeRole.role_type !== 'traveller') {
      alert(
        `You have already selected ${activeRole.role_type}. Partner role selection is permanent.`,
      )
      return
    }

    setIsLoading(true)
    try {
      await switchRole(mode)
      // Redirect to specific dashboard based on role
      if (mode === 'hotel_manager') {
        navigate('/manager/dashboard')
      } else if (mode === 'tour_operator') {
        navigate('/operator/dashboard')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Failed to switch role:', error)
      alert('Failed to switch role. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-gray-50 flex items-center justify-center p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Choose Your Partner Type</h1>
          <p className="text-lg text-gray-600">Select how you want to earn with TripAvail</p>
          {activeRole && activeRole.role_type !== 'traveller' && (
            <p className="mt-4 text-warning font-medium">
              ⚠️ You have already selected a partner role. This choice is permanent.
            </p>
          )}
        </div>

        {/* Partner Options - Clean Design */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {partnerOptions.map((option, index) => (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card
                className="p-8 bg-white border border-gray-200 rounded-2xl hover:shadow-2xl transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredOption(option.id)}
                onMouseLeave={() => setHoveredOption(null)}
                onClick={() => handleSelectPartner(option.id as 'hotel_manager' | 'tour_operator')}
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{option.title}</h3>
                  <p className="text-gray-600">{option.description}</p>
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

        {/* Why Partner with TripAvail */}
        <motion.div
          className="p-8 bg-primary/5 rounded-2xl border border-primary/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Partner with TripAvail?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-gray-900 font-semibold mb-1">Grow Your Business</h4>
                <p className="text-sm text-gray-600">Reach millions of travelers worldwide</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Star className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-gray-900 font-semibold mb-1">Build Your Brand</h4>
                <p className="text-sm text-gray-600">Showcase your unique offerings</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="text-gray-900 font-semibold mb-1">Manage Everything</h4>
                <p className="text-sm text-gray-600">Powerful tools for seamless operations</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
