import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IdentitySubFlow } from './IdentitySubFlow';
import { BusinessDocsSubFlow } from '../../tour-operator/setup/components/verification/BusinessDocsSubFlow';
import { PropertyOwnershipSubFlow } from '../../hotel-manager/setup/components/verification/PropertyOwnershipSubFlow';
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService';
import { hotelManagerService } from '@/features/hotel-manager/services/hotelManagerService';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function PartnerVerificationHub() {
    const { user, activeRole } = useAuth();
    const [step, setStep] = useState<'identity' | 'docs' | 'property' | 'complete'>('identity');
    const [isLoading, setIsLoading] = useState(true);
    const [verificationData, setVerificationData] = useState<any>({
        idCardUrl: '',
        selfieUrl: '',
        matchingScore: 0,
        businessDocs: {},
        ownershipDocs: {}
    });

    const role = activeRole?.role_type;
    const service = role === 'tour_operator' ? tourOperatorService : hotelManagerService;

    useEffect(() => {
        const loadStatus = async () => {
            if (!user?.id) return;
            try {
                const data = await service.getOnboardingData(user.id);
                if (data?.verification) {
                    const ver = data.verification as any;
                    setVerificationData(ver);
                    // Determine starting step based on existing data
                    if (ver.matchingScore > 0) {
                        if (role === 'hotel_manager' && !ver.ownershipDocs?.titleDeedUrl) {
                            setStep('property');
                        } else {
                            setStep('docs');
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading verification status:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadStatus();
    }, [user?.id, role]);

    const handleIdentityComplete = (idData: any) => {
        setVerificationData((prev: any) => ({ ...prev, ...idData }));
        setStep('docs');
    };

    const handleDocsComplete = async (docs: any) => {
        setVerificationData((prev: any) => ({ ...prev, businessDocs: docs }));
        
        if (role === 'hotel_manager') {
            setStep('property');
        } else {
            await finishVerification();
        }
    };

    const handlePropertyComplete = async (propertyDocs: any) => {
        setVerificationData((prev: any) => ({ ...prev, ownershipDocs: propertyDocs }));
        await finishVerification();
    };

    const finishVerification = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            // Save final verification data and mark as pending review
            await service.saveOnboardingData(user.id, { 
                verification: verificationData 
            }, true);
            setStep('complete');
        } catch (error) {
            console.error('Error finishing verification:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                <p className="mt-4 text-gray-500 font-medium">Initializing verification hub...</p>
            </div>
        );
    }

    if (step === 'complete') {
        return (
            <div className="text-center py-12 space-y-6">
                <div className="flex justify-center">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                </div>
                <h2 className="text-3xl font-black text-gray-900 italic uppercase">Verification Submitted</h2>
                <p className="text-gray-500 max-w-md mx-auto">
                    Your documents have been received and are now under manual review. This typically takes 48-72 hours.
                </p>
                <Button 
                    className="rounded-2xl px-8 h-12 font-bold"
                    onClick={() => window.location.reload()}
                >
                    View Status
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Verification Header */}
            <div className="mb-12 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 text-primary rounded-full text-xs font-black uppercase tracking-widest mb-4">
                    <ShieldCheck className="w-4 h-4" />
                    High-Trust Verification
                </div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
                    {step === 'identity' ? 'Identity Verification' : 
                     step === 'docs' ? 'Business Compliance' : 'Property Authentication'}
                </h2>
                <p className="text-gray-500 mt-2 font-medium">
                    {step === 'identity' ? 'Biometric match with government issued ID' : 
                     step === 'docs' ? 'Official registration and license documents' : 'Live evidence of property ownership'}
                </p>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    {step === 'identity' && (
                        <IdentitySubFlow 
                            onComplete={handleIdentityComplete} 
                            initialData={verificationData}
                            role={role === 'tour_operator' ? 'tour_operator' : 'hotel_manager'}
                        />
                    )}

                    {step === 'docs' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <button 
                                    onClick={() => setStep('identity')}
                                    className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                                >
                                    ← Back to Identity
                                </button>
                            </div>
                            <BusinessDocsSubFlow 
                                onComplete={handleDocsComplete}
                                initialData={verificationData?.businessDocs}
                            />
                        </div>
                    )}

                    {step === 'property' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between mb-4">
                                <button 
                                    onClick={() => setStep('docs')}
                                    className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                                >
                                    ← Back to Business Docs
                                </button>
                            </div>
                            <PropertyOwnershipSubFlow 
                                onComplete={handlePropertyComplete}
                                initialData={verificationData?.ownershipDocs}
                            />
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Privacy Shield */}
            <Card className="mt-12 p-6 bg-gray-50/50 border-gray-100 rounded-2xl flex gap-4 items-start">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100">
                    <ShieldCheck className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400 italic mb-1">Encrypted & Secure</p>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                        Your documents are processed via end-to-end encryption. TripAvail compliance officers only view these files to verify legal eligibility.
                    </p>
                </div>
            </Card>
        </div>
    );
}
