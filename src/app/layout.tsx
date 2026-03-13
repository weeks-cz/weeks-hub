import type { Metadata } from 'next';
import { DM_Sans, Outfit } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin', 'latin-ext'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin', 'latin-ext'],
});

export const metadata: Metadata = {
  title: 'Weeks Hub',
  description: 'Interní systém pro tým Weeks',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className="dark">
      <body className={`${dmSans.variable} ${outfit.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
