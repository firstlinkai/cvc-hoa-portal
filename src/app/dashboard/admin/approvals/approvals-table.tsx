'use client';

import { useState, useTransition } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';

import { approveRegistration, denyRegistration } from '../actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { getDict, type Lang } from '@/lib/i18n';
import {
  ASSIGNABLE_ROLES,
  type Profile,
  type UserRole,
} from '@/lib/types';

interface ApprovalsTableProps {
  lang: Lang;
  pending: Profile[];
  viewerRole: UserRole;
}

export function ApprovalsTable({ lang, pending, viewerRole }: ApprovalsTableProps) {
  const d = getDict(lang);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, UserRole>>({});
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [denyTarget, setDenyTarget] = useState<Profile | null>(null);
  const [isPending, startTransition] = useTransition();

  // Only sys_admin can install a President (bootstrap exception).
  const roleOptions =
    viewerRole === 'sys_admin'
      ? ASSIGNABLE_ROLES
      : ASSIGNABLE_ROLES.filter((r) => r !== 'president');

  function handleApprove(applicant: Profile) {
    const role = selectedRoles[applicant.id] ?? 'regular_member';
    setBusyId(applicant.id);
    setFeedback(null);
    startTransition(async () => {
      const result = await approveRegistration(applicant.id, role);
      setFeedback({
        ok: result.ok,
        text: result.ok
          ? `${applicant.first_name} ${applicant.last_name} ${d.approvals.approvedAs} ${d.roles[role]}.`
          : result.error ?? 'Approval failed.',
      });
      setBusyId(null);
    });
  }

  function handleDeny() {
    if (!denyTarget) return;
    const target = denyTarget;
    setBusyId(target.id);
    setFeedback(null);
    setDenyTarget(null);
    startTransition(async () => {
      const result = await denyRegistration(target.id);
      setFeedback({
        ok: result.ok,
        text: result.ok
          ? `${d.approvals.deniedFor} ${target.first_name} ${target.last_name}.`
          : result.error ?? 'Denial failed.',
      });
      setBusyId(null);
    });
  }

  return (
    <div className="space-y-4">
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

      {pending.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground/50" />
            <p className="font-medium">{d.approvals.emptyTitle}</p>
            <p className="text-sm text-muted-foreground">
              {d.approvals.emptyBody}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{d.approvals.colApplicant}</TableHead>
                <TableHead>{d.approvals.colEmail}</TableHead>
                <TableHead>{d.approvals.colProperty}</TableHead>
                <TableHead>{d.approvals.colRegistered}</TableHead>
                <TableHead>{d.approvals.colRole}</TableHead>
                <TableHead className="text-right">
                  {d.approvals.colDecision}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell className="font-medium">
                    {applicant.first_name} {applicant.last_name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {applicant.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      P{applicant.phase} · B{applicant.block} · L{applicant.lot}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(applicant.created_at)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={selectedRoles[applicant.id] ?? 'regular_member'}
                      onValueChange={(value) =>
                        setSelectedRoles((prev) => ({
                          ...prev,
                          [applicant.id]: value as UserRole,
                        }))
                      }
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {d.roles[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        disabled={isPending && busyId === applicant.id}
                        onClick={() => handleApprove(applicant)}
                      >
                        <ThumbsUp className="mr-1 h-3.5 w-3.5" />
                        {d.approvals.approve}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={isPending && busyId === applicant.id}
                        onClick={() => setDenyTarget(applicant)}
                      >
                        <ThumbsDown className="mr-1 h-3.5 w-3.5" />
                        {d.approvals.deny}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Deny confirmation */}
      <Dialog
        open={denyTarget !== null}
        onOpenChange={(open) => !open && setDenyTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{d.approvals.denyTitle}</DialogTitle>
            <DialogDescription>
              {denyTarget && (
                <>
                  {d.approvals.denyLead}{' '}
                  <span className="font-medium text-foreground">
                    {denyTarget.first_name} {denyTarget.last_name}
                  </span>{' '}
                  (Phase {denyTarget.phase}, Block {denyTarget.block}, Lot{' '}
                  {denyTarget.lot}). {d.approvals.denyTail}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyTarget(null)}>
              {d.approvals.cancel}
            </Button>
            <Button variant="destructive" onClick={handleDeny}>
              {d.approvals.denyConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
