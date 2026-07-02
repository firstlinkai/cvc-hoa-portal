'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { AlertCircle, CheckCircle2, LogIn, UserPlus } from 'lucide-react';

import { login, register, type AuthFormState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getDict, type Lang } from '@/lib/i18n';

const initialState: AuthFormState = {};

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function FormAlert({ state }: { state: AuthFormState }) {
  if (state.error) {
    return (
      <div className="alert-error">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{state.error}</p>
      </div>
    );
  }
  if (state.success) {
    return (
      <div className="alert-success">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{state.success}</p>
      </div>
    );
  }
  return null;
}

interface AuthFormsProps {
  lang: Lang;
  redirectTo: string;
  initialTab: 'login' | 'register';
  bannerError?: string;
}

export function AuthForms({
  lang,
  redirectTo,
  initialTab,
  bannerError,
}: AuthFormsProps) {
  const d = getDict(lang);
  const [tab, setTab] = useState<'login' | 'register'>(initialTab);
  const [loginState, loginAction] = useFormState(login, initialState);
  const [registerState, registerAction] = useFormState(register, initialState);

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-3">
        <CardTitle className="text-center text-2xl">
          {tab === 'login' ? d.auth.loginTitle : d.auth.registerTitle}
        </CardTitle>
        <CardDescription className="text-center">
          {tab === 'login' ? d.auth.loginDesc : d.auth.registerDesc}
        </CardDescription>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              tab === 'login'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LogIn className="h-4 w-4" /> {d.auth.tabLogin}
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={cn(
              'flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              tab === 'register'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <UserPlus className="h-4 w-4" /> {d.auth.tabRegister}
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {bannerError && tab === 'login' && !loginState.error && (
          <div className="alert-warning">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{bannerError}</p>
          </div>
        )}

        {tab === 'login' ? (
          <form action={loginAction} className="space-y-4">
            {/* Deep-link target carried through authentication */}
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <FormAlert state={loginState} />

            <div className="space-y-2">
              <Label htmlFor="login-email">{d.auth.email}</Label>
              <Input
                id="login-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">{d.auth.password}</Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <SubmitButton label={d.auth.signIn} pendingLabel={d.auth.signingIn} />
          </form>
        ) : (
          <form action={registerAction} className="space-y-4">
            <FormAlert state={registerState} />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="reg-first-name">{d.auth.firstName}</Label>
                <Input id="reg-first-name" name="firstName" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-last-name">{d.auth.lastName}</Label>
                <Input id="reg-last-name" name="lastName" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="reg-phase">{d.auth.phase}</Label>
                <Input id="reg-phase" name="phase" placeholder="1" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-block">{d.auth.block}</Label>
                <Input id="reg-block" name="block" placeholder="12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-lot">{d.auth.lot}</Label>
                <Input id="reg-lot" name="lot" placeholder="34" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-email">{d.auth.email}</Label>
              <Input
                id="reg-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-password">{d.auth.password}</Label>
              <Input
                id="reg-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
              />
              <p className="text-xs text-muted-foreground">{d.auth.minChars}</p>
            </div>

            <SubmitButton label={d.auth.submit} pendingLabel={d.auth.submitting} />

            <p className="text-center text-xs text-muted-foreground">
              {d.auth.approvalNote}
            </p>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
