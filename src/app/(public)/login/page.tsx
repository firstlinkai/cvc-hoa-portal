import type { Metadata } from 'next';
import { AuthForms } from './auth-forms';
import { getServerDict } from '@/lib/i18n-server';

export const metadata: Metadata = {
  title: 'Member Login',
};

interface LoginPageProps {
  searchParams: {
    redirectTo?: string;
    error?: string;
    tab?: string;
  };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const { lang, d } = getServerDict();

  // Captured from email deep links (/login?redirectTo=/dashboard/documents/…)
  // and forwarded into the login form so the auth handler can resume it.
  const redirectTo =
    searchParams.redirectTo && searchParams.redirectTo.startsWith('/dashboard')
      ? searchParams.redirectTo
      : '/dashboard';

  const initialTab = searchParams.tab === 'register' ? 'register' : 'login';

  const bannerError =
    searchParams.error === 'unauthorized' ? d.auth.bannerUnauthorized : undefined;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-start justify-center bg-gradient-to-b from-emerald-50 to-background px-4 py-8 dark:from-emerald-950/30 sm:py-12">
      <AuthForms
        lang={lang}
        redirectTo={redirectTo}
        initialTab={initialTab}
        bannerError={bannerError}
      />
    </div>
  );
}
