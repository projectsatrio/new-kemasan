'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Wifi, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  MapPin, 
  Gauge, 
  ShieldAlert, 
  UserCheck 
} from 'lucide-react';

export default function WifiClaimPage() {
  const [namaSearch, setNamaSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: 'success' | 'claimed' | 'not_found' | null;
    message: string;
    voucherData?: any;
  }>({ type: null, message: '' });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // EFEK JARING-JARING INTERAKTIF (PARTICLE CONSTELLATION NETWORK)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const mouse = {
      x: width / 2,
      y: height / 2,
      radius: 170,
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const particleCount = Math.min(Math.floor((width * height) / 9000), 100);
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2 + 1.5,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const force = (mouse.radius - distance) / mouse.radius;
          const dirX = dx / distance;
          const dirY = dy / distance;
          p.x += dirX * force * 3.5;
          p.y += dirY * force * 3.5;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.45)'; 
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distanceP = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);

          if (distanceP < 130) {
            const alpha = (1 - distanceP / 130) * 0.25;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }

        if (distance < mouse.radius) {
          const alpha = (1 - distance / mouse.radius) * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(29, 78, 216, ${alpha})`;
          ctx.lineWidth = 1.3;
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Handle Claim
  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaSearch.trim()) return;

    setLoading(true);
    setResultMessage({ type: null, message: '' });

    try {
      // Cari data nama di Supabase (Case Insensitive)
      const { data, error } = await supabase
        .from('wifi_vouchers')
        .select('*')
        .ilike('nama_pemilik', namaSearch.trim())
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setResultMessage({
          type: 'not_found',
          message: 'Nama tidak terdaftar di Supabase.'
        });
        setLoading(false);
        return;
      }

      const voucher = data[0];

      // Cek Status jika sudah Lock / Digunakan
      if (voucher.status === 'Lock' || voucher.status === 'Digunakan') {
        setResultMessage({
          type: 'claimed',
          message: 'Voucher sudah diclaim, hubungi IT.',
          voucherData: voucher
        });
        setLoading(false);
        return;
      }

      // Jika Open -> Update status jadi Lock
      const { error: updateErr } = await supabase
        .from('wifi_vouchers')
        .update({ status: 'Lock' })
        .eq('id', voucher.id);

      if (updateErr) throw updateErr;

      setResultMessage({
        type: 'success',
        message: `Selamat bekerja ${voucher.nama_pemilik}!`,
        voucherData: { ...voucher, status: 'Lock' }
      });

    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-slate-100 to-sky-100 text-slate-800 relative overflow-hidden flex items-center justify-center p-4 lg:p-10 font-sans">
      
      {/* BACKGROUND CANVAS JARING-JARING */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* LIGHT GLOW EFFECT */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-300/25 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-300/25 rounded-full blur-[140px] pointer-events-none"></div>

      {/* CARD MAIN STANDALONE CONTAINER */}
      <div className="w-full max-w-[560px] bg-white/80 backdrop-blur-xl border border-white rounded-[32px] shadow-2xl p-6 md:p-10 relative z-10 space-y-6">
        
        {/* LOGO & TITLE HEADER */}
        <div className="text-center space-y-3">
          <img 
            src="https://kemasancipta.com/wp-content/uploads/2021/01/WEBSITE-KCS-logo-2025-1024x346.png" 
            alt="PT. KCS Logo" 
            className="h-10 mx-auto object-contain drop-shadow-sm"
          />
          <div>
            <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">IT INFRASTRUCTURE SERVICE</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Klaim Voucher WiFi Kantor</h1>
          </div>
        </div>

        {/* CLAIM FORM */}
        <form onSubmit={handleClaim} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Masukkan Nama Terdaftar
            </label>
            <div className="relative">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                value={namaSearch}
                onChange={(e) => setNamaSearch(e.target.value)}
                placeholder="Ketik Nama Anda (Contoh: Shafiq)"
                className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-600/25 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Memeriksa Data...' : 'Klaim Voucher WiFi'}
          </button>
        </form>

        {/* NOTIFIKASI & HASIL KLAIM */}
        {resultMessage.type === 'not_found' && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 animate-shake">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="text-xs font-bold">{resultMessage.message}</span>
          </div>
        )}

        {resultMessage.type === 'claimed' && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
            <span className="text-xs font-bold">{resultMessage.message}</span>
          </div>
        )}

        {resultMessage.type === 'success' && resultMessage.voucherData && (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-600" />
              <span className="text-sm font-black">{resultMessage.message}</span>
            </div>

            {/* BOX KODE VOUCHER DETAIL */}
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-28 h-28 bg-blue-500/20 rounded-full blur-2xl"></div>

              <div className="text-center space-y-1">
                <span className="text-[10px] uppercase tracking-widest text-blue-300 font-bold">KODE VOUCHER ANDA</span>
                <div className="text-3xl font-black tracking-widest text-yellow-400 font-mono py-1">
                  {resultMessage.voucherData.kode_voucher}
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Gauge className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-[10px] text-slate-400">Kecepatan</p>
                    <p className="font-bold">{resultMessage.voucherData.batasan_kecepatan}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="text-[10px] text-slate-400">Lokasi</p>
                    <p className="font-bold">{resultMessage.voucherData.lokasi}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 border-t border-white/10">
                <span>Status: <strong className="text-rose-400 uppercase">{resultMessage.voucherData.status} (LOCKED)</strong></span>
                <span>Periode: {resultMessage.voucherData.bulan} {resultMessage.voucherData.tahun}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
