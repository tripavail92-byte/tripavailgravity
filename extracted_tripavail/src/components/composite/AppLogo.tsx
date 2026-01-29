import { BRAND_COLORS } from '../../lib/constants';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-base',
  md: 'text-lg', 
  lg: 'text-xl',
};

export function AppLogo({ size = 'md', className = '' }: AppLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span 
        className={sizeClasses[size]}
        style={{ color: BRAND_COLORS.PRIMARY, fontWeight: '700' }}
      >
        Trip
      </span>
      <span 
        className={`${sizeClasses[size]} text-gray-900 dark:text-foreground`}
        style={{ fontWeight: '700' }}
      >
        Avail
      </span>
    </div>
  );
}