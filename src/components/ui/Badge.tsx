import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'outline';
  className?: string;
}

export function Badge({ children, color, variant = 'solid', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        variant === 'solid'
          ? 'text-white'
          : 'border',
        className
      )}
      style={
        color
          ? variant === 'solid'
            ? { backgroundColor: color }
            : { borderColor: color, color }
          : undefined
      }
    >
      {children}
    </span>
  );
}
