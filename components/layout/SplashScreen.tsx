'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Zap, TrendingUp, Activity, Sparkles } from 'lucide-react';

export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [statusText, setStatusText] = useState('Initializing Protocol...');

  useEffect(() => {
    setMounted(true);
    // Hide splash screen after 5.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5500);

    const statuses = [
      'Establishing CLOB Pipeline...',
      'Syncing 1,438 Active Markets...',
      'Syncing Gamma Liquidity...',
      'Bootstrapping Solana Core...',
      'Optimizing Research Agents...',
      'Neural Engine: Online',
      'Protocol Ready'
    ];

    // Progress and status animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (Math.random() > 0.8 ? 2 : 1);
        if (next >= 100) {
          clearInterval(progressInterval);
          return 100;
        }

        // Update status text based on progress
        const statusIdx = Math.floor((next / 100) * statuses.length);
        if (statuses[statusIdx]) {
          setStatusText(statuses[statusIdx]);
        }

        return next;
      });
    }, 45);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <AnimatePresence initial={false}>
      {isVisible && (
        <motion.div
          initial={false}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'circOut' }}
          className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-black"
          style={{ zIndex: 99999 }}
        >
          {/* Deep Black Background with Radial Blue Glow */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-black" />
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.12)_0%,transparent_70%)]"
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>

          {/* Minimal Grid Layer */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px]" />
          </div>

          {/* Drifting Stars/Particles */}
          <div className="absolute inset-0 overflow-hidden">
            {mounted && [...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-px h-px bg-white rounded-full"
                initial={{
                  x: Math.random() * 2000,
                  y: Math.random() * 1200,
                  opacity: 0,
                }}
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [0, 1.5, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 4,
                  repeat: Infinity,
                  delay: Math.random() * 3,
                }}
              />
            ))}
          </div>

          {/* Main Content */}
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.8 }}
            className="relative flex flex-col items-center gap-10 z-10"
          >
            {/* Logo Section */}
            <div className="relative group">
              {/* Outer Pulsing Glow */}
              <motion.div
                className="absolute inset-0 -m-12 rounded-full bg-bullish/10 blur-[100px] -z-10"
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 4, repeat: Infinity }}
              />

              {/* Central Logo */}
              <motion.div
                className="relative w-24 h-24 bg-gradient-to-br from-bullish via-bullish-hover to-blue-700 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(37,99,235,0.4)] border border-white/10"
                whileHover={{ scale: 1.05 }}
              >
                <BarChart3 size={48} className="text-white drop-shadow-2xl" />

                {/* Orbital dots (requested style from Image 0) */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 bg-bullish rounded-full"
                    style={{
                      top: `${50 + 70 * Math.cos((i * Math.PI * 2) / 8)}%`,
                      left: `${50 + 70 * Math.sin((i * Math.PI * 2) / 8)}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.25
                    }}
                  />
                ))}
              </motion.div>
            </div>

            {/* Typography */}
            <div className="text-center space-y-3">
              <h1 className="text-5xl font-black text-white uppercase tracking-tighter italic">
                Poly<span className="text-bullish">Pulse</span>
              </h1>
              <p className="text-xs text-neutral-500 font-bold uppercase tracking-[0.4em] border-t border-white/5 pt-2">
                The Architecture of Prediction
              </p>
            </div>

            {/* Loading & Status Block */}
            <div className="w-64 space-y-4">
              <div className="relative h-px w-full bg-white/10 overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-bullish"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                />
                <motion.div
                  className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{ x: ['-100%', '400%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <Zap size={10} className="text-bullish" />
                  </motion.div>
                  <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest leading-none">
                    {statusText}
                  </span>
                </div>
                <span className="text-[8px] text-bullish font-mono">{progress}%</span>
              </div>
            </div>

            {/* Utility Showcase */}
            <div className="flex items-center gap-8 mt-4">
              {[
                { Icon: TrendingUp, label: 'TRENDING' },
                { Icon: Activity, label: 'LIVE' },
                { Icon: BarChart3, label: 'ANALYTICS' },
              ].map(({ Icon, label }, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-500 hover:text-bullish hover:border-bullish/50 transition-all duration-300">
                    <Icon size={18} />
                  </div>
                  <span className="text-[8px] text-neutral-600 font-bold tracking-widest">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
