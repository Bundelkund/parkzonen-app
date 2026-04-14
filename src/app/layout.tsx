import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="de" className="h-full antialiased">
      <body className="min-h-dvh flex flex-col bg-slate-50 font-sans">
        {children}
      </body>
    </html>
  );
}
