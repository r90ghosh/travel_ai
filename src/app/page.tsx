import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MapPin,
  Calendar,
  Users,
  Sparkles,
  MessageSquare,
  Clock,
  Mountain,
  Waves,
  Camera,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/80">
        <nav className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <Mountain className="h-8 w-8 text-emerald-600" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              Travel Planner
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              Log in
            </Link>
            <Button asChild size="sm">
              <Link href="/plan">Start Planning</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-sky-50 to-white py-20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 lg:py-32">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-30" />
          <div className="container relative mx-auto px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="max-w-2xl">
                <Badge variant="secondary" className="mb-4">
                  <Sparkles className="mr-1 h-3 w-3" />
                  AI-Powered Planning
                </Badge>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
                  Plan Your Next{' '}
                  <span className="text-emerald-600">Adventure</span>
                </h1>
                <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
                  AI-powered itineraries that adapt to your travel style. Tell us your dates,
                  pace, and must-sees — we&apos;ll create a personalized journey through waterfalls,
                  glaciers, and hidden gems.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Button asChild size="lg" className="gap-2">
                    <Link href="/plan">
                      Start Planning — It&apos;s Free
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No signup required to start
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-emerald-600" />
                    2 min to create
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Share with group
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    Collaborate live
                  </span>
                </div>
              </div>

              {/* Hero Itinerary Preview */}
              <div className="relative">
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-emerald-500/20 to-sky-500/20 blur-2xl" />
                <Card className="relative overflow-hidden border-slate-200 shadow-2xl dark:border-slate-800">
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-emerald-100">7-Day Adventure</p>
                        <h3 className="text-lg font-semibold text-white">South Coast & Golden Circle</h3>
                      </div>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        Balanced Pace
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      <ItineraryPreviewDay
                        day={1}
                        title="Reykjavik & Blue Lagoon"
                        items={['Arrive at KEF', 'Blue Lagoon', 'Explore Reykjavik']}
                        icon={<Waves className="h-4 w-4" />}
                      />
                      <ItineraryPreviewDay
                        day={2}
                        title="Golden Circle"
                        items={['Þingvellir National Park', 'Geysir Hot Springs', 'Gullfoss Waterfall']}
                        icon={<Camera className="h-4 w-4" />}
                      />
                      <ItineraryPreviewDay
                        day={3}
                        title="South Coast Waterfalls"
                        items={['Seljalandsfoss', 'Skógafoss', 'Reynisfjara Beach']}
                        icon={<Mountain className="h-4 w-4" />}
                      />
                      <div className="flex items-center justify-center gap-1 py-3 text-sm text-slate-400">
                        <span>+ 4 more days</span>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="border-y border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                How It Works
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                From first idea to perfect itinerary in minutes
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <StepCard
                step={1}
                title="Tell Us Your Style"
                description="Choose your dates, travel pace, and must-see experiences. Waterfalls? Glaciers? Northern lights? You decide."
                icon={<Calendar className="h-6 w-6" />}
              />
              <StepCard
                step={2}
                title="Get Your Itinerary"
                description="Our AI generates a personalized day-by-day plan with driving routes, timing, and insider tips."
                icon={<Sparkles className="h-6 w-6" />}
              />
              <StepCard
                step={3}
                title="Refine Together"
                description="Share with friends, add comments like 'skip this' or 'add more time', and regenerate until it's perfect."
                icon={<Users className="h-6 w-6" />}
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                Built for Real Travelers
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                Everything you need to plan the perfect trip
              </p>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Sparkles className="h-5 w-5" />}
                title="No Signup Required"
                description="Start planning immediately. Create your account later if you want to save multiple trips."
              />
              <FeatureCard
                icon={<Users className="h-5 w-5" />}
                title="Share with Your Group"
                description="Send a link to your travel companions. Everyone can view and comment on the itinerary."
              />
              <FeatureCard
                icon={<MessageSquare className="h-5 w-5" />}
                title="AI Adapts to Feedback"
                description="Leave comments like 'more time here' or 'swap for something easier'. AI understands and adjusts."
              />
              <FeatureCard
                icon={<MapPin className="h-5 w-5" />}
                title="Smart Routing"
                description="Optimized driving routes that respect your pace. No backtracking, no rushed days."
              />
              <FeatureCard
                icon={<Clock className="h-5 w-5" />}
                title="Realistic Timing"
                description="Accurate drive times, visit durations, and breaks. Plans that actually work in the real world."
              />
              <FeatureCard
                icon={<Camera className="h-5 w-5" />}
                title="Local Insights"
                description="Pro tips for each spot: best times to visit, what to wear, and hidden gems nearby."
              />
            </div>
          </div>
        </section>

        {/* Sample Itinerary */}
        <section className="border-t border-slate-200 bg-slate-50 py-20 dark:border-slate-800 dark:bg-slate-900">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                See What You&apos;ll Get
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                A detailed, actionable plan for every day of your trip
              </p>
            </div>
            <div className="mx-auto mt-12 max-w-4xl">
              <Card className="overflow-hidden border-slate-200 shadow-lg dark:border-slate-800">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-lg font-bold text-white">
                        2
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Day 2 of 7</p>
                        <h3 className="text-lg font-semibold text-white">Golden Circle Adventure</h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-400">Total driving</p>
                      <p className="font-medium text-white">230 km · 3.5 hrs</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <TimelineItem
                      time="08:30"
                      title="Þingvellir National Park"
                      duration="2 hours"
                      description="Walk between tectonic plates at this UNESCO World Heritage site. Don't miss the Öxarárfoss waterfall."
                      tags={['Historic Site', 'Easy Walk', 'UNESCO']}
                    />
                    <TimelineItem
                      time="11:00"
                      driving="45 min drive to Geysir"
                    />
                    <TimelineItem
                      time="11:45"
                      title="Geysir Geothermal Area"
                      duration="1 hour"
                      description="Watch Strokkur erupt every 5-10 minutes. Grab lunch at the Geysir Center cafe."
                      tags={['Geothermal', 'Photo Spot']}
                    />
                    <TimelineItem
                      time="13:00"
                      driving="10 min drive to Gullfoss"
                    />
                    <TimelineItem
                      time="13:15"
                      title="Gullfoss Waterfall"
                      duration="1.5 hours"
                      description="Iceland's most famous waterfall. Walk down to both viewing platforms for the full experience."
                      tags={['Waterfall', 'Must See', 'Moderate Walk']}
                      proTip="The lower platform gets you closer but expect spray. Bring a waterproof layer!"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-12 text-center">
              <Button asChild size="lg" className="gap-2">
                <Link href="/plan">
                  Create Your Itinerary
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-12 text-center shadow-xl sm:px-12">
              <h2 className="text-3xl font-bold text-white">
                Ready to Plan Your Adventure?
              </h2>
              <p className="mt-4 text-lg text-emerald-100">
                Join thousands of travelers who&apos;ve discovered the magic of Iceland with our AI planner.
              </p>
              <div className="mt-8">
                <Button asChild size="lg" variant="secondary" className="gap-2">
                  <Link href="/plan">
                    Start Planning — It&apos;s Free
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <Mountain className="h-6 w-6 text-emerald-600" />
              <span className="font-semibold text-slate-900 dark:text-white">Travel Planner</span>
            </div>
            <div className="flex gap-8 text-sm text-slate-600 dark:text-slate-400">
              <Link href="/plan" className="hover:text-slate-900 dark:hover:text-white">
                Plan a Trip
              </Link>
              <Link href="/login" className="hover:text-slate-900 dark:hover:text-white">
                Sign In
              </Link>
              <Link href="#" className="hover:text-slate-900 dark:hover:text-white">
                About
              </Link>
              <Link href="#" className="hover:text-slate-900 dark:hover:text-white">
                Privacy
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Travel Planner. Made with AI for adventurers.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
  icon
}: {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
          {icon}
        </div>
        <div className="absolute -top-2 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
          {step}
        </div>
        <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardContent className="p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
          {icon}
        </div>
        <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}

function ItineraryPreviewDay({
  day,
  title,
  items,
  icon
}: {
  day: number;
  title: string;
  items: string[];
  icon: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Day {day}</span>
        </div>
        <h4 className="font-medium text-slate-900 dark:text-white">{title}</h4>
        <div className="mt-1 flex flex-wrap gap-1">
          {items.map((item, i) => (
            <span key={i} className="text-xs text-slate-500 dark:text-slate-400">
              {item}{i < items.length - 1 ? ' · ' : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineItem({
  time,
  title,
  duration,
  description,
  tags,
  proTip,
  driving
}: {
  time: string;
  title?: string;
  duration?: string;
  description?: string;
  tags?: string[];
  proTip?: string;
  driving?: string;
}) {
  if (driving) {
    return (
      <div className="flex items-center gap-4 pl-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <MapPin className="h-4 w-4 text-slate-400" />
        </div>
        <div className="flex-1 border-b border-dashed border-slate-200 dark:border-slate-700" />
        <span className="text-sm text-slate-500">{driving}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
          {time.split(':')[0]}
        </div>
        <div className="mt-1 text-xs text-slate-400">{time.split(':')[1]}</div>
      </div>
      <div className="flex-1 pb-2">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-slate-900 dark:text-white">{title}</h4>
          <span className="text-sm text-slate-500">{duration}</span>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        {tags && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {proTip && (
          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            <span className="font-medium">Pro tip:</span> {proTip}
          </div>
        )}
      </div>
    </div>
  );
}
