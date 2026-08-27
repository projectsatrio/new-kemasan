'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Wifi, 
  Upload, 
  Plus, 
  Search, 
  RefreshCw, 
  FileDown, 
  Lock, 
  Unlock, 
  Trash2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface WifiVoucher {
  id?: string;
  kode_voucher: string;
  nama_pemilik: string;
  lokasi: string;
  batasan_kecepatan: string;
  status: 'Open' | 'Lock' | 'Digunakan' | 'Tidak digunakan';
  bulan: string;
  tahun: string;
}

export default function WifiVoucherPage() {
  const [vouchers, setVouchers] = useState<WifiVoucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBulan, setSelectedBulan] = useState<string>('Semua');
  const [selectedTahun, setSelectedTahun] = useState<string>('2026');

  // Form Manual Input
  const [kodeVoucher, setKodeVoucher] = useState('');
  const [namaPemilik, setNamaPemilik] = useState('');
  const [lokasi, setLokasi] = useState('');
  const [kecepatan, setKecepatan] = useState('15Mbps/15Mbps');
  const [statusInput, setStatusInput] = useState<'Open' | 'Lock'>('Open');
  const [bulanInput, setBulanInput] = useState('Agustus');
  const [tahunInput, setTahunInput] = useState('2026');

  const bulanList = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('wifi_vouchers').select('*').order('created_at', { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      setVouchers(data || []);
    } catch (err: any) {
      console.error('Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // Manual Add
  const handleAddManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kodeVoucher || !namaPemilik) return alert('Kode Voucher & Nama Wajib diisi!');

    try {
      const { error } = await supabase.from('wifi_vouchers').insert([
        {
          kode_voucher: kodeVoucher,
          nama_pemilik: namaPemilik,
          lokasi: lokasi || 'Pabrik',
          batasan_kecepatan: kecepatan,
          status: statusInput,
          bulan: bulanInput,
          tahun: tahunInput
        }
      ]);

      if (error) throw error;
      alert('Voucher berhasil ditambahkan!');
      setKodeVoucher('');
      setNamaPemilik('');
      fetchVouchers();
    } catch (err: any) {
      alert('Gagal menambah data: ' + err.message);
    }
  };

  // Upload Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const dataJson: any[] = XLSX.utils.sheet_to_json(ws);

        const formattedData = dataJson.map((item) => ({
          kode_voucher: String(item['Kode voucher'] || item['kode_voucher'] || ''),
          nama_pemilik: String(item['Nama depan'] || item['nama_pemilik'] || 'Tanpa Nama').trim(),
          lokasi: String(item['Lokasi'] || item['lokasi'] || 'Pasuruan Plant'),
          batasan_kecepatan: String(item['Batasan Unggah/Unduh'] || item['batasan_kecepatan'] || '15Mbps/15Mbps'),
          status: item['Status'] === 'Tidak digunakan' ? 'Open' : (item['status'] || 'Open'),
          bulan: bulanInput,
          tahun: tahunInput
        })).filter(v => v.kode_voucher !== '');

        if (formattedData.length === 0) {
          return alert('Format Kolom Excel tidak sesuai atau data kosong!');
        }

        const { error } = await supabase.from('wifi_vouchers').insert(formattedData);
        if (error) throw error;

        alert(`Berhasil mengimpor ${formattedData.length} data voucher!`);
        fetchVouchers();
      } catch (err: any) {
        alert('Gagal impor Excel: ' + err.message);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Toggle Status (Lock/Open)
  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = (currentStatus === 'Open' || currentStatus === 'Tidak digunakan') ? 'Lock' : 'Open';
    try {
      const { error } = await supabase
        .from('wifi_vouchers')
        .update({ status: nextStatus })
        .eq('id', id);

      if (error) throw error;
      setVouchers(prev => prev.map(item => item.id === id ? { ...item, status: nextStatus } : item));
    } catch (err: any) {
      alert('Gagal mengubah status: ' + err.message);
    }
  };

  // Delete Item
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus voucher ini?')) return;
    try {
      const { error } = await supabase.from('wifi_vouchers').delete().eq('id', id);
      if (error) throw error;
      setVouchers(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`LAPORAN VOUCHER WIFI IT DEPARTMENT - ${selectedBulan.toUpperCase()} ${selectedTahun}`, 14, 15);
    
    const tableColumn = ["No", "Kode Voucher", "Nama Pemilik", "Lokasi", "Kecepatan", "Status", "Periode"];
    const tableRows = filteredVouchers.map((item, index) => [
      index + 1,
      item.kode_voucher,
      item.nama_pemilik,
      item.lokasi,
      item.batasan_kecepatan,
      item.status,
      `${item.bulan} ${item.tahun}`
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 22,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`Voucher_WiFi_${selectedBulan}_${selectedTahun}.pdf`);
  };

  // Filtering
  const filteredVouchers = vouchers.filter((v) => {
    const matchSearch = v.nama_pemilik.toLowerCase().includes(search.toLowerCase()) || 
                        v.kode_voucher.toLowerCase().includes(search.toLowerCase());
    const matchBulan = selectedBulan === 'Semua' || v.bulan === selectedBulan;
    const matchTahun = selectedTahun === 'Semua' || v.tahun === selectedTahun;
    return matchSearch && matchBulan && matchTahun;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Voucher WiFi Management</h1>
            <p className="text-xs text-slate-500 font-medium">PT. Kemasan Ciptatama Sempurna - IT Department</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchVouchers}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>

          <button 
            onClick={exportPDF}
            className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 text-xs font-bold"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Input Section (Manual & Excel Scan) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Input Manual */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" /> Input Voucher Manual
          </h2>
          
          <form onSubmit={handleAddManual} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600">Kode Voucher</label>
              <input 
                type="text" 
                value={kodeVoucher} 
                onChange={(e) => setKodeVoucher(e.target.value)} 
                placeholder="Contoh: gmjgvu"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                required 
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600">Nama Pemilik</label>
              <input 
                type="text" 
                value={namaPemilik} 
                onChange={(e) => setNamaPemilik(e.target.value)} 
                placeholder="Contoh: Shafiq"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Lokasi</label>
                <input 
                  type="text" 
                  value={lokasi} 
                  onChange={(e) => setLokasi(e.target.value)} 
                  placeholder="Ekspedisi"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Batasan Kecepatan</label>
                <input 
                  type="text" 
                  value={kecepatan} 
                  onChange={(e) => setKecepatan(e.target.value)} 
                  placeholder="15Mbps/15Mbps"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-600">Bulan Target</label>
                <select 
                  value={bulanInput} 
                  onChange={(e) => setBulanInput(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                >
                  {bulanList.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600">Tahun Target</label>
                <input 
                  type="text" 
                  value={tahunInput} 
                  onChange={(e) => setTahunInput(e.target.value)} 
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none mt-1"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              Simpan Voucher
            </button>
          </form>
        </div>

        {/* Scan & Import Excel */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Upload className="w-4 h-4 text-emerald-600" /> Import File Excel
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Upload file data voucher (format <code>.xlsx</code> / <code>.xls</code>). Kolom yang dibaca otomatis: <br />
              <span className="font-semibold text-slate-700">Kode voucher, Nama depan, Lokasi, Batasan Unggah/Unduh, Status</span>.
            </p>
          </div>

          <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-400 rounded-2xl p-6 text-center transition-all relative">
            <input 
              type="file" 
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
            />
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="w-8 h-8 text-slate-400" />
              <p className="text-xs font-bold text-slate-700">Klik di sini untuk upload atau drag file Excel</p>
              <span className="text-[10px] text-slate-400">Target Periode: {bulanInput} {tahunInput}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Filter & Table Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Nama / Kode Voucher..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select 
              value={selectedBulan} 
              onChange={(e) => setSelectedBulan(e.target.value)}
              className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Semua">Semua Bulan</option>
              {bulanList.map(b => <option key={b} value={b}>{b}</option>)}
            </select>

            <select 
              value={selectedTahun} 
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="p-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Semua">Semua Tahun</option>
              <option value="2025">2025</option>
              <option value="2026">2026</option>
              <option value="2027">2027</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                <th className="p-3">No</th>
                <th className="p-3">Kode Voucher</th>
                <th className="p-3">Nama Pemilik</th>
                <th className="p-3">Lokasi</th>
                <th className="p-3">Kecepatan</th>
                <th className="p-3">Periode</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Aksi (Edit Status)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 font-medium">
                    {loading ? 'Memuat data...' : 'Tidak ada voucher ditemukan.'}
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((item, idx) => {
                  const isLocked = item.status === 'Lock' || item.status === 'Digunakan';
                  return (
                    <tr key={item.id || idx} className="hover:bg-blue-50/40 transition-colors">
                      <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-blue-600">{item.kode_voucher}</td>
                      <td className="p-3 font-semibold text-slate-800">{item.nama_pemilik}</td>
                      <td className="p-3 text-slate-600">{item.lokasi}</td>
                      <td className="p-3 text-slate-600">{item.batasan_kecepatan}</td>
                      <td className="p-3 text-slate-500">{item.bulan} {item.tahun}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          isLocked 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => toggleStatus(item.id!, item.status)}
                            className={`p-1.5 rounded-lg border transition-all text-[11px] font-bold flex items-center gap-1 ${
                              isLocked 
                                ? 'bg-white border-slate-200 text-emerald-600 hover:bg-emerald-50' 
                                : 'bg-white border-slate-200 text-rose-600 hover:bg-rose-50'
                            }`}
                            title="Toggle Lock/Open"
                          >
                            {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            {isLocked ? 'Set Open' : 'Set Lock'}
                          </button>
                          
                          <button 
                            onClick={() => handleDelete(item.id!)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
