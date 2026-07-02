import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Download, FileText, User } from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { getServerDict } from '@/lib/i18n-server';
import { APPROVER_ROLES, type Document, type Profile } from '@/lib/types';
import { PublishButton } from './publish-button';

export const metadata: Metadata = {
  title: 'Document',
};

interface DocumentDetailPageProps {
  params: { id: string };
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
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

  // Fetched with the USER's JWT — RLS is the authorization check. If the row
  // comes back, this user is cleared to see the file; if not, 404.
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('id', params.id)
    .maybeSingle<Document>();

  if (!data) notFound();
  const doc = data;

  // Uploader name (informational).
  const { data: uploader } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', doc.uploaded_by)
    .maybeSingle<Pick<Profile, 'first_name' | 'last_name'>>();

  // The RLS check above passed, so minting a short-lived signed URL with the
  // service client is safe (the bucket itself stays private).
  const admin = createAdminClient();
  const { data: signed } = await admin.storage
    .from('hoa-documents')
    .createSignedUrl(doc.storage_url, 60 * 60); // 1 hour

  const signedUrl = signed?.signedUrl ?? null;

  const isPdf = doc.mime_type === 'application/pdf';
  const isImage = doc.mime_type === 'image/png' || doc.mime_type === 'image/jpeg';
  const canPublish =
    !!profile && APPROVER_ROLES.includes(profile.role) && !doc.is_published;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/dashboard/documents">
          <ArrowLeft className="mr-1 h-4 w-4" /> {d.docDetail.back}
        </Link>
      </Button>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ── Viewer ─────────────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {signedUrl && isPdf && (
              <iframe
                src={signedUrl}
                title={doc.title}
                className="h-[60vh] w-full border-0 sm:h-[75vh]"
              />
            )}
            {signedUrl && isImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signedUrl}
                alt={doc.title}
                className="mx-auto max-h-[75vh] w-auto max-w-full"
              />
            )}
            {signedUrl && !isPdf && !isImage && (
              <div className="flex flex-col items-center gap-4 px-4 py-24 text-center">
                <FileText className="h-14 w-14 text-muted-foreground/50" />
                <div>
                  <p className="font-medium">{doc.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {d.docDetail.noPreview}
                  </p>
                </div>
                <Button asChild>
                  <a href={signedUrl} download={doc.file_name}>
                    <Download className="mr-2 h-4 w-4" />{' '}
                    {d.docDetail.downloadDocument}
                  </a>
                </Button>
              </div>
            )}
            {!signedUrl && (
              <div className="flex flex-col items-center gap-2 px-4 py-24 text-center">
                <FileText className="h-14 w-14 text-muted-foreground/50" />
                <p className="font-medium">{d.docDetail.unavailableTitle}</p>
                <p className="text-sm text-muted-foreground">
                  {d.docDetail.unavailableBody}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Metadata panel ─────────────────────────────────────────── */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{d.categories[doc.category]}</Badge>
                {doc.is_published ? (
                  <Badge variant="success">{d.docs.published}</Badge>
                ) : (
                  <Badge variant="warning">{d.docs.pending}</Badge>
                )}
              </div>
              <CardTitle className="text-xl">{doc.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {d.docDetail.trackingNo}
                </span>
                <span className="font-mono font-medium">
                  {doc.tracking_number}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {d.docDetail.uploaded}
                </span>
                <span>{formatDate(doc.created_at)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {d.docDetail.published}
                </span>
                <span>{formatDate(doc.published_at)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{d.docDetail.file}</span>
                <span className="truncate">{doc.file_name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">{d.docDetail.size}</span>
                <span>{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">
                  <User className="mr-1 inline h-3.5 w-3.5" />
                  {d.docDetail.uploadedBy}
                </span>
                <span>
                  {uploader
                    ? `${uploader.first_name} ${uploader.last_name}`
                    : '—'}
                </span>
              </div>
              {doc.notify_members && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {d.docDetail.broadcast}
                  </span>
                  <span>
                    {doc.notified_at
                      ? `${d.docDetail.sent} ${formatDate(doc.notified_at)}`
                      : d.docDetail.queued}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {signedUrl && (
            <Button asChild variant="outline" className="w-full">
              <a href={signedUrl} download={doc.file_name}>
                <Download className="mr-2 h-4 w-4" /> {d.docDetail.download}
              </a>
            </Button>
          )}

          {canPublish && <PublishButton lang={lang} docId={doc.id} />}
        </div>
      </div>
    </div>
  );
}
