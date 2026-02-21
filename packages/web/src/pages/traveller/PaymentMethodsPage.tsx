import { CreditCard, Info, Loader2, Plus, ShieldCheck, Smartphone, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass'
import {
  paymentMethodService,
  type UserPaymentMethod,
} from '@/features/traveller/services/paymentMethodService'
import { useAuth } from '@/hooks/useAuth'

export default function PaymentMethodsPage() {
  const {} = useAuth()
  const [methods, setMethods] = useState<UserPaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [activeTab, setActiveTab] = useState<'card' | 'wallet'>('card')

  // Form States
  const [walletType, setWalletType] = useState<'easypaisa' | 'jazzcash'>('easypaisa')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadMethods()
  }, [])

  const loadMethods = async () => {
    try {
      setIsLoading(true)
      const data = await paymentMethodService.getPaymentMethods()
      setMethods(data)
    } catch (err) {
      console.error('Failed to load payment methods:', err)
      toast.error('Could not load your payment methods')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddWallet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber) return toast.error('Please enter a phone number')

    try {
      setIsSubmitting(true)
      await paymentMethodService.savePaymentMethod({
        method_type: walletType,
        provider: walletType,
        label: `${walletType.charAt(0).toUpperCase() + walletType.slice(1)} Wallet`,
        phone_number: phoneNumber,
        is_default: methods.length === 0,
      })
      toast.success(`${walletType} wallet added successfully!`)
      setPhoneNumber('')
      setIsAddingCard(false)
      loadMethods()
    } catch (err) {
      toast.error('Failed to save wallet')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this payment method?')) return
    try {
      await paymentMethodService.deletePaymentMethod(id)
      toast.success('Deleted')
      loadMethods()
    } catch (err) {
      toast.error('Failed to delete')
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await paymentMethodService.setDefault(id)
      toast.success('Default updated')
      loadMethods()
    } catch (err) {
      toast.error('Failed to update default')
    }
  }

  const renderCard = (method: UserPaymentMethod) => (
    <motion.div
      layout
      key={method.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative group ${method.is_default ? 'ring-2 ring-primary' : ''}`}
    >
      <GlassCard
        variant="card"
        className="p-6 rounded-2xl h-full flex flex-col justify-between border-none shadow-lg overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div
              className={`p-3 rounded-xl ${
                method.method_type === 'card'
                  ? 'bg-info/10 text-info'
                  : 'bg-success/10 text-success'
              }`}
            >
              {method.method_type === 'card' ? (
                <CreditCard className="w-6 h-6" />
              ) : (
                <Smartphone className="w-6 h-6" />
              )}
            </div>
            {method.is_default && (
              <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black px-2">
                Primary
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-bold text-foreground mb-1">{method.label}</h3>
          <p className="text-sm text-muted-foreground font-medium tracking-wider">
            {method.method_type === 'card'
              ? `•••• •••• •••• ${method.last_four}`
              : method.phone_number?.replace(/(\d{4})(\d{3})(\d{4})/, '$1-***-$3')}
          </p>
        </div>

        <div className="relative z-10 mt-8 flex items-center justify-between border-t border-border/40 pt-4">
          {!method.is_default ? (
            <button
              onClick={() => handleSetDefault(method.id)}
              className="text-xs font-bold text-muted-foreground/70 hover:text-primary transition-colors uppercase tracking-widest"
            >
              Set Default
            </button>
          ) : (
            <span></span>
          )}

          <button
            onClick={() => handleDelete(method.id)}
            className="p-2 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-muted/30 pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border/50 pt-12 pb-20 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-black text-primary uppercase tracking-widest">
                Secure Payments
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
              Payment Methods
            </h1>
            <p className="text-muted-foreground font-medium">
              Manage your credit cards and mobile wallets for a faster checkout.
            </p>
          </motion.div>

          <Button
            onClick={() => setIsAddingCard(true)}
            className="rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5 mr-2" /> Add New Method
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-12">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-3xl bg-card/50 animate-pulse border border-border/50"
              />
            ))}
          </div>
        ) : methods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {methods.map((method) => renderCard(method))}
            </AnimatePresence>
          </div>
        ) : (
          <GlassCard
            variant="light"
            className="p-20 text-center rounded-[3rem] border-dashed border-2 border-border bg-transparent"
          >
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No payment methods saved</h2>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">
              Add a card or mobile wallet to enjoy seamless bookings on TripAvail.
            </p>
            <Button
              variant="outline"
              onClick={() => setIsAddingCard(true)}
              className="rounded-full px-8"
            >
              Get Started
            </Button>
          </GlassCard>
        )}

        {/* Info Card */}
        <div className="mt-12 p-6 rounded-3xl bg-info/10 border border-info/20 flex gap-4">
          <Info className="w-5 h-5 text-info flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-bold text-foreground mb-1">
              Your security is our priority
            </h4>
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
              TripAvail uses Stripe for international credit card processing. We never store your
              full card details on our servers. Mobile wallet transactions are secured via dedicated
              provider APIs.
            </p>
          </div>
        </div>
      </div>

      {/* Modal for adding method */}
      <AnimatePresence>
        {isAddingCard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingCard(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-background rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-border/50 flex justify-between items-center">
                <h2 className="text-xl font-black text-foreground">Add Payment Method</h2>
                <button
                  onClick={() => setIsAddingCard(false)}
                  className="text-muted-foreground/70 hover:text-foreground"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="p-8">
                <div className="flex bg-muted/60 p-1.5 rounded-2xl mb-8">
                  <button
                    onClick={() => setActiveTab('card')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      activeTab === 'card'
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted-foreground/70 hover:text-foreground'
                    }`}
                  >
                    Credit Card
                  </button>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                      activeTab === 'wallet'
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted-foreground/70 hover:text-foreground'
                    }`}
                  >
                    Mobile Wallet
                  </button>
                </div>

                {activeTab === 'card' ? (
                  <div className="space-y-6">
                    <div className="p-8 rounded-3xl bg-muted/60 border border-border/50 text-center">
                      <CreditCard className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground font-medium mb-6">
                        Secure Stripe integration will appear here for card entry.
                      </p>
                      <Button
                        disabled={isSubmitting}
                        onClick={async () => {
                          setIsSubmitting(true)
                          // Mock adding a card
                          await new Promise((r) => setTimeout(r, 1000))
                          await paymentMethodService.savePaymentMethod({
                            method_type: 'card',
                            provider: 'stripe',
                            label: 'Visa ending in 4242',
                            last_four: '4242',
                            card_brand: 'visa',
                            exp_month: 12,
                            exp_year: 2025,
                            is_default: methods.length === 0,
                          })
                          setIsSubmitting(false)
                          setIsAddingCard(false)
                          loadMethods()
                          toast.success('Card added (Simulated)')
                        }}
                        className="w-full rounded-2xl h-12"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Simulate Add Card'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAddWallet} className="space-y-6">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setWalletType('easypaisa')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                          walletType === 'easypaisa'
                            ? 'border-success bg-success/10'
                            : 'border-border/50 hover:border-border'
                        }`}
                      >
                        <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center shadow-sm">
                          <Badge className="bg-success text-success-foreground border-none p-1">
                            EP
                          </Badge>
                        </div>
                        <span className="text-xs font-bold text-foreground/80">EasyPaisa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWalletType('jazzcash')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
                          walletType === 'jazzcash'
                            ? 'border-warning bg-warning/10'
                            : 'border-border/50 hover:border-border'
                        }`}
                      >
                        <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center shadow-sm">
                          <Badge className="bg-warning text-warning-foreground border-none p-1">
                            JC
                          </Badge>
                        </div>
                        <span className="text-xs font-bold text-foreground/80">JazzCash</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-foreground/80 ml-1">
                        Wallet Number
                      </label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                        <input
                          type="tel"
                          placeholder="03xx-xxxxxxx"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full bg-muted/60 border-none rounded-2xl h-14 pl-12 pr-4 font-bold text-foreground placeholder:text-muted-foreground/40 focus:ring-2 ring-primary/20"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-2xl h-14 bg-primary text-primary-foreground font-black text-lg shadow-xl shadow-primary/20"
                    >
                      {isSubmitting ? <Loader2 className="animate-spin" /> : 'Confirm Account'}
                    </Button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
