import { redirect } from 'next/navigation';
// import { createServerClient } from '@/lib/supabase/server';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Uncomment when Supabase server client is set up
  // const supabase = createServerClient();
  // const { data: { user } } = await supabase.auth.getUser();
  //
  // if (!user) {
  //   redirect('/login');
  // }

  return <>{children}</>;
}
