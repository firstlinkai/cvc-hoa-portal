import 'server-only';

import { Resend } from 'resend';
import type { DocCategory } from '@/lib/types';

const FROM = process.env.EMAIL_FROM || 'CVC HOA Portal <onboarding@resend.dev>';

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(
    /\/$/,
    ''
  );
}

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY is not configured.');
  return new Resend(key);
}

/* ── Shared layout ──────────────────────────────────────────────────────── */

function emailShell(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f4f7f4;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f4;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8e2;">
            <tr>
              <td style="background-color:#166534;padding:20px 32px;">
                <h1 style="margin:0;font-size:18px;color:#ffffff;">Ciudad Verde Calamba HOA</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h2 style="margin:0 0 16px;font-size:20px;color:#14532d;">${title}</h2>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#f8faf8;border-top:1px solid #e2e8e2;">
                <p style="margin:0;font-size:12px;color:#6b7280;">
                  This is an automated message from the Ciudad Verde Calamba HOA Portal. Please do not reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:#166534;border-radius:6px;">
        <a href="${href}" target="_blank"
           style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

/* ── 1. Registration request → President / VP ───────────────────────────── */

export interface RegistrationEmailInput {
  applicantName: string;
  applicantEmail: string;
  phase: string;
  block: string;
  lot: string;
  approverEmails: string[];
}

export async function sendRegistrationRequestEmail(
  input: RegistrationEmailInput
): Promise<{ ok: boolean; error?: string }> {
  if (input.approverEmails.length === 0) {
    return { ok: false, error: 'No active President/VP recipients found.' };
  }

  // Deep link survives an expired session: middleware captures redirectTo,
  // the login handler resumes it after authentication.
  const approvalsLink = `${siteUrl()}/login?redirectTo=${encodeURIComponent(
    '/dashboard/admin/approvals'
  )}`;

  const html = emailShell(
    'New Membership Registration',
    `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
       A new homeowner has registered on the portal and is awaiting your review.
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
            style="background-color:#f8faf8;border:1px solid #e2e8e2;border-radius:6px;margin:0 0 8px;">
       <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;width:120px;">Applicant</td>
           <td style="padding:8px 16px;font-size:14px;color:#111827;font-weight:bold;">${input.applicantName}</td></tr>
       <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Email</td>
           <td style="padding:8px 16px;font-size:14px;color:#111827;">${input.applicantEmail}</td></tr>
       <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Phase</td>
           <td style="padding:8px 16px;font-size:14px;color:#111827;">${input.phase}</td></tr>
       <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Block</td>
           <td style="padding:8px 16px;font-size:14px;color:#111827;">${input.block}</td></tr>
       <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Lot</td>
           <td style="padding:8px 16px;font-size:14px;color:#111827;">${input.lot}</td></tr>
     </table>
     ${ctaButton(approvalsLink, 'Review in Approvals Dashboard')}
     <p style="margin:0;font-size:13px;color:#6b7280;">
       The account remains blocked from the dashboard until it is approved.
     </p>`
  );

  try {
    const resend = getResend();
    const { error } = await resend.emails.send({
      from: FROM,
      to: input.approverEmails,
      subject: `[Action Required] New HOA registration: ${input.applicantName}`,
      html,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown email error',
    };
  }
}

/* ── 2. Document broadcast → active members ─────────────────────────────── */

export interface BroadcastEmailInput {
  documentId: string;
  trackingNumber: string;
  title: string;
  category: DocCategory;
  recipientEmails: string[];
}

const RESEND_BATCH_LIMIT = 100;

export async function sendDocumentBroadcast(
  input: BroadcastEmailInput
): Promise<{ ok: boolean; sent: number; error?: string }> {
  if (input.recipientEmails.length === 0) {
    return { ok: true, sent: 0 };
  }

  const documentLink = `${siteUrl()}/login?redirectTo=${encodeURIComponent(
    `/dashboard/documents/${input.documentId}`
  )}`;

  const html = emailShell(
    `New ${input.category} Published`,
    `<p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
       The HOA has published a new document on the community portal.
     </p>
     <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
            style="background-color:#f8faf8;border:1px solid #e2e8e2;border-radius:6px;margin:0 0 8px;">
       <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;width:130px;">Title</td>
           <td style="padding:8px 16px;font-size:14px;color:#111827;font-weight:bold;">${input.title}</td></tr>
       <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Category</td>
           <td style="padding:8px 16px;font-size:14px;color:#111827;">${input.category}</td></tr>
       <tr><td style="padding:8px 16px;font-size:13px;color:#6b7280;">Tracking No.</td>
           <td style="padding:8px 16px;font-size:14px;color:#111827;">${input.trackingNumber}</td></tr>
     </table>
     ${ctaButton(documentLink, 'View Document')}
     <p style="margin:0;font-size:13px;color:#6b7280;">
       You will be asked to sign in first; the portal will take you straight to the document afterwards.
     </p>`
  );

  const subject = `[CVC HOA] New ${input.category}: ${input.title} (${input.trackingNumber})`;

  try {
    const resend = getResend();
    let sent = 0;

    // Resend's batch endpoint caps at 100 messages per call; each member gets
    // an individual email (no exposed recipient lists).
    for (let i = 0; i < input.recipientEmails.length; i += RESEND_BATCH_LIMIT) {
      const chunk = input.recipientEmails.slice(i, i + RESEND_BATCH_LIMIT);
      const { error } = await resend.batch.send(
        chunk.map((to) => ({ from: FROM, to: [to], subject, html }))
      );
      if (error) {
        return { ok: false, sent, error: error.message };
      }
      sent += chunk.length;
    }

    return { ok: true, sent };
  } catch (err) {
    return {
      ok: false,
      sent: 0,
      error: err instanceof Error ? err.message : 'Unknown email error',
    };
  }
}
