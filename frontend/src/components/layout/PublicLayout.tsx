import Header from './Header';
import Footer from './Footer';
import TopStickyLoginBanner from '@/components/job-search/TopStickyLoginBanner';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex flex-1 flex-col">
      {/* Sticky top banner for guests — dismissable for 7 days. */}
      <TopStickyLoginBanner />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
