'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TripFormData, TravelerType, PacingType, BudgetTier } from '@/types';
import { generateClaimToken, storeClaimToken } from '@/lib/trip-token';

const ANCHORS = [
  { id: 'waterfalls', label: 'Waterfalls', icon: '💧' },
  { id: 'glaciers', label: 'Glaciers', icon: '🏔️' },
  { id: 'hot_springs', label: 'Hot Springs', icon: '♨️' },
  { id: 'northern_lights', label: 'Northern Lights', icon: '🌌' },
  { id: 'wildlife', label: 'Wildlife', icon: '🐋' },
  { id: 'volcanic', label: 'Volcanic', icon: '🌋' },
  { id: 'ice_caves', label: 'Ice Caves', icon: '❄️' },
];

const TRAVELER_TYPES: { value: TravelerType; label: string }[] = [
  { value: 'solo', label: 'Solo' },
  { value: 'couple', label: 'Couple' },
  { value: 'friends', label: 'Friends' },
  { value: 'family', label: 'Family' },
  { value: 'multi_gen', label: 'Multi-generational' },
];

const PACING_OPTIONS: { value: PacingType; label: string; description: string }[] = [
  { value: 'relaxed', label: 'Relaxed', description: '2-3 stops per day' },
  { value: 'balanced', label: 'Balanced', description: '3-4 stops per day' },
  { value: 'packed', label: 'Packed', description: '5-6 stops per day' },
];

const BUDGET_OPTIONS: { value: BudgetTier; label: string }[] = [
  { value: 'budget', label: 'Budget' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'luxury', label: 'Luxury' },
];

export function TripForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TripFormData>({
    destination_slug: 'iceland',
    start_date: '',
    end_date: '',
    travelers: 'couple',
    traveler_count: 2,
    pacing: 'balanced',
    anchors: [],
    budget_tier: 'moderate',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate claim token for anonymous trip creation
      const claimToken = generateClaimToken();

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          claim_token: claimToken,
        }),
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Store claim token for anonymous access
      if (result.data?.id) {
        storeClaimToken(result.data.id, claimToken);
        router.push(`/trip/${result.data.id}?token=${claimToken}`);
      }
    } catch (error) {
      console.error('Failed to create trip:', error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAnchor = (anchorId: string) => {
    setFormData((prev) => ({
      ...prev,
      anchors: prev.anchors.includes(anchorId)
        ? prev.anchors.filter((a) => a !== anchorId)
        : [...prev.anchors, anchorId],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Dates */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          When are you traveling?
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Start date
            </label>
            <input
              type="date"
              id="start_date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              End date
            </label>
            <input
              type="date"
              id="end_date"
              required
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Travelers */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          Who&apos;s going?
        </h3>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {TRAVELER_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData({ ...formData, travelers: type.value })}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                formData.travelers === type.value
                  ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                  : 'border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Anchors */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          What do you want to experience?
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Select your must-haves. We&apos;ll build your itinerary around these.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ANCHORS.map((anchor) => (
            <button
              key={anchor.id}
              type="button"
              onClick={() => toggleAnchor(anchor.id)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-left transition-colors ${
                formData.anchors.includes(anchor.id)
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-300 hover:border-slate-400 dark:border-slate-600'
              }`}
            >
              <span className="text-xl">{anchor.icon}</span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {anchor.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Pacing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          What&apos;s your pace?
        </h3>
        <div className="grid gap-2 sm:grid-cols-3">
          {PACING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, pacing: option.value })}
              className={`rounded-lg border p-4 text-left transition-colors ${
                formData.pacing === option.value
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-300 hover:border-slate-400 dark:border-slate-600'
              }`}
            >
              <span className="block font-medium text-slate-900 dark:text-white">
                {option.label}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">
          Budget preference
        </h3>
        <div className="grid gap-2 sm:grid-cols-4">
          {BUDGET_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, budget_tier: option.value })}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                formData.budget_tier === option.value
                  ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20'
                  : 'border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !formData.start_date || !formData.end_date}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Creating your itinerary...' : 'Generate Itinerary'}
      </button>
    </form>
  );
}

export default TripForm;
