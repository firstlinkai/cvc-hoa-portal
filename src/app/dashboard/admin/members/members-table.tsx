'use client';

import { useMemo, useState, useTransition } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  Search,
  ShieldOff,
  ShieldCheck,
  Lock,
  UserCog,
} from 'lucide-react';

import { setAccountStatus, setMemberRole } from '../actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { getDict, type Lang } from '@/lib/i18n';
import {
  ACCOUNT_MANAGER_ROLES,
  ASSIGNABLE_ROLES,
  type Profile,
  type UserRole,
} from '@/lib/types';

interface MembersTableProps {
  lang: Lang;
  members: Profile[];
  viewerId: string;
  viewerRole: UserRole;
}

export function MembersTable({
  lang,
  members,
  viewerId,
  viewerRole,
}: MembersTableProps) {
  const d = getDict(lang);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    member: Profile;
    nextStatus: 'active' | 'deactivated';
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  // VP (and anyone else outside sys_admin/president) sees the roster but has
  // no status/role controls — mirrored server-side and in the database trigger.
  const canManageAccounts = ACCOUNT_MANAGER_ROLES.includes(viewerRole);

  // Only sys_admin can install a President (mirrors the approvals rule).
  const roleOptions =
    viewerRole === 'sys_admin'
      ? ASSIGNABLE_ROLES
      : ASSIGNABLE_ROLES.filter((r) => r !== 'president');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        `${m.phase}-${m.block}-${m.lot}`.includes(q)
    );
  }, [members, query]);

  function statusBadge(status: Profile['status']) {
    switch (status) {
      case 'active':
        return <Badge variant="success">{d.statuses[status]}</Badge>;
      case 'pending_approval':
        return <Badge variant="warning">{d.statuses[status]}</Badge>;
      case 'deactivated':
        return <Badge variant="destructive">{d.statuses[status]}</Badge>;
    }
  }

  function isProtectedFromViewer(member: Profile): boolean {
    if (member.id === viewerId) return true; // never self-manage
    if (viewerRole === 'president') {
      return member.role === 'sys_admin' || member.role === 'president';
    }
    return false; // sys_admin manages everyone else
  }

  function handleConfirm() {
    if (!confirmTarget) return;
    const { member, nextStatus } = confirmTarget;
    setConfirmTarget(null);
    setFeedback(null);
    startTransition(async () => {
      const result = await setAccountStatus(member.id, nextStatus);
      setFeedback({
        ok: result.ok,
        text: result.ok
          ? result.message ?? 'Status updated.'
          : result.error ?? 'Status change failed.',
      });
    });
  }

  function handleRoleChange(member: Profile, newRole: UserRole) {
    if (newRole === member.role) return;
    setFeedback(null);
    startTransition(async () => {
      const result = await setMemberRole(member.id, newRole);
      setFeedback({
        ok: result.ok,
        text: result.ok
          ? `${member.first_name} ${member.last_name}: ${d.members.roleChanged} ${d.roles[newRole]}.`
          : result.error ?? 'Role change failed.',
      });
    });
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={d.members.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {feedback && (
        <div className={feedback.ok ? 'alert-success' : 'alert-error'}>
          {feedback.ok ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <p>{feedback.text}</p>
        </div>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{d.members.colMember}</TableHead>
              <TableHead>{d.members.colEmail}</TableHead>
              <TableHead>{d.members.colProperty}</TableHead>
              <TableHead>{d.members.colRole}</TableHead>
              <TableHead>{d.members.colStatus}</TableHead>
              {canManageAccounts && (
                <TableHead className="text-right">
                  {d.members.colManage}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((member) => {
              const isProtected = isProtectedFromViewer(member);
              return (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.first_name} {member.last_name}
                    {member.id === viewerId && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {d.members.you}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      P{member.phase} · B{member.block} · L{member.lot}
                    </Badge>
                  </TableCell>
                  <TableCell>{d.roles[member.role]}</TableCell>
                  <TableCell>{statusBadge(member.status)}</TableCell>
                  {canManageAccounts && (
                    <TableCell className="text-right">
                      {isProtected ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                          title={d.members.protectedHint}
                        >
                          <Lock className="h-3.5 w-3.5" /> {d.members.protected}
                        </span>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isPending}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">
                                {d.members.colManage}
                              </span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <UserCog />
                                {d.members.changeRole}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuRadioGroup
                                  value={member.role}
                                  onValueChange={(value) =>
                                    handleRoleChange(member, value as UserRole)
                                  }
                                >
                                  {roleOptions.map((role) => (
                                    <DropdownMenuRadioItem key={role} value={role}>
                                      {d.roles[role]}
                                    </DropdownMenuRadioItem>
                                  ))}
                                </DropdownMenuRadioGroup>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>
                              {d.members.accountStatus}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {member.status !== 'active' && (
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmTarget({
                                    member,
                                    nextStatus: 'active',
                                  })
                                }
                              >
                                <ShieldCheck className="text-emerald-600" />
                                {d.members.activate}
                              </DropdownMenuItem>
                            )}
                            {member.status === 'active' && (
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() =>
                                  setConfirmTarget({
                                    member,
                                    nextStatus: 'deactivated',
                                  })
                                }
                              >
                                <ShieldOff />
                                {d.members.deactivate}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-muted-foreground">
            {d.members.noMatch}
          </p>
        )}
      </Card>

      {/* Confirmation dialog */}
      <Dialog
        open={confirmTarget !== null}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmTarget?.nextStatus === 'deactivated'
                ? d.members.confirmDeactivateTitle
                : d.members.confirmActivateTitle}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget && (
                <>
                  <span className="font-medium text-foreground">
                    {confirmTarget.member.first_name}{' '}
                    {confirmTarget.member.last_name}
                  </span>{' '}
                  (Phase {confirmTarget.member.phase}, Block{' '}
                  {confirmTarget.member.block}, Lot {confirmTarget.member.lot}
                  ) —{' '}
                  {confirmTarget.nextStatus === 'deactivated'
                    ? d.members.deactivateBody
                    : d.members.activateBody}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              {d.members.cancel}
            </Button>
            <Button
              variant={
                confirmTarget?.nextStatus === 'deactivated'
                  ? 'destructive'
                  : 'default'
              }
              onClick={handleConfirm}
            >
              {confirmTarget?.nextStatus === 'deactivated'
                ? d.members.deactivateBtn
                : d.members.activateBtn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
