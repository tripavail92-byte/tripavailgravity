import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileText, Check, ChevronDown } from 'lucide-react';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

const PLATFORM_TERMS = [
    { id: 'usage', title: 'Platform Usage', desc: 'Rules for using TripAvail services' },
    { id: 'payments', title: 'Payments & Commission', desc: 'Financial terms and fee structure' },
    { id: 'data', title: 'Data Protection', desc: 'Privacy and data handling policies' },
];

export function PoliciesStep({ onUpdate, data }: StepProps) {
    const [accepted, setAccepted] = useState(data.policies?.accepted || false);
    const [expanded, setExpanded] = useState<string | null>(null);

    const toggleAccepted = () => {
        setAccepted(!accepted);
        onUpdate({ policies: { accepted: !accepted } });
    };

    return (
        <div className="space-y-6 w-full max-w-2xl mx-auto">
            <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Terms & Policies</h3>
                <p className="text-gray-600">Review and accept the platform guidelines for tour operators.</p>
            </div>

            <div className="space-y-4">
                {PLATFORM_TERMS.map((term) => (
                    <div key={term.id} className="border border-gray-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                        <button
                            onClick={() => setExpanded(expanded === term.id ? null : term.id)}
                            className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-gray-900">{term.title}</p>
                                    <p className="text-xs text-gray-500">{term.desc}</p>
                                </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expanded === term.id ? 'rotate-180' : ''}`} />
                        </button>
                        <AnimatePresence>
                            {expanded === term.id && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden border-t border-gray-50"
                                >
                                    <div className="p-6 text-sm text-gray-600 space-y-3 leading-relaxed">
                                        <p>By using the TripAvail platform, you agree to provide accurate information and maintain professional standards of service. You are responsible for the safety and quality of the tours you list.</p>
                                        <ul className="list-disc pl-4 space-y-1">
                                            <li>Maintain up-to-date availability calendars.</li>
                                            <li>Honor all confirmed bookings.</li>
                                            <li>Respond to traveler inquiries within 24 hours.</li>
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            <Card
                onClick={toggleAccepted}
                className={`p-6 cursor-pointer border-2 transition-all rounded-3xl mt-8 flex items-center gap-4 ${accepted ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 bg-white hover:border-gray-200 shadow-sm'
                    }`}
            >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${accepted ? 'bg-primary border-primary text-white scale-110' : 'border-gray-200 text-transparent'
                    }`}>
                    <Check className="w-5 h-5" />
                </div>
                <div>
                    <p className="font-bold text-gray-900">I accept the Platform Terms</p>
                    <p className="text-xs text-gray-500">I have read and agree to all platform operating policies.</p>
                </div>
            </Card>

            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex gap-4 mt-4">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-1">
                    <p className="font-bold text-amber-900">Safety First</p>
                    <p className="text-sm text-amber-800/80 leading-relaxed">
                        TripAvail reserves the right to audit your tour operations to ensure safety standards and insurance requirements are met at all times.
                    </p>
                </div>
            </div>
        </div>
    );
}
