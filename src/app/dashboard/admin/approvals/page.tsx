import type { Metadata } from 'next';

import { createClient } from '@/lib/supabase/server';
import { getServerDict } from '@/lib/i18n-server';
import type { Profile } from '@/lib/types';
import { ApprovalsTable } from './approvals-table';

export const metadata: Metadata = {
  title: 'Membership Approvals',
};

export default async function ApprovalsPage() {
  const { lang, d } = getServerDict();
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single<Profile>();

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: true });

  const pending = (data ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {d.approvals.title}
        </h1>
        <p className="mt-1 text-muted-foreground">{d.approvals.subtitle}</p>
      </div>

      <ApprovalsTable
        lang={lang}
        pending={pending}
        viewerRole={me?.role ?? 'regular_member'}
      />
    </div>
  );
}
