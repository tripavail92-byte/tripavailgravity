import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CreditCard, Plus, Trash2, Smartphone, ShieldCheck, Info, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  paymentMethodService,
  type UserPaymentMethod,
} from '@/features/traveller/services/paymentMethodService'
import { GlassCard } from '@/components/ui/glass'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

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
              className={`p-3 rounded-xl ${method.method_type === 'card' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}
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

          <h3 className="text-lg font-bold text-gray-900 mb-1">{method.label}</h3>
          <p className="text-sm text-gray-500 font-medium tracking-wider">
            {method.method_type === 'card'
              ? `•••• •••• •••• ${method.last_four}`
              : method.phone_number?.replace(/(\d{4})(\d{3})(\d{4})/, '$1-***-$3')}
          </p>
        </div>

        <div className="relative z-10 mt-8 flex items-center justify-between border-t border-gray-50 pt-4">
          {!method.is_default ? (
            <button
              onClick={() => handleSetDefault(method.id)}
              className="text-xs font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest"
            >
              Set Default
            </button>
          ) : (
            <span></span>
          )}

          <button
            onClick={() => handleDelete(method.id)}
            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </GlassCard>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-12 pb-20 px-4">
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
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">Payment Methods</h1>
            <p className="text-gray-500 font-medium">
              Manage your credit cards and mobile wallets for a faster checkout.
            </p>
          </motion.div>

          <Button
            onClick={() => setIsAddingCard(true)}
            className="rounded-2xl h-14 px-8 bg-primary hover:bg-primary/90 text-white font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
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
                className="h-48 rounded-3xl bg-white/50 animate-pulse border border-gray-100"
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
            className="p-20 text-center rounded-[3rem] border-dashed border-2 border-gray-200 bg-transparent"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No payment methods saved</h2>
            <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium">
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
        <div className="mt-12 p-6 rounded-3xl bg-blue-50/50 border border-blue-100 flex gap-4">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-sm font-bold text-blue-900 mb-1">Your security is our priority</h4>
            <p className="text-xs text-blue-700/80 font-medium leading-relaxed">
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
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-900">Add Payment Method</h2>
                <button
                  onClick={() => setIsAddingCard(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <div className="p-8">
                <div className="flex bg-gray-50 p-1.5 rounded-2xl mb-8">
                  <button
                    onClick={() => setActiveTab('card')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'card' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Credit Card
                  </button>
                  <button
                    onClick={() => setActiveTab('wallet')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'wallet' ? 'bg-white text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Mobile Wallet
                  </button>
                </div>

                {activeTab === 'card' ? (
                  <div className="space-y-6">
                    <div className="p-8 rounded-3xl bg-gray-50 border border-gray-100 text-center">
                      <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 font-medium mb-6">
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
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${walletType === 'easypaisa' ? 'border-emerald-500 bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Badge className="bg-emerald-500 text-white border-none p-1">EP</Badge>
                        </div>
                        <span className="text-xs font-bold text-gray-700">EasyPaisa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWalletType('jazzcash')}
                        className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${walletType === 'jazzcash' ? 'border-amber-500 bg-amber-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                      >
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Badge className="bg-amber-500 text-white border-none p-1">JC</Badge>
                        </div>
                        <span className="text-xs font-bold text-gray-700">JazzCash</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-1">Wallet Number</label>
                      <div className="relative">
                        <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="tel"
                          placeholder="03xx-xxxxxxx"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full bg-gray-50 border-none rounded-2xl h-14 pl-12 pr-4 font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 ring-primary/20"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full rounded-2xl h-14 bg-primary text-white font-black text-lg shadow-xl shadow-primary/20"
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
