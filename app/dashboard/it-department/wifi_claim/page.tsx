'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { 
  Wifi, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Copy, 
  Check, 
  Sparkles,
  Zap,
  MapPin,
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

  // EFEK GELEMBUNG UDARA & PARTIKEL PERAYAN (AIR BUBBLES EXPLOSION)
  const triggerAirBubbles = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    for (let i = 0; i < 60; i++) {
      bubblesRef.current.push({
        x: width / 2 + (Math.random() - 0.5) * 350,
        y: height / 2 + 100 + Math.random() * 100,
        radius: Math.random() * 10 + 3,
        speedY: Math.random() * 3 + 1.5,
        speedX: (Math.random() - 0.5) * 1.5,
        alpha: Math.random() * 0.7 + 0.3,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.05 + 0.02
      });
    }
  };

  // EFEK JARING-JARING SIMPUL BLUE + DOODLE & PARTIKEL BERJALAN
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

    // Partikel Jaring-jaring
    const particleCount = Math.min(Math.floor((width * height) / 9000), 85);
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

    // Moving Background Doodles (Float Elements)
    const doodlesCount = 15;
    const doodles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      rotation: number;
      rotSpeed: number;
      opacity: number;
      type: number;
    }> = [];

    for (let d = 0; d < doodlesCount; d++) {
      doodles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 16 + 12,
        speedY: Math.random() * 0.4 + 0.2,
        speedX: (Math.random() - 0.5) * 0.3,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.02,
        opacity: Math.random() * 0.25 + 0.1,
        type: Math.floor(Math.random() * 3) // 0: Wifi Ring, 1: Plus/Cross, 2: Glowing Node
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Render Floating Moving Doodles di Background
      for (let i = 0; i < doodles.length; i++) {
        const d = doodles[i];
        d.y -= d.speedY;
        d.x += d.speedX;
        d.rotation += d.rotSpeed;

        if (d.y < -40) {
          d.y = height + 40;
          d.x = Math.random() * width;
        }
        if (d.x < -40) d.x = width + 40;
        if (d.x > width + 40) d.x = -40;

        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rotation);
        ctx.strokeStyle = `rgba(37, 99, 235, ${d.opacity})`;
        ctx.fillStyle = `rgba(59, 130, 246, ${d.opacity})`;
        ctx.lineWidth = 1.5;

        if (d.type === 0) {
          // Wifi Wave Icon Doodle
          ctx.beginPath();
          ctx.arc(0, 0, d.size * 0.8, Math.PI * 1.25, Math.PI * 1.75);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, 0, d.size * 0.4, Math.PI * 1.25, Math.PI * 1.75);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(0, d.size * 0.2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (d.type === 1) {
          // Plus Signal Node Doodle
          const s = d.size * 0.4;
          ctx.beginPath();
          ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
          ctx.moveTo(0, -s); ctx.lineTo(0, s);
          ctx.stroke();
        } else {
          // Circle Ring Doodle
          ctx.beginPath();
          ctx.arc(0, 0, d.size * 0.35, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Render Jaring-jaring Simpul Biru (Network Mesh)
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
          p.x += dirX * force * 2.5;
          p.y += dirY * force * 2.5;
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
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // 3. Render Gelembung Udara Melayang (Air Bubbles)
      for (let b = bubblesRef.current.length - 1; b >= 0; b--) {
        const bubble = bubblesRef.current[b];
        bubble.y -= bubble.speedY;
        bubble.wobble += bubble.wobbleSpeed;
        bubble.x += Math.sin(bubble.wobble) * bubble.speedX;
        bubble.alpha -= 0.0035;

        if (bubble.y < -20 || bubble.alpha <= 0) {
          bubblesRef.current.splice(b, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);

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

        ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.alpha * 0.8})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
          bubble.x - bubble.radius * 0.4,
          bubble.y - bubble.radius * 0.4,
          bubble.radius * 0.25,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${bubble.alpha * 0.95})`;
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

  // Handle Claim (Logika Asli)
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
        message: `Selamat Bekerja! 🎉`,
        voucherData: { ...voucher, status: 'lock' }
      });

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
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-gradient-to-br from-[#e0eeff] via-[#edf5ff] to-[#d8e9fd] text-slate-800 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-center p-4 lg:p-10 font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* CANVAS BACKGROUND */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {/* WATERMARK EMBLEM BACKGROUND (KEMASAN CIPTA / YOUR PARTNER) */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.06] select-none">
        <div className="text-center font-black text-slate-900 tracking-tighter">
          <span className="text-[14vw] block leading-none">KCS</span>
          <span className="text-[2.8vw] tracking-[0.35em] font-extrabold text-slate-800 block mt-2">YOUR PARTNER</span>
        </div>
      </div>

      {/* CARD UTAMA */}
      <div className="w-full max-w-[430px] bg-white/80 backdrop-blur-2xl border border-white/90 rounded-[36px] shadow-[0_25px_65px_rgba(37,99,235,0.14)] p-7 md:p-8 relative z-10 space-y-6 transition-all duration-300">
        
        {/* LOGO ICON & TITLE HEADER */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white transform hover:scale-105 transition-transform duration-300">
            <Wifi className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">KEMASAN CIPTA</h1>
            <p className="text-[10px] font-extrabold tracking-[0.2em] text-blue-600 uppercase">WI-FI ACCESS PORTAL</p>
          </div>
        </div>

        {/* CLAIM FORM */}
        <form onSubmit={handleClaim} className="space-y-3.5">
          <div>
            <input 
              type="text" 
              value={namaSearch}
              onChange={(e) => setNamaSearch(e.target.value)}
              placeholder="Input Your Name..."
              className="w-full px-5 py-3.5 bg-white/95 border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all duration-200 text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
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

        {/* NOTIFIKASI & RESULT DISPLAY */}
        
        {/* NOT FOUND */}
        {resultMessage.type === 'not_found' && (
          <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 shadow-sm animate-in fade-in duration-200">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
            <span className="text-xs font-semibold">{resultMessage.message}</span>
          </div>
        )}

        {/* CLAIMED / LOCKED */}
        {resultMessage.type === 'claimed' && (
          <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 shadow-sm animate-in fade-in duration-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span className="text-xs font-semibold">{resultMessage.message}</span>
          </div>
        )}

        {/* SUCCESS CARD - MATCHING REFERENCE DESIGN PRECISELY */}
        {resultMessage.type === 'success' && resultMessage.voucherData && (
          <div className="space-y-4 pt-1 animate-in fade-in zoom-in-95 duration-300">
            
            {/* 1. Header Success Pill Badge */}
            <div className="mx-auto w-max px-4 py-1.5 bg-emerald-100/80 border border-emerald-300/80 rounded-full flex items-center gap-2 text-emerald-800 text-[11px] font-extrabold tracking-wide uppercase shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Voucher Baru Berhasil Di-Claim!</span>
            </div>

            {/* 2. Welcome Greeting */}
            <div className="text-center space-y-0.5">
              <p className="text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5">
                Selamat Bekerja! 🎉
              </p>
              <h2 className="text-xl font-black text-blue-600 tracking-tight uppercase">
                {resultMessage.voucherData.nama_pemilik}
              </h2>
            </div>

            {/* 3. Main Token Banner Card */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white p-6 rounded-[28px] shadow-xl shadow-blue-500/25 text-center space-y-1 relative overflow-hidden border border-blue-400/30">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-100/90 block">
                YOUR WI-FI TOKEN
              </span>
              <div className="text-3xl font-black tracking-widest text-white drop-shadow-md py-1">
                {resultMessage.voucherData.kode_voucher}
              </div>
            </div>

            {/* 4. Detail Info Grid (Network Speed & Location) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-blue-50/80 border border-blue-200/70 p-3.5 rounded-2xl text-center">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  NETWORK SPEED
                </span>
                <span className="text-xs font-extrabold text-blue-700 block">
                  {resultMessage.voucherData.speed || '15Mbps/15Mbps'}
                </span>
              </div>

              <div className="bg-blue-50/80 border border-blue-200/70 p-3.5 rounded-2xl text-center">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  SCAN LOCATION
                </span>
                <span className="text-xs font-extrabold text-emerald-600 uppercase block">
                  {resultMessage.voucherData.lokasi || 'LANTAI 2'}
                </span>
              </div>
            </div>

            {/* 5. Status Voucher Bar */}
            <div className="bg-blue-50/80 border border-blue-200/70 p-3 rounded-2xl text-center">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
                STATUS VOUCHER
              </span>
              <span className="text-xs font-black text-blue-600 uppercase block">
                AKTIF / {resultMessage.voucherData.status || 'LOCKED'}
              </span>
            </div>

            {/* 6. Copy Token Button */}
            <button
              onClick={() => copyVoucher(resultMessage.voucherData.kode_voucher)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-blue-600/30 transition-all duration-200 text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> TOKEN COPIED!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> COPY TOKEN
                </>
              )}
            </button>

          </div>
        )}

      </div>

      {/* FOOTER LABEL */}
      <div className="relative z-10 mt-6">
        <div className="px-5 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 text-[10px] font-bold text-slate-500 uppercase tracking-widest shadow-sm">
          DEVELOPED BY IT KEMASAN
        </div>
      </div>

    </div>
  );
}
