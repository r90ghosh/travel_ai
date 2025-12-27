import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-900 dark:to-slate-800">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Travel AI
          </h1>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Plan your perfect Iceland adventure
          </h2>
          <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">
            AI-powered itinerary planning that adapts to your preferences.
            Get personalized recommendations for waterfalls, glaciers, hot springs, and more.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/plan"
              className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Start Planning
            </Link>
            <Link
              href="#features"
              className="text-lg font-semibold leading-6 text-slate-900 dark:text-white"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <section id="features" className="mt-24">
          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              title="Smart Itineraries"
              description="AI generates personalized day-by-day plans based on your preferences and travel style."
            />
            <FeatureCard
              title="Collaborate"
              description="Share your trip with friends and family. Comment, suggest changes, and plan together."
            />
            <FeatureCard
              title="Local Insights"
              description="Get pro tips, best times to visit, and hidden gems from our curated destination data."
            />
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Travel AI. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-2 text-slate-600 dark:text-slate-300">{description}</p>
    </div>
  );
}
