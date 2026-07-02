'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LANG_COOKIE, type Lang } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/**
 * EN/TL language switch. Persists the choice in a cookie and refreshes the
 * route so Server Components re-render in the selected language.
 */
export function LanguageToggle({ lang, label }: { lang: Lang; label: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function setLang(next: Lang) {
    if (next === lang) return;
    document.cookie = `${LANG_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'flex items-center overflow-hidden rounded-md border text-xs font-semibold',
        isPending && 'opacity-60'
      )}
    >
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={cn(
          'px-2.5 py-1.5 transition-colors',
          lang === 'en'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('tl')}
        aria-pressed={lang === 'tl'}
        className={cn(
          'px-2.5 py-1.5 transition-colors',
          lang === 'tl'
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground'
        )}
      >
        TL
      </button>
    </div>
  );
}
