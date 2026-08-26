'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRole } from '../types';
import { supabase } from '../lib/supabaseClient';
import { 
  LayoutDashboard, 
  Megaphone, 
  Users, 
  Wifi, 
  HelpCircle, 
  Package, 
  Video, 
  FileText, 
  Settings,
  LogOut,
  Lock
} from 'lucide-react';

interface SidebarProps {
  userRole: UserRole;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navGroups = [
    {
      group: 'MARKETING',
      items: [
        { label: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone, roles: ['superadmin', 'admin', 'marketing'] },
        { label: 'Sales Visit Log', href: '/dashboard/sales', icon: Users, roles: ['superadmin', 'admin', 'marketing'] },
      ]
    },
    {
      group: 'IT DEPARTMENT',
      items: [
        { label: 'Wi-Fi Vouchers', href: '/dashboard/wifi', icon: Wifi, roles: ['superadmin', 'admin'] },
        { label: 'Helpdesk Tickets', href: '/dashboard/helpdesk', icon: HelpCircle, roles: ['superadmin', 'admin'] },
        { label: 'Sparepart Stock', href: '/dashboard/it-department/inventory', icon: Package, roles: ['superadmin', 'admin', 'logistik'] },
        { label: 'CCTV Configuration', href: '/dashboard/cctv', icon: Video, roles: ['superadmin', 'admin'] },
      ]
    },
    {
      group: 'ACCOUNTING',
      items: [
        { label: 'Invoices', href: '/dashboard/finance', icon: FileText, roles: ['superadmin', 'admin', 'finansial'] },
      ]
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { label: 'User Settings', href: '/dashboard/settings', icon: Settings, roles: ['superadmin', 'admin'] },
      ]
    }
  ];

  return (
    <aside className="w-64 bg-[#0b1329] text-slate-300 flex flex-col justify-between min-h-screen">
      <div className="p-5">
        {/* Header Branding */}
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
            HQ
          </div>
          <div>
            <h2 className="font-bold text-white text-sm leading-tight tracking-wide">CORP INTERNAL</h2>
            <span className="text-[10px] text-slate-400">KEMASAN GROUP</span>
          </div>
        </div>

        {/* Dashboard Single Button */}
        <div className="mb-4">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              pathname === '/dashboard'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Dynamic Groups */}
        <div className="space-y-4">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <p className="text-[10px] font-bold tracking-wider text-slate-500 uppercase px-3 mb-1.5">
                {group.group}
              </p>
              <nav className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasAccess = item.roles.includes(userRole);
                  const isActive = pathname === item.href;

                  if (!hasAccess) {
                    return (
                      <div
                        key={item.href}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-600 cursor-not-allowed select-none opacity-50"
                        title="Akses Terkunci"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-slate-600" />
                          <span>{item.label}</span>
                        </div>
                        <Lock className="w-3 h-3 text-slate-600" />
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md'
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
          ))}
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold">
            IT
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">IT</p>
            <p className="text-[10px] text-blue-400 capitalize">{userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-slate-400 hover:text-red-400 transition-colors"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
