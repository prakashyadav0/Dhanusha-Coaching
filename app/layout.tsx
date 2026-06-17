import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import SessionWrapper from '@/components/shared/SessionWrapper';
import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduNepal — Online Learning Platform',
  description:
    'Buy and access courses, notes, and notices from top teachers.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <SessionWrapper>
          <Navbar />

          <main className="flex-1">
            {children}
          </main>

          <Footer />
        </SessionWrapper>
      </body>
    </html>
  );
}