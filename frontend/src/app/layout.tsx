import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Festix — Concert Ticket Booking',
  description: 'High-traffic distributed concert ticket booking platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
