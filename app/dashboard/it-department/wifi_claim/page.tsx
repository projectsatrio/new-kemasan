'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Gauge, 
  ShieldAlert, 
  UserCheck,
  User,
  Copy,
  Check,
  Lock
} from 'lucide-react';

export default function WifiClaimPage() {
  const [namaSearch, setNamaSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resultMessage, setResultMessage] = useState<{
    type: 'success' | 'claimed' | 'not_found' | null;
    message: string;
    voucherData?: any;
  }>({ type: null, message: '' });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubblesRef = useRef<any[]>([]);

  // EFEK GELEMBUNG UDARA (AIR BUBBLES EXPLOSION)
  const triggerAirBubbles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    // Buat 50-70 gelembung udara naik ke atas
    for (let i = 0; i < 60; i++) {
      bubblesRef.current.push({
        x: width / 2 + (Math.random() - 0.5) * 350,
        y: height / 2 + 100 + Math.random() * 100,
        radius: Math.random() * 12 + 4,
        speedY: Math.random() * 3 + 1.5,
        speedX: (Math.random() - 0.5) * 1.2,
        alpha: Math.random() * 0.6 + 0.3,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.05 + 0.02
      });
    }
  };

  // EFEK JARING-JARING SIMPUL BLUE + GELEMBUNG UDARA
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

    const particleCount = Math.min(Math.floor((width * height) / 9000), 90);
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
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        radius: Math.random() * 2 + 1.5,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Render Jaring-jaring Simpul Biru (Sesuai Referensi Gambar)
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
          p.x += dirX * force * 3;
          p.y += dirY * force * 3;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.5)';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const distanceP = Math.sqrt((p.x - p2.x) ** 2 + (p.y - p2.y) ** 2);

          if (distanceP < 130) {
            const alpha = (1 - distanceP / 130) * 0.3;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 2. Render Animasi Gelembung Udara Melayang (Air Bubbles)
      for (let b = bubblesRef.current.length - 1; b >= 0; b--) {
        const bubble = bubblesRef.current[b];
        bubble.y -= bubble.speedY;
        bubble.wobble += bubble.wobbleSpeed;
        bubble.x += Math.sin(bubble.wobble) * bubble.speedX;
        bubble.alpha -= 0.003;

        if (bubble.y < -20 || bubble.alpha <= 0) {
          bubblesRef.current.splice(b, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        
        // Buat gradasi kilauan gelembung udara transparan
        const gradient = ctx.createRadialGradient(
          bubble.x - bubble.radius * 0.3,
          bubble.y - bubble.radius * 0.3,
          bubble.radius * 0.1,
          bubble.x,
          bubble.y,
          bubble.radius
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${bubble.alpha + 0.2})`);
        gradient.addColorStop(0.6, `rgba(147, 197, 253, ${bubble.alpha * 0.4})`);
        gradient.addColorStop(1, `rgba(59, 130, 246, ${bubble.alpha * 0.6})`);

        ctx.fillStyle = gradient;
        ctx.fill();

        // Border kilap gelembung
        ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.alpha * 0.7})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Highlight pantulan cahaya kecil di gelembung
        ctx.beginPath();
        ctx.arc(
          bubble.x - bubble.radius * 0.4,
          bubble.y - bubble.radius * 0.4,
          bubble.radius * 0.25,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${bubble.alpha * 0.9})`;
        ctx.fill();

        ctx.restore();
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

      if (voucher.status === 'Lock' || voucher.status === 'Digunakan' || voucher.status === 'lock') {
        setResultMessage({
          type: 'claimed',
          message: 'Voucher sudah diclaim, hubungi IT.',
          voucherData: voucher
        });
        setLoading(false);
        return;
      }

      const { error: updateErr } = await supabase
        .from('wifi_vouchers')
        .update({ status: 'lock' })
        .eq('id', voucher.id);

      if (updateErr) throw updateErr;

      setResultMessage({
        type: 'success',
        message: `Selamat bekerja ${voucher.nama_pemilik}!`,
        voucherData: { ...voucher, status: 'lock' }
      });

      // PANGGUL EFEK GELEMBUNG UDARA SAAT BERHASIL
      triggerAirBubbles();

    } catch (err: any) {
      alert('Terjadi kesalahan: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyVoucher = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-gradient-to-br from-[#dcebfa] via-[#eaf3fc] to-[#d5e7f9] text-slate-800 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center p-4 lg:p-10 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* CANVAS BACKGROUND */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* WATERMARK EMBLEM BACKGROUND (KEMASAN CIPTA / YOUR PARTNER) */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.07] select-none">
        <div className="text-center font-black text-slate-900 tracking-tighter">
          <span className="text-[14vw] block leading-none">KCS</span>
          <span className="text-[3vw] tracking-[0.3em] font-extrabold text-slate-700 block mt-2">YOUR PARTNER</span>
        </div>
      </div>

      {/* CARD UTAMA (GLASSMORPHISM PRESISI GAMBAR REFERENSI) */}
      <div className="w-full max-w-[420px] bg-white/75 backdrop-blur-2xl border border-white/90 rounded-[32px] shadow-[0_20px_60px_rgba(37,99,235,0.12)] p-8 relative z-10 space-y-6 transition-all duration-300">
        
        {/* LOGO ICON & TITLE HEADER */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
            <Wifi className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">KEMASAN CIPTA</h1>
            <p className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">WI-FI ACCESS PORTAL</p>
          </div>
        </div>

        {/* CLAIM FORM */}
        <form onSubmit={handleClaim} className="space-y-4">
          <div>
            <input 
              type="text" 
              value={namaSearch}
              onChange={(e) => setNamaSearch(e.target.value)}
              placeholder="Input Your Name..."
              className="w-full px-5 py-3.5 bg-white/90 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all duration-200 text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              <>
                <Wifi className="w-4 h-4" /> CLAIM VOUCHER
              </>
            )}
          </button>
        </form>

        {/* NOTIFIKASI & KARTU DETAIL HASIL CLAIM */}
        
        {/* NOT FOUND */}
        {resultMessage.type === 'not_found' && (
          <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 shadow-sm">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="text-xs font-semibold">{resultMessage.message}</span>
          </div>
        )}

        {/* CLAIMED / LOCKED */}
        {resultMessage.type === 'claimed' && (
          <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold">{resultMessage.message}</span>
          </div>
        )}

        {/* SUCCESS (TAMPILKAN DETAIL lengkap KODE VOUCHER, STATUS, NAMA PEMILIK, LOKASI, SPEED) */}
        {resultMessage.type === 'success' && resultMessage.voucherData && (
          <div className="space-y-4 pt-1 animate-in fade-in zoom-in-95 duration-300">
            <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{resultMessage.message}</span>
            </div>

            {/* CARD VOUCHER DETAIL */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-5 rounded-2xl shadow-xl space-y-4 border border-blue-500/20 relative overflow-hidden">
              
              {/* HEADER VOUCHER */}
              <div className="text-center space-y-1">
                <span className="text-[9px] uppercase tracking-widest text-blue-300 font-bold">KODE VOUCHER ANDA</span>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black tracking-widest text-yellow-400 font-mono">
                    {resultMessage.voucherData.kode_voucher}
                  </span>
                  <button 
                    onClick={() => copyVoucher(resultMessage.voucherData.kode_voucher)}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg transition-colors"
                    title="Copy Kode"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Rincian Detail Data */}
              <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
                
                {/* NAMA PEMILIK */}
                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Nama Pemilik</span>
                  </div>
                  <strong className="text-white font-semibold">{resultMessage.voucherData.nama_pemilik}</strong>
                </div>

                {/* SPEED / KECEPATAN */}
                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-3.5 h-3.5 text-blue-400" />
                    <span>Kecepatan</span>
                  </div>
                  <strong className="text-white font-semibold">{resultMessage.voucherData.speed || '15Mbps/15Mbps'}</strong>
                </div>

                {/* LOKASI */}
                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    <span>Lokasi</span>
                  </div>
                  <strong className="text-white font-semibold">{resultMessage.voucherData.lokasi || '-'}</strong>
                </div>

                {/* STATUS */}
                <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    <span>Status</span>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded text-[10px] font-black uppercase">
                    {resultMessage.voucherData.status}
                  </span>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>

      {/* FOOTER LABEL */}
      <div className="relative z-10 mt-6">
        <div className="px-5 py-1.5 rounded-full bg-white/60 border border-white/80 text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
          DEVELOPED BY IT KEMASAN
        </div>
      </div>

    </div>
  );
}
