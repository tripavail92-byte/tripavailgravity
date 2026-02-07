import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { usePackageCreation } from '../CompletePackageCreationFlow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Plus,
    Trash2,
    ChevronDown,
    Sparkles,
    Percent,
    Info
} from 'lucide-react';
import {
    getIconForHighlight
} from '@/components/icons/packages/AnimatedHighlightIcons';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

// Helper to determine if a highlight should be visually prominent
const isPremiumHighlight = (name: string): boolean => {
    const lower = name.toLowerCase();
    return (
        lower.includes('spa') ||
        lower.includes('massage') ||
        lower.includes('dinner') ||
        lower.includes('champagne') ||
        lower.includes('suite') ||
        lower.includes('view') ||
        lower.includes('transfer')
    );
};

export const HighlightsStep = () => {
    const { data, updateData, onNext, onBack } = usePackageCreation();

    // Local state for free inclusions
    const [inclusions, setInclusions] = useState<Array<{ name: string; icon?: string }>>(
        data.freeInclusions || []
    );
    const [newInclusion, setNewInclusion] = useState('');

    // Local state for discounts
    const [discounts, setDiscounts] = useState<Array<{ name: string; originalPrice: number; discount: number; icon?: string }>>(
        data.discountOffers || []
    );

    // Dialog state for adding discount
    const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
    const [newDiscount, setNewDiscount] = useState({
        name: '',
        originalPrice: 100, // Default value
        discount: 20 // Default percentage
    });

    // Sync back to global state when local state changes
    useEffect(() => {
        updateData({
            freeInclusions: inclusions,
            discountOffers: discounts
        });
    }, [inclusions, discounts]);

    // Handler for adding a free inclusion
    const addFreeInclusion = (name: string) => {
        if (!name.trim()) return;

        // Check for duplicates
        if (inclusions.some(i => i.name.toLowerCase() === name.toLowerCase())) {
            return;
        }

        setInclusions(prev => [...prev, { name: name.trim() }]);
        setNewInclusion('');
    };

    // Handler for removing a free inclusion
    const removeFreeInclusion = (index: number) => {
        setInclusions(prev => prev.filter((_, i) => i !== index));
    };

    // Handler for adding a discount Offer
    const addDiscountOfferFromDialog = () => {
        if (!newDiscount.name.trim()) return;

        setDiscounts(prev => [...prev, {
            name: newDiscount.name.trim(),
            originalPrice: Number(newDiscount.originalPrice),
            discount: Number(newDiscount.discount)
        }]);

        setNewDiscount({ name: '', originalPrice: 100, discount: 20 });
        setIsDiscountDialogOpen(false);
    };

    // Handler for removing a discount
    const removeDiscountOffer = (index: number) => {
        setDiscounts(prev => prev.filter((_, i) => i !== index));
    };

    // Suggested inclusions (could be more extensive or dynamic based on package type)
    const suggestedInclusions = [
        'Daily Breakfast',
        'Airport Transfer',
        'Welcome Drink',
        'Late Checkout',
        'Room Upgrade',
        'Spa Access',
        'Wifi'
    ].filter(s => !inclusions.some(i => i.name.toLowerCase() === s.toLowerCase()));

    // Calculate generic total value for preview (just an estimation for visual flair)
    const estimatedValue = inclusions.length * 50 + discounts.reduce((acc, d) => acc + (d.originalPrice * (d.discount / 100)), 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Package Highlights
                </h2>
                <p className="text-muted-foreground max-w-[600px] mx-auto text-lg">
                    Make your package irresistible with free perks and exclusive discounts.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Input Forms */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Section 1: Free Inclusions */}
                    <Card className="p-6 border-blue-100 dark:border-blue-900 shadow-sm overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-24 h-24 text-blue-500" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">Free Inclusions</h3>
                                    <p className="text-sm text-muted-foreground">Perks included in the base price</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g. Daily Breakfast, Airport Transfer..."
                                    value={newInclusion}
                                    onChange={(e) => setNewInclusion(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addFreeInclusion(newInclusion);
                                        }
                                    }}
                                    className="flex-1"
                                />
                                <Button onClick={() => addFreeInclusion(newInclusion)} disabled={!newInclusion.trim()}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add
                                </Button>
                            </div>

                            {/* Suggestions */}
                            {suggestedInclusions.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs text-muted-foreground self-center mr-1">Suggestions:</span>
                                    {suggestedInclusions.slice(0, 4).map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => addFreeInclusion(suggestion)}
                                            className="text-xs bg-secondary/50 hover:bg-secondary px-2 py-1 rounded-full transition-colors flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" />
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* List of Added Inclusions */}
                            <div className="space-y-3 pt-2">
                                <AnimatePresence mode='popLayout'>
                                    {inclusions.map((item, index) => {
                                        const Icon = getIconForHighlight(item.name);
                                        return (
                                            <motion.div
                                                key={`inclusion-${index}`}
                                                initial={{ opacity: 0, height: 0, y: 10 }}
                                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                                                className="flex items-center justify-between p-3 bg-card border rounded-lg group hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" animate={false} />
                                                    </div>
                                                    <span className="font-medium">{item.name}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                                    onClick={() => removeFreeInclusion(index)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {inclusions.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                        <p className="text-muted-foreground">No inclusions added yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">Add perks like WiFi, Breakfast, or Parking</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>

                    {/* Section 2: Exclusive Discounts */}
                    <Card className="p-6 border-purple-100 dark:border-purple-900 shadow-sm overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Percent className="w-24 h-24 text-purple-500" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Percent className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold">Exclusive Discounts</h3>
                                        <p className="text-sm text-muted-foreground">Special offers on extra services</p>
                                    </div>
                                </div>

                                <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" className="border-purple-200 hover:bg-purple-50 text-purple-700 dark:border-purple-800 dark:hover:bg-purple-900/50 dark:text-purple-300">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Offer
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Discount Offer</DialogTitle>
                                            <DialogDescription>
                                                Create a special price for an add-on service.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label>Item Name</Label>
                                                <Input
                                                    placeholder="e.g. Couples Massage"
                                                    value={newDiscount.name}
                                                    onChange={e => setNewDiscount({ ...newDiscount, name: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Original Price ($)</Label>
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={newDiscount.originalPrice}
                                                        onChange={e => setNewDiscount({ ...newDiscount, originalPrice: parseFloat(e.target.value) })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Discount (%)</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Slider
                                                            value={[newDiscount.discount]}
                                                            onValueChange={vals => setNewDiscount({ ...newDiscount, discount: vals[0] })}
                                                            max={100}
                                                            step={5}
                                                            className="flex-1"
                                                        />
                                                        <span className="w-12 text-right font-mono">{newDiscount.discount}%</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-secondary/30 rounded-lg text-sm flex justify-between items-center">
                                                <span>New Price:</span>
                                                <span className="font-bold text-green-600 dark:text-green-400">
                                                    ${(newDiscount.originalPrice * (1 - newDiscount.discount / 100)).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={addDiscountOfferFromDialog} disabled={!newDiscount.name}>Add Offer</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            {/* List of Discounts */}
                            <div className="space-y-3">
                                <AnimatePresence mode='popLayout'>
                                    {discounts.map((item, index) => {
                                        const Icon = getIconForHighlight(item.name);
                                        return (
                                            <motion.div
                                                key={`discount-${index}`}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-center justify-between p-4 bg-card border border-purple-100 dark:border-purple-900/50 rounded-lg"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                                        <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" animate={false} />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{item.name}</div>
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <span className="line-through text-muted-foreground">${item.originalPrice}</span>
                                                            <span className="font-bold text-green-600 dark:text-green-400">
                                                                ${(item.originalPrice * (1 - item.discount / 100)).toFixed(0)}
                                                            </span>
                                                            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded">
                                                                -{item.discount}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                                                    onClick={() => removeDiscountOffer(index)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {discounts.length === 0 && (
                                    <div className="text-center py-8 border-2 border-dashed border-purple-100 dark:border-purple-900/30 rounded-lg">
                                        <p className="text-muted-foreground">No discount offers added yet</p>
                                        <p className="text-xs text-muted-foreground mt-1">Add discounts for Spa, Dining, or Activities</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Live Preview */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6">
                        <Card className="p-0 overflow-hidden border-2 shadow-lg bg-slate-50 dark:bg-slate-950/50">
                            <div className="bg-slate-900 text-white p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    <span className="text-xs font-medium text-slate-300 uppercase tracking-wider">Guest View</span>
                                </div>
                                <h4 className="font-semibold">Package Preview</h4>
                            </div>

                            <div className="p-5 space-y-6">
                                {/* Inclusions Tag Cloud */}
                                <div className="space-y-3">
                                    <h5 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Sparkles className="w-3 h-3" /> Included FREE
                                    </h5>

                                    <div className="flex flex-wrap gap-2">
                                        {inclusions.length > 0 ? (
                                            inclusions.map((item, i) => {
                                                const Icon = getIconForHighlight(item.name);
                                                const isPremium = isPremiumHighlight(item.name);

                                                return (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all duration-300",
                                                            isPremium
                                                                ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-800 dark:from-amber-900/20 dark:to-yellow-900/20 dark:border-amber-700 dark:text-amber-300 shadow-sm"
                                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                                                        )}
                                                    >
                                                        <Icon className={cn("w-3.5 h-3.5", isPremium ? "text-amber-600 dark:text-amber-400" : "text-slate-400")} animate={inclusions.length < 5} />
                                                        <span className="font-medium">{item.name}</span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">Add inclusions to see them here...</span>
                                        )}
                                    </div>
                                </div>

                                {/* Discounts List */}
                                {discounts.length > 0 && (
                                    <div className="space-y-3">
                                        <div className="h-px bg-slate-200 dark:bg-slate-800" />
                                        <h5 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <Percent className="w-3 h-3" /> Exclusive Offers
                                        </h5>

                                        <div className="space-y-2">
                                            {discounts.map((item, i) => (
                                                <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm">
                                                    <span className="text-sm font-medium truncate max-w-[120px]" title={item.name}>{item.name}</span>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="line-through text-slate-400 text-xs">${item.originalPrice}</span>
                                                        <span className="font-bold text-green-600 dark:text-green-400">${(item.originalPrice * (1 - item.discount / 100)).toFixed(0)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Value Summary */}
                                {(inclusions.length > 0 || discounts.length > 0) && (
                                    <div className="pt-2">
                                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-center">
                                            <div className="text-xs text-muted-foreground">Total Added Value</div>
                                            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                ~${estimatedValue.toFixed(0)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
                <Button variant="outline" onClick={onBack}>
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={inclusions.length === 0 && discounts.length === 0}
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};
