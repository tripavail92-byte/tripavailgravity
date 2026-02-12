import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    User, 
    ShieldCheck, 
    Upload, 
    ArrowRight, 
    Check, 
    Loader2, 
    AlertCircle,
    ScanFace,
    CreditCard
} from 'lucide-react';
import { tourOperatorService } from '@/features/tour-operator/services/tourOperatorService';
import { hotelManagerService } from '@/features/hotel-manager/services/hotelManagerService';
import { aiVerificationService } from '@/features/verification/services/aiVerificationService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface IdentitySubFlowProps {
    onComplete: (data: { 
        idCardUrl: string; 
        selfieUrl: string; 
        matchingScore: number;
    }) => void;
    initialData?: any;
    role: 'tour_operator' | 'hotel_manager';
}

type SubStep = 'id_front' | 'selfie' | 'verifying' | 'result';

export function IdentitySubFlow({ onComplete, initialData, role }: IdentitySubFlowProps) {
    const { user } = useAuth();
    const [subStep, setSubStep] = useState<SubStep>('id_front');
    const [idCardUrl, setIdCardUrl] = useState<string>(initialData?.idCardUrl || '');
    const [selfieUrl, setSelfieUrl] = useState<string>(initialData?.selfieUrl || '');
    const [isUploading, setIsUploading] = useState(false);
    const [verificationResult, setVerificationResult] = useState<{ match: boolean; score: number; reason?: string } | null>(null);

    const service = role === 'tour_operator' ? tourOperatorService : hotelManagerService;

    const handleIdUpload = async (file: File) => {
        if (!user?.id) return;
        setIsUploading(true);
        try {
            const url = await service.uploadAsset(user.id, file, 'verification/id_card');
            setIdCardUrl(url);
            setSubStep('selfie');
            toast.success('ID Card uploaded!');
        } catch (error) {
            toast.error('Upload failed. Try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSelfieUpload = async (file: File) => {
        if (!user?.id) return;
        setIsUploading(true);
        try {
            const url = await service.uploadAsset(user.id, file, 'verification/selfie');
            setSelfieUrl(url);
            setSubStep('verifying');
            
            // Run AI Verification
            const result = await aiVerificationService.compareFaceToId(idCardUrl, url);
            setVerificationResult(result);
            setSubStep('result');
            
            if (result.match) {
                toast.success('Identity Verified!');
            } else {
                toast.error('Identity documents do not match.');
            }
        } catch (error) {
            toast.error('Verification failed. Try again.');
            setSubStep('selfie');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            <AnimatePresence mode="wait">
                {subStep === 'id_front' && (
                    <motion.div
                        key="id_front"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                                <CreditCard className="w-8 h-8" />
                            </div>
                            <h4 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Step 1: Government ID</h4>
                            <p className="text-gray-500 mt-2 font-medium">Please upload a clear photo of your passport or national ID card.</p>
                        </div>

                        <Card className="p-12 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50/50 rounded-[32px]">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                                <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                            <input
                                type="file"
                                id="id-upload"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleIdUpload(e.target.files[0])}
                                disabled={isUploading}
                            />
                            <Button asChild className="rounded-2xl px-10 h-14 bg-primary-gradient text-white font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20">
                                <label htmlFor="id-upload" className="cursor-pointer">
                                    {isUploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                                    Select ID Card
                                </label>
                            </Button>
                        </Card>
                    </motion.div>
                )}

                {subStep === 'selfie' && (
                    <motion.div
                        key="selfie"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                    >
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
                                <ScanFace className="w-8 h-8" />
                            </div>
                            <h4 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Step 2: Verification Selfie</h4>
                            <p className="text-gray-500 mt-2 font-medium">Take a photo of yourself holding the same ID card at chest level. Make sure both your face and the ID details are visible.</p>
                        </div>

                        <Card className="p-12 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center bg-gray-50/50 rounded-[32px]">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6">
                                <User className="w-8 h-8 text-gray-400" />
                            </div>
                            <input
                                type="file"
                                id="selfie-upload"
                                className="hidden"
                                capture="user"
                                onChange={(e) => e.target.files?.[0] && handleSelfieUpload(e.target.files[0])}
                                disabled={isUploading}
                            />
                            <Button asChild className="rounded-2xl px-10 h-14 bg-primary-gradient text-white font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20">
                                <label htmlFor="selfie-upload" className="cursor-pointer">
                                    {isUploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />}
                                    Take / Upload Selfie
                                </label>
                            </Button>
                        </Card>
                    </motion.div>
                )}

                {subStep === 'verifying' && (
                    <motion.div
                        key="verifying"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-primary mx-auto mb-8"
                        >
                            <ShieldCheck className="w-10 h-10" />
                        </motion.div>
                        <h4 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Comparing Biometrics</h4>
                        <p className="text-gray-500 mt-2 font-medium">AI is matching your selfie with your ID card photo. This will take a moment...</p>
                    </motion.div>
                )}

                {subStep === 'result' && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-8"
                    >
                        <Card className={cn(
                            "p-10 rounded-[32px] text-center border-2",
                            verificationResult?.match ? "bg-green-50/50 border-green-100" : "bg-red-50/50 border-red-100"
                        )}>
                            <div className={cn(
                                "w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl",
                                verificationResult?.match ? "bg-green-500 text-white" : "bg-red-500 text-white"
                            )}>
                                {verificationResult?.match ? <Check className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                            </div>

                            <h4 className="text-3xl font-black text-gray-900 tracking-tight italic uppercase">
                                {verificationResult?.match ? "Identity Matched" : "Verification Failed"}
                            </h4>
                            
                            <p className="text-gray-500 mt-4 font-medium px-4">
                                {verificationResult?.reason || (verificationResult?.match 
                                    ? `AI confirmed identity with a confidence score of ${verificationResult.score}%.`
                                    : "The face in the selfie does not match the ID card.")}
                            </p>

                            {verificationResult?.match ? (
                                <Button 
                                    className="mt-10 rounded-2xl h-14 bg-primary-gradient text-white px-12 font-black uppercase tracking-widest border-0 shadow-lg shadow-primary/20"
                                    onClick={() => onComplete({
                                        idCardUrl,
                                        selfieUrl,
                                        matchingScore: verificationResult.score
                                    })}
                                >
                                    Proceed to Documents <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            ) : (
                                <Button 
                                    className="mt-10 rounded-2xl h-14 bg-gray-900 px-12 font-black uppercase tracking-widest"
                                    onClick={() => setSubStep('id_front')}
                                >
                                    Try Again
                                </Button>
                            )}
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
