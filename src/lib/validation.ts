/**
 * Shared file validation rules — enforced on both the client (fast feedback)
 * and inside Server Actions (authoritative).
 */

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.png', '.jpg', '.jpeg'] as const;

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
] as const;

export const EXTENSION_TO_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx':
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

export function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf('.');
  return idx === -1 ? '' : fileName.slice(idx).toLowerCase();
}

export interface FileValidationResult {
  ok: boolean;
  error?: string;
}

export function validateDocumentFile(file: {
  name: string;
  size: number;
  type: string;
}): FileValidationResult {
  const ext = getExtension(file.name);

  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return {
      ok: false,
      error: `File type "${ext || 'unknown'}" is not allowed. Accepted: PDF, DOCX, PNG, JPG.`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return {
      ok: false,
      error: `MIME type "${file.type || 'unknown'}" is not allowed. Accepted: PDF, DOCX, PNG, JPG.`,
    };
  }

  // Extension must agree with the declared MIME type (blocks e.g. virus.exe renamed to .pdf
  // with a spoofed content type slipping through simple checks).
  if (EXTENSION_TO_MIME[ext] !== file.type) {
    return {
      ok: false,
      error: `File extension "${ext}" does not match its content type "${file.type}".`,
    };
  }

  if (file.size <= 0) {
    return { ok: false, error: 'File is empty.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      ok: false,
      error: `File is ${(file.size / (1024 * 1024)).toFixed(1)}MB — the maximum allowed size is 10MB.`,
    };
  }

  return { ok: true };
}

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}
