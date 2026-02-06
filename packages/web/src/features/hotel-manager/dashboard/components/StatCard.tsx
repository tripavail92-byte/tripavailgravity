import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
    label: string;
    value: string;
    change: string;
    trend: 'up' | 'down';
    icon: LucideIcon;
    period?: string;
}

export function StatCard({ label, value, change, trend, icon: Icon, period }: StatCardProps) {
    const isPositive = trend === 'up';
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;

    return (
        <Card className="p-6 hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>

                    <div className="flex items-center gap-1 text-sm">
                        <TrendIcon className={`w-4 h-4 ${isPositive ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {change}
                        </span>
                        {period && (
                            <span className="text-gray-500 ml-1">{period}</span>
                        )}
                    </div>
                </div>

                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                    style={{ background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.1) 0%, rgba(0, 212, 255, 0.1) 100%)' }}
                >
                    <Icon className="w-6 h-6" style={{ color: '#9D4EDD' }} />
                </div>
            </div>
        </Card>
    );
}
