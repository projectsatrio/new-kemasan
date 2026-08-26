'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { 
  Package, 
  Download, 
  Save, 
  History, 
  ChevronLeft, 
  ChevronRight, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  TrendingUp,
  TrendingDown,
  Boxes,
  X,
  Eye,
  AlertTriangle,
  Search,
  Filter,
  RotateCcw
} from 'lucide-react';

interface MutationLog {
  id: string;
  nama_barang: string;
  jenis_mutasi: string;
  satuan: string;
  detail_satuan?: string;
  bekas_dari?: string;
  jumlah: number;
  tanggal: string;
  tujuan_user: string;
}

export default function InventoryPage() {
  const [namaBarang, setNamaBarang] = useState('');
  const [jenisMutasi, setJenisMutasi] = useState('Barang Masuk');
  const [satuan, setSatuan] = useState('Pcs');
  const [detailSatuan, setDetailSatuan] = useState('');
  const [bekasDari, setBekasDari] = useState('');
  const [jumlah, setJumlah] = useState<number>(1);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [tujuanUser, setTujuanUser] = useState('STOCK INTERNAL');

  const [isMasterExist, setIsMasterExist] = useState<boolean | null>(null);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<MutationLog[]>([]);

  // State Filter & Search Tabel Log
  const [searchQuery, setSearchQuery] = useState('');
  const [filterJenis, setFilterJenis] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [totalMasterCount, setTotalMasterCount] = useState(0);
  const [totalMasukCount, setTotalMasukCount] = useState(0);
  const [totalKeluarCount, setTotalKeluarCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Pagination & Rows Per Page State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [totalItems, setTotalItems] = useState(0);

  // Modal State Histori Per Item
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);
  const [itemHistoryLogs, setItemHistoryLogs] = useState<MutationLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (jenisMutasi === 'Barang Masuk') {
      setTujuanUser('STOCK INTERNAL');
      setBekasDari('');
    } else if (jenisMutasi === 'Barang Keluar') {
      if (tujuanUser === 'STOCK INTERNAL') setTujuanUser('');
      setBekasDari('');
    } else if (jenisMutasi === 'Barang Bekas') {
      if (tujuanUser === 'STOCK INTERNAL') setTujuanUser('');
    }
  }, [jenisMutasi]);

  useEffect(() => {
    if (!namaBarang.trim()) {
      setIsMasterExist(null);
      return;
    }

    const checkMaster = async () => {
      setLoadingCheck(true);
      const { data } = await supabase
        .from('inventory_masters')
        .select('id')
        .ilike('nama_barang', namaBarang.trim())
        .maybeSingle();

      setIsMasterExist(!!data);
      setLoadingCheck(false);
    };

    const timer = setTimeout(checkMaster, 400);
    return () => clearTimeout(timer);
  }, [namaBarang]);

  const fetchStats = async () => {
    const { count: masterCnt } = await supabase.from('inventory_masters').select('*', { count: 'exact', head: true });
    if (masterCnt !== null) setTotalMasterCount(masterCnt);

    const { count: masukCnt } = await supabase.from('inventory_mutations').select('*', { count: 'exact', head: true }).eq('jenis_mutasi', 'Barang Masuk');
    if (masukCnt !== null) setTotalMasukCount(masukCnt);

    const { count: keluarCnt } = await supabase.from('inventory_mutations').select('*', { count: 'exact', head: true }).neq('jenis_mutasi', 'Barang Masuk');
    if (keluarCnt !== null) setTotalKeluarCount(keluarCnt);

    const { count: lowCnt } = await supabase.from('inventory_masters').select('*', { count: 'exact', head: true }).lt('total_stok', 5);
    if (lowCnt !== null) setLowStockCount(lowCnt);
  };

  const fetchLogs = useCallback(async () => {
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    let query = supabase
      .from('inventory_mutations')
      .select('*', { count: 'exact' });

    if (searchQuery.trim()) {
      query = query.or(`nama_barang.ilike.%${searchQuery.trim()}%,tujuan_user.ilike.%${searchQuery.trim()}%`);
    }

    if (filterJenis !== 'ALL') {
      query = query.eq('jenis_mutasi', filterJenis);
    }

    if (startDate) {
      query = query.gte('tanggal', startDate);
    }

    if (endDate) {
      query = query.lte('tanggal', endDate);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setLogs(data as MutationLog[]);
      if (count !== null) setTotalItems(count);
    }
  }, [currentPage, itemsPerPage, searchQuery, filterJenis, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [fetchLogs]);

  const handleResetFilter = () => {
    setSearchQuery('');
    setFilterJenis('ALL');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaBarang.trim()) return;

    setSubmitting(true);

    const payload = {
      nama_barang: namaBarang.trim().toUpperCase(),
      jenis_mutasi: jenisMutasi,
      satuan: satuan,
      detail_satuan: (satuan === 'Box' || satuan === 'Set') ? detailSatuan : null,
      bekas_dari: jenisMutasi === 'Barang Bekas' ? bekasDari : null,
      jumlah: Number(jumlah),
      tanggal: tanggal,
      tujuan_user: tujuanUser,
    };

    const { error: insertErr } = await supabase.from('inventory_mutations').insert([payload]);

    if (!insertErr) {
      const { data: existingMaster } = await supabase
        .from('inventory_masters')
        .select('*')
        .eq('nama_barang', payload.nama_barang)
        .maybeSingle();

      let currentStock = existingMaster ? existingMaster.total_stok : 0;
      let newStock = currentStock;

      if (jenisMutasi === 'Barang Masuk' || jenisMutasi === 'Barang Bekas') {
        newStock += payload.jumlah;
      } else if (jenisMutasi === 'Barang Keluar') {
        newStock -= payload.jumlah;
      }

      await supabase.from('inventory_masters').upsert({
        nama_barang: payload.nama_barang,
        satuan: payload.satuan,
        detail_satuan: payload.detail_satuan,
        total_stok: Math.max(0, newStock),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'nama_barang' });

      setNamaBarang('');
      setJumlah(1);
      setDetailSatuan('');
      setBekasDari('');
      fetchLogs();
      fetchStats();
    }
    setSubmitting(false);
  };

  const handleExportPDF = () => {
    const printWindow = window.open('', '', 'width=900,height=700');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Laporan Mutasi Stok Sparepart IT</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #1e293b; }
            h2 { text-align: center; margin-bottom: 5px; }
            p.sub { text-align: center; font-size: 12px; color: #64748b; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
            th { background-color: #0f172a; color: #ffffff; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>PT. KEMASAN CIPTATAMA SEMPURNA</h2>
          <p class="sub">LAPORAN MUTASI STOK SPAREPART IT - Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Nama Barang</th>
                <th>Jenis</th>
                <th>Qty</th>
                <th>Satuan</th>
                <th>Detail/Bekas</th>
                <th>Tujuan / Penerima</th>
              </tr>
            </thead>
            <tbody>
              ${logs.map(log => `
                <tr>
                  <td>${log.tanggal}</td>
                  <td><b>${log.nama_barang}</b></td>
                  <td>${log.jenis_mutasi}</td>
                  <td>${log.jumlah}</td>
                  <td>${log.satuan}</td>
                  <td>${log.detail_satuan || log.bekas_dari || '-'}</td>
                  <td>${log.tujuan_user}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* STATS SUMMARY CARDS (DITARUH DI ATAS SENDIRI) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Variasi Master Barang</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalMasterCount} <span className="text-xs font-semibold text-slate-400">Item</span></h3>
            <p className="text-[10px] text-blue-600 font-semibold mt-1">Terdaftar di master stock</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Mutasi Masuk</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{totalMasukCount} <span className="text-xs font-semibold text-slate-400">Transaksi</span></h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1">Stock internal bertambah</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Mutasi Keluar & Bekas</p>
            <h3 className="text-2xl font-black text-rose-600 mt-1">{totalKeluarCount} <span className="text-xs font-semibold text-slate-400">Transaksi</span></h3>
            <p className="text-[10px] text-rose-600 font-semibold mt-1">Pengeluaran & retur user</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Top Header Banner & Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Mutasi Stok Sparepart IT</h1>
            <p className="text-xs text-slate-400">Log inventory masuk dan keluar untuk manajemen ketersediaan hardware.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/it-department/inventory_sub"
            className="relative bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Layers className="w-4 h-4" />
            Subtotal Master Stok
            {lowStockCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {lowStockCount} Critical
              </span>
            )}
          </Link>

          <button
            onClick={handleExportPDF}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Input Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span>Input Log Mutasi</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nama Barang / Sparepart</label>
              <input
                type="text"
                required
                placeholder="Contoh: RAM DDR4 8GB"
                value={namaBarang}
                onChange={(e) => setNamaBarang(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              {loadingCheck ? (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking master database...
                </div>
              ) : isMasterExist === true ? (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Master item sudah terdaftar
                </div>
              ) : isMasterExist === false ? (
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-amber-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Master item belum terdaftar (Item Baru)
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Jenis Mutasi</label>
                <select
                  value={jenisMutasi}
                  onChange={(e) => setJenisMutasi(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Barang Masuk">Barang Masuk</option>
                  <option value="Barang Keluar">Barang Keluar</option>
                  <option value="Barang Bekas">Barang Bekas</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Satuan</label>
                <select
                  value={satuan}
                  onChange={(e) => setSatuan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Pcs">Pcs</option>
                  <option value="Unit">Unit</option>
                  <option value="Box">Box</option>
                  <option value="Set">Set</option>
                </select>
              </div>
            </div>

            {satuan === 'Box' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Isi 1 Box Berapa Pcs?</label>
                <input
                  type="text"
                  placeholder="Contoh: 1 Box = 50 Pcs"
                  value={detailSatuan}
                  onChange={(e) => setDetailSatuan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {satuan === 'Set' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Rincian Isi 1 Set</label>
                <input
                  type="text"
                  placeholder="Contoh: 1 Mouse, 1 Keyboard"
                  value={detailSatuan}
                  onChange={(e) => setDetailSatuan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {jenisMutasi === 'Barang Bekas' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Barang Bekas Dari User/Dept</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pak Budi (HRD)"
                  value={bekasDari}
                  onChange={(e) => setBekasDari(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Jumlah</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={jumlah}
                  onChange={(e) => setJumlah(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tanggal Input</label>
                <input
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Tujuan User / Departemen</label>
              <input
                type="text"
                required
                disabled={jenisMutasi === 'Barang Masuk'}
                value={tujuanUser}
                onChange={(e) => setTujuanUser(e.target.value)}
                className={`w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                  jenisMutasi === 'Barang Masuk' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-slate-50'
                }`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Mutasi
          </button>
        </form>

        {/* Right Table with Search & Filter Bar */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <History className="w-4 h-4 text-blue-600" />
                <span>Riwayat Aktivitas Logistik</span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full">
                Total: {totalItems} Data
              </span>
            </div>

            {/* FILTER & SEARCH BAR SECTION */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 space-y-2 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                
                {/* Search Bar */}
                <div className="md:col-span-5 relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama barang / tujuan..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                {/* Filter Jenis Mutasi */}
                <div className="md:col-span-4 relative">
                  <Filter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <select
                    value={filterJenis}
                    onChange={(e) => { setFilterJenis(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="ALL">Semua Jenis Mutasi</option>
                    <option value="Barang Masuk">Barang Masuk</option>
                    <option value="Barang Keluar">Barang Keluar</option>
                    <option value="Barang Bekas">Barang Bekas</option>
                  </select>
                </div>

                {/* Reset Filter Button */}
                <div className="md:col-span-3">
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="w-full py-1.5 px-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Filter
                  </button>
                </div>
              </div>

              {/* Date Range Picker */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Dari Tanggal</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Sampai Tanggal</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#1b253b] text-slate-200 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4 rounded-l-xl">Tanggal</th>
                    <th className="py-3 px-4">Nama Barang</th>
                    <th className="py-3 px-4">Qty</th>
                    <th className="py-3 px-4">Jenis</th>
                    <th className="py-3 px-4 rounded-r-xl">Tujuan / Penerima</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Tidak ada log mutasi yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-medium">{log.tanggal}</td>
                        <td className="py-3 px-4">
                          {/* WARNA TEKS DIBUAT HITAM TEGAS (text-slate-900) */}
                          <button
                            type="button"
                            onClick={() => handleOpenItemHistory(log.nama_barang)}
                            className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-left flex items-center gap-1.5 group transition-colors"
                            title="Klik untuk lihat audit riwayat barang"
                          >
                            <span>{log.nama_barang}</span>
                            <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                          </button>
                          {log.detail_satuan && <p className="text-[10px] text-slate-400">{log.detail_satuan}</p>}
                          {log.bekas_dari && <p className="text-[10px] text-amber-600">Bekas dari: {log.bekas_dari}</p>}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold">
                          {log.jumlah} <span className="text-[10px] text-slate-400">({log.satuan})</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            log.jenis_mutasi === 'Barang Masuk'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                              : log.jenis_mutasi === 'Barang Bekas'
                              ? 'bg-amber-50 text-amber-600 border border-amber-200'
                              : 'bg-rose-50 text-rose-600 border border-rose-200'
                          }`}>
                            {log.jenis_mutasi}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{log.tujuan_user}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CLEAN PAGINATION WITH SELECTOR (5, 10, 25, 50, 100) */}
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

      </div>

      {/* MODAL AUDIT HISTORI PER ITEM */}
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
