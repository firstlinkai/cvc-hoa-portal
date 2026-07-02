import type { Metadata } from 'next';

import { createClient } from '@/lib/supabase/server';
import { getServerDict } from '@/lib/i18n-server';
import { APPROVER_ROLES, type Document, type Profile } from '@/lib/types';
import { DocumentsGrid } from './documents-grid';

export const metadata: Metadata = {
  title: 'Documents',
};

export default async function DocumentsPage() {
  const { lang, d } = getServerDict();
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single<Profile>();

  // RLS scopes this automatically:
  //  * regular members  → published Notices + Announcements only
  //  * board members    → + published Minutes of Meeting
  //  * uploaders        → + their own pending uploads
  //  * executives       → everything, including the pending review queue
  const { data } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  const documents = (data ?? []) as Document[];
  const canPublish = profile ? APPROVER_ROLES.includes(profile.role) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {d.docs.title}
        </h1>
        <p className="mt-1 text-muted-foreground">{d.docs.subtitle}</p>
      </div>

      <DocumentsGrid lang={lang} documents={documents} canPublish={canPublish} />
    </div>
  );
}
