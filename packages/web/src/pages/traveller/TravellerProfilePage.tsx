/**
 * Traveller Profile Page - LIVE VERSION
 *
 * Full-featured profile management with:
 * - Real data integration via Supabase
 * - Edit mode for all profile fields
 * - Email/phone verification system
 * - Avatar upload
 * - Profile completion tracking
 */

import { format } from 'date-fns'
import {
  Calendar,
  Camera,
  Check,
  ChevronRight,
  CreditCard,
  Edit,
  Loader2,
  Lock,
  Mail,
  Map,
  MapPin,
  Phone,
  Save,
  Wallet,
  X,
} from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { GlassBadge, GlassCard } from '@/components/ui/glass'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/hooks/useAuth'
import { type UserProfile, userProfileService } from '@/services/userProfileService'

interface ContactInfoItem {
  id: string
  icon: typeof Mail
  label: string
  value: string
  verified: boolean
  isCalendar?: boolean
  isRoseAccent?: boolean
}

interface EditingField {
  [key: string]: string
}

export default function TravellerProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingData, setEditingData] = useState<EditingField>({})
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  // Verification modals
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [showPhoneVerification, setShowPhoneVerification] = useState(false)
  const [phoneOTP, setPhoneOTP] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  // Load profile on mount
  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      const profileData = await userProfileService.getProfile()
      setProfile(profileData)

      // Initialize editing data
      setEditingData({
        first_name: profileData?.first_name || '',
        last_name: profileData?.last_name || '',
        phone: profileData?.phone || '',
        bio: profileData?.bio || '',
        address: profileData?.address || '',
        city: profileData?.city || '',
      })

      if (profileData?.date_of_birth) {
        setDateOfBirth(new Date(profileData.date_of_birth))
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset editing data
      setEditingData({
        first_name: profile?.first_name || '',
        last_name: profile?.last_name || '',
        phone: profile?.phone || '',
        bio: profile?.bio || '',
        address: profile?.address || '',
        city: profile?.city || '',
      })
    }
    setIsEditing(!isEditing)
  }

  const handleFieldChange = (field: string, value: string) => {
    setEditingData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true)

      const updateData: any = {
        first_name: editingData.first_name,
        last_name: editingData.last_name,
        phone: editingData.phone,
        bio: editingData.bio,
        address: editingData.address,
        city: editingData.city,
      }

      if (dateOfBirth) {
        updateData.date_of_birth = dateOfBirth.toISOString()
      }

      const updatedProfile = await userProfileService.updateProfile(updateData)
      setProfile(updatedProfile)
      setIsEditing(false)
      toast.success('Profile saved successfully!')
    } catch (error) {
      console.error('Failed to save profile:', error)
      toast.error('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleVerifyEmail = async () => {
    try {
      setIsVerifying(true)
      await userProfileService.sendEmailVerification()
      setShowEmailVerification(false)
    } catch (error) {
      console.error('Failed to send verification email:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleVerifyPhone = async () => {
    try {
      setIsVerifying(true)
      await userProfileService.sendPhoneVerification(profile?.phone || '')
      setShowPhoneVerification(true)
    } catch (error) {
      console.error('Failed to send OTP:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleVerifyPhoneOTP = async () => {
    try {
      setIsVerifying(true)
      await userProfileService.verifyPhoneOTP(profile?.phone || '', phoneOTP)

      // Reload profile to get updated verification status
      await loadProfile()
      setShowPhoneVerification(false)
      setPhoneOTP('')
    } catch (error) {
      console.error('Failed to verify OTP:', error)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      await userProfileService.uploadAvatar(file)
      await loadProfile()
    } catch (error) {
      console.error('Failed to upload avatar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
        <GlassCard variant="light" className="p-8 rounded-2xl text-center">
          <p className="text-muted-foreground mb-4">Failed to load profile</p>
          <Button onClick={loadProfile} variant="outline">
            Try Again
          </Button>
        </GlassCard>
      </div>
    )
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
  const profileCompletion = userProfileService.calculateCompletion(profile)

  const contactInfo: ContactInfoItem[] = [
    {
      id: 'email',
      icon: Mail,
      label: 'Email',
      value: profile.email,
      verified: profile.email_verified || false,
    },
    {
      id: 'phone',
      icon: Phone,
      label: 'Phone',
      value: profile.phone || 'Not added',
      verified: profile.phone_verified || false,
    },
    {
      id: 'address',
      icon: MapPin,
      label: 'Address',
      value: profile.address || 'Not added',
      verified: false,
    },
    {
      id: 'location',
      icon: Map,
      label: 'City',
      value: profile.city || 'Not added',
      verified: false,
    },
    {
      id: 'dob',
      icon: Calendar,
      label: 'Date of Birth',
      value: dateOfBirth ? format(dateOfBirth, 'MMMM dd, yyyy') : 'Not added',
      verified: true,
      isCalendar: true,
      isRoseAccent: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-foreground">Profile</h1>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleEditToggle}
            disabled={isSaving}
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {isEditing && (
          <div className="bg-accent/10 border border-accent rounded-lg p-4 mb-4">
            <p className="text-sm text-accent-foreground">
              <strong>Editing mode:</strong> Make changes below and click Save to update your
              profile.
            </p>
          </div>
        )}
        {/* Profile Header Card */}
        <GlassCard
          variant="card"
          className="p-6 rounded-2xl"
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-background shadow-lg bg-muted">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
                    <span className="text-2xl font-bold text-primary">
                      {fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {isEditing && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-foreground/90"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={isLoading}
                  />
                </label>
              )}
            </div>

            {isEditing ? (
              <>
                <div className="w-full space-y-3 mb-4">
                  <input
                    type="text"
                    placeholder="First name"
                    value={editingData.first_name || ''}
                    onChange={(e) => handleFieldChange('first_name', e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    placeholder="Last name"
                    value={editingData.last_name || ''}
                    onChange={(e) => handleFieldChange('last_name', e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-lg text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold text-foreground mb-2">
                  {fullName || 'Add your name'}
                </h2>
              </>
            )}

            {isEditing ? (
              <textarea
                placeholder="Tell us about yourself..."
                value={editingData.bio || ''}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-input rounded-lg text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-6"
              />
            ) : (
              <>
                <p className="text-muted-foreground mb-1 max-w-sm leading-relaxed">
                  {profile.bio || 'No bio added yet'}
                </p>
              </>
            )}

            {/* Member Since */}
            {!isEditing && (
              <p className="text-sm text-muted-foreground mb-6">
                {profile.created_at
                  ? `Member since ${format(new Date(profile.created_at), 'MMM yyyy')}`
                  : 'New member'}
              </p>
            )}

            {/* Profile Completion */}
            <div className="w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground">Profile completion</span>
                <span className="text-sm font-semibold text-foreground">{profileCompletion}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <motion.div
                  className="h-2 rounded-full"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${profileCompletion}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 mt-6 w-full">
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </GlassCard>

        {/* About Me Card */}
        {!isEditing && (
          <GlassCard
            variant="card"
            className="p-6 rounded-2xl"
            asMotion
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">About Me</h3>
            <p className="text-muted-foreground leading-relaxed">
              {profile.bio || 'Add a bio to help other travelers know more about you'}
            </p>
          </GlassCard>
        )}

        {/* Contact Information Card */}
        <GlassCard
          variant="card"
          className="rounded-2xl overflow-hidden"
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Contact Info</h3>
          </div>

          <div className="divide-y divide-border">
            {contactInfo.map((item) =>
              item.isCalendar ? (
                <Popover key={item.id} open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <motion.div
                      className={`p-6 ${isEditing ? 'cursor-text' : 'hover:bg-muted/40'} transition-colors`}
                      whileHover={!isEditing ? { x: 4 } : {}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              item.isRoseAccent ? 'bg-primary/10' : 'bg-muted'
                            }`}
                          >
                            <item.icon
                              size={20}
                              className={item.isRoseAccent ? 'text-primary' : 'text-foreground/80'}
                            />
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">{item.label}</div>
                            <div
                              className={
                                isEditing
                                  ? 'text-sm text-primary font-medium'
                                  : 'font-medium text-foreground'
                              }
                            >
                              {item.value}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {item.verified && (
                            <GlassBadge
                              variant="info"
                              size="sm"
                              icon={<Check className="w-3 h-3" />}
                            >
                              Verified
                            </GlassBadge>
                          )}
                          {!isEditing && <ChevronRight className="w-4 h-4 text-muted-foreground/70" />}
                        </div>
                      </div>
                    </motion.div>
                  </PopoverTrigger>

                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dateOfBirth || undefined}
                      onSelect={(date) => {
                        if (date) {
                          setDateOfBirth(date)
                          setIsCalendarOpen(false)
                        }
                      }}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              ) : item.id === 'email' ? (
                <motion.div
                  key={item.id}
                  className={`p-6 ${isEditing ? '' : 'hover:bg-muted/40'} transition-colors cursor-pointer`}
                  whileHover={!isEditing ? { x: 4 } : {}}
                  onClick={() => !profile.email_verified && setShowEmailVerification(true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <item.icon size={20} className="text-foreground/80" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">{item.label}</div>
                        <div className="font-medium text-foreground">{item.value}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {item.verified ? (
                        <GlassBadge variant="info" size="sm" icon={<Check className="w-3 h-3" />}>
                          Verified
                        </GlassBadge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7"
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowEmailVerification(true)
                          }}
                        >
                          Verify
                        </Button>
                      )}
                      {!isEditing && <ChevronRight className="w-4 h-4 text-muted-foreground/70" />}
                    </div>
                  </div>
                </motion.div>
              ) : item.id === 'phone' ? (
                <motion.div
                  key={item.id}
                  className={`p-6 ${isEditing ? '' : 'hover:bg-muted/40'} transition-colors`}
                  whileHover={!isEditing ? { x: 4 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <item.icon size={20} className="text-foreground/80" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">{item.label}</div>
                        {isEditing ? (
                          <input
                            type="tel"
                            placeholder="Enter phone number"
                            value={editingData.phone || ''}
                            onChange={(e) => handleFieldChange('phone', e.target.value)}
                            className="w-full px-3 py-1 border border-border/60 bg-background rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                          />
                        ) : (
                          <div className="font-medium text-foreground">{item.value}</div>
                        )}
                      </div>
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-3">
                        {item.verified ? (
                          <GlassBadge variant="info" size="sm" icon={<Check className="w-3 h-3" />}>
                            Verified
                          </GlassBadge>
                        ) : profile.phone ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7"
                            onClick={() => handleVerifyPhone()}
                            disabled={isVerifying}
                          >
                            {isVerifying ? 'Sending...' : 'Verify'}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground/70">Not added</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={item.id}
                  className={`p-6 ${isEditing ? '' : 'hover:bg-muted/40'} transition-colors`}
                  whileHover={!isEditing ? { x: 4 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <item.icon size={20} className="text-foreground/80" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-muted-foreground">{item.label}</div>
                        {isEditing ? (
                          item.id === 'address' ? (
                            <input
                              type="text"
                              placeholder="Enter address"
                              value={editingData.address || ''}
                              onChange={(e) => handleFieldChange('address', e.target.value)}
                              className="w-full px-3 py-1 border border-border/60 bg-background rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                            />
                          ) : item.id === 'location' ? (
                            <input
                              type="text"
                              placeholder="Enter city"
                              value={editingData.city || ''}
                              onChange={(e) => handleFieldChange('city', e.target.value)}
                              className="w-full px-3 py-1 border border-border/60 bg-background rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mt-1"
                            />
                          ) : (
                            <div className="font-medium text-foreground">{item.value}</div>
                          )
                        ) : (
                          <div className="font-medium text-foreground">{item.value}</div>
                        )}
                      </div>
                    </div>

                    {!isEditing && <ChevronRight className="w-4 h-4 text-muted-foreground/70" />}
                  </div>
                </motion.div>
              ),
            )}
          </div>
        </GlassCard>

        {/* Payment Methods Card */}
        <GlassCard
          variant="card"
          className="rounded-2xl overflow-hidden"
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Payment Methods</h3>
          </div>

          <div className="divide-y divide-border">
            <motion.div
              className="p-6 hover:bg-muted/40 transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Wallet size={20} className="text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Mobile Wallets</div>
                    <div className="text-sm text-muted-foreground">EasyPaisa, JazzCash</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
              </div>
            </motion.div>

            <motion.div
              className="p-6 hover:bg-muted/40 transition-colors cursor-pointer"
              whileHover={{ x: 4 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-info/10 rounded-full flex items-center justify-center">
                    <CreditCard size={20} className="text-info" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Credit & Debit Cards</div>
                    <div className="text-sm text-muted-foreground">Visa, Mastercard</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
              </div>
            </motion.div>
          </div>
        </GlassCard>

        {/* Account Security Card */}
        <GlassCard
          variant="card"
          className="rounded-2xl overflow-hidden"
          asMotion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Account Security</h3>
          </div>

          <motion.div
            className="p-6 hover:bg-muted/40 transition-colors cursor-pointer"
            whileHover={{ x: 4 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                  <Lock size={20} className="text-success" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Change Password</div>
                  <div className="text-sm text-muted-foreground">
                    Update your password to keep your account secure
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
            </div>
          </motion.div>
        </GlassCard>
      </div>

      {/* Email Verification Modal */}
      <Dialog open={showEmailVerification} onOpenChange={setShowEmailVerification}>
        <DialogContent>
          <DialogTitle>Verify Your Email</DialogTitle>
          <DialogDescription>We'll send a verification link to {profile?.email}</DialogDescription>

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowEmailVerification(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleVerifyEmail}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                'Send Verification Link'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Phone Verification Modal */}
      <Dialog open={showPhoneVerification} onOpenChange={setShowPhoneVerification}>
        <DialogContent>
          <DialogTitle>Verify Your Phone</DialogTitle>
          <DialogDescription>
            Enter the OTP (One-Time Password) sent to {profile?.phone}
          </DialogDescription>

          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={phoneOTP}
            onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            className="w-full px-4 py-3 border border-border/60 bg-background rounded-lg text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 mt-4"
          />

          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowPhoneVerification(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={handleVerifyPhoneOTP}
              disabled={isVerifying || phoneOTP.length !== 6}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
