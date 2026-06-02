import type { Metadata } from 'next';
import { IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import { QueryProvider } from '@/components/providers/QueryProvider';
import './globals.css';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--loaded-sans',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--loaded-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Schissel Health Status',
  description: 'Practice operations dashboard — Schissel Medicine, PLLC',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      // Font variables applied here override the CSS fallbacks in globals.css
      style={{
        '--font-sans': `${ibmPlexSans.style.fontFamily}, system-ui, sans-serif`,
        '--font-mono': `${ibmPlexMono.style.fontFamily}, ui-monospace, monospace`,
      } as React.CSSProperties}
    >
      <body className={`${ibmPlexSans.variable} ${ibmPlexMono.variable}`}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
