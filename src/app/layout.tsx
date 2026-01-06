
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"; 
import { CartProvider } from '@/context/CartContext';
import FloatingCartButton from '@/components/FloatingCartButton';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'paBondi Online Marketplace',
  description: 'Discover unique products from local stores on paBondi.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="paBondi" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="paBondi" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />

        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`antialiased flex flex-col min-h-screen`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const preference = window.localStorage.getItem('theme');
                  if (preference) {
                    document.documentElement.classList.add(preference);
                    return;
                  }
                  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  console.error(e);
                }
              })();
            `,
          }}
        />
        <CartProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
          <FloatingCartButton />
        </CartProvider>
        <Toaster />
      </body>
    </html>
  );
}
