import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });

export const metadata: Metadata = {
  title: 'Parkzonen Deutschland — Gebuehren, Zeiten & kostenloses Parken',
  description:
    'Finde Parkzonen, Gebuehren und kostenloses Parken in deutschen Staedten. Alle Parkraumbewirtschaftungszonen auf einer Karte.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`h-full antialiased ${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-dvh flex flex-col bg-slate-50 font-sans">
        {children}
      </body>
    </html>
  );
}
