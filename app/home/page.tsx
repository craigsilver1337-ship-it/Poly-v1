'use client';

import { FullScreenScrollFX } from "@/components/ui/full-screen-scroll-fx";
import { Activity, Zap, Shield, ChevronRight } from "lucide-react";
import Link from "next/link";

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

const ContentSection = () => (
    <div className="bg-black text-white py-32 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div>
                    <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tighter uppercase">
                        Master the <span className="text-bullish">Market</span> Intelligence
                    </h2>
                    <p className="text-xl text-neutral-400 mb-10 leading-relaxed max-w-lg uppercase tracking-wide">
                        PolyPulse provides deep insights into prediction markets, enabling strategic decision-making through advanced AI-driven analytics.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <Link href="/markets" className="px-8 py-4 bg-bullish hover:bg-bullish-hover text-white font-bold rounded-full transition-all uppercase tracking-widest text-sm flex items-center gap-2">
                            Explore Markets <ChevronRight size={18} />
                        </Link>
                        <Link href="/docs" className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-full transition-all uppercase tracking-widest text-sm">
                            Read Docs
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                        { icon: Activity, title: "Spread Analysis", desc: "Monitor market inefficiencies in real-time with millisecond precision." },
                        { icon: Zap, title: "Instant Execution", desc: "Proprietary signals for optimized entry and exit on Polymarket." },
                        { icon: Shield, title: "Risk Mitigation", desc: "Advanced algorithmic hedging tools to protect your trading capital." },
                        { icon: Zap, title: "AI Strategy", desc: "LLM-powered research briefs generated from live market sentiment." }
                    ].map((feature, i) => (
                        <div key={i} className="p-8 rounded-3xl bg-neutral-900/50 border border-white/5 hover:border-bullish/30 transition-all duration-500 group">
                            <feature.icon className="text-bullish mb-4 group-hover:scale-110 transition-transform" size={32} />
                            <h4 className="text-lg font-bold mb-2 uppercase tracking-tight">{feature.title}</h4>
                            <p className="text-sm text-neutral-500 leading-relaxed uppercase">{feature.desc}</p>
                        </div>
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

            <ContentSection />
        </div>
    );
}
