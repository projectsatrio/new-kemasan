import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: 'ERP System - PT. Kemasan Ciptatama Sempurna',
  description: 'Sistem Informasi ERP Terintegrasi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
