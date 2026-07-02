'use server';

import { revalidatePath } from 'next/cache';
import { randomUUID } from 'node:crypto';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendDocumentBroadcast } from '@/lib/email';
import { validateDocumentFile, sanitizeFileName } from '@/lib/validation';
import {
  APPROVER_ROLES,
  UPLOADER_ROLES,
  ACCOUNT_MANAGER_ROLES,
  ASSIGNABLE_ROLES,
  DOC_CATEGORIES,
  type DocCategory,
  type Document,
  type Profile,
  type UserRole,
} from '@/lib/types';

export interface ActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

const CATEGORY_SLUGS: Record<DocCategory, string> = {
  Notice: 'notice',
  Announcement: 'announcement',
  'Minutes of Meeting': 'minutes-of-meeting',
};

/**
 * Loads the calling user's profile and asserts an active account with one of
 * the allowed roles. Every privileged action starts here — the client-side
 * UI is never trusted.
 */
async function requireRole(allowed: UserRole[]) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, profile: null as Profile | null, error: 'Not authenticated.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>();

  if (!profile || profile.status !== 'active') {
    return { supabase, profile: null, error: 'Your account is not active.' };
  }

  if (!allowed.includes(profile.role)) {
    return { supabase, profile: null, error: 'You are not authorized to perform this action.' };
  }

  return { supabase, profile, error: null };
}

/* ══════════════════════════════════════════════════════════════════════════
   REGISTRATION APPROVALS
   ══════════════════════════════════════════════════════════════════════════ */

export async function approveRegistration(
  userId: string,
  assignedRole: UserRole
): Promise<ActionResult> {
  const { supabase, profile, error } = await requireRole(APPROVER_ROLES);
  if (error || !profile) return { ok: false, error: error ?? 'Unauthorized.' };

  if (!ASSIGNABLE_ROLES.includes(assignedRole)) {
    return { ok: false, error: 'That role cannot be assigned through approvals.' };
  }

  // Only sys_admin may install a president (PRD: sys_admin approves the
  // first President account).
  if (assignedRole === 'president' && profile.role !== 'sys_admin') {
    return { ok: false, error: 'Only the System Admin can approve a President account.' };
  }

  // Update runs with the CALLER's JWT: RLS policies + the tr_profiles_guard
  // trigger enforce the authority matrix at the database level as well.
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ role: assignedRole, status: 'active' })
    .eq('id', userId)
    .eq('status', 'pending_approval')
    .select('id');

  if (updateError) {
    return { ok: false, error: `Approval failed: ${updateError.message}` };
  }
  if (!updated || updated.length === 0) {
    return { ok: false, error: 'Registration not found or already processed.' };
  }

  revalidatePath('/dashboard/admin/approvals');
  revalidatePath('/dashboard/admin/members');
  return { ok: true, message: 'Registration approved and account activated.' };
}

export async function denyRegistration(userId: string): Promise<ActionResult> {
  const { profile, error } = await requireRole(APPROVER_ROLES);
  if (error || !profile) return { ok: false, error: error ?? 'Unauthorized.' };

  const admin = createAdminClient();

  // Verify the target really is a pending registration — denial deletes the
  // auth user, which must never happen to an established member.
  const { data: target } = await admin
    .from('profiles')
    .select('id, status')
    .eq('id', userId)
    .single();

  if (!target || target.status !== 'pending_approval') {
    return { ok: false, error: 'Registration not found or already processed.' };
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return { ok: false, error: `Denial failed: ${deleteError.message}` };
  }

  revalidatePath('/dashboard/admin/approvals');
  return { ok: true, message: 'Registration denied and removed.' };
}

/* ══════════════════════════════════════════════════════════════════════════
   ACCOUNT LIFECYCLE (activate / deactivate) — sys_admin & president ONLY
   ══════════════════════════════════════════════════════════════════════════ */

export async function setAccountStatus(
  userId: string,
  status: 'active' | 'deactivated'
): Promise<ActionResult> {
  const { supabase, profile, error } = await requireRole(ACCOUNT_MANAGER_ROLES);
  if (error || !profile) return { ok: false, error: error ?? 'Unauthorized.' };

  if (userId === profile.id) {
    return { ok: false, error: 'You cannot change the status of your own account.' };
  }

  // Application-level mirror of the database guard: the President cannot
  // touch sys_admin or other President accounts.
  const { data: target } = await supabase
    .from('profiles')
    .select('id, role, status')
    .eq('id', userId)
    .single<Pick<Profile, 'id' | 'role' | 'status'>>();

  if (!target) return { ok: false, error: 'Member not found.' };

  if (
    profile.role === 'president' &&
    (target.role === 'sys_admin' || target.role === 'president')
  ) {
    return {
      ok: false,
      error: 'The President cannot modify System Admin or President accounts.',
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({ status })
    .eq('id', userId)
    .select('id');

  if (updateError) {
    return { ok: false, error: `Status change failed: ${updateError.message}` };
  }
  if (!updated || updated.length === 0) {
    return { ok: false, error: 'Status change was rejected.' };
  }

  revalidatePath('/dashboard/admin/members');
  return {
    ok: true,
    message: status === 'active' ? 'Account activated.' : 'Account deactivated. Any active session will be terminated by the middleware on their next request.',
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   DOCUMENT UPLOAD (staged as pending_review / is_published = false)
   ══════════════════════════════════════════════════════════════════════════ */

export async function uploadDocument(formData: FormData): Promise<ActionResult> {
  const { supabase, profile, error } = await requireRole(UPLOADER_ROLES);
  if (error || !profile) return { ok: false, error: error ?? 'Unauthorized.' };

  const title = String(formData.get('title') ?? '').trim();
  const category = String(formData.get('category') ?? '') as DocCategory;
  const notifyMembers = formData.get('notifyMembers') === 'on';
  const file = formData.get('file');

  if (!title) return { ok: false, error: 'A document title is required.' };
  if (title.length > 200) return { ok: false, error: 'Title must be 200 characters or fewer.' };

  if (!DOC_CATEGORIES.includes(category)) {
    return { ok: false, error: 'Please select a valid category.' };
  }

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: 'Please attach a file.' };
  }

  // Authoritative backend validation: extension, MIME agreement, 10MB cap.
  const validation = validateDocumentFile(file);
  if (!validation.ok) {
    return { ok: false, error: validation.error };
  }

  const safeName = sanitizeFileName(file.name);
  const storagePath = `${CATEGORY_SLUGS[category]}/${randomUUID()}-${safeName}`;

  // Upload with the caller's JWT — storage RLS + bucket MIME/size limits
  // provide a second enforcement layer.
  const { error: uploadError } = await supabase.storage
    .from('hoa-documents')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: `File upload failed: ${uploadError.message}` };
  }

  const { data: inserted, error: insertError } = await supabase
    .from('documents')
    .insert({
      title,
      category,
      storage_url: storagePath,
      file_name: safeName,
      mime_type: file.type,
      file_size: file.size,
      uploaded_by: profile.id,
      is_published: false,
      notify_members: notifyMembers,
    })
    .select('tracking_number')
    .single();

  if (insertError || !inserted) {
    // Don't leave an orphaned object behind.
    await supabase.storage.from('hoa-documents').remove([storagePath]);
    return {
      ok: false,
      error: `Saving the document record failed: ${insertError?.message ?? 'unknown error'}`,
    };
  }

  revalidatePath('/dashboard/documents');
  return {
    ok: true,
    message: `Document staged for review as ${inserted.tracking_number}. It will go live once the President or VP publishes it.`,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   PUBLISH + OPTIONAL EMAIL BROADCAST
   ══════════════════════════════════════════════════════════════════════════ */

export async function publishDocument(docId: string): Promise<ActionResult> {
  const { supabase, profile, error } = await requireRole(APPROVER_ROLES);
  if (error || !profile) return { ok: false, error: error ?? 'Unauthorized.' };

  // publish_document() takes a row-level lock (SELECT ... FOR UPDATE) so two
  // concurrent publish clicks can never both succeed — which in turn
  // guarantees the broadcast below fires at most once.
  const { data: doc, error: rpcError } = await supabase
    .rpc('publish_document', { doc_id: docId })
    .single<Document>();

  if (rpcError) {
    if (rpcError.message.includes('ALREADY_PUBLISHED')) {
      return { ok: false, error: 'This document has already been published.' };
    }
    if (rpcError.message.includes('DOCUMENT_NOT_FOUND')) {
      return { ok: false, error: 'Document not found or not accessible.' };
    }
    return { ok: false, error: `Publishing failed: ${rpcError.message}` };
  }

  revalidatePath('/dashboard/documents');
  revalidatePath(`/dashboard/documents/${docId}`);

  if (!doc.notify_members) {
    return { ok: true, message: `${doc.tracking_number} is now live (silent publish — no emails sent).` };
  }

  // ── Broadcast: resolve recipients honoring category visibility rules ──
  const admin = createAdminClient();

  let recipientQuery = admin
    .from('profiles')
    .select('email, role')
    .eq('status', 'active');

  if (doc.category === 'Minutes of Meeting') {
    // Regular members must never be notified about (or linked to) board minutes.
    recipientQuery = recipientQuery.in('role', [
      'sys_admin',
      'president',
      'vice_president',
      'doc_controller',
      'board_member',
    ]);
  }

  const { data: recipients, error: recipientsError } = await recipientQuery;

  if (recipientsError) {
    return {
      ok: true,
      message: `${doc.tracking_number} published, but the notification email could not be prepared: ${recipientsError.message}`,
    };
  }

  const result = await sendDocumentBroadcast({
    documentId: doc.id,
    trackingNumber: doc.tracking_number,
    title: doc.title,
    category: doc.category,
    recipientEmails: (recipients ?? []).map((r) => r.email),
  });

  if (result.ok && result.sent > 0) {
    await admin
      .from('documents')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', doc.id);
  }

  if (!result.ok) {
    console.error('[publishDocument] broadcast failed:', result.error);
    return {
      ok: true,
      message: `${doc.tracking_number} published, but the email broadcast failed: ${result.error}`,
    };
  }

  return {
    ok: true,
    message: `${doc.tracking_number} published and ${result.sent} member notification${result.sent === 1 ? '' : 's'} dispatched.`,
  };
}
