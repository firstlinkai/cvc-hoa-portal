'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendRegistrationRequestEmail } from '@/lib/email';

export interface AuthFormState {
  error?: string;
  success?: string;
}

/** Only allow internal dashboard paths — blocks open-redirect abuse. */
function sanitizeRedirect(target: unknown): string {
  if (
    typeof target === 'string' &&
    target.startsWith('/dashboard') &&
    !target.startsWith('//')
  ) {
    return target;
  }
  return '/dashboard';
}

/* ── LOGIN ──────────────────────────────────────────────────────────────── */

export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const redirectTo = sanitizeRedirect(formData.get('redirectTo'));

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = createClient();

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: 'Invalid email or password.' };
  }

  // Gatekeeper: only active accounts may proceed to the dashboard.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication failed. Please try again.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: 'No member profile found for this account. Contact the HOA office.' };
  }

  if (profile.status === 'pending_approval') {
    await supabase.auth.signOut();
    return {
      error:
        'Your registration is still awaiting approval by the HOA President or Vice President.',
    };
  }

  if (profile.status === 'deactivated') {
    await supabase.auth.signOut();
    return {
      error: 'This account has been deactivated. Contact the HOA office for assistance.',
    };
  }

  // Deep-link resilience: resume the exact target captured from the email link.
  redirect(redirectTo);
}

/* ── REGISTER ───────────────────────────────────────────────────────────── */

export async function register(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const phase = String(formData.get('phase') ?? '').trim();
  const block = String(formData.get('block') ?? '').trim();
  const lot = String(formData.get('lot') ?? '').trim();

  if (!email || !password || !firstName || !lastName || !phase || !block || !lot) {
    return { error: 'All fields are required.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long.' };
  }

  const admin = createAdminClient();

  // Provision the auth user pre-confirmed; the real gate is HOA approval,
  // not email verification.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created?.user) {
    if (
      createError?.code === 'email_exists' ||
      createError?.message?.toLowerCase().includes('already')
    ) {
      return { error: 'An account with this email already exists.' };
    }
    return { error: 'Registration failed. Please try again later.' };
  }

  const { error: profileError } = await admin.from('profiles').insert({
    id: created.user.id,
    email,
    first_name: firstName,
    last_name: lastName,
    phase,
    block,
    lot,
    role: 'regular_member',
    status: 'pending_approval',
  });

  if (profileError) {
    // Roll back the orphaned auth user so the email can be reused.
    await admin.auth.admin.deleteUser(created.user.id);
    return { error: 'Registration failed while saving your profile. Please try again.' };
  }

  // Notify the President / Vice President (and sys_admin as fallback while
  // no executives exist yet). Email failure must not block registration.
  const { data: approvers } = await admin
    .from('profiles')
    .select('email, role')
    .in('role', ['president', 'vice_president'])
    .eq('status', 'active');

  let approverEmails = (approvers ?? []).map((a) => a.email);

  if (approverEmails.length === 0) {
    const { data: sysAdmins } = await admin
      .from('profiles')
      .select('email')
      .eq('role', 'sys_admin')
      .eq('status', 'active');
    approverEmails = (sysAdmins ?? []).map((a) => a.email);
  }

  const emailResult = await sendRegistrationRequestEmail({
    applicantName: `${firstName} ${lastName}`,
    applicantEmail: email,
    phase,
    block,
    lot,
    approverEmails,
  });

  if (!emailResult.ok) {
    console.error('[register] approver notification failed:', emailResult.error);
  }

  return {
    success:
      'Registration received! Your account is pending approval by the HOA. You will be able to sign in once an officer approves your membership.',
  };
}
