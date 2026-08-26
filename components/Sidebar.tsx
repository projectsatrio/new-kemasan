'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Truck, 
  Users, 
  FileText, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  userRole: UserRole;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  // Konfigurasi Navigasi Berdasarkan Role User
  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['superadmin', 'admin', 'marketing', 'logistik', 'finansial', 'purchasing'],
    },
    {
      label: 'Penjualan (Sales)',
      href: '/dashboard/sales',
      icon: ShoppingCart,
      roles: ['superadmin', 'admin', 'marketing'],
    },
    {
      label: 'Stok Barang',
      href: '/dashboard/inventory',
      icon: Package,
      roles: ['superadmin', 'admin', 'logistik'],
    },
    {
      label: 'Pengiriman & Armada',
      href: '/dashboard/logistics',
      icon: Truck,
      roles: ['superadmin', 'admin', 'logistik'],
    },
    {
      label: 'Laporan Keuangan',
      href: '/dashboard/finance',
      icon: FileText,
      roles: ['superadmin', 'admin', 'finansial'],
    },
    {
      label: 'Manajemen User',
      href: '/dashboard/users',
      icon: Users,
      roles: ['superadmin'],
    },
    {
      label: 'Pengaturan System',
      href: '/dashboard/settings',
      icon: Settings,
      roles: ['superadmin', 'admin'],
    },
  ];

  // Filter menu yang boleh diakses sesuai role
  const filteredNavItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col justify-between min-h-screen">
      <div className="p-4">
        {/* Header Logo */}
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            K
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white text-base leading-none">PT. KCS</h2>
            <span className="text-xs text-gray-500 dark:text-gray-400">ERP System Integrated</span>
          </div>
        </div>

        {/* Info Role Active */}
        <div className="mb-6 px-3 py-2 bg-gray-100 dark:bg-gray-700/50 rounded-md">
          <p className="text-xs text-gray-500 dark:text-gray-400">Akses Hak User:</p>
          <p className="text-sm font-semibold capitalize text-blue-600 dark:text-blue-400">{userRole}</p>
        </div>

        {/* Menu Navigasi */}
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Navigasi */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 text-center">
        v1.0.0 &copy; 2026 PT. KCS
      </div>
    </aside>
  );
}
