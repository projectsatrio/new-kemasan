'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import { 
  Wifi, 
  Upload, 
  Plus, 
  RefreshCw, 
  Printer, 
  Search, 
  Lock, 
  Unlock, 
  Loader2, 
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Voucher {
  id?: number;
  kode_voucher: string;
  nama_pemilik: string;
  lokasi: string;
  speed: string;
  status: 'open' | 'lock';
  bulan: number;
  tahun: number;
}

export default function WifiManagementPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter Periode
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  // Form Input Manual
  const [form, setForm] = useState<Voucher>({
    kode_voucher: '',
    nama_pemilik: '',
    lokasi: '',
    speed: '15Mbps/15Mbps',
    status: 'open',
    bulan: currentDate.getMonth() + 1,
    tahun: currentDate.getFullYear()
  });

  const months = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' }
  ];

  // Fetch Data dari Supabase
  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('wifi_vouchers')
        .select('*')
        .eq('bulan', selectedMonth)
        .eq('tahun', selectedYear)
        .order('id', { ascending: false });

      if (error) throw error;
      setVouchers(data || []);
      setCurrentPage(1); // Reset ke halaman 1 saat reload data
    } catch (err: any) {
      alert('Gagal mengambil data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [selectedMonth, selectedYear]);

  // Input Manual Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kode_voucher || !form.nama_pemilik) {
      alert('Kode Voucher & Nama Pemilik wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('wifi_vouchers')
        .insert([{ 
          kode_voucher: form.kode_voucher,
          nama_pemilik: form.nama_pemilik,
          lokasi: form.lokasi,
          speed: form.speed,
          status: form.status,
          bulan: selectedMonth, 
          tahun: selectedYear 
        }]);

      if (error) throw error;
      alert('Voucher berhasil ditambahkan!');
      setForm({
        kode_voucher: '',
        nama_pemilik: '',
        lokasi: '',
        speed: '15Mbps/15Mbps',
        status: 'open',
        bulan: selectedMonth,
        tahun: selectedYear
      });
      fetchVouchers();
    } catch (err: any) {
      alert('Gagal menambahkan voucher: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import / Scan File CSV / Text Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const content = evt.target?.result as string;
        const lines = content.split('\n');

        if (lines.length < 2) {
          alert('File kosong atau format salah.');
          setLoading(false);
          return;
        }

        // Header parsing
        const headers = lines[0].split(/,|\t/).map(h => h.trim().replace(/^"|"$/g, ''));
        const kodeIdx = headers.findIndex(h => /kode voucher/i.test(h));
        const namaIdx = headers.findIndex(h => /nama depan|nama/i.test(h));
        const lokasiIdx = headers.findIndex(h => /lokasi/i.test(h));
        const speedIdx = headers.findIndex(h => /batasan/i.test(h));

        const formattedData: Voucher[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          const cols = lines[i].split(/,|\t/).map(c => c.trim().replace(/^"|"$/g, ''));
          
          const kode = kodeIdx !== -1 ? cols[kodeIdx] : cols[0];
          const nama = namaIdx !== -1 ? cols[namaIdx] : cols[4];
          const lokasi = lokasiIdx !== -1 ? cols[lokasiIdx] : (cols[5] || '-');
          const speedVal = speedIdx !== -1 ? cols[speedIdx] : (cols[13] || '15Mbps/15Mbps');

          if (kode && nama) {
            formattedData.push({
              kode_voucher: kode,
              nama_pemilik: nama,
              lokasi: lokasi || '-',
              speed: speedVal || '15Mbps/15Mbps',
              status: 'open',
              bulan: selectedMonth,
              tahun: selectedYear
            });
          }
        }

        if (formattedData.length === 0) {
          alert('Format baris tidak valid.');
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from('wifi_vouchers')
          .upsert(formattedData, { onConflict: 'kode_voucher' });

        if (error) throw error;

        alert(`Berhasil mengimpor ${formattedData.length} data voucher!`);
        fetchVouchers();
      } catch (err: any) {
        alert('Gagal mengimpor file: ' + err.message);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Toggle Edit Status (Lock / Open)
  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'lock' : 'open';
    try {
      const { error } = await supabase
        .from('wifi_vouchers')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setVouchers(prev => prev.map(item => item.id === id ? { ...item, status: newStatus as any } : item));
    } catch (err: any) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  // Print & Export PDF Bawaan Browser
  const handlePrint = () => {
    window.print();
  };

  // Live Filter/Search Data
  const filteredVouchers = vouchers.filter(v => 
    v.nama_pemilik.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.kode_voucher.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.lokasi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedVouchers = filteredVouchers.slice(startIndex, startIndex + itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">WiFi Voucher Management</h1>
            <p className="text-xs text-slate-500">Kelola & Scan Voucher WiFi per Periode</p>
          </div>
        </div>

        {/* PERIODE BULAN & TAHUN */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <Filter className="w-4 h-4 text-slate-400 ml-2" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none pr-2 cursor-pointer"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none pr-2 cursor-pointer"
            >
              {[2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchVouchers}
            className="p-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all"
            title="Reload Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* INPUT SECTION (INPUT MANUAL & SCAN EXCEL/CSV) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:hidden">
        
        {/* Form Input Manual */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> Input Manual Voucher
          </h2>
          <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase">Kode Voucher *</label>
              <input 
                type="text"
                placeholder="misal: gmjgvu"
                value={form.kode_voucher}
                onChange={e => setForm({...form, kode_voucher: e.target.value})}
                className="w-full mt-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase">Nama Pemilik *</label>
              <input 
                type="text"
                placeholder="misal: Shafiq"
                value={form.nama_pemilik}
                onChange={e => setForm({...form, nama_pemilik: e.target.value})}
                className="w-full mt-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase">Lokasi</label>
              <input 
                type="text"
                placeholder="misal: Ekspedisi / Pasuruan Plant"
                value={form.lokasi}
                onChange={e => setForm({...form, lokasi: e.target.value})}
                className="w-full mt-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase">Batasan Unggah/Unduh</label>
              <input 
                type="text"
                placeholder="15Mbps/15Mbps"
                value={form.speed}
                onChange={e => setForm({...form, speed: e.target.value})}
                className="w-full mt-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
              >
                Simpan Voucher
              </button>
            </div>
          </form>
        </div>

        {/* Box Upload / Scan CSV / Excel */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 p-6 rounded-2xl border border-blue-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm mb-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <span>Scan & Import CSV / Excel</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Upload file CSV atau simpanan Excel untuk mengimpor massal data voucher WiFi. 
            </p>
          </div>
          
          <label className="w-full py-3 bg-white hover:bg-slate-50 border border-blue-200 rounded-xl text-center text-xs font-bold text-blue-700 cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            <span>Pilih File CSV / Excel</span>
            <input 
              type="file" 
              accept=".csv, .txt, .tsv"
              onChange={handleFileUpload} 
              className="hidden" 
            />
          </label>
        </div>

      </div>

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        
        {/* Table Filter Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari Nama / Kode / Lokasi..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Export PDF</span>
          </button>
        </div>

        {/* Header Khusus Saat Print PDF */}
        <div className="hidden print:block p-6">
          <h1 className="text-xl font-bold">LAPORAN VOUCHER WIFI PT. KCS</h1>
          <p className="text-xs">Periode: {selectedMonth}/{selectedYear}</p>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100">
              <tr>
                <th className="p-4">Kode Voucher</th>
                <th className="p-4">Nama Pemilik</th>
                <th className="p-4">Lokasi</th>
                <th className="p-4">Batasan Kecepatan</th>
                <th className="p-4">Periode</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center print:hidden">Aksi Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data voucher...
                  </td>
                </tr>
              ) : paginatedVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    Tidak ada data voucher ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-blue-600">{v.kode_voucher}</td>
                    <td className="p-4 font-bold text-slate-900">{v.nama_pemilik}</td>
                    <td className="p-4 font-medium text-slate-600">{v.lokasi || '-'}</td>
                    <td className="p-4 font-medium text-slate-600">{v.speed || '-'}</td>
                    <td className="p-4 font-medium text-slate-500">{v.bulan}/{v.tahun}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        v.status === 'open' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="p-4 text-center print:hidden">
                      <button
                        onClick={() => toggleStatus(v.id!, v.status)}
                        className={`p-2 rounded-lg text-xs font-bold transition-all ${
                          v.status === 'open'
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                        title={v.status === 'open' ? 'Kunci Voucher' : 'Buka Kunci Voucher'}
                      >
                        {v.status === 'open' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION CONTROLS */}
        {!loading && filteredVouchers.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 print:hidden">
            <div>
              Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{Math.min(startIndex + itemsPerPage, filteredVouchers.length)}</span> dari <span className="font-bold text-slate-800">{filteredVouchers.length}</span> voucher
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
