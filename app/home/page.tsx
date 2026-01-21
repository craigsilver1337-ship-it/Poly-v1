'use client';

import { FullScreenScrollFX } from "@/components/ui/full-screen-scroll-fx";
import { Activity, Zap, Shield, ChevronRight, Github, Twitter, Send } from "lucide-react";
import Link from "next/link";
import { HeroScrollDemo } from "@/components/ui/hero-scroll-demo";
import { TimelineDemo } from "@/components/ui/timeline-demo";
import { motion } from "framer-motion";
import React, { useRef, useState } from "react";
import BackgroundParticles from "@/components/visualizations/BackgroundParticles";

const VideoBackground = () => (
    <div className="absolute inset-[-2px] overflow-hidden">
        <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover scale-105"
        >
            <source src="/back3.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
    </div>
);

const sections = [
    {
        leftLabel: "Intelligence",
        title: "AI Powered Insights",
        rightLabel: "Polymarket",
        background: "",
        renderBackground: () => <VideoBackground />,
    },
    {
        leftLabel: "Strategy",
        title: "Multi-market Analysis",
        rightLabel: "Optimization",
        background: "",
        renderBackground: () => <VideoBackground />,
    },
    {
        leftLabel: "Discovery",
        title: "Scan for Inefficiencies",
        rightLabel: "Real-time",
        background: "",
        renderBackground: () => <VideoBackground />,
    },
    {
        leftLabel: "Pulse",
        title: "The Heart of Betting",
        rightLabel: "Global",
        background: "",
        renderBackground: () => <VideoBackground />,
    },
];

// Spotlight Card Wrapper
const SpotlightCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!divRef.current) return;
        const div = divRef.current;
        const rect = div.getBoundingClientRect();
        setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
        setIsFocused(true);
        setOpacity(1);
    };

    const handleBlur = () => {
        setIsFocused(false);
        setOpacity(0);
    };

    const handleMouseEnter = () => {
        setOpacity(1);
    };

    const handleMouseLeave = () => {
        setOpacity(0);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/50 ${className}`}
        >
            <div
                className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
                style={{
                    opacity,
                    background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(37,99,235,0.15), transparent 40%)`,
                }}
            />
            <div className="relative h-full">{children}</div>
        </div>
    );
};

const ContentSection = () => (
    <div className="relative bg-black text-white pt-0 pb-32 px-4 z-10 overflow-hidden">
        <BackgroundParticles className="opacity-30" />
        <div className="relative max-w-7xl mx-auto z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h2 className="text-5xl md:text-7xl font-black mb-8 leading-[0.9] tracking-tighter uppercase relative">
                        <span className="block text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">Master The</span>
                        <span className="block text-bullish">Market</span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50">Intelligence</span>
                    </h2>
                    <p className="text-xl text-neutral-400 mb-10 leading-relaxed max-w-lg uppercase tracking-wide border-l-2 border-bullish/50 pl-6">
                        PolyPulse provides deep insights into prediction markets, enabling strategic decision-making through advanced AI-driven analytics.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/markets" className="group relative px-8 py-4 bg-bullish hover:bg-bullish-hover text-white font-bold rounded-full transition-all uppercase tracking-widest text-sm flex items-center gap-2 overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <span className="relative">Explore Markets</span>
                            <ChevronRight size={18} className="relative group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/docs" className="group px-8 py-4 bg-transparent border border-white/10 hover:border-white/30 text-white font-bold rounded-full transition-all uppercase tracking-widest text-sm">
                            <span className="group-hover:text-bullish transition-colors">Read Docs</span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-4 mt-8">
                        <Link href="https://t.me/polypulse" target="_blank" className="group p-3 bg-neutral-900/50 border border-white/10 rounded-full hover:bg-bullish hover:border-bullish text-white transition-all duration-300">
                            <Send size={20} className="group-hover:scale-110 transition-transform" />
                        </Link>
                        <Link href="https://twitter.com/polypulse" target="_blank" className="group p-3 bg-neutral-900/50 border border-white/10 rounded-full hover:bg-bullish hover:border-bullish text-white transition-all duration-300">
                            <Twitter size={20} className="group-hover:scale-110 transition-transform" />
                        </Link>
                        <Link href="https://github.com/polypulse" target="_blank" className="group p-3 bg-neutral-900/50 border border-white/10 rounded-full hover:bg-bullish hover:border-bullish text-white transition-all duration-300">
                            <Github size={20} className="group-hover:scale-110 transition-transform" />
                        </Link>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                        { icon: Activity, title: "Spread Analysis", desc: "Monitor market inefficiencies in real-time with millisecond precision." },
                        { icon: Zap, title: "Instant Execution", desc: "Proprietary signals for optimized entry and exit on Polymarket." },
                        { icon: Shield, title: "Risk Mitigation", desc: "Advanced algorithmic hedging tools to protect your trading capital." },
                        { icon: Zap, title: "AI Strategy", desc: "LLM-powered research briefs generated from live market sentiment." }
                    ].map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        >
                            <SpotlightCard className="h-full p-8 group hover:bg-neutral-900/80 transition-colors">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-bullish group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <feature.icon size={24} />
                                </div>
                                <h4 className="text-xl font-bold mb-3 uppercase tracking-tight text-white group-hover:text-bullish transition-colors">
                                    {feature.title}
                                </h4>
                                <p className="text-sm text-neutral-500 leading-relaxed uppercase group-hover:text-neutral-300 transition-colors">
                                    {feature.desc}
                                </p>
                            </SpotlightCard>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default function HomePage() {
    return (
        <div className="relative -mt-16 min-h-screen bg-black">
            <FullScreenScrollFX
                sections={sections}
                header={<><div>PolyPulse</div><div>Intelligence</div></>}
                showProgress
                durations={{ change: 0.8, snap: 1000 }}
                colors={{
                    text: "rgba(245,245,245,0.92)",
                    overlay: "rgba(0,0,0,0.4)",
                    pageBg: "#000000",
                    stageBg: "#000000",
                }}
            />

            <HeroScrollDemo />
            <ContentSection />
            <TimelineDemo />
        </div>
    );
}
