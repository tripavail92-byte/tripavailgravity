import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { 
    ShieldCheck, 
    Clock, 
    AlertCircle, 
    CheckCircle2, 
    ArrowRight,
    Search,
    FileText,
    Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass';

export default function VerificationStatusPage() {
    const { activeRole } = useAuth();
    const navigate = useNavigate();

    const status = activeRole?.verification_status || 'incomplete';
    const roleLabel = activeRole?.role_type === 'hotel_manager' ? 'Hotel Manager' : 'Tour Operator';
    const setupPath = activeRole?.role_type === 'hotel_manager' ? '/manager/setup?step=verification' : '/operator/setup?step=verification';

    const getStatusContent = () => {
        switch (status) {
            case 'approved':
                return {
                    icon: <CheckCircle2 className="w-16 h-16 text-green-500" />,
                    title: "Verified Partner",
                    description: `Your ${roleLabel} account has been fully verified. You have full access to all platform features.`,
                    color: "bg-green-500",
                    action: null
                };
            case 'pending':
                return {
                    icon: <Clock className="w-16 h-16 text-amber-500 animate-pulse-slow" />,
                    title: "Verification Pending",
                    description: "Your documents are currently under review by our compliance team. This typically takes 48-72 hours.",
                    color: "bg-amber-500",
                    action: (
                        <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100">
                            <p className="text-sm text-amber-800 font-medium">
                                Need to update something? Contact our partner support team.
                            </p>
                        </div>
                    )
                };
            case 'rejected':
                return {
                    icon: <AlertCircle className="w-16 h-16 text-red-500" />,
                    title: "Verification Declined",
                    description: "We couldn't verify your account with the provided documents. Please review the requirements and re-submit.",
                    color: "bg-red-500",
                    action: (
                        <Button 
                            className="mt-8 rounded-2xl px-8 bg-red-600 hover:bg-red-700 h-12 font-bold"
                            onClick={() => navigate(setupPath)}
                        >
                            Re-submit Documents <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    )
                };
            case 'incomplete':
            default:
                return {
                    icon: <Shield className="w-16 h-16 text-primary" />,
                    title: "Verification Required",
                    description: "You haven't completed your partner profile yet. Verification is required to list your services and accept bookings.",
                    color: "bg-primary",
                    action: (
                        <Button 
                            className="mt-8 rounded-2xl px-8 bg-primary-gradient hover:opacity-90 border-0 h-12 font-bold text-white shadow-lg shadow-primary/20"
                            onClick={() => navigate(setupPath)}
                        >
                            Complete Setup <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    )
                };
        }
    };

    const content = getStatusContent();

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans pb-20">
            {/* Header */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-6">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-black shadow-sm border border-primary/20">
                            V
                        </div>
                        <div>
                            <h1 className="font-black text-gray-900 tracking-tighter text-xl uppercase italic">Partner Verification</h1>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">
                                {roleLabel} • Trusted Status
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-6 pt-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <GlassCard variant="card" className="rounded-[32px] p-12 text-center relative overflow-hidden">
                        {/* Decorative Background Elements */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full -ml-32 -mb-32 blur-3xl" />

                        <div className="relative z-10 flex flex-col items-center">
                            <div className="mb-8 p-6 bg-white rounded-3xl shadow-xl shadow-gray-200/50">
                                {content.icon}
                            </div>

                            <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-4 italic uppercase">
                                {content.title}
                            </h2>
                            
                            <p className="text-xl text-gray-500 max-w-xl mx-auto font-medium leading-relaxed">
                                {content.description}
                            </p>

                            {content.action}
                        </div>
                    </GlassCard>

                    {/* Trust Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                        <TrustCard 
                            icon={<ShieldCheck className="w-6 h-6" />}
                            title="Secure Data"
                            description="Your documents are encrypted and stored securely."
                        />
                        <TrustCard 
                            icon={<Search className="w-6 h-6" />}
                            title="Manual Review"
                            description="Every application is reviewed personally by our team."
                        />
                        <TrustCard 
                            icon={<FileText className="w-6 h-6" />}
                            title="Legal Compliance"
                            description="Meeting international standards for travel partners."
                        />
                    </div>
                </motion.div>
            </main>
        </div>
    );
}

function TrustCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="p-6 rounded-2xl border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:text-primary group-hover:bg-primary/5 transition-colors mb-4">
                {icon}
            </div>
            <h3 className="font-bold text-gray-900 mb-1 italic uppercase tracking-tight">{title}</h3>
            <p className="text-sm text-gray-500 leading-snug">{description}</p>
        </Card>
    );
}
