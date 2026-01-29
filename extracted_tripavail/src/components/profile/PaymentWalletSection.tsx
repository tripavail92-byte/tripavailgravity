import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Wallet, 
  CreditCard, 
  Building, 
  Check, 
  Edit2, 
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ModernVerificationBadge } from './ModernVerificationBadge';

interface PaymentMethod {
  id: string;
  type: 'easypaisa' | 'jazzcash' | 'bank_account';
  name: string;
  accountNumber: string;
  verified: boolean;
  primary: boolean;
  icon: string;
  color: string;
}

interface PaymentWalletSectionProps {
  className?: string;
}

const paymentTypeConfig = {
  easypaisa: {
    name: 'EasyPaisa',
    icon: '💳',
    color: 'bg-green-500',
    placeholder: 'Enter EasyPaisa account number',
    label: 'Account Number'
  },
  jazzcash: {
    name: 'JazzCash',
    icon: '📱',
    color: 'bg-orange-500',
    placeholder: 'Enter JazzCash wallet number',
    label: 'Wallet Number'
  },
  bank_account: {
    name: 'Bank Account',
    icon: '🏦',
    color: 'bg-blue-500',
    placeholder: 'Enter bank account number',
    label: 'Account Number'
  }
};

export function PaymentWalletSection({ className = '' }: PaymentWalletSectionProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'easypaisa',
      name: 'EasyPaisa',
      accountNumber: '03001234567',
      verified: true,
      primary: true,
      icon: '💳',
      color: 'bg-green-500'
    },
    {
      id: '2',
      type: 'jazzcash',
      name: 'JazzCash',
      accountNumber: '03009876543',
      verified: false,
      primary: false,
      icon: '📱',
      color: 'bg-orange-500'
    }
  ]);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState<keyof typeof paymentTypeConfig>('easypaisa');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [showAccountNumbers, setShowAccountNumbers] = useState<{[key: string]: boolean}>({});

  const handleAddPaymentMethod = () => {
    if (!newAccountNumber.trim()) return;

    const config = paymentTypeConfig[newPaymentType];
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: newPaymentType,
      name: config.name,
      accountNumber: newAccountNumber,
      verified: false,
      primary: paymentMethods.length === 0,
      icon: config.icon,
      color: config.color
    };

    setPaymentMethods([...paymentMethods, newMethod]);
    setNewAccountNumber('');
    setIsAddingNew(false);
  };

  const handleRemovePaymentMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
  };

  const handleSetPrimary = (id: string) => {
    setPaymentMethods(paymentMethods.map(method => ({
      ...method,
      primary: method.id === id
    })));
  };

  const toggleAccountVisibility = (id: string) => {
    setShowAccountNumbers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const maskAccountNumber = (accountNumber: string) => {
    if (accountNumber.length <= 4) return accountNumber;
    return `${accountNumber.slice(0, 3)}${'*'.repeat(accountNumber.length - 6)}${accountNumber.slice(-3)}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Payment Methods</h3>
          <p className="text-sm text-muted-foreground">Manage your wallets and bank accounts</p>
        </div>
        <Button
          onClick={() => setIsAddingNew(true)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add New
        </Button>
      </div>

      {/* Payment Methods List */}
      <div className="space-y-3">
        <AnimatePresence>
          {paymentMethods.map((method) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="group"
            >
              <Card className="p-4 hover:shadow-md transition-all duration-200 border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Payment Type Icon */}
                    <div className={`w-12 h-12 ${method.color} rounded-xl flex items-center justify-center text-white text-xl shadow-lg`}>
                      {method.icon}
                    </div>

                    {/* Payment Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-medium text-foreground">{method.name}</h4>
                        {method.verified && <ModernVerificationBadge verified={true} size="sm" />}
                        {method.primary && (
                          <Badge className="bg-primary text-primary-foreground text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground font-mono">
                          {showAccountNumbers[method.id] 
                            ? method.accountNumber 
                            : maskAccountNumber(method.accountNumber)
                          }
                        </span>
                        <button
                          onClick={() => toggleAccountVisibility(method.id)}
                          className="p-1 hover:bg-accent rounded transition-colors"
                        >
                          {showAccountNumbers[method.id] ? (
                            <EyeOff className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <Eye className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!method.primary && (
                      <Button
                        onClick={() => handleSetPrimary(method.id)}
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        Set Primary
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleRemovePaymentMethod(method.id)}
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add New Payment Method */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 border-dashed border-2 border-border">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-foreground">Add New Payment Method</h4>
                
                {/* Payment Type Selection */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-3 block">
                    Select Payment Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(paymentTypeConfig).map(([key, config]) => (
                      <motion.button
                        key={key}
                        onClick={() => setNewPaymentType(key as keyof typeof paymentTypeConfig)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          newPaymentType === key
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border hover:border-border/80 text-muted-foreground hover:text-foreground'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-2xl mb-2">{config.icon}</div>
                        <div className="text-sm font-medium">{config.name}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Account Number Input */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    {paymentTypeConfig[newPaymentType].label}
                  </label>
                  <Input
                    value={newAccountNumber}
                    onChange={(e) => setNewAccountNumber(e.target.value)}
                    placeholder={paymentTypeConfig[newPaymentType].placeholder}
                    className="bg-input-background dark:bg-input border-border focus:border-primary focus:ring-primary/20"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleAddPaymentMethod}
                    className="flex items-center gap-2"
                    disabled={!newAccountNumber.trim()}
                  >
                    <Check className="w-4 h-4" />
                    Add Payment Method
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewAccountNumber('');
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {paymentMethods.length === 0 && !isAddingNew && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No Payment Methods</h3>
          <p className="text-muted-foreground mb-6">Add your EasyPaisa, JazzCash, or bank account</p>
          <Button
            onClick={() => setIsAddingNew(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Your First Payment Method
          </Button>
        </motion.div>
      )}
    </div>
  );
}