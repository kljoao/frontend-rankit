import { cn } from '@/lib/utils';

interface RankItLogoProps {
  className?: string;
  variant?: 'default' | 'white';
}

export function RankItLogo({ className, variant = 'default' }: RankItLogoProps) {
  const textColor = variant === 'white' ? 'text-white' : 'text-gradient-primary';
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center font-heading font-bold text-xl',
          variant === 'white' 
            ? 'bg-white text-primary' 
            : 'bg-gradient-primary text-white'
        )}>
          R
        </div>
        <div className={cn(
          'absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
          variant === 'white'
            ? 'bg-accent text-white'
            : 'bg-accent text-white'
        )}>
          1
        </div>
      </div>
      <span className={cn('font-heading text-2xl font-bold', textColor)}>
        {variant === 'white' ? (
          'RankIt'
        ) : (
          <>
            <span className="text-primary">Rank</span>
            <span className="text-secondary">It</span>
          </>
        )}
      </span>
    </div>
  );
}
