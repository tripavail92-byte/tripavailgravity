import { motion } from 'motion/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { MobileWalletIcon, CreditCardIcon, EasyPaisaIcon, JazzCashIcon, BankCardIcon } from '../../../components/icons/profile/PaymentMethodIcons';

interface PaymentMethodsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function PaymentMethodsScreen({ onNavigate }: PaymentMethodsScreenProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-gray-200 dark:border-border">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onNavigate('home')}
              className="text-gray-600 dark:text-muted-foreground -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Payment Methods</h1>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Payment Methods */}
        <div className="space-y-4">
          {/* Mobile Wallets */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white dark:bg-card border-0 shadow-sm">
              <motion.div
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                whileHover={{ x: 4 }}
                onClick={() => onNavigate('mobile-wallets')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <MobileWalletIcon size={24} className="text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-foreground">Mobile Wallets</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">EasyPaisa, JazzCash & more</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* EasyPaisa & JazzCash mini icons */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
                        <EasyPaisaIcon size={20} className="" />
                      </div>
                      <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
                        <JazzCashIcon size={20} className="" />
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </motion.div>
            </Card>
          </motion.div>

          {/* Debit/Credit Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-white dark:bg-card border-0 shadow-sm">
              <motion.div
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                whileHover={{ x: 4 }}
                onClick={() => onNavigate('payment-cards')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <CreditCardIcon size={24} className="text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-foreground">Cards</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Debit & Credit Cards</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Card icon */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                        <BankCardIcon size={20} className="text-gray-700 dark:text-gray-300" />
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
              </motion.div>
            </Card>
          </motion.div>
        </div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 bg-blue-600 dark:bg-blue-400 rounded-full flex items-center justify-center mt-0.5">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Secure Payments</h4>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Additional spacing for bottom navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}