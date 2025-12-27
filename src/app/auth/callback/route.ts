import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Handle OAuth callback from Supabase Auth
 * Exchanges the code for a session and redirects to the next page
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
