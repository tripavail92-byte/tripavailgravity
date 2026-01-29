import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeft,
  Plus,
  Check,
  ChevronRight,
  CreditCard,
  Shield,
  Edit3,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';

interface PaymentCardsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function PaymentCardsScreen({ onNavigate }: PaymentCardsScreenProps) {
  const [cards] = useState([
    {
      id: 'card-1',
      type: 'Visa',
      lastFour: '4532',
      holderName: 'MARIA RODRIGUEZ',
      expiry: '12/26',
      isDefault: true,
      bankName: 'HBL Bank',
      cardType: 'Debit',
      color: 'from-blue-600 to-blue-700',
      textColor: 'text-white'
    },
    {
      id: 'card-2',
      type: 'Mastercard',
      lastFour: '8901',
      holderName: 'MARIA RODRIGUEZ',
      expiry: '08/25',
      isDefault: false,
      bankName: 'MCB Bank',
      cardType: 'Credit',
      color: 'from-red-600 to-red-700',
      textColor: 'text-white'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showCardNumbers, setShowCardNumbers] = useState(false);

  const getCardLogo = (type: string) => {
    switch (type) {
      case 'Visa':
        return (
          <div className="text-lg font-bold text-white">VISA</div>
        );
      case 'Mastercard':
        return (
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 bg-red-500 rounded-full opacity-80"></div>
            <div className="w-6 h-6 bg-yellow-500 rounded-full opacity-80 -ml-3"></div>
          </div>
        );
      default:
        return <CreditCard className="w-6 h-6 text-white" />;
    }
  };

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
              <h1 className="text-xl font-semibold text-gray-900 dark:text-foreground">Payment Cards</h1>
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
        {/* Add New Card Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <Card className="p-6 bg-white dark:bg-card border-0 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">Add New Card</h3>
              
              {/* Card Type Selection */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <motion.button
                  className="p-4 border-2 border-blue-200 dark:border-blue-800 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 hover:from-blue-100 hover:to-blue-150 dark:hover:from-blue-800/30 dark:hover:to-blue-700/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-foreground">Debit Card</span>
                  </div>
                </motion.button>

                <motion.button
                  className="p-4 border-2 border-purple-200 dark:border-purple-800 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/10 hover:from-purple-100 hover:to-purple-150 dark:hover:from-purple-800/30 dark:hover:to-purple-700/20 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-medium text-gray-900 dark:text-foreground">Credit Card</span>
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

        {/* Existing Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">Your Cards</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCardNumbers(!showCardNumbers)}
              className="text-gray-500"
            >
              {showCardNumbers ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Show
                </>
              )}
            </Button>
          </div>
          
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 bg-white dark:bg-card border-0 shadow-sm">
                {/* Card Preview */}
                <div className={`w-full h-48 bg-gradient-to-br ${card.color} rounded-xl p-6 mb-4 relative overflow-hidden`}>
                  {/* Card Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white rounded-full"></div>
                    <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-white rounded-full"></div>
                  </div>
                  
                  {/* Card Content */}
                  <div className="relative h-full flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <div className="text-white/80 text-sm">{card.bankName}</div>
                      {getCardLogo(card.type)}
                    </div>
                    
                    <div>
                      <div className="text-white text-xl font-mono tracking-wider mb-4">
                        {showCardNumbers 
                          ? `4532 1234 5678 ${card.lastFour}`
                          : `•••• •••• •••• ${card.lastFour}`
                        }
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white/80 text-xs uppercase">Card Holder</div>
                          <div className="text-white text-sm font-medium">{card.holderName}</div>
                        </div>
                        <div>
                          <div className="text-white/80 text-xs uppercase">Expires</div>
                          <div className="text-white text-sm font-medium">{card.expiry}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Details */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-foreground">
                          {card.type} {card.cardType}
                        </span>
                        {card.isDefault && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        Ending in {card.lastFour} • {card.bankName}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="p-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                    </Button>
                    <Button variant="ghost" size="sm" className="p-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </Button>
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
              <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-1">Security & Privacy</h4>
              <p className="text-sm text-blue-700 dark:text-blue-400">
                Your card information is encrypted with bank-level security. We use tokenization to protect your data during transactions.
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