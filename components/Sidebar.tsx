'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserRole } from '../types';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Truck, 
  FileText, 
  Settings,
  Lock 
} from 'lucide-react';

interface SidebarProps {
  userRole: UserRole;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['superadmin', 'admin', 'marketing', 'logistik', 'finansial', 'purchasing'] },
    { label: 'Penjualan (Sales)', href: '/dashboard/sales', icon: ShoppingCart, roles: ['superadmin', 'admin', 'marketing'] },
    { label: 'Stok Barang', href: '/dashboard/inventory', icon: Package, roles: ['superadmin', 'admin', 'logistik'] },
    { label: 'Pengiriman & Armada', href: '/dashboard/logistics', icon: Truck, roles: ['superadmin', 'admin', 'logistik'] },
    { label: 'Laporan Keuangan', href: '/dashboard/finance', icon: FileText, roles: ['superadmin', 'admin', 'finansial'] },
    { label: 'Pengaturan System', href: '/dashboard/settings', icon: Settings, roles: ['superadmin', 'admin'] },
  ];

  return (
    <aside className="w-64 bg-slate-900 dark:bg-slate-950 border-r border-slate-800 text-slate-100 flex flex-col justify-between min-h-screen shadow-xl transition-colors duration-200">
      <div className="p-4">
        {/* Header Logo */}
        <div className="flex items-center gap-3 mb-8 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/30">
            K
          </div>
          <div>
            <h2 className="font-bold text-white text-sm tracking-wide leading-none">PT. KCS</h2>
            <span className="text-[11px] text-blue-300 font-medium">ERP Integrated</span>
          </div>
        </div>

        {/* Info Role Active */}
        <div className="mb-6 px-3.5 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl">
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Akses Hak User</p>
          <p className="text-xs font-bold capitalize text-cyan-400 mt-0.5">{userRole}</p>
        </div>

        {/* Menu Navigasi */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasAccess = item.roles.includes(userRole);
            const isActive = pathname === item.href;

            if (!hasAccess) {
              return (
                <div
                  key={item.href}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-500 bg-slate-800/30 border border-transparent cursor-not-allowed select-none opacity-50"
                  title="Akses Terkunci untuk Role Anda"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{item.label}</span>
                  </div>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 text-center font-medium">
        v1.0.0 &copy; 2026 PT. KCS
      </div>
    </aside>
  );
}
