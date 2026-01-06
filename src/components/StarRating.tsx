
import { Star, StarHalf, Sparkle } from 'lucide-react'; // Using Sparkle for empty star
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  totalStars?: number;
  size?: number;
  className?: string;
  starClassName?: string;
  showText?: boolean;
  reviewCount?: number;
}

const StarRating = ({
  rating,
  totalStars = 5,
  size = 16,
  className,
  starClassName,
  showText = false,
  reviewCount,
}: StarRatingProps) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} fill="currentColor" size={size} className={cn("text-primary", starClassName)} />
      ))}
      {halfStar && <StarHalf key="half" fill="currentColor" size={size} className={cn("text-primary", starClassName)} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Sparkle key={`empty-${i}`} size={size} className={cn("text-primary/50", starClassName)} />
      ))}
      {showText && reviewCount !== undefined && (
         <span className="ml-1 text-xs text-muted-foreground">({reviewCount} review{reviewCount !== 1 ? 's' : ''})</span>
      )}
       {showText && reviewCount === undefined && (
         <span className="ml-1 text-xs text-muted-foreground">({rating.toFixed(1)})</span>
      )}
    </div>
  );
};

export default StarRating;
