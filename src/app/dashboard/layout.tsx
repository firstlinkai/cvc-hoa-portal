import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Home,
  FileText,
  UserCheck,
  Upload,
  Users,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

import { createClient } from '@/lib/supabase/server';
import { signOut } from './actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/site/theme-toggle';
import { LanguageToggle } from '@/components/site/language-toggle';
import { getServerDict } from '@/lib/i18n-server';
import {
  APPROVER_ROLES,
  UPLOADER_ROLES,
  type Profile,
} from '@/lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang, d } = getServerDict();
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  // Middleware already guards this, but never render the shell without an
  // active profile.
  if (!profile || profile.status !== 'active') {
    redirect('/login?error=unauthorized');
  }

  const isApprover = APPROVER_ROLES.includes(profile.role);
  const isUploader = UPLOADER_ROLES.includes(profile.role);

  const navItems = [
    {
      href: '/dashboard',
      label: d.nav.overview,
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: '/dashboard/documents',
      label: d.nav.documents,
      icon: FileText,
      show: true,
    },
    {
      href: '/dashboard/admin/approvals',
      label: d.nav.approvals,
      icon: UserCheck,
      show: isApprover,
    },
    {
      href: '/dashboard/admin/upload',
      label: d.nav.upload,
      icon: Upload,
      show: isUploader,
    },
    {
      href: '/dashboard/admin/members',
      label: d.nav.members,
      icon: Users,
      show: isApprover,
    },
  ].filter((item) => item.show);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Home className="h-5 w-5" />
            </span>
            <span className="hidden text-lg font-bold tracking-tight text-primary lg:inline">
              CVC HOA Portal
            </span>
          </Link>

          <nav className="flex items-center gap-0.5 overflow-x-auto sm:gap-1">
            {navItems.map((item) => (
              <Button key={item.href} asChild variant="ghost" size="sm">
                <Link href={item.href} className="flex items-center gap-1.5">
                  <item.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              </Button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <div className="hidden text-right xl:block">
              <p className="text-sm font-medium leading-tight">
                {profile.first_name} {profile.last_name}
              </p>
              <Badge variant="secondary" className="mt-0.5">
                {d.roles[profile.role]}
              </Badge>
            </div>
            <LanguageToggle lang={lang} label={d.nav.switchLanguage} />
            <ThemeToggle label={d.nav.toggleTheme} />
            <form action={signOut}>
              <Button
                type="submit"
                variant="outline"
                size="icon"
                title={d.nav.signOut}
                aria-label={d.nav.signOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-3 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
