import { useState } from 'react';
import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Landmark, Info, ShieldCheck } from 'lucide-react';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

export function BankDetailsStep({ onUpdate, data }: StepProps) {
    const [formData, setFormData] = useState(data.bankInfo || {
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        routingNumber: '',
    });

    const handleInputChange = (field: string, value: string) => {
        const next = { ...formData, [field]: value };
        setFormData(next);
        onUpdate({ bankInfo: next });
    };

    return (
        <div className="space-y-12">
            <div className="text-center flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-primary rounded-[40px] flex items-center justify-center text-white mb-8 shadow-2xl shadow-primary/30"
                >
                    <CreditCard className="w-12 h-12" />
                </motion.div>
                <h3 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter uppercase italic">Payout Setup</h3>
                <p className="text-xl text-gray-500 max-w-md mx-auto leading-relaxed font-medium">Securely receive your payments from guests.</p>
            </div>

            <Card className="p-8 space-y-6 border-gray-100 shadow-sm rounded-[32px] bg-white ring-1 ring-black/[0.02]">
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                            <Landmark className="w-3.5 h-3.5" />
                            Bank Name
                        </Label>
                        <Input
                            value={formData.bankName}
                            onChange={(e) => handleInputChange('bankName', e.target.value)}
                            placeholder="e.g. HBL, Bank Alfalah, etc."
                            className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Account Holder Name</Label>
                        <Input
                            value={formData.accountHolder}
                            onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                            placeholder="Exact name as on bank statement"
                            className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Account / IBAN</Label>
                            <Input
                                value={formData.accountNumber}
                                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                                placeholder="PK00 XXXX XXXX..."
                                className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-1">Swift / Routing</Label>
                            <Input
                                value={formData.routingNumber}
                                onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                                placeholder="8-11 characters"
                                className="rounded-2xl border-gray-200 py-7 focus-visible:ring-primary/20"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-5 bg-primary/[0.03] border border-primary/10 rounded-2xl mt-4">
                    <ShieldCheck className="w-6 h-6 text-primary flex-shrink-0" />
                    <p className="text-xs text-primary/70 font-semibold leading-relaxed">
                        Payout information is stored using industry-standard AES-256 encryption. We never share your full bank details with anyone.
                    </p>
                </div>
            </Card>

            <div className="p-6 bg-gray-50 border border-gray-100 rounded-[28px] flex gap-5">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Info className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">International Payouts</p>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        TripAvail supports payouts in over 40 currencies. Conversion fees may apply based on your bank's policy.
                    </p>
                </div>
            </div>
        </div>
    );
}
