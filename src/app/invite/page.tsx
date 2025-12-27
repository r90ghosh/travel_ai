'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InviteDetails {
  tripId: string;
  tripTitle: string;
  inviterName: string;
  role: string;
}

function InviteSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const tripId = searchParams.get('trip');

  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);

  const supabase = createClient();

  // Fetch invite details
  useEffect(() => {
    async function fetchInvite() {
      if (!token || !tripId) {
        setLoadingInvite(false);
        return;
      }

      try {
        const response = await fetch(`/api/invites/verify?token=${token}&trip=${tripId}`);
        if (response.ok) {
          const data = await response.json();
          setInviteDetails(data);
          if (data.email) {
            setEmail(data.email);
          }
        }
      } catch (err) {
        console.error('Failed to verify invite:', err);
      }
      setLoadingInvite(false);
    }

    fetchInvite();
  }, [token, tripId]);

  async function acceptInvite() {
    if (!token || !tripId) return;

    try {
      await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, tripId }),
      });
    } catch (err) {
      console.error('Failed to accept invite:', err);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/trip/${tripId}`,
          },
        });

        if (error) throw error;

        // Accept invite after signup
        await acceptInvite();

        // Show confirmation message
        setError(null);
        router.push(`/trip/${tripId}`);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Accept invite after login
        await acceptInvite();

        router.push(`/trip/${tripId}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }

    setLoading(false);
  }

  async function handleGoogleAuth() {
    setLoading(true);
    setError(null);

    // Store invite info in session storage for after OAuth redirect
    if (token && tripId) {
      sessionStorage.setItem('pendingInvite', JSON.stringify({ token, tripId }));
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/trip/${tripId}&acceptInvite=true`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  if (loadingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
          <span className="h-5 w-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Loading invite...
        </div>
      </div>
    );
  }

  if (!token || !tripId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Invalid Invite Link
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              This invite link is missing or invalid. Please ask for a new invite.
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Invite Info Card */}
        {inviteDetails && (
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                You&apos;re Invited!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                <strong>{inviteDetails.inviterName}</strong> invited you to collaborate on{' '}
                <strong>{inviteDetails.tripTitle}</strong> as {inviteDetails.role === 'editor' ? 'an editor' : 'a ' + inviteDetails.role}.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Auth Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {mode === 'signup' ? 'Create your account' : 'Welcome back'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Google OAuth Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-slate-950 px-2 text-xs text-slate-500">
                or
              </span>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : ''}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {mode === 'signup' ? 'Creating account...' : 'Logging in...'}
                  </span>
                ) : (
                  mode === 'signup' ? 'Create account & join trip' : 'Log in & join trip'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              {mode === 'signup' ? (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InviteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
        <span className="h-5 w-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
        Loading...
      </div>
    </div>
  );
}

export default function InviteSignupPage() {
  return (
    <Suspense fallback={<InviteLoadingFallback />}>
      <InviteSignupContent />
    </Suspense>
  );
}
