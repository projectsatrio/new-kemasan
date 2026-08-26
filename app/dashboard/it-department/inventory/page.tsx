'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../lib/supabaseClient';
import { Package, Download, Save, History, ChevronLeft, ChevronRight, Layers, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

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
  // Form State
  const [namaBarang, setNamaBarang] = useState('');
  const [jenisMutasi, setJenisMutasi] = useState('Barang Masuk');
  const [satuan, setSatuan] = useState('Pcs');
  const [detailSatuan, setDetailSatuan] = useState('');
  const [bekasDari, setBekasDari] = useState('');
  const [jumlah, setJumlah] = useState<number>(1);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [tujuanUser, setTujuanUser] = useState('STOCK INTERNAL');

  // Master Check & UI State
  const [isMasterExist, setIsMasterExist] = useState<boolean | null>(null);
  const [loadingCheck, setLoadingCheck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [logs, setLogs] = useState<MutationLog[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [totalItems, setTotalItems] = useState(0);

  // Auto-lock logic based on jenis mutasi
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

  // Real-time check if master item exists
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

  // Fetch Logs with Pagination
  useEffect(() => {
    fetchLogs();
  }, [currentPage]);

  const fetchLogs = async () => {
    const from = (currentPage - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, count, error } = await supabase
      .from('inventory_mutations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setLogs(data as MutationLog[]);
      if (count !== null) setTotalItems(count);
    }
  };

  // Handle Form Submit
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

    // 1. Insert Log Mutasi
    const { error: insertErr } = await supabase.from('inventory_mutations').insert([payload]);

    if (!insertErr) {
      // 2. Upsert Master Stock Subtotal
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

      // Reset Form
      setNamaBarang('');
      setJumlah(1);
      setDetailSatuan('');
      setBekasDari('');
      fetchLogs();
    }
    setSubmitting(false);
  };

  // Export PDF Stream function
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

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Action Buttons */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
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
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all"
          >
            <Layers className="w-4 h-4" />
            Subtotal Master Stok
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

      {/* Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form Input */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <span>Input Log Mutasi</span>
          </div>

          {/* Nama Barang + Indicator Status */}
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

          {/* Jenis Mutasi & Satuan */}
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

          {/* Dynamic Satuan Fields (Box / Set) */}
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

          {/* Dynamic Bekas Dari Field */}
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

          {/* Jumlah & Tanggal */}
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

          {/* Tujuan User */}
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

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Mutasi
          </button>
        </form>

        {/* Right Table Logs & Pagination */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <History className="w-4 h-4 text-blue-600" />
                <span>Riwayat Aktivitas Logistik</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Total Log: {totalItems} Data</span>
            </div>

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
                      <td colSpan={5} className="py-8 text-center text-slate-400">Belum ada data mutasi terrekam.</td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-500 font-medium">{log.tanggal}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800">{log.nama_barang}</p>
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

          {/* Pagination Component */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
              <p className="text-xs text-slate-500">
                Halaman <span className="font-bold text-slate-800">{currentPage}</span> dari <span className="font-bold text-slate-800">{totalPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
