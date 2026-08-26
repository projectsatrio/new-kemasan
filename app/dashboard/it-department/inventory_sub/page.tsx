'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { ArrowLeft, Search, Eye, X, Loader2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

interface MasterStock {
  id: string;
  nama_barang: string;
  satuan: string;
  detail_satuan?: string;
  total_stok: number;
  updated_at: string;
}

interface MutationLog {
  id: string;
  nama_barang: string;
  jenis_mutasi: string;
  satuan: string;
  bekas_dari?: string;
  jumlah: number;
  tanggal: string;
  tujuan_user: string;
}

export default function SubtotalInventoryPage() {
  const [masters, setMasters] = useState<MasterStock[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Pagination & Rows Per Page State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modal State Histori Per Item
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [itemHistoryLogs, setItemHistoryLogs] = useState<MutationLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const LOW_STOCK_THRESHOLD = 5;

  useEffect(() => {
    fetchMasters();
  }, []);

  const fetchMasters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventory_masters')
      .select('*')
      .order('nama_barang', { ascending: true });

    if (!error && data) {
      setMasters(data as MasterStock[]);
    }
    setLoading(false);
  };

  const handleOpenItemHistory = async (itemName: string) => {
    setSelectedItemName(itemName);
    setLoadingHistory(true);

    const { data, error } = await supabase
      .from('inventory_mutations')
      .select('*')
      .eq('nama_barang', itemName)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setItemHistoryLogs(data as MutationLog[]);
    }
    setLoadingHistory(false);
  };

  const filteredMasters = masters.filter(m =>
    m.nama_barang.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = masters.filter(m => m.total_stok < LOW_STOCK_THRESHOLD);

  // Calculations for Pagination
  const totalItems = filteredMasters.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMasters = filteredMasters.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/it-department/inventory"
            className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all"
            title="Kembali ke Log Mutasi"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Subtotal Master Stok IT</h1>
            <p className="text-xs text-slate-400">Akumulasi total sisa stok barang/hardware terdaftar saat ini.</p>
          </div>
        </div>

        <div className="w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari master barang..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>
      </div>

      {/* CLEAN & MODERN LOW STOCK ALERT BANNER */}
      {lowStockItems.length > 0 && (
        <div className="bg-white border-l-4 border-l-rose-500 border-y border-r border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Peringatan Stok Menipis</h4>
                <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {lowStockItems.length} Item Kritis
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Stok sparepart berada di bawah ambang batas minimum (&lt; 5 pcs). Segera persiapkan pengajuan pengadaan barang.
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap justify-start md:justify-end">
            {lowStockItems.slice(0, 3).map((item) => (
              <span key={item.id} className="bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {item.nama_barang}: <b className="text-rose-600">{item.total_stok} {item.satuan}</b>
              </span>
            ))}
            {lowStockItems.length > 3 && (
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-lg">
                +{lowStockItems.length - 3} barang lainnya
              </span>
            )}
          </div>
        </div>
      )}

      {/* Table Subtotal + Pagination */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#1b253b] text-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-4 rounded-l-xl">Nama Barang Master</th>
                <th className="py-3.5 px-4">Satuan</th>
                <th className="py-3.5 px-4">Keterangan / Isi</th>
                <th className="py-3.5 px-4">Total Sisa Stok</th>
                <th className="py-3.5 px-4 rounded-r-xl">Terakhir Diperbarui</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Memuat master stok...</td>
                </tr>
              ) : paginatedMasters.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Master stok tidak ditemukan.</td>
                </tr>
              ) : (
                paginatedMasters.map((item) => {
                  const isLow = item.total_stok < LOW_STOCK_THRESHOLD;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${isLow ? 'bg-rose-50/20' : ''}`}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {/* WARNA TEKS NAMA BARANG DIBUAT HITAM TEGAS (text-slate-900) */}
                          <button
                            type="button"
                            onClick={() => handleOpenItemHistory(item.nama_barang)}
                            className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-left flex items-center gap-1.5 group transition-colors"
                            title="Klik untuk lihat audit riwayat barang"
                          >
                            <span>{item.nama_barang}</span>
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                          </button>

                          {isLow && (
                            <span className="bg-rose-100 text-rose-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-rose-200 uppercase tracking-wider flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Stok Kritis
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-semibold">{item.satuan}</td>
                      <td className="py-3.5 px-4 text-slate-500">{item.detail_satuan || '-'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isLow
                            ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                        }`}>
                          {item.total_stok} {item.satuan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {new Date(item.updated_at).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* CLEAN PAGINATION WITH SELECTOR AT SUBTOTAL MASTER */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Tampilkan:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 Data</option>
              <option value={10}>10 Data</option>
              <option value={25}>25 Data</option>
              <option value={50}>50 Data</option>
              <option value={100}>100 Data</option>
            </select>
            <span className="text-xs text-slate-400 font-medium">
              (Hal. <b>{currentPage}</b> dari <b>{totalPages}</b>)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 font-semibold disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 font-semibold disabled:opacity-40 disabled:hover:bg-transparent transition-all"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL POP-UP AUDIT HISTORI PER ITEM */}
      {selectedItemName && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">Audit Track History</span>
                  <h3 className="text-lg font-black text-slate-800">{selectedItemName}</h3>
                </div>
                <button
                  onClick={() => setSelectedItemName(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4 overflow-y-auto max-h-[50vh]">
                {loadingHistory ? (
                  <div className="py-8 flex items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Memuat histori item...
                  </div>
                ) : itemHistoryLogs.length === 0 ? (
                  <p className="py-8 text-center text-slate-400 text-xs">Belum ada riwayat tercatat untuk item ini.</p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-900 text-slate-100 font-semibold uppercase text-[10px] tracking-wider sticky top-0">
                        <th className="py-2.5 px-3 rounded-l-lg">Tanggal</th>
                        <th className="py-2.5 px-3">Jenis Mutasi</th>
                        <th className="py-2.5 px-3">Jumlah</th>
                        <th className="py-2.5 px-3">Bekas Dari</th>
                        <th className="py-2.5 px-3 rounded-r-lg">Tujuan / User</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemHistoryLogs.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-slate-500 font-medium">{item.tanggal}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.jenis_mutasi === 'Barang Masuk'
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                : item.jenis_mutasi === 'Barang Bekas'
                                ? 'bg-amber-50 text-amber-600 border border-amber-200'
                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                            }`}>
                              {item.jenis_mutasi}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {item.jumlah} <span className="text-[10px] font-normal text-slate-400">({item.satuan})</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{item.bekas_dari || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium">{item.tujuan_user}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Total Transaksi Terrekam: <b>{itemHistoryLogs.length} Data</b></span>
              <button
                onClick={() => setSelectedItemName(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold px-4 py-2 rounded-xl transition-all"
              >
                Tutup Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
