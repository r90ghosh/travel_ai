import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * Handle OAuth callback from Supabase Auth
 * Exchanges the code for a session and redirects to the next page
 * Also handles invite acceptance after OAuth signup/login
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';
  const acceptInvite = requestUrl.searchParams.get('acceptInvite');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && acceptInvite === 'true') {
      // Check for pending invite in the redirect URL (trip ID is in 'next')
      const tripIdMatch = next.match(/\/trip\/([^/?]+)/);
      if (tripIdMatch) {
        const tripId = tripIdMatch[1];

        // Get the invite token from cookies or query (set by client before OAuth)
        const cookieStore = await cookies();
        const inviteToken = cookieStore.get('pendingInviteToken')?.value;

        if (inviteToken) {
          // Accept the invite
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('collaborators')
              .update({
                user_id: user.id,
                status: 'accepted',
                accepted_at: new Date().toISOString(),
              })
              .eq('trip_id', tripId)
              .eq('invite_token', inviteToken)
              .eq('status', 'pending');
          }

          // Clear the cookie
          cookieStore.delete('pendingInviteToken');
        }
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
