import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface GlassProgressProps {
    currentStep: number;
    totalSteps: number;
    className?: string;
}

export function GlassProgress({ currentStep, totalSteps, className }: GlassProgressProps) {
    const progress = Math.min(Math.max((currentStep / totalSteps) * 100, 0), 100);

    return (
        <div className={cn("w-full h-2 bg-gray-100/50 backdrop-blur-sm rounded-full overflow-hidden border border-white/20 shadow-inner", className)}>
            <motion.div
                className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
            />
        </div>
    );
}
