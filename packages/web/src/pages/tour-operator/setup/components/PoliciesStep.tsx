import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Shield,
    FileText,
    Check,
    ChevronDown,
    ClipboardCheck,
    FileUp,
    AlertCircle,
    Trash2,
    CalendarDays,
    HeartPulse,
    ShieldAlert,
    Wallet,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

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

const POLICY_TEMPLATES = [
    {
        id: 'cancellation',
        title: 'Cancellation Policy',
        icon: CalendarDays,
        template: 'Tours cancelled 48+ hours in advance: Full refund\nTours cancelled 24-48 hours: 50% refund\nTours cancelled <24 hours: No refund\nWeather cancellations: Full refund or reschedule'
    },
    {
        id: 'liability',
        title: 'Liability & Insurance',
        icon: ShieldAlert,
        template: 'All tours include comprehensive insurance coverage\nOperator liability limited to tour cost\nParticipants advised to have personal travel insurance\nNot liable for acts of God or extreme weather'
    },
    {
        id: 'safety',
        title: 'Safety Standards',
        icon: HeartPulse,
        template: 'Safety briefing provided before all tours\nFirst aid certified guides on all tours\nEmergency contact procedures established\nAge and fitness requirements clearly communicated'
    },
    {
        id: 'booking',
        title: 'Booking & Payments',
        icon: Wallet,
        template: '25% deposit required to secure booking\nFull payment due 7 days before tour\nGroup size minimums and maximums apply\nSpecial dietary requirements accommodated with notice'
    },
];

export function PoliciesStep({ onUpdate, data }: StepProps) {
    const [accepted, setAccepted] = useState(data.policies?.accepted || false);
    const [expanded, setExpanded] = useState<string | null>(null);
    const { user } = useAuth();
    const [policyMode, setPolicyMode] = useState<'templates' | 'upload'>(data.policies?.mode || 'templates');
    const [customPolicies, setCustomPolicies] = useState<Record<string, string>>(data.policies?.custom || {});
    const [uploads, setUploads] = useState<Record<string, boolean>>(data.policies?.uploads || {});
    const [isUploading, setIsUploading] = useState<string | null>(null);

    const updateAllData = (newData: any) => {
        onUpdate({
            policies: {
                accepted,
                mode: policyMode,
                custom: customPolicies,
                uploads,
                ...newData
            }
        });
    };

    const toggleAccepted = () => {
        const next = !accepted;
        setAccepted(next);
        updateAllData({ accepted: next });
    };

    const handlePolicyChange = (id: string, value: string) => {
        const next = { ...customPolicies, [id]: value };
        setCustomPolicies(next);
        updateAllData({ custom: next });
    };

    const useTemplate = (id: string, template: string) => {
        handlePolicyChange(id, template);
    };

    const handleUpload = async (id: string, file: File) => {
        if (!user?.id) return;

        setIsUploading(id);
        try {
            await tourOperatorService.uploadAsset(user.id, file, `policies/${id}`);
            const next = { ...uploads, [id]: true };
            setUploads(next);
            updateAllData({ uploads: next });
            toast.success('Policy document uploaded!');
        } catch (error) {
            console.error('Policy upload error:', error);
            toast.error('Failed to upload policy document');
        } finally {
            setIsUploading(null);
        }
    };

    return (
        <div className="space-y-8 w-full max-w-3xl mx-auto pb-12">
            <div className="mb-8">
                <h3 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Terms & Policies</h3>
                <p className="text-lg text-gray-500">Define how you operate and ensure a safe experience for travelers.</p>
            </div>

            {/* Platform Terms Section */}
            <section className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-primary" />
                    <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Platform Agreement</h4>
                </div>
                <div className="space-y-3">
                    {PLATFORM_TERMS.map((term) => (
                        <div key={term.id} className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm ring-1 ring-black/[0.02]">
                            <button
                                onClick={() => setExpanded(expanded === term.id ? null : term.id)}
                                className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-gray-900">{term.title}</p>
                                        <p className="text-xs text-gray-500">{term.desc}</p>
                                    </div>
                                </div>
                                <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform", expanded === term.id && "rotate-180")} />
                            </button>
                            <AnimatePresence>
                                {expanded === term.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-t border-gray-50"
                                    >
                                        <div className="p-6 text-sm text-gray-600 space-y-3 leading-relaxed bg-gray-50/30">
                                            <p>By using the TripAvail platform, you agree to provide accurate information and maintain professional standards of service. You are responsible for the safety and quality of the tours you list.</p>
                                            <ul className="list-disc pl-5 space-y-1 text-xs">
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
                    className={cn(
                        "p-5 cursor-pointer border-2 transition-all rounded-2xl mt-4 flex items-center gap-4 group",
                        accepted ? "border-primary bg-primary/[0.02] shadow-sm" : "border-gray-100 bg-white hover:border-gray-200"
                    )}
                >
                    <div className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all",
                        accepted ? "bg-primary border-primary text-white scale-110" : "border-gray-200 text-transparent group-hover:border-primary/30"
                    )}>
                        <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm">I accept the Platform Terms</p>
                        <p className="text-xs text-gray-500 font-medium">I have read and agree to all platform operating policies.</p>
                    </div>
                </Card>
            </section>

            <hr className="border-gray-100" />

            {/* Operator Policies Section */}
            <section className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5 text-primary" />
                        <h4 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Your Operation Policies</h4>
                    </div>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => { setPolicyMode('templates'); updateAllData({ mode: 'templates' }); }}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                                policyMode === 'templates' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            Templates
                        </button>
                        <button
                            onClick={() => { setPolicyMode('upload'); updateAllData({ mode: 'upload' }); }}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                                policyMode === 'upload' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            <FileUp className="w-3.5 h-3.5" />
                            Upload
                        </button>
                    </div>
                </div>

                {policyMode === 'templates' ? (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {POLICY_TEMPLATES.map((policy) => (
                            <div key={policy.id} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                            <policy.icon className="w-4 h-4" />
                                        </div>
                                        <Label className="text-sm font-bold text-gray-700 uppercase tracking-tight">{policy.title}</Label>
                                    </div>
                                    {!customPolicies[policy.id] && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => useTemplate(policy.id, policy.template)}
                                            className="text-xs text-primary font-bold hover:bg-primary/5 rounded-lg h-8"
                                        >
                                            <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                                            Use Template
                                        </Button>
                                    )}
                                </div>
                                <div className="relative group">
                                    <Textarea
                                        placeholder={`Describe your ${policy.title.toLowerCase()}...`}
                                        value={customPolicies[policy.id] || ''}
                                        onChange={(e) => handlePolicyChange(policy.id, e.target.value)}
                                        className="min-h-[120px] rounded-2xl border-gray-100 focus:border-primary/30 focus:ring-primary/10 transition-all resize-none text-sm p-4 bg-white/50"
                                    />
                                    {customPolicies[policy.id] && (
                                        <button
                                            onClick={() => handlePolicyChange(policy.id, '')}
                                            className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur shadow-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="p-10 border-2 border-dashed border-gray-100 rounded-[32px] bg-gray-50/50 flex flex-col items-center justify-center text-center group hover:border-primary/20 hover:bg-primary/[0.01] transition-all">
                            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm border border-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:scale-110 transition-all mb-4">
                                <FileUp className="w-8 h-8" />
                            </div>
                            <h5 className="font-bold text-gray-900 mb-1">Upload Policy Documents</h5>
                            <p className="text-xs text-gray-500 max-w-[240px] leading-relaxed mb-6">
                                Upload your PDF or Word documents containing all your tour policies.
                            </p>
                            <Button variant="outline" className="rounded-xl font-bold bg-white shadow-sm border-gray-200">
                                Select Files
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['cancellation_signed', 'safety_manual'].map((id) => (
                                <Card key={id} className={cn(
                                    "p-4 border-gray-100 shadow-sm rounded-2xl flex items-center justify-between transition-all",
                                    uploads[id] && "bg-primary/[0.02] border-primary/20"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            uploads[id] ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                                        )}>
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-gray-900">{id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</p>
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">{uploads[id] ? 'Verified' : 'Required'}</p>
                                        </div>
                                    </div>
                                    {!uploads[id] ? (
                                        <div className="relative">
                                            <input
                                                type="file"
                                                id={`upload-${id}`}
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleUpload(id, file);
                                                }}
                                                disabled={!!isUploading}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                asChild
                                                className="h-8 w-8 p-0 rounded-lg hover:bg-primary/5 hover:text-primary"
                                                disabled={!!isUploading}
                                            >
                                                <label htmlFor={`upload-${id}`} className="cursor-pointer flex items-center justify-center">
                                                    {isUploading === id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <FileUp className="w-4 h-4" />
                                                    )}
                                                </label>
                                            </Button>
                                        </div>
                                    ) : (
                                        <Check className="w-4 h-4 text-primary" />
                                    )}
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* Helper Alert */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-6 flex gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <div className="space-y-1">
                    <p className="font-bold text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Platform Compliance
                    </p>
                    <p className="text-sm text-amber-800/80 leading-relaxed font-medium">
                        TripAvail reserves the right to audit your tour operations to ensure safety standards and insurance requirements are met. Your listed prices must match your publicly advertised rates.
                    </p>
                </div>
            </div>
        </div>
    );
}
