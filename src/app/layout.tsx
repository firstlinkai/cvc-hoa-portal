import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getLang } from '@/lib/i18n-server';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Ciudad Verde Calamba HOA Portal',
    template: '%s | Ciudad Verde Calamba HOA',
  },
  description:
    'The official digital hub of the Ciudad Verde Calamba Homeowners Association — notices, announcements, and community services for verified homeowners.',
};

// Applies the persisted (or system) theme before first paint to avoid a
// light-mode flash when the user prefers dark.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const lang = getLang();

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
