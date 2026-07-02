'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Send } from 'lucide-react';

import { publishDocument } from '@/app/dashboard/admin/actions';
import { Button } from '@/components/ui/button';
import { getDict, type Lang } from '@/lib/i18n';

export function PublishButton({ lang, docId }: { lang: Lang; docId: string }) {
  const d = getDict(lang);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const result = await publishDocument(docId);
      if (!result.ok) {
        setError(result.error ?? 'Publishing failed.');
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="alert-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}
      <Button className="w-full" disabled={isPending} onClick={handlePublish}>
        <Send className="mr-2 h-4 w-4" />
        {isPending ? d.docs.publishing : d.docDetail.publishBtn}
      </Button>
      <p className="text-xs text-muted-foreground">{d.docDetail.publishNote}</p>
    </div>
  );
}
