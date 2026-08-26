'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  ShieldCheck, 
  Box, 
  Layers, 
  Scissors, 
  Package, 
  Sparkles,
  Award,
  Clock,
  Leaf
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // EFEK JARING-JARING INTERAKTIF (PARTICLE CONSTELLATION NETWORK FOR LIGHT BACKGROUND)
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
      radius: 170, // Jarak jaring mengikuti mouse
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

        // Hitung Jarak ke Mouse (Interaksi Tarik Jaring)
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

        // Gambar Dot Partikel Biru Soft
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37, 99, 235, 0.45)'; 
        ctx.fill();

        // Hubungkan Garis Jaring Antar Partikel Dekat
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

        // Hubungkan Garis Jaring Langsung ke Mouse Kursor
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.refresh();
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan atau sistem.');
      setLoading(false);
    }
  };

  const productCategories = [
    { icon: Box, name: 'Styrofoam' },
    { icon: Layers, name: 'PE Foam' },
    { icon: Scissors, name: 'Sendok Plastik' },
    { icon: Package, name: 'Thinwall' },
    { icon: Box, name: 'Bubble Wrap' },
    { icon: Package, name: 'Lunchbox Plastik' },
    { icon: Box, name: 'Toples Plastik' },
    { icon: Sparkles, name: 'Custom Moulding' },
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-sky-100/70 to-blue-100 text-slate-800 relative overflow-hidden flex items-center justify-center p-4 md:p-8 font-sans">
      
      {/* BACKGROUND INTERACTIVE CANVAS (JARING-JARING INTERAKTIF) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* AMBIENT LIGHT GLOWS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-300/30 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-sky-300/30 rounded-full blur-[140px] pointer-events-none"></div>

      {/* MAIN CONTAINER SPLIT SCREEN */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        
        {/* LEFT COLUMN: BRANDING & PRODUCT HIGHLIGHTS */}
        <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-6">
          
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 font-extrabold text-xl">
              KCS
            </div>
            <div>
              <h2 className="text-xl font-black text-blue-900 tracking-tight leading-none">
                KCS
              </h2>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                Your Packaging Partner
              </p>
            </div>
          </div>

          {/* Hero Typography */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              PT. KEMASAN CIPTATAMA SEMPURNA
            </p>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Inovasi Kemasan, <br />
              <span className="text-blue-600">Kualitas Terpercaya,</span> <br />
              Solusi untuk Masa Depan.
            </h1>
            <p className="text-sm text-slate-600 max-w-lg leading-relaxed font-medium">
              Kami menyediakan berbagai produk kemasan berkualitas tinggi dengan inovasi berkelanjutan untuk mendukung kebutuhan industri dan bisnis Anda.
            </p>
          </div>

          {/* Grid Kategori Produk */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {productCategories.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={idx}
                  className="p-3 bg-white/70 backdrop-blur-md border border-white/80 rounded-xl shadow-sm flex items-center gap-2.5 hover:shadow-md hover:bg-white transition-all group cursor-default"
                >
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900 transition-colors truncate">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Sustainability Badge */}
          <div className="inline-flex items-center gap-3 p-3 bg-white/60 backdrop-blur-md border border-blue-200/60 rounded-xl shadow-sm">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <Leaf className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Commitment to Sustainability</p>
              <p className="text-[11px] text-slate-500 font-medium">Kemasan Berkualitas, Lingkungan Terjaga.</p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: LOGIN CARD */}
        <div className="lg:col-span-5">
          <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden">
            
            {/* Form Inner Body */}
            <div className="p-8 space-y-6">
              
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Selamat Datang Kembali!
                </h3>
                <div className="w-10 h-1 bg-blue-600 rounded-full mt-2 mb-2"></div>
                <p className="text-xs text-slate-500 font-medium">
                  Masuk untuk melanjutkan ke sistem ERP PT. KCS
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold animate-shake text-center">
                  {error}
                </div>
              )}

              {/* Form Input Login */}
              <form onSubmit={handleLogin} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Masukkan email Anda"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 font-medium transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password Anda"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 font-medium transition-all"
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Lupa password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-500 font-medium">
                  Belum punya akun? <span className="font-bold text-blue-600 hover:underline cursor-pointer">Hubungi Admin IT</span>
                </p>
              </div>

            </div>

            {/* Bottom Card Feature Highlights */}
            <div className="bg-blue-50/80 border-t border-blue-100 p-4 grid grid-cols-4 gap-2 text-center">
              <div className="flex flex-col items-center">
                <Award className="w-4 h-4 text-blue-600 mb-1" />
                <span className="text-[10px] font-bold text-slate-800">Berkualitas</span>
                <span className="text-[9px] text-slate-500 hidden sm:block">Standar tinggi</span>
              </div>
              <div className="flex flex-col items-center">
                <Sparkles className="w-4 h-4 text-blue-600 mb-1" />
                <span className="text-[10px] font-bold text-slate-800">Inovatif</span>
                <span className="text-[9px] text-slate-500 hidden sm:block">Terus berkembang</span>
              </div>
              <div className="flex flex-col items-center">
                <Clock className="w-4 h-4 text-blue-600 mb-1" />
                <span className="text-[10px] font-bold text-slate-800">Tepat Waktu</span>
                <span className="text-[9px] text-slate-500 hidden sm:block">Pengiriman terjamin</span>
              </div>
              <div className="flex flex-col items-center">
                <Leaf className="w-4 h-4 text-blue-600 mb-1" />
                <span className="text-[10px] font-bold text-slate-800">Ramah Lingkungan</span>
                <span className="text-[9px] text-slate-500 hidden sm:block">Peduli masa depan</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
