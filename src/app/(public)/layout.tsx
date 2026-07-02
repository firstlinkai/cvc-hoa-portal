import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { LanguageToggle } from '@/components/site/language-toggle';
import { getServerDict } from '@/lib/i18n-server';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang, d } = getServerDict();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Home className="h-5 w-5" />
            </span>
            <span className="truncate text-base font-bold tracking-tight text-primary sm:text-lg">
              <span className="hidden sm:inline">Ciudad Verde Calamba</span>
              <span className="sm:hidden">CVC HOA</span>
            </span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button asChild variant="ghost" className="hidden md:inline-flex">
              <Link href="/#about">{d.nav.about}</Link>
            </Button>
            <LanguageToggle lang={lang} label={d.nav.switchLanguage} />
            <ThemeToggle label={d.nav.toggleTheme} />
            <Button asChild size="sm" className="sm:h-10 sm:px-4">
              <Link href="/login">{d.nav.memberLogin}</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-center text-sm text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <p>
            © {new Date().getFullYear()} Ciudad Verde Calamba Homeowners
            Association. {d.footer.rights}
          </p>
          <p>{d.footer.location}</p>
        </div>
      </footer>
    </div>
  );
}
