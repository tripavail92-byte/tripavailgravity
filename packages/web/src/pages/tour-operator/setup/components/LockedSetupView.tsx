import { Building, CheckCircle2, LayoutDashboard, Lock, MapPin, Phone, UnlockKeyhole, User } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import type { TourOperatorOnboardingData } from '@/features/tour-operator/services/tourOperatorService'

interface LockedSetupViewProps {
  data: Partial<TourOperatorOnboardingData>
  onEdit: () => void
}

export function LockedSetupView({ data, onEdit }: LockedSetupViewProps) {
  const navigate = useNavigate()
  const { personalInfo, businessInfo, coverage, services } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/25 text-green-600 dark:text-green-400 text-[10px] font-bold uppercase tracking-widest">
          <CheckCircle2 className="w-3 h-3" />
          Setup Complete & Locked
        </div>
        <h3 className="text-2xl font-black text-foreground tracking-tight">
          Your Operator Profile
        </h3>
        <p className="text-muted-foreground text-sm font-medium leading-relaxed">
          Your setup is complete. Click <span className="text-foreground font-semibold">Edit Profile</span> below if you need to make changes.
        </p>
      </motion.div>

      {/* Personal info card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="p-5 rounded-2xl bg-muted/30 border border-border/50 flex items-center gap-4"
      >
        {data.profilePicture ? (
          <img
            src={data.profilePicture}
            alt="Profile"
            className="w-16 h-16 rounded-2xl object-cover border border-border flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border/50 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-muted-foreground/30" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-black text-foreground text-lg truncate">
            {personalInfo?.operatorName || personalInfo?.contactPerson || '—'}
          </p>
          <p className="text-muted-foreground text-sm truncate">{personalInfo?.email || '—'}</p>
        </div>
      </motion.div>

      {/* Business info card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="p-5 rounded-2xl bg-muted/30 border border-border/50 flex items-start gap-4"
      >
        {businessInfo?.companyLogo ? (
          <img
            src={businessInfo.companyLogo}
            alt="Company Logo"
            className="w-12 h-12 rounded-xl object-contain border border-border flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-muted border border-border/50 flex items-center justify-center flex-shrink-0">
            <Building className="w-5 h-5 text-muted-foreground/30" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-bold text-foreground">{businessInfo?.businessName || '—'}</p>
          {businessInfo?.businessDescription ? (
            <p className="text-muted-foreground text-sm leading-relaxed mt-0.5 line-clamp-3">
              {businessInfo.businessDescription}
            </p>
          ) : null}
          {businessInfo?.yearsInBusiness ? (
            <p className="text-muted-foreground/70 text-xs mt-1">
              {businessInfo.yearsInBusiness} years in business
              {businessInfo?.teamSize ? ` · ${businessInfo.teamSize} team members` : ''}
            </p>
          ) : null}
        </div>
      </motion.div>

      {/* Details grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="grid grid-cols-2 gap-3"
      >
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Phone className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Phone</span>
          </div>
          <p className="font-semibold text-foreground text-sm">{personalInfo?.phone || '—'}</p>
        </div>
        <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Location</span>
          </div>
          <p className="font-semibold text-foreground text-sm">{coverage?.primaryLocation || '—'}</p>
        </div>
      </motion.div>

      {/* Categories */}
      {services?.selected && services.selected.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3 }}
          className="space-y-2"
        >
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Tour Categories
          </p>
          <div className="flex flex-wrap gap-2">
            {[...services.selected, ...(services.custom || [])].map((cat) => (
              <span
                key={cat}
                className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold capitalize"
              >
                {cat.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* Lock notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="flex items-center gap-2.5 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20"
      >
        <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" aria-hidden="true" />
        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
          Your setup is locked. Editing will allow changes — make sure to complete all steps again to re-lock.
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.3 }}
        className="flex flex-col gap-3 pt-1"
      >
        <Button
          onClick={() => navigate('/operator/dashboard')}
          className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
        >
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
        <Button
          variant="outline"
          onClick={onEdit}
          className="w-full h-12 rounded-xl font-semibold border-border/60 hover:bg-muted/40"
        >
          <UnlockKeyhole className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </motion.div>
    </div>
  )
}
