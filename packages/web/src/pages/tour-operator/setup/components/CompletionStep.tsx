import { motion } from 'motion/react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, PartyPopper, ArrowRight, LayoutDashboard, Map } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StepProps {
    onNext: () => void;
    onUpdate: (data: any) => void;
    data: any;
}

export function CompletionStep(_props: StepProps) {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center space-y-8 py-8 w-full max-w-md mx-auto">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 12, stiffness: 200 }}
                className="relative"
            >
                <div className="w-32 h-32 bg-primary/10 rounded-[40px] flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-16 h-16" />
                </div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -top-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-amber-500 border border-amber-50"
                >
                    <PartyPopper className="w-6 h-6" />
                </motion.div>
            </motion.div>

            <div className="text-center space-y-3">
                <h3 className="text-4xl font-extrabold text-gray-900 tracking-tight">You're All Set!</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                    Congratulations! Your tour operator profile is ready. You can now start creating world-class travel experiences.
                </p>
            </div>

            <div className="w-full space-y-4 pt-4">
                <Card className="p-4 border-gray-100 shadow-sm rounded-2xl hover:border-primary/20 transition-all cursor-pointer group" onClick={() => navigate('/operator/dashboard')}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <LayoutDashboard className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">Go to Dashboard</p>
                                <p className="text-xs text-gray-500">Manage your tours and bookings</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                    </div>
                </Card>

                <Card className="p-4 border-gray-100 shadow-sm rounded-2xl hover:border-primary/20 transition-all cursor-pointer group" onClick={() => navigate('/operator/tours/new')}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                <Map className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-gray-900">Create Your First Tour</p>
                                <p className="text-xs text-gray-500">Launch a new adventure package</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
                    </div>
                </Card>
            </div>

            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em] pt-8">
                Powered by TripAvail Partner Network
            </p>
        </div>
    );
}
