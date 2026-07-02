import Link from 'next/link';
import {
  Trees,
  ShieldCheck,
  FileText,
  Users,
  Target,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getServerDict } from '@/lib/i18n-server';

export default function LandingPage() {
  const { d } = getServerDict();

  const features = [
    { icon: FileText, title: d.landing.f1Title, desc: d.landing.f1Desc },
    { icon: ShieldCheck, title: d.landing.f2Title, desc: d.landing.f2Desc },
    { icon: Users, title: d.landing.f3Title, desc: d.landing.f3Desc },
  ];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-background to-background dark:from-emerald-950/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Trees className="h-4 w-4" />
            {d.landing.badge}
          </span>
          <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {d.landing.heroPrefix}{' '}
            <span className="text-primary">Ciudad Verde Calamba</span>
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
            {d.landing.heroSub}
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">{d.landing.ctaPortal}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login?tab=register">{d.landing.ctaRegister}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Feature strip ────────────────────────────────────────────── */}
      <section className="border-y bg-background">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {features.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4">
              <span className="icon-chip p-3">
                <feature.icon className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ────────────────────────────────────────────────────── */}
      <section id="about" className="bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {d.landing.aboutTitle}
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {d.landing.aboutBody}
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            <Card className="border-emerald-100 dark:border-emerald-900">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="icon-chip p-2.5">
                    <Target className="h-6 w-6" />
                  </span>
                  <CardTitle className="text-xl">
                    {d.landing.missionTitle}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground">
                  {d.landing.missionBody}
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 dark:border-emerald-900">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="icon-chip p-2.5">
                    <Eye className="h-6 w-6" />
                  </span>
                  <CardTitle className="text-xl">
                    {d.landing.visionTitle}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground">
                  {d.landing.visionBody}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="bg-primary">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-primary-foreground sm:text-3xl">
            {d.landing.ctaTitle}
          </h2>
          <p className="max-w-xl text-primary-foreground/85">
            {d.landing.ctaBody}
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-2">
            <Link href="/login?tab=register">{d.landing.ctaButton}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
