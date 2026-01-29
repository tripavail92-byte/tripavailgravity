import { User } from 'lucide-react';

interface ProfileAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  src?: string;
  name?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
};

const iconSizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6', 
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
};

export function ProfileAvatar({ 
  size = 'md', 
  src, 
  name = 'User',
  className = '' 
}: ProfileAvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  if (src) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 ${className}`}>
        <img 
          src={src} 
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium ${className}`}>
      {initials.length > 0 ? (
        <span className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : size === 'lg' ? 'text-base' : 'text-lg'}>
          {initials}
        </span>
      ) : (
        <User className={iconSizeClasses[size]} />
      )}
    </div>
  );
}