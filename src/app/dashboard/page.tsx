import Link from 'next/link';
import type { Metadata } from 'next';
import { FileText, Megaphone, ScrollText, ArrowRight, UserCheck } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { getServerDict } from '@/lib/i18n-server';
import {
  APPROVER_ROLES,
  BOARD_ROLES,
  type Document,
  type Profile,
} from '@/lib/types';

export const metadata: Metadata = {
  title: 'Dashboard',
};

const CATEGORY_ICONS = {
  Notice: FileText,
  Announcement: Megaphone,
  'Minutes of Meeting': ScrollText,
} as const;

export default async function DashboardPage() {
  const { d } = getServerDict();
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single<Profile>();

  // RLS already scopes visibility: regular members never receive
  // Minutes of Meeting rows from this query.
  const { data: recentDocs } = await supabase
    .from('documents')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(6);

  const documents = (recentDocs ?? []) as Document[];

  const isApprover = profile ? APPROVER_ROLES.includes(profile.role) : false;
  const canSeeMinutes = profile ? BOARD_ROLES.includes(profile.role) : false;

  let pendingCount = 0;
  if (isApprover) {
    const { count } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval');
    pendingCount = count ?? 0;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {d.overview.welcome}, {profile?.first_name}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          {d.overview.signedInAs}{' '}
          <span className="font-medium text-foreground">
            {profile ? d.roles[profile.role] : ''}
          </span>
          {profile && (
            <>
              {' '}
              — Phase {profile.phase}, Block {profile.block}, Lot {profile.lot}
            </>
          )}
          .
        </p>
      </div>

      {isApprover && pendingCount > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50">
          <CardContent className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                <UserCheck className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                {pendingCount}{' '}
                {pendingCount === 1
                  ? d.overview.pendingOne
                  : d.overview.pendingMany}
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/admin/approvals">
                {d.overview.reviewNow} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold sm:text-xl">
            {d.overview.recent}
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/documents">
              {d.overview.viewAll} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
              <p className="font-medium">{d.overview.emptyTitle}</p>
              <p className="text-sm text-muted-foreground">
                {d.overview.emptyBody}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const Icon = CATEGORY_ICONS[doc.category];
              return (
                <Link key={doc.id} href={`/dashboard/documents/${doc.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="icon-chip p-2">
                          <Icon className="h-5 w-5" />
                        </span>
                        <Badge variant="outline">
                          {d.categories[doc.category]}
                        </Badge>
                      </div>
                      <CardTitle className="line-clamp-2 text-base">
                        {doc.title}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {doc.tracking_number}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-muted-foreground">
                      {d.overview.published} {formatDate(doc.published_at)}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {!canSeeMinutes && (
          <p className="mt-4 text-xs text-muted-foreground">
            {d.overview.minutesNote}
          </p>
        )}
      </div>
    </div>
  );
}
