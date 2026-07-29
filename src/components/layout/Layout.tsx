import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import NotificationBanner from './NotificationBanner';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NotificationBanner />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
