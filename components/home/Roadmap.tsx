"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Zap, Target, Brain, Globe, Shield, Rocket } from "lucide-react";
import BackgroundParticles from "@/components/visualizations/BackgroundParticles";

const roadmapData = [
    {
        phase: "PHASE 01",
        title: "PROTOCOL GENESIS & LIQUIDITY BOOTSTRAPPING",
        date: "Q1 2026 (Current Phase)",
        status: "IN PROGRESS",
        description: "Following 90 days of intensive closed-beta development, PolyPulse is transitioning to its public deployment phase. We are initiating a strategic fair launch on Solana via the Pump.fun ecosystem to ensure decentralized token distribution and immediate liquidity provisioning.",
        icon: Rocket,
        features: ["PUMP.FUN STRATEGIC LAUNCH", "CORE ENGINE ACTIVATION", "RESEARCH V1 DEPLOYMENT"]
    },
    {
        phase: "PHASE 02",
        title: "MARKET PENETRATION & ANALYTIC AGGREGATION",
        date: "Q2 2026",
        status: "PLANNED",
        description: "Post-launch, the focus shifts to global visibility and deep-liquidity integration. We will execute listings on premier decentralized aggregators including DEX Screener and CoinGecko to establish market transparency and tracking accuracy.",
        icon: Zap,
        features: ["TIER-1 TRACKER INTEGRATION", "AUTOMATED EXECUTION LAYER", "LIQUIDITY DEPTH EXPANSION"]
    },
    {
        phase: "PHASE 03",
        title: "ECOSYSTEM VIBRANCY & NEURAL SCALING",
        date: "Q3 2026",
        status: "PLANNED",
        description: "Phase 03 marks the transition from a tool to a self-sustaining intelligence ecosystem. We will launch the PolyPulse Neural Network, leveraging Google Gemini Pro for advanced predictive modeling and autonomous agentic research.",
        icon: Brain,
        features: ["NEURAL NETWORK ACTIVATION", "COMMUNITY ARCHITECTURE", "INCENTIVIZED INTELLIGENCE"]
    },
    {
        phase: "PHASE 04",
        title: "CROSS-CHAIN ORCHESTRATION & HORIZONTAL EXPANSION",
        date: "Q4 2026+",
        status: "PLANNED",
        description: "The final phase of our initial roadmap involves breaking the boundaries of a single blockchain. PolyPulse will evolve into a market-agnostic infrastructure, deploying its terminal and scanning capabilities across multiple high-performance networks.",
        icon: Globe,
        features: ["MULTI-CHAIN DEPLOYMENT", "DAO GOVERNANCE", "INSTITUTIONAL API ACCESS"]
    }
];

export function Roadmap() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start 80%", "end 20%"]
    });

    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <section ref={containerRef} className="relative py-32 bg-black overflow-hidden">
            {/* Background Infrastructure */}
            <BackgroundParticles className="opacity-20" />

            {/* Dynamic Glows */}
            <div className="absolute top-32 left-1/4 w-[800px] h-[800px] bg-bullish/10 blur-[130px] rounded-full animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />

            <div className="relative max-w-7xl mx-auto px-4 md:px-8 lg:px-10 z-10">
                <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-bullish/10 border border-bullish/20 text-bullish text-[10px] font-bold tracking-[0.2em] mb-4"
                        >
                            <Target size={12} />
                            STRATEGIC DEPLOYMENT
                        </motion.div>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-8xl font-black text-white uppercase tracking-tighter leading-[0.8]"
                        >
                            MISSION <br />
                            <span className="text-bullish">TIMELINE</span>
                        </motion.h2>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-neutral-500 uppercase tracking-widest text-xs md:text-sm max-w-md leading-relaxed border-l border-white/10 pl-6"
                    >
                        Engineering the future of predictive sovereignty.
                        A multi-phase protocol expansion across the Solana ecosystem.
                    </motion.p>
                </div>

                <div className="relative">
                    {/* Central Neural Path - Stationary Background */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-white/5 transform md:-translate-x-1/2 hidden md:block" />

                    {/* Central Neural Path - Animated Foreground */}
                    <motion.div
                        style={{ scaleY, originY: 0 }}
                        className="absolute left-8 md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-bullish via-blue-400 to-bullish shadow-[0_0_15px_rgba(37,99,235,0.5)] transform md:-translate-x-1/2 hidden md:block z-20"
                    />

                    <div className="space-y-24">
                        {roadmapData.map((item, index) => (
                            <div key={index} className={`relative flex flex-col md:flex-row items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>

                                {/* Visual Node */}
                                <div className="absolute left-8 md:left-1/2 w-4 h-4 rounded-full bg-black border-2 border-bullish/50 transform -translate-x-1/2 z-30 hidden md:flex items-center justify-center">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        className="w-2 h-2 rounded-full bg-bullish shadow-[0_0_10px_#2563eb]"
                                    />
                                </div>

                                {/* Content Block */}
                                <div className="w-full md:w-[48%] pl-16 md:pl-0">
                                    <motion.div
                                        initial={{ opacity: 0, y: 40 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 50,
                                            damping: 20,
                                            delay: 0.1
                                        }}
                                        whileHover={{ y: -5 }}
                                        className="group relative"
                                    >
                                        {/* Card Body */}
                                        <div className="relative p-px rounded-[2.5rem] bg-gradient-to-br from-white/20 via-white/5 to-transparent overflow-hidden">
                                            <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-3xl rounded-[2.5rem] -z-10" />

                                            {/* Scanline Effect */}
                                            <div className="absolute inset-0 bg-[linear-gradient(transparent_0%,rgba(37,99,235,0.05)_50%,transparent_100%)] bg-[length:100%_4px] animate-scanline pointer-events-none opacity-20" />

                                            <div className="relative p-12 space-y-8">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-bullish/10 border border-bullish/20 flex items-center justify-center text-bullish shadow-inner">
                                                            <item.icon size={24} />
                                                        </div>
                                                        <span className="text-[12px] font-bold text-bullish tracking-[0.4em] uppercase">{item.phase}</span>
                                                    </div>
                                                    <div className={`px-4 py-1.5 text-[10px] font-black rounded-full border tracking-tighter ${item.status === 'COMPLETE' ? 'border-green-500/30 text-green-500 bg-green-500/5' :
                                                        item.status === 'IN PROGRESS' ? 'border-bullish/30 text-bullish bg-bullish/5 anim-pulse shadow-[0_0_10px_rgba(37,99,235,0.2)]' :
                                                            'border-white/5 text-neutral-600 bg-white/[0.02]'
                                                        }`}>
                                                        {item.status}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-4xl md:text-5xl font-black text-white mb-3 leading-none uppercase italic tracking-tighter transition-colors group-hover:text-bullish">
                                                        {item.title}
                                                    </h3>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-px bg-bullish/50" />
                                                        <p className="text-bullish font-mono text-sm uppercase tracking-widest">{item.date}</p>
                                                    </div>
                                                </div>

                                                <p className="text-neutral-300 text-lg leading-relaxed uppercase tracking-tight font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                                                    {item.description}
                                                </p>

                                                <div className="flex flex-wrap gap-3">
                                                    {item.features.map((feature, i) => (
                                                        <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[10px] text-neutral-400 font-bold tracking-widest uppercase hover:bg-white/10 transition-colors">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-bullish shadow-[0_0_5px_#2563eb]" />
                                                            {feature}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Decorative Elements */}
                                        <div className="absolute -top-4 -left-4 w-32 h-32 bg-bullish/5 blur-3xl rounded-full group-hover:bg-bullish/10 transition-colors" />
                                    </motion.div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .animate-scanline {
          animation: scanline 8s linear infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        .anim-pulse {
          animation: pulse-glow 2s infinite ease-in-out;
        }
      `}</style>
        </section>
    );
}

