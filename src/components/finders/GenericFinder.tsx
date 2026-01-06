
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { GitCompareArrows } from 'lucide-react';

interface FinderProps {
    onFilterChange: (key: string, value: string) => void;
    stats: { sellerCount: number; unitCount: number };
    category: string;
    previewImage?: string | null;
    attributes: Record<string, string[]>;
    onCompare: () => void;
}

const GenericFinder = ({ onFilterChange, stats, category, previewImage, attributes, onCompare }: FinderProps) => {
    return (
        <div className="space-y-4">
            <div className="aspect-square relative w-full overflow-hidden rounded-md border bg-muted/30 flex items-center justify-center">
                {previewImage ? (
                    <Image
                        src={previewImage}
                        alt="Product Preview"
                        fill
                        className="object-cover"
                    />
                ) : stats.unitCount === 0 ? (
                    <Image
                        src="/images/no-products-found.svg"
                        alt="No products found"
                        fill
                        className="object-contain p-6"
                    />
                ) : (
                    <Image
                        src="/images/finder-instructions.svg"
                        alt="How to use product finder"
                        fill
                        className="object-contain p-6"
                    />
                )}
            </div>

            <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                    Browse our collection of <span className="font-semibold text-foreground capitalize">{category}</span>.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {Object.entries(attributes).map(([key, values]) => (
                    <Select key={key} onValueChange={(val) => onFilterChange(key, val)}>
                        <SelectTrigger aria-label={key} className="capitalize">
                            <SelectValue placeholder={key.replace(/_/g, ' ')} />
                        </SelectTrigger>
                        <SelectContent>
                            {values.map((val) => (
                                <SelectItem key={val} value={val}>
                                    {val}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ))}
            </div>

            <div className="text-xs text-muted-foreground pt-2 space-y-2 text-center border-t">
                <div className="flex justify-between items-center pt-2">
                    <p><span className="font-bold text-foreground">{stats.sellerCount}</span> sellers have this</p>
                    <p><span className="font-bold text-foreground">{stats.unitCount}</span> units available</p>
                </div>
                <Button variant="link" className="p-0 h-auto text-primary" onClick={onCompare}>
                    <GitCompareArrows size={14} className="mr-1" />
                    Compare Prices
                </Button>
            </div>
        </div>
    );
};

export default GenericFinder;
