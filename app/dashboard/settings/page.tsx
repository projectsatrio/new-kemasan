'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { supabase } from '../../../lib/supabaseClient';
import { UserRole } from '../../../types';
import { Sun, Moon, Monitor, UserPlus, Shield, CheckCircle2, Loader2 } from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  email?: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Form New User State
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('marketing');
  const [createLoading, setCreateLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && data) {
      setProfiles(data as UserProfile[]);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, targetRole: UserRole) => {
    setUpdatingId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: targetRole })
      .eq('id', userId);

    if (!error) {
      setProfiles((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
      );
      setMessage({ type: 'success', text: 'Hak akses user berhasil diperbarui.' });
    } else {
      setMessage({ type: 'error', text: 'Gagal memperbarui hak akses.' });
    }
    setUpdatingId(null);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setMessage(null);

    // Registrasi Auth User via Supabase API
    const { data, error } = await supabase.auth.signUp({
      email: newEmail,
      password: newPassword,
      options: {
        data: { full_name: newName }
      }
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else if (data.user) {
      // Upsert profile role
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: newName,
        role: newRole,
      });

      setMessage({ type: 'success', text: `User ${newName} (${newRole}) berhasil dibuat!` });
      setNewEmail('');
      setNewPassword('');
      setNewName('');
      fetchUsers();
    }
    setCreateLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan System & Hak Akses</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Kelola tampilan interface dan konfigurasikan role akses setiap pengguna.</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {message.text}
        </div>
      )}

      {/* SECTION 1: TEMA UI */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sun className="w-5 h-5 text-blue-500" /> Tema Visual Tampilan
        </h2>
        <div className="grid grid-cols-3 gap-4 max-w-md">
          {[
            { id: 'light', label: 'Cerah', icon: Sun },
            { id: 'dark', label: 'Gelap', icon: Moon },
            { id: 'system', label: 'Sistem', icon: Monitor },
          ].map((item) => {
            const Icon = item.icon;
            const active = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                  active
                    ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 dark:border-blue-500'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: BUAT USER BARU */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-blue-500" /> Tambah Pengguna Baru
        </h2>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Contoh: Ahmad Marketing"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="ahmad@kemasangroup.com"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Role / Hak Akses</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="marketing">Marketing (Akses Sales saja)</option>
              <option value="logistik">Logistik (Akses Stok & Armada)</option>
              <option value="finansial">Finansial (Akses Keuangan)</option>
              <option value="admin">Admin (Akses Hampir Semua)</option>
              <option value="superadmin">Superadmin (Full Access)</option>
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={createLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {createLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Simpan & Daftarkan User
            </button>
          </div>
        </form>
      </section>

      {/* SECTION 3: DAFTAR USER & UBAH ROLE */}
      <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-500" /> Manajemen Akses User Aktif
        </h2>

        {loading ? (
          <div className="text-center py-6 text-sm text-gray-500">Memuat data user...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3">Nama User</th>
                  <th className="px-4 py-3">Role Akses Saat Ini</th>
                  <th className="px-4 py-3 text-right">Aksi Ubah Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {profiles.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {user.full_name || 'Tanpa Nama'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md text-xs font-semibold capitalize">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={user.role}
                        disabled={updatingId === user.id}
                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                        className="px-2.5 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="marketing">Marketing</option>
                        <option value="logistik">Logistik</option>
                        <option value="finansial">Finansial</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
