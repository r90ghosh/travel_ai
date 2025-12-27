import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Protected layout that requires authentication
 * Redirects to login page if user is not authenticated
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <>{children}</>;
}
