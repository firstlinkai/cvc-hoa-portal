'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  FileText,
  Megaphone,
  ScrollText,
  Search,
  Send,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import { publishDocument } from '@/app/dashboard/admin/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { getDict, type Lang } from '@/lib/i18n';
import { DOC_CATEGORIES, type Document } from '@/lib/types';

const CATEGORY_ICONS = {
  Notice: FileText,
  Announcement: Megaphone,
  'Minutes of Meeting': ScrollText,
} as const;

interface DocumentsGridProps {
  lang: Lang;
  documents: Document[];
  canPublish: boolean;
}

export function DocumentsGrid({ lang, documents, canPublish }: DocumentsGridProps) {
  const d = getDict(lang);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (category !== 'all' && doc.category !== category) return false;
      if (!q) return true;
      return (
        doc.title.toLowerCase().includes(q) ||
        doc.tracking_number.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q)
      );
    });
  }, [documents, query, category]);

  function handlePublish(docId: string) {
    setPublishingId(docId);
    setFeedback(null);
    startTransition(async () => {
      const result = await publishDocument(docId);
      setFeedback({
        ok: result.ok,
        text: result.ok ? result.message ?? 'Published.' : result.error ?? 'Failed.',
      });
      setPublishingId(null);
    });
  }

  return (
    <div className="space-y-4">
      {/* Search / filter toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={d.docs.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder={d.docs.allCategories} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{d.docs.allCategories}</SelectItem>
            {DOC_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {d.categories[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {feedback && (
        <div className={feedback.ok ? 'alert-success' : 'alert-error'}>
          {feedback.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{feedback.text}</p>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">{d.docs.emptyTitle}</p>
            <p className="text-sm text-muted-foreground">
              {documents.length === 0 ? d.docs.emptyNone : d.docs.emptyFilter}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((doc) => {
            const Icon = CATEGORY_ICONS[doc.category];
            return (
              <Card key={doc.id} className="flex h-full flex-col transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="icon-chip p-2">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline">{d.categories[doc.category]}</Badge>
                      {doc.is_published ? (
                        <Badge variant="success">{d.docs.published}</Badge>
                      ) : (
                        <Badge variant="warning">{d.docs.pending}</Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 text-base">
                    <Link
                      href={`/dashboard/documents/${doc.id}`}
                      className="hover:underline"
                    >
                      {doc.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="font-mono text-xs">
                    {doc.tracking_number}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-3 pt-0">
                  <p className="text-sm text-muted-foreground">
                    {doc.is_published
                      ? `${d.docs.publishedOn} ${formatDate(doc.published_at)}`
                      : `${d.docs.uploadedOn} ${formatDate(doc.created_at)}`}
                  </p>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/dashboard/documents/${doc.id}`}>
                        {d.docs.open}
                      </Link>
                    </Button>
                    {canPublish && !doc.is_published && (
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={isPending && publishingId === doc.id}
                        onClick={() => handlePublish(doc.id)}
                      >
                        <Send className="mr-1 h-3.5 w-3.5" />
                        {isPending && publishingId === doc.id
                          ? d.docs.publishing
                          : d.docs.publish}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
