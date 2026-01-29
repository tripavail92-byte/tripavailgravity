import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft,
  Plus,
  Check,
  ChevronRight,
  Wallet,
  Phone,
  Shield,
  Edit3,
  Trash2
} from 'lucide-react';
import { EasyPaisaIcon, JazzCashIcon } from '../../../components/icons/profile/PaymentMethodIcons';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

interface MobileWalletsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function MobileWalletsScreen({ onNavigate }: MobileWalletsScreenProps) {
  const [wallets] = useState([
    {
      id: 'easypaisa-1',
      type: 'EasyPaisa',
      number: '03001234567',
      name: 'Maria Rodriguez',
      isDefault: true,
      isVerified: true,
      color: 'bg-green-500',
      bgColor: 'from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10'
    },
    {
      id: 'jazzcash-1',
      type: 'JazzCash',
      number: '03151234567',
      name: 'Maria Rodriguez',
      isDefault: false,
      isVerified: false,
      color: 'bg-orange-500',
      bgColor: 'from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-800/10'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-card border-b border-gray-200 dark:border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onNavigate('profile')}
                className="text-gray-600 dark:text-muted-foreground -ml-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Mobile Wallets</h1>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Add New Wallet Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="p-6 bg-white dark:bg-card border-0 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">Add New Wallet</h3>
              
              {/* Wallet Type Selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.button
                  className="p-4 border-2 border-green-200 dark:border-green-800 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/10 hover:from-green-100 hover:to-green-150 dark:hover:from-green-800/30 dark:hover:to-green-700/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
                      <EasyPaisaIcon size={32} className="" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-foreground">EasyPaisa</span>
                  </div>
                </motion.button>

                <motion.button
                  className="p-4 border-2 border-orange-200 dark:border-orange-800 rounded-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/10 hover:from-orange-100 hover:to-orange-150 dark:hover:from-orange-800/30 dark:hover:to-orange-700/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
                      <JazzCashIcon size={32} className="" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-foreground">JazzCash</span>
                  </div>
                </motion.button>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setShowAddForm(false)}
                >
                  Continue
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="px-6"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Existing Wallets */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">Your Wallets</h2>
          
          {wallets.map((wallet, index) => (
            <motion.div
              key={wallet.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 bg-white dark:bg-card border-0 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700">
                      {wallet.type === 'EasyPaisa' ? (
                        <EasyPaisaIcon size={32} className="" />
                      ) : (
                        <JazzCashIcon size={32} className="" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-foreground">{wallet.type}</span>
                        {wallet.isDefault && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {wallet.number.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3')}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500">{wallet.name}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Verification Status */}
                    {wallet.isVerified ? (
                      <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
                        <Check className="w-3 h-3 text-green-500" />
                        <span className="text-xs font-medium text-green-700 dark:text-green-300">Verified</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-full">
                        <Shield className="w-3 h-3 text-orange-500" />
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Verify</span>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="p-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                      </Button>
                      <Button variant="ghost" size="sm" className="p-1.5">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Security Notice */}
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Security Notice</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Your wallet information is encrypted and secure. We never store your PIN or passwords.
              </p>
            </div>
          </div>
        </Card>

        {/* Additional spacing for bottom navigation */}
        <div className="h-20"></div>
      </div>
    </div>
  );
}