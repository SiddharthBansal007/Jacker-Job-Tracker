import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jacker',
  description: 'A minimal browser-only job application tracker.',
  icons: {
    icon: '/jacker-icon.png',
    shortcut: '/jacker-icon.png',
    apple: '/jacker-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
