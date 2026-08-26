'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
import ThemeToggle from '../../components/ThemeToggle';
import { UserRole } from '../../types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        setRole('marketing');
      } else {
        setRole(data.role as UserRole);
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-blue-400 font-semibold text-sm">
        Memuat Sistem ERP...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <Sidebar userRole={role || 'marketing'} />
      
      {/* Container Utama (Kombinasi Putih-Biru) */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-blue-50/70 via-white to-blue-100/50 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40">
        
        {/* Top Header */}
        <header className="h-16 border-b border-blue-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <h1 className="text-base font-bold text-slate-800 dark:text-white tracking-wide">
              Main Dashboard System
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="text-xs font-semibold bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl shadow-md shadow-red-500/20 transition-all active:scale-95"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Content View */}
        <main className="p-8 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
