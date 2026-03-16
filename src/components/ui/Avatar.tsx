import { cn } from '@/lib/utils/cn';

interface AvatarProps {
  src?: string | null;
  customSrc?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-12 h-12 text-base',
};

export function Avatar({ src, customSrc, name, size = 'md', className }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const displaySrc = customSrc || src;

  if (displaySrc) {
    return (
      <img
        src={displaySrc}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-[var(--color-primary)] flex items-center justify-center font-medium text-white',
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
