'use client';

import { useRef, useState, useTransition } from 'react';
import { AlertCircle, CheckCircle2, FileUp, UploadCloud } from 'lucide-react';

import { uploadDocument } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  validateDocumentFile,
  ALLOWED_EXTENSIONS,
} from '@/lib/validation';
import { getDict, type Lang } from '@/lib/i18n';
import { DOC_CATEGORIES } from '@/lib/types';

export function UploadForm({ lang }: { lang: Lang }) {
  const d = getDict(lang);
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState<string>('');
  const [notify, setNotify] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    setFileName(null);
    const file = event.target.files?.[0];
    if (!file) return;

    // Frontend validation for instant feedback; the Server Action re-runs
    // the exact same checks authoritatively.
    const result = validateDocumentFile(file);
    if (!result.ok) {
      setFileError(result.error ?? 'Invalid file.');
      event.target.value = '';
      return;
    }
    setFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
  }

  function handleSubmit(formData: FormData) {
    setFeedback(null);
    startTransition(async () => {
      const result = await uploadDocument(formData);
      setFeedback({
        ok: result.ok,
        text: result.ok
          ? result.message ?? 'Document uploaded.'
          : result.error ?? 'Upload failed.',
      });
      if (result.ok) {
        formRef.current?.reset();
        setCategory('');
        setNotify(false);
        setFileName(null);
      }
    });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="icon-chip p-2.5">
            <UploadCloud className="h-6 w-6" />
          </span>
          <div>
            <CardTitle className="text-lg">{d.uploadPage.cardTitle}</CardTitle>
            <CardDescription>{d.uploadPage.cardDesc}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={handleSubmit} className="space-y-5">
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

          <div className="space-y-2">
            <Label htmlFor="title">{d.uploadPage.titleLabel}</Label>
            <Input
              id="title"
              name="title"
              placeholder={d.uploadPage.titlePlaceholder}
              maxLength={200}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{d.uploadPage.category}</Label>
            <Select
              name="category"
              value={category}
              onValueChange={setCategory}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={d.uploadPage.selectCategory} />
              </SelectTrigger>
              <SelectContent>
                {DOC_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {d.categories[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category === 'Minutes of Meeting' && (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {d.uploadPage.momWarning}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">{d.uploadPage.file}</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileChange}
              required
            />
            {fileName && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                <FileUp className="h-3.5 w-3.5" /> {fileName}
              </p>
            )}
            {fileError && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5" /> {fileError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {d.uploadPage.maxSize}
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-md border bg-muted/40 p-4">
            <Checkbox
              id="notifyMembers"
              name="notifyMembers"
              checked={notify}
              onCheckedChange={(checked) => setNotify(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="notifyMembers" className="cursor-pointer">
                {d.uploadPage.notifyLabel}
              </Label>
              <p className="text-xs text-muted-foreground">
                {d.uploadPage.notifyDesc}
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? d.uploadPage.uploading : d.uploadPage.submitBtn}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
