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
  UserCheck,
  Sparkles,
  Zap,
  Copy,
  Check
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
  const particlesRef = useRef<any[]>([]);

  // TRIGGER LEDAKAN BALON / CONFETTI
  const triggerBalloonExplosion = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

    for (let i = 0; i < 120; i++) {
      particlesRef.current.push({
        x: width / 2,
        y: height / 2 + 100,
        vx: (Math.random() - 0.5) * 18,
        vy: (Math.random() - 0.8) * 22,
        size: Math.random() * 10 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 10,
        shape: Math.random() > 0.4 ? 'circle' : 'rect',
        gravity: 0.35,
        drag: 0.96
      });
    }
  };

  // EFEK JARING-JARING + ANIMASI BALON LEDAKAN
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

      // 1. Render Jaring-jaring Background
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

      // 2. Render Ledakan Balon / Confetti
      for (let k = particlesRef.current.length - 1; k >= 0; k--) {
        const bp = particlesRef.current[k];
        bp.vx *= bp.drag;
        bp.vy *= bp.drag;
        bp.vy += bp.gravity;
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.rotation += bp.vRot;
        bp.alpha -= 0.008;

        if (bp.alpha <= 0) {
          particlesRef.current.splice(k, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, bp.alpha);
        ctx.translate(bp.x, bp.y);
        ctx.rotate((bp.rotation * Math.PI) / 180);

        ctx.fillStyle = bp.color;
        if (bp.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, bp.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-bp.size / 2, -bp.size / 2, bp.size, bp.size * 0.6);
        }
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

  // Handle Claim (Langsung koneksi Supabase di Client side)
  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const queryName = namaSearch.trim();
    if (!queryName) return;

    setLoading(true);
    setResultMessage({ type: null, message: '' });

    try {
      // Cari data nama di Supabase (Case Insensitive & Substring match)
      const { data, error } = await supabase
        .from('wifi_vouchers')
        .select('*')
        .ilike('nama_pemilik', `%${queryName}%`)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        setResultMessage({
          type: 'not_found',
          message: 'Nama tidak terdaftar di database Supabase.'
        });
        setLoading(false);
        return;
      }

      const voucher = data[0];

      // Cek Status jika sudah Lock / Digunakan
      if (voucher.status === 'Lock' || voucher.status === 'Digunakan') {
        setResultMessage({
          type: 'claimed',
          message: 'Voucher sudah pernah diclaim, silakan hubungi Tim IT jika bermasalah.',
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
        message: `Selamat bekerja, ${voucher.nama_pemilik}!`,
        voucherData: { ...voucher, status: 'Lock' }
      });

      // TRIGGER LEDAKAN BALON SAAT SUKSES
      triggerBalloonExplosion();

    } catch (err: any) {
      alert('Terjadi kesalahan saat memproses data: ' + err.message);
    } font-sans finally {
      setLoading(false);
    }
  };

  const copyVoucher = (code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-slate-950 text-slate-100 overflow-y-auto overflow-x-hidden flex items-center justify-center p-4 lg:p-10 font-sans selection:bg-blue-500 selection:text-white">
      
      {/* BACKGROUND CANVAS JARING-JARING + BALON */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* LIGHT GLOW AMBIENT BACKGROUND */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[160px] pointer-events-none"></div>
      <div className="fixed bottom-10 right-10 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      {/* CARD MAIN STANDALONE CONTAINER */}
      <div className="w-full max-w-[540px] bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-[36px] shadow-[0_25px_70px_rgba(0,0,0,0.6)] p-6 md:p-10 relative z-10 space-y-7 transition-all">
        
        {/* LOGO & TITLE HEADER */}
        <div className="text-center space-y-4">
          <div className="inline-block p-3 rounded-2xl bg-slate-800/60 border border-slate-700/50 shadow-inner">
            <img 
              src="https://kemasancipta.com/wp-content/uploads/2021/01/WEBSITE-KCS-logo-2025-1024x346.png" 
              alt="PT. KCS Logo" 
              className="h-9 mx-auto object-contain brightness-110 drop-shadow-[0_0_12px_rgba(59,130,246,0.3)]"
            />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black tracking-widest text-blue-400 uppercase">
              <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" /> IT Infrastructure Service
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Klaim Voucher WiFi Kantor</h1>
          </div>
        </div>

        {/* CLAIM FORM */}
        <form onSubmit={handleClaim} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Masukkan Nama Terdaftar
            </label>
            <div className="relative group">
              <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="text" 
                value={namaSearch}
                onChange={(e) => setNamaSearch(e.target.value)}
                placeholder="Ketik Nama Anda (Contoh: Shafiq)"
                className="w-full pl-12 pr-4 py-4 bg-slate-950/70 border border-slate-700/80 rounded-2xl text-sm font-semibold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/80 focus:border-blue-500 transition-all shadow-inner"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all duration-300 text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Memeriksa Data...
              </span>
            ) : (
              <>
                <Wifi className="w-4 h-4" /> Klaim Voucher WiFi
              </>
            )}
          </button>
        </form>

        {/* NOTIFIKASI PREMIUM & HASIL KLAIM */}
        
        {/* NOT FOUND ALERT */}
        {resultMessage.type === 'not_found' && (
          <div className="p-4 bg-rose-950/40 border border-rose-500/30 rounded-2xl flex items-center gap-3.5 text-rose-300 shadow-lg backdrop-blur-md">
            <div className="p-2 bg-rose-500/20 rounded-xl border border-rose-500/30">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            </div>
            <span className="text-xs font-semibold leading-relaxed">{resultMessage.message}</span>
          </div>
        )}

        {/* CLAIMED ALERT */}
        {resultMessage.type === 'claimed' && (
          <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl flex items-center gap-3.5 text-amber-300 shadow-lg backdrop-blur-md">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            </div>
            <span className="text-xs font-semibold leading-relaxed">{resultMessage.message}</span>
          </div>
        )}

        {/* SUCCESS NOTIFICATION & KARD VOUCHER PREMIUM */}
        {resultMessage.type === 'success' && resultMessage.voucherData && (
          <div className="space-y-4 pt-1">
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex items-center gap-3.5 text-emerald-300 shadow-lg backdrop-blur-md">
              <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              </div>
              <span className="text-sm font-bold">{resultMessage.message}</span>
            </div>

            {/* BOX KODE VOUCHER DETAIL */}
            <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl border border-blue-500/30 shadow-[0_15px_40px_rgba(0,0,0,0.5)] space-y-5 relative overflow-hidden group">
              <div className="absolute right-0 top-0 translate-x-6 -translate-y-6 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all duration-700"></div>

              <div className="text-center space-y-2 relative z-10">
                <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-blue-300 font-bold bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                  <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> KODE VOUCHER ANDA
                </div>
                
                <div className="flex items-center justify-center gap-3 pt-1">
                  <div className="text-3xl md:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 font-mono py-1 drop-shadow-md">
                    {resultMessage.voucherData.kode_voucher}
                  </div>
                  <button 
                    type="button"
                    onClick={() => copyVoucher(resultMessage.voucherData.kode_voucher)}
                    className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-600/50 transition-colors"
                    title="Salin Kode"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-4 grid grid-cols-2 gap-3 text-xs relative z-10">
                <div className="flex items-center gap-3 text-slate-300 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                  <Gauge className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Kecepatan</p>
                    <p className="font-bold text-slate-100">{resultMessage.voucherData.batasan_kecepatan || '-'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-300 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60">
                  <MapPin className="w-5 h-5 text-blue-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">Lokasi</p>
                    <p className="font-bold text-slate-100">{resultMessage.voucherData.lokasi || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 text-[10px] text-slate-400 border-t border-slate-800/80 relative z-10">
                <span>Status: <strong className="text-rose-400 uppercase font-black">{resultMessage.voucherData.status} (LOCKED)</strong></span>
                <span>Periode: {resultMessage.voucherData.bulan} {resultMessage.voucherData.tahun}</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
