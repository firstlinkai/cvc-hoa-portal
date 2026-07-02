import type { Metadata } from 'next';

import { getServerDict } from '@/lib/i18n-server';
import { UploadForm } from './upload-form';

export const metadata: Metadata = {
  title: 'Upload Document',
};

export default function UploadPage() {
  const { lang, d } = getServerDict();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {d.uploadPage.title}
        </h1>
        <p className="mt-1 text-muted-foreground">{d.uploadPage.subtitle}</p>
      </div>

      <UploadForm lang={lang} />
    </div>
  );
}
