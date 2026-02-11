import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, PartyPopper, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CompletionStep() {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center py-12 space-y-12">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative"
            >
                <div className="w-32 h-32 bg-primary/10 rounded-[48px] flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
                    <CheckCircle2 className="w-16 h-16" />
                </div>
                <motion.div
                    animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-4 -right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
                >
                    <PartyPopper className="w-6 h-6 text-yellow-500" />
                </motion.div>
            </motion.div>

            <div className="text-center space-y-4">
                <h3 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic">Success!</h3>
                <p className="text-xl text-gray-500 max-w-sm mx-auto font-medium leading-relaxed">
                    Your partner application has been submitted for review.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="p-6 bg-primary/[0.03] border border-primary/10 rounded-[32px] flex flex-col gap-3">
                    <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <p className="font-black text-xs uppercase tracking-widest text-primary italic">Verification</p>
                    <p className="text-sm text-primary/80 font-medium">Our team will verify your documents within 48-72 hours.</p>
                </div>

                <div className="p-6 bg-gray-50 border border-gray-100 rounded-[32px] flex flex-col gap-3">
                    <div className="w-10 h-10 bg-white text-gray-400 rounded-xl flex items-center justify-center border border-gray-100">
                        <ArrowRight className="w-5 h-5" />
                    </div>
                    <p className="font-black text-xs uppercase tracking-widest text-gray-400 italic">Next Steps</p>
                    <p className="text-sm text-gray-500 font-medium">You can now head to your dashboard and start drafting your properties.</p>
                </div>
            </div>

            <Button 
                onClick={() => navigate('/manager/dashboard')} 
                size="lg" 
                className="w-full h-16 rounded-[24px] text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
                Go to Dashboard
            </Button>
        </div>
    );
}
