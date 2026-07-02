import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type UserRole =
  | 'sys_admin'
  | 'president'
  | 'vice_president'
  | 'doc_controller'
  | 'board_member'
  | 'regular_member';

/**
 * Role clearance per admin sub-route. A user must hold one of the listed
 * roles to enter the path prefix.
 */
const ADMIN_ROUTE_CLEARANCE: Array<{ prefix: string; roles: UserRole[] }> = [
  {
    prefix: '/dashboard/admin/approvals',
    roles: ['sys_admin', 'president', 'vice_president'],
  },
  {
    prefix: '/dashboard/admin/members',
    roles: ['sys_admin', 'president', 'vice_president'],
  },
  {
    prefix: '/dashboard/admin/upload',
    roles: ['sys_admin', 'president', 'vice_president', 'doc_controller'],
  },
  // Fallback for any other /dashboard/admin/* path.
  {
    prefix: '/dashboard/admin',
    roles: ['sys_admin', 'president', 'vice_president', 'doc_controller'],
  },
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() validates the JWT against Supabase Auth servers
  // (never trust getSession() in middleware).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isDashboardPath = pathname.startsWith('/dashboard');

  if (!isDashboardPath) {
    // Already-authenticated users landing on /login get bounced into the
    // dashboard (or their deep-link target).
    if (user && pathname === '/login') {
      const redirectTo = request.nextUrl.searchParams.get('redirectTo');
      const url = request.nextUrl.clone();
      url.pathname =
        redirectTo && redirectTo.startsWith('/dashboard')
          ? redirectTo
          : '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return response;
  }

  // ── /dashboard/* below this line ────────────────────────────────────────

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    // Preserve the deep link so the login handler can resume it post-auth.
    url.searchParams.set('redirectTo', pathname + search);
    return NextResponse.redirect(url);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  const status = profile?.status;
  const role = (profile?.role ?? 'regular_member') as UserRole;

  if (!profile || status === 'pending_approval' || status === 'deactivated') {
    // Terminate the session and force re-authentication.
    await supabase.auth.signOut();
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('error', 'unauthorized');
    const redirect = NextResponse.redirect(url);
    // Carry over the cookie clearing performed by signOut().
    response.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie.name, cookie.value, cookie);
    });
    return redirect;
  }

  if (pathname.startsWith('/dashboard/admin')) {
    const rule = ADMIN_ROUTE_CLEARANCE.find((r) => pathname.startsWith(r.prefix));
    if (rule && !rule.roles.includes(role)) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets so the auth cookies stay
     * refreshed, while the guard logic itself only acts on /dashboard/*.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
