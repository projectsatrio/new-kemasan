'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1527] text-blue-400 font-semibold text-sm">
        Memuat Sistem...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f4f7fc] text-slate-800 font-sans">
      <Sidebar userRole={role || 'marketing'} />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
