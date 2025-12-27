'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import type { TravelerType, PacingType, BudgetTier } from '@/types';
import { generateClaimToken, storeClaimToken } from '@/lib/trip-token';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  User,
  Users,
  Heart,
  Baby,
  Accessibility,
  Sun,
  Snowflake,
  Leaf,
  Check,
  Lock,
  Gauge,
  Zap,
  Coffee,
  Droplets,
  Mountain,
  Flame,
  Sparkles,
  Eye,
  Bird,
  AlertTriangle,
  AlertCircle,
  Info,
  Calendar as CalendarIcon,
  MapPin,
  DollarSign,
  Loader2,
} from 'lucide-react';
import type { DateRange } from 'react-day-picker';

// Types
interface TripFormData {
  destination_slug: string;
  start_date: string;
  end_date: string;
  travelers: TravelerType;
  traveler_count: number;
  has_young_children: boolean;
  pacing: PacingType;
  anchors: string[];
  budget_tier: BudgetTier;
}

// Constants
const DESTINATIONS = [
  {
    slug: 'iceland',
    name: 'Iceland',
    tagline: 'Land of fire and ice',
    flag: '🇮🇸',
    bestSeasons: ['Summer', 'Winter'],
    enabled: true,
  },
  {
    slug: 'norway',
    name: 'Norway',
    tagline: 'Fjords and northern lights',
    flag: '🇳🇴',
    bestSeasons: ['Summer', 'Winter'],
    enabled: false,
  },
  {
    slug: 'new-zealand',
    name: 'New Zealand',
    tagline: 'Adventure awaits',
    flag: '🇳🇿',
    bestSeasons: ['Spring', 'Fall'],
    enabled: false,
  },
  {
    slug: 'japan',
    name: 'Japan',
    tagline: 'Ancient meets modern',
    flag: '🇯🇵',
    bestSeasons: ['Spring', 'Fall'],
    enabled: false,
  },
];

const TRAVELER_TYPES: {
  value: TravelerType;
  label: string;
  description: string;
  icon: React.ReactNode;
  showCount?: boolean;
  minCount?: number;
  maxCount?: number;
  showChildrenToggle?: boolean;
}[] = [
  {
    value: 'solo',
    label: 'Solo',
    description: 'Just me',
    icon: <User className="h-6 w-6" />,
  },
  {
    value: 'couple',
    label: 'Couple',
    description: 'Traveling with partner',
    icon: <Heart className="h-6 w-6" />,
  },
  {
    value: 'friends',
    label: 'Friends',
    description: 'Group adventure',
    icon: <Users className="h-6 w-6" />,
    showCount: true,
    minCount: 2,
    maxCount: 6,
  },
  {
    value: 'family',
    label: 'Family',
    description: 'With kids',
    icon: <Baby className="h-6 w-6" />,
    showChildrenToggle: true,
  },
  {
    value: 'multi_gen',
    label: 'Multi-gen',
    description: 'Mixed ages',
    icon: <Accessibility className="h-6 w-6" />,
  },
];

const PACING_OPTIONS: {
  value: PacingType;
  label: string;
  description: string;
  details: string[];
  icon: React.ReactNode;
}[] = [
  {
    value: 'relaxed',
    label: 'Relaxed',
    description: 'Quality over quantity',
    details: ['2-3 stops per day', 'Max 2.5 hrs driving', 'Leisurely mornings'],
    icon: <Coffee className="h-6 w-6" />,
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'See the highlights',
    details: ['4-5 stops per day', 'Max 4 hrs driving', 'Well-paced days'],
    icon: <Gauge className="h-6 w-6" />,
  },
  {
    value: 'packed',
    label: 'Packed',
    description: 'Maximize everything',
    details: ['6-7 stops per day', 'Max 5.5 hrs driving', 'Early starts'],
    icon: <Zap className="h-6 w-6" />,
  },
];

const ANCHORS: {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  seasonRestriction?: {
    type: 'blocking' | 'warning';
    months: number[];
    message: string;
  };
}[] = [
  {
    id: 'northern_lights',
    label: 'Northern Lights',
    description: 'Chase the aurora borealis',
    icon: <Sparkles className="h-5 w-5" />,
    seasonRestriction: {
      type: 'blocking',
      months: [5, 6, 7], // May, June, July
      message: 'Not visible in summer (May-Jul)',
    },
  },
  {
    id: 'waterfalls',
    label: 'Waterfalls',
    description: 'Powerful cascades & hidden gems',
    icon: <Droplets className="h-5 w-5" />,
  },
  {
    id: 'glaciers',
    label: 'Glaciers',
    description: 'Hike on ancient ice',
    icon: <Mountain className="h-5 w-5" />,
  },
  {
    id: 'hot_springs',
    label: 'Hot Springs',
    description: 'Natural geothermal pools',
    icon: <Flame className="h-5 w-5" />,
  },
  {
    id: 'wildlife',
    label: 'Wildlife',
    description: 'Whales, puffins & seals',
    icon: <Bird className="h-5 w-5" />,
    seasonRestriction: {
      type: 'warning',
      months: [9, 10, 11, 12, 1, 2, 3, 4], // Sep-Apr (puffin season is May-Aug)
      message: 'Puffin season is May-August',
    },
  },
  {
    id: 'ice_caves',
    label: 'Ice Caves',
    description: 'Explore crystal blue caves',
    icon: <Eye className="h-5 w-5" />,
    seasonRestriction: {
      type: 'blocking',
      months: [5, 6, 7, 8, 9, 10], // May-Oct
      message: 'Only available Nov-Mar',
    },
  },
  {
    id: 'volcanic',
    label: 'Volcanic',
    description: 'Craters, lava fields & geysers',
    icon: <Flame className="h-5 w-5" />,
  },
];

const BUDGET_OPTIONS: {
  value: BudgetTier;
  label: string;
  description: string;
  dailyCost: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'budget',
    label: 'Budget',
    description: 'Hostels, cooking, free activities',
    dailyCost: '$75-140',
    icon: <DollarSign className="h-5 w-5" />,
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Guesthouses, mix of dining',
    dailyCost: '$155-260',
    icon: (
      <div className="flex">
        <DollarSign className="h-5 w-5" />
        <DollarSign className="-ml-2 h-5 w-5" />
      </div>
    ),
  },
  {
    value: 'comfort',
    label: 'Comfort',
    description: 'Hotels, nice restaurants',
    dailyCost: '$290-425',
    icon: (
      <div className="flex">
        <DollarSign className="h-5 w-5" />
        <DollarSign className="-ml-2 h-5 w-5" />
        <DollarSign className="-ml-2 h-5 w-5" />
      </div>
    ),
  },
  {
    value: 'luxury',
    label: 'Luxury',
    description: 'Premium hotels, fine dining',
    dailyCost: '$465-725',
    icon: (
      <div className="flex">
        <DollarSign className="h-5 w-5" />
        <DollarSign className="-ml-2 h-5 w-5" />
        <DollarSign className="-ml-2 h-5 w-5" />
        <DollarSign className="-ml-2 h-5 w-5" />
      </div>
    ),
  },
];

const TOTAL_STEPS = 7;

function getSeasonFromDate(date: Date): { season: string; description: string; icon: React.ReactNode; month: number } {
  const month = date.getMonth() + 1;

  if (month >= 5 && month <= 8) {
    return {
      season: 'Summer',
      description: 'Midnight sun, long days',
      icon: <Sun className="h-4 w-4 text-amber-500" />,
      month,
    };
  } else if (month >= 11 || month <= 2) {
    return {
      season: 'Winter',
      description: 'Northern lights, snow',
      icon: <Snowflake className="h-4 w-4 text-sky-500" />,
      month,
    };
  } else {
    return {
      season: 'Shoulder',
      description: 'Fewer crowds, varied weather',
      icon: <Leaf className="h-4 w-4 text-emerald-500" />,
      month,
    };
  }
}

export function TripForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  const [formData, setFormData] = useState<TripFormData>({
    destination_slug: '',
    start_date: '',
    end_date: '',
    travelers: 'couple',
    traveler_count: 2,
    has_young_children: false,
    pacing: 'balanced',
    anchors: [],
    budget_tier: 'moderate',
  });

  // Calculate duration and season
  const duration = dateRange.from && dateRange.to
    ? differenceInDays(dateRange.to, dateRange.from) + 1
    : 0;

  const seasonInfo = dateRange.from ? getSeasonFromDate(dateRange.from) : null;

  // Check if relaxed pace should be recommended/forced
  const shouldRecommendRelaxed =
    formData.travelers === 'multi_gen' ||
    (formData.travelers === 'family' && formData.has_young_children);

  // Auto-select relaxed pacing when entering step 4 if needed
  useEffect(() => {
    if (currentStep === 4 && shouldRecommendRelaxed && formData.pacing !== 'relaxed') {
      setFormData((prev) => ({ ...prev, pacing: 'relaxed' }));
    }
  }, [currentStep, shouldRecommendRelaxed]);

  // Check anchor availability based on season
  const getAnchorStatus = (anchor: typeof ANCHORS[0]) => {
    if (!seasonInfo || !anchor.seasonRestriction) {
      return { available: true, warning: null };
    }

    const isRestricted = anchor.seasonRestriction.months.includes(seasonInfo.month);

    if (isRestricted) {
      return {
        available: anchor.seasonRestriction.type !== 'blocking',
        warning: {
          type: anchor.seasonRestriction.type,
          message: anchor.seasonRestriction.message,
        },
      };
    }

    return { available: true, warning: null };
  };

  // Validation
  const isStep1Valid = formData.destination_slug !== '';
  const isStep2Valid = duration >= 3 && duration <= 21 && dateRange.from && dateRange.from > new Date();
  const isStep3Valid = formData.traveler_count > 0;
  const isStep4Valid = formData.pacing !== undefined;
  const isStep5Valid = true; // Anchors are optional
  const isStep6Valid = formData.budget_tier !== undefined;

  const canProceed = () => {
    switch (currentStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep4Valid;
      case 5: return isStep5Valid;
      case 6: return isStep6Valid;
      default: return true;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    if (range) {
      setDateRange(range);
      setFormData({
        ...formData,
        start_date: range.from ? format(range.from, 'yyyy-MM-dd') : '',
        end_date: range.to ? format(range.to, 'yyyy-MM-dd') : '',
      });
    }
  };

  const handleDestinationSelect = (slug: string) => {
    setFormData({ ...formData, destination_slug: slug });
  };

  const handleTravelerSelect = (type: TravelerType) => {
    let count = formData.traveler_count;

    switch (type) {
      case 'solo':
        count = 1;
        break;
      case 'couple':
        count = 2;
        break;
      case 'friends':
        count = Math.max(2, Math.min(6, count));
        break;
      case 'family':
      case 'multi_gen':
        count = Math.max(3, count);
        break;
    }

    setFormData({
      ...formData,
      travelers: type,
      traveler_count: count,
      has_young_children: type === 'family' ? formData.has_young_children : false,
    });
  };

  const handlePacingSelect = (pacing: PacingType) => {
    setFormData({ ...formData, pacing });
  };

  const handleAnchorToggle = (anchorId: string) => {
    const anchor = ANCHORS.find((a) => a.id === anchorId);
    if (!anchor) return;

    const status = getAnchorStatus(anchor);
    if (!status.available) return; // Can't select blocked anchors

    setFormData((prev) => {
      const isSelected = prev.anchors.includes(anchorId);
      if (isSelected) {
        return { ...prev, anchors: prev.anchors.filter((a) => a !== anchorId) };
      } else if (prev.anchors.length < 3) {
        return { ...prev, anchors: [...prev.anchors, anchorId] };
      }
      return prev;
    });
  };

  const handleBudgetSelect = (budget: BudgetTier) => {
    setFormData({ ...formData, budget_tier: budget });
  };

  const handleSubmit = async () => {
    console.log('[TripForm] handleSubmit called');
    console.log('[TripForm] Current form data:', formData);
    setIsSubmitting(true);

    try {
      const claimToken = generateClaimToken();
      console.log('[TripForm] Generated claim token:', claimToken);

      const requestBody = {
        destination_slug: formData.destination_slug,
        start_date: formData.start_date,
        end_date: formData.end_date,
        travelers: formData.travelers,
        traveler_count: formData.traveler_count,
        pacing: formData.pacing,
        anchors: formData.anchors.length > 0 ? formData.anchors : ['waterfalls'], // Default anchor if none selected
        budget_tier: formData.budget_tier,
      };
      console.log('[TripForm] Request body:', requestBody);

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[TripForm] Response status:', response.status);
      const result = await response.json();
      console.log('[TripForm] Response body:', result);

      if (result.error) {
        console.error('[TripForm] API returned error:', result.error);
        throw new Error(result.error);
      }

      // API returns { trip, claim_token } not { data }
      const tripId = result.trip?.id;
      const serverClaimToken = result.claim_token;
      console.log('[TripForm] Trip ID:', tripId, 'Server claim token:', serverClaimToken);

      if (tripId) {
        // Use server's claim token if available, otherwise use client-generated one
        const tokenToStore = serverClaimToken || claimToken;
        storeClaimToken(tripId, tokenToStore);
        console.log('[TripForm] Stored claim token, redirecting to:', `/trip/${tripId}`);
        router.push(`/trip/${tripId}?token=${tokenToStore}`);
      } else {
        console.error('[TripForm] No trip ID in response:', result);
      }
    } catch (error) {
      console.error('[TripForm] Failed to create trip:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get labels for review
  const getDestinationName = () => DESTINATIONS.find((d) => d.slug === formData.destination_slug)?.name || '';
  const getTravelerLabel = () => TRAVELER_TYPES.find((t) => t.value === formData.travelers)?.label || '';
  const getPacingLabel = () => PACING_OPTIONS.find((p) => p.value === formData.pacing)?.label || '';
  const getBudgetLabel = () => BUDGET_OPTIONS.find((b) => b.value === formData.budget_tier)?.label || '';
  const getAnchorLabels = () => formData.anchors.map((a) => ANCHORS.find((x) => x.id === a)?.label || '').filter(Boolean);

  return (
    <div className="space-y-8">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-900 dark:text-white">
            Step {currentStep} of {TOTAL_STEPS}
          </span>
          <span className="text-slate-500">
            {currentStep === 1 && 'Choose destination'}
            {currentStep === 2 && 'Select dates'}
            {currentStep === 3 && 'Who\'s going?'}
            {currentStep === 4 && 'Travel pace'}
            {currentStep === 5 && 'Must-see experiences'}
            {currentStep === 6 && 'Budget'}
            {currentStep === 7 && 'Review & create'}
          </span>
        </div>
        <Progress value={(currentStep / TOTAL_STEPS) * 100} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {/* Step 1: Destination */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Where do you want to go?
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Choose your destination. More locations coming soon!
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {DESTINATIONS.map((dest) => (
                <Card
                  key={dest.slug}
                  className={`relative cursor-pointer transition-all ${
                    !dest.enabled
                      ? 'opacity-60 cursor-not-allowed'
                      : formData.destination_slug === dest.slug
                      ? 'ring-2 ring-emerald-600 border-emerald-600'
                      : 'hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                  onClick={() => dest.enabled && handleDestinationSelect(dest.slug)}
                >
                  <CardContent className="p-6">
                    {!dest.enabled && (
                      <Badge variant="secondary" className="absolute right-3 top-3">
                        <Lock className="mr-1 h-3 w-3" />
                        Coming Soon
                      </Badge>
                    )}
                    {formData.destination_slug === dest.slug && (
                      <div className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">{dest.flag}</span>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{dest.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{dest.tagline}</p>
                        <div className="mt-2 flex gap-1">
                          {dest.bestSeasons.map((season) => (
                            <Badge key={season} variant="outline" className="text-xs">
                              {season}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Dates */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                When are you traveling?
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Select your travel dates. We recommend 5-10 days for the best experience.
              </p>
            </div>

            <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
              <Card className="w-fit">
                <CardContent className="p-4">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={handleDateSelect}
                    numberOfMonths={2}
                    disabled={(date) => date < new Date()}
                    className="rounded-md"
                  />
                </CardContent>
              </Card>

              <div className="w-full max-w-xs space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <Label className="text-xs uppercase tracking-wide text-slate-500">Duration</Label>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-slate-900 dark:text-white">
                        {duration || '—'}
                      </span>
                      <span className="text-slate-600 dark:text-slate-400">days</span>
                    </div>
                    {duration > 0 && (duration < 3 || duration > 21) && (
                      <p className="mt-2 text-sm text-red-600">
                        {duration < 3 ? 'Minimum 3 days required' : 'Maximum 21 days allowed'}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {seasonInfo && (
                  <Card>
                    <CardContent className="p-4">
                      <Label className="text-xs uppercase tracking-wide text-slate-500">Season</Label>
                      <div className="mt-1 flex items-center gap-2">
                        {seasonInfo.icon}
                        <span className="text-lg font-semibold text-slate-900 dark:text-white">
                          {seasonInfo.season}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {seasonInfo.description}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {dateRange.from && dateRange.to && (
                  <Card>
                    <CardContent className="p-4">
                      <Label className="text-xs uppercase tracking-wide text-slate-500">Selected Dates</Label>
                      <p className="mt-1 text-sm text-slate-900 dark:text-white">
                        {format(dateRange.from, 'MMM d, yyyy')} — {format(dateRange.to, 'MMM d, yyyy')}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Travelers */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Who&apos;s going?</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                This helps us tailor activities and pacing to your group.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TRAVELER_TYPES.map((type) => (
                <Card
                  key={type.value}
                  className={`cursor-pointer transition-all ${
                    formData.travelers === type.value
                      ? 'ring-2 ring-emerald-600 border-emerald-600'
                      : 'hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                  onClick={() => handleTravelerSelect(type.value)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div
                        className={`rounded-lg p-3 ${
                          formData.travelers === type.value
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {type.icon}
                      </div>
                      {formData.travelers === type.value && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{type.label}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{type.description}</p>

                    {type.showCount && formData.travelers === type.value && (
                      <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                        <Label htmlFor="traveler_count" className="text-xs">Number of travelers</Label>
                        <Input
                          id="traveler_count"
                          type="number"
                          min={type.minCount}
                          max={type.maxCount}
                          value={formData.traveler_count}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              traveler_count: Math.max(
                                type.minCount || 1,
                                Math.min(type.maxCount || 10, parseInt(e.target.value) || 2)
                              ),
                            })
                          }
                          className="mt-1 w-20"
                        />
                      </div>
                    )}

                    {type.showChildrenToggle && formData.travelers === type.value && (
                      <div className="mt-4" onClick={(e) => e.stopPropagation()}>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.has_young_children}
                            onChange={(e) =>
                              setFormData({ ...formData, has_young_children: e.target.checked })
                            }
                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            Traveling with young children (under 6)
                          </span>
                        </label>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Pacing */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                What&apos;s your travel pace?
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                This determines how many stops we plan each day.
              </p>
            </div>

            {shouldRecommendRelaxed && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Relaxed pace is recommended for your group to ensure comfortable travel.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              {PACING_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    formData.pacing === option.value
                      ? 'ring-2 ring-emerald-600 border-emerald-600'
                      : 'hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                  onClick={() => handlePacingSelect(option.value)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div
                        className={`rounded-lg p-3 ${
                          formData.pacing === option.value
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {option.icon}
                      </div>
                      {formData.pacing === option.value && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{option.label}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{option.description}</p>
                    <ul className="mt-3 space-y-1">
                      {option.details.map((detail, i) => (
                        <li key={i} className="text-xs text-slate-500 dark:text-slate-400">
                          • {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Anchors */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                What must you experience?
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Select up to 3 priorities. We&apos;ll build your itinerary around these.
              </p>
            </div>

            {formData.anchors.length === 3 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Maximum 3 experiences selected. Deselect one to choose another.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {ANCHORS.map((anchor) => {
                const status = getAnchorStatus(anchor);
                const isSelected = formData.anchors.includes(anchor.id);
                const isDisabled = !status.available || (!isSelected && formData.anchors.length >= 3);

                return (
                  <Card
                    key={anchor.id}
                    className={`relative cursor-pointer transition-all ${
                      isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : isSelected
                        ? 'ring-2 ring-emerald-600 border-emerald-600'
                        : 'hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                    onClick={() => !isDisabled && handleAnchorToggle(anchor.id)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div
                          className={`rounded-lg p-2.5 ${
                            isSelected
                              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {anchor.icon}
                        </div>
                        {isSelected && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <h3 className="mt-3 font-semibold text-slate-900 dark:text-white">{anchor.label}</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{anchor.description}</p>

                      {status.warning && (
                        <div
                          className={`mt-3 flex items-start gap-2 rounded-md p-2 text-xs ${
                            status.warning.type === 'blocking'
                              ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                          }`}
                        >
                          {status.warning.type === 'blocking' ? (
                            <AlertCircle className="h-4 w-4 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                          )}
                          <span>{status.warning.message}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 6: Budget */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                What&apos;s your budget style?
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                This helps us recommend accommodations and activities.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {BUDGET_OPTIONS.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer transition-all ${
                    formData.budget_tier === option.value
                      ? 'ring-2 ring-emerald-600 border-emerald-600'
                      : 'hover:border-slate-400 dark:hover:border-slate-600'
                  }`}
                  onClick={() => handleBudgetSelect(option.value)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div
                        className={`rounded-lg p-3 ${
                          formData.budget_tier === option.value
                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {option.icon}
                      </div>
                      {formData.budget_tier === option.value && (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{option.label}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{option.description}</p>
                    <p className="mt-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      {option.dailyCost}/day per person
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 7: Review */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Review your trip
              </h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Make sure everything looks good before we create your itinerary.
              </p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Destination */}
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
                      <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Destination</p>
                      <p className="font-medium text-slate-900 dark:text-white">{getDestinationName()}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Dates */}
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
                      <CalendarIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Dates</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {dateRange.from && dateRange.to
                          ? `${format(dateRange.from, 'MMM d')} — ${format(dateRange.to, 'MMM d, yyyy')}`
                          : '—'}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {duration} days • {seasonInfo?.season} season
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Travelers */}
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
                      <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Travelers</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {getTravelerLabel()} • {formData.traveler_count} {formData.traveler_count === 1 ? 'person' : 'people'}
                      </p>
                      {formData.has_young_children && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">With young children</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Pacing */}
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
                      <Gauge className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Pace</p>
                      <p className="font-medium text-slate-900 dark:text-white">{getPacingLabel()}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Anchors */}
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
                      <Sparkles className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Must-See</p>
                      {getAnchorLabels().length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                          {getAnchorLabels().map((label) => (
                            <Badge key={label} variant="secondary">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-600 dark:text-slate-400">No specific priorities</p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Budget */}
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800">
                      <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Budget</p>
                      <p className="font-medium text-slate-900 dark:text-white">{getBudgetLabel()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-slate-500">
              No account needed • You can save it later
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-6 dark:border-slate-800">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>

        {currentStep < TOTAL_STEPS ? (
          <Button onClick={handleNext} disabled={!canProceed()} className="gap-2">
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create My Itinerary
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export default TripForm;
