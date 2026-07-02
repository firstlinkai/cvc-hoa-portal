export type UserRole =
  | 'sys_admin'
  | 'president'
  | 'vice_president'
  | 'doc_controller'
  | 'board_member'
  | 'regular_member';

export type AccountStatus = 'pending_approval' | 'active' | 'deactivated';

export type DocCategory = 'Notice' | 'Announcement' | 'Minutes of Meeting';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phase: string;
  block: string;
  lot: string;
  role: UserRole;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  tracking_number: string;
  title: string;
  category: DocCategory;
  storage_url: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  uploaded_by: string;
  is_published: boolean;
  notify_members: boolean;
  notified_at: string | null;
  created_at: string;
  published_at: string | null;
}

export interface DocumentWithUploader extends Document {
  uploader: Pick<Profile, 'first_name' | 'last_name'> | null;
}

export const ALL_ROLES: UserRole[] = [
  'sys_admin',
  'president',
  'vice_president',
  'doc_controller',
  'board_member',
  'regular_member',
];

/** Roles the approvals dropdown may assign (sys_admin is seeded manually, never assigned). */
export const ASSIGNABLE_ROLES: UserRole[] = [
  'president',
  'vice_president',
  'doc_controller',
  'board_member',
  'regular_member',
];

export const ROLE_LABELS: Record<UserRole, string> = {
  sys_admin: 'System Admin',
  president: 'President',
  vice_president: 'Vice President',
  doc_controller: 'Document Controller',
  board_member: 'Board Member',
  regular_member: 'Regular Member',
};

export const STATUS_LABELS: Record<AccountStatus, string> = {
  pending_approval: 'Pending Approval',
  active: 'Active',
  deactivated: 'Deactivated',
};

export const DOC_CATEGORIES: DocCategory[] = [
  'Notice',
  'Announcement',
  'Minutes of Meeting',
];

/** Roles allowed to see Minutes of Meeting documents. */
export const BOARD_ROLES: UserRole[] = [
  'sys_admin',
  'president',
  'vice_president',
  'doc_controller',
  'board_member',
];

/** Roles allowed to upload documents. */
export const UPLOADER_ROLES: UserRole[] = [
  'sys_admin',
  'president',
  'vice_president',
  'doc_controller',
];

/** Roles allowed to approve registrations and publish documents. */
export const APPROVER_ROLES: UserRole[] = ['sys_admin', 'president', 'vice_president'];

/** Roles allowed to activate/deactivate accounts (VP explicitly excluded). */
export const ACCOUNT_MANAGER_ROLES: UserRole[] = ['sys_admin', 'president'];

export function canViewCategory(role: UserRole, category: DocCategory): boolean {
  if (category === 'Minutes of Meeting') return BOARD_ROLES.includes(role);
  return true;
}
