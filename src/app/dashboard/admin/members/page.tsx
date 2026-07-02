import type { Metadata } from 'next';

import { createClient } from '@/lib/supabase/server';
import { getServerDict } from '@/lib/i18n-server';
import type { Profile } from '@/lib/types';
import { MembersTable } from './members-table';

export const metadata: Metadata = {
  title: 'Members Directory',
};

export default async function MembersPage() {
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
    .order('created_at', { ascending: false });

  const members = (data ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {d.members.title}
        </h1>
        <p className="mt-1 text-muted-foreground">{d.members.subtitle}</p>
      </div>

      <MembersTable
        lang={lang}
        members={members}
        viewerId={me?.id ?? ''}
        viewerRole={me?.role ?? 'regular_member'}
      />
    </div>
  );
}
