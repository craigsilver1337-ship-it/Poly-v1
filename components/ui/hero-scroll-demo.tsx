"use client";
import React, { useState } from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";
import BackgroundParticles from "@/components/visualizations/BackgroundParticles";
import { Copy, Check } from "lucide-react";

export function HeroScrollDemo() {
    const [copied, setCopied] = useState(false);
    const ca = "6tgkzeiXiA5w2uFLQ8NFMWQDMcrn76CcXcrXoao9pump";

    const handleCopy = () => {
        navigator.clipboard.writeText(ca);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative flex flex-col overflow-hidden bg-black pt-0 pb-0 -mt-20">
            <BackgroundParticles className="opacity-50" />
            <div className="relative z-10 w-full">
                <ContainerScroll
                    titleComponent={
                        <>
                            <h1 className="text-2xl md:text-4xl font-semibold text-white">
                                Unleash the power of <br />
                                <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none text-bullish">
                                    Market Analytics
                                </span>
                            </h1>
                        </>
                    }
                >
                    <Image
                        src="/hero1.png"
                        alt="market intelligence hero"
                        height={720}
                        width={1400}
                        className="mx-auto rounded-2xl object-cover h-full object-center"
                        draggable={false}
                    />
                </ContainerScroll>

                <div className="flex justify-center -mt-12 md:-mt-40 pb-20 relative z-30 pointer-events-auto">
                    <button
                        onClick={handleCopy}
                        className="group flex items-center gap-3 px-6 py-3 rounded-full bg-neutral-900/60 border border-white/10 hover:border-bullish/50 hover:bg-bullish/10 backdrop-blur-xl transition-all duration-300 shadow-2xl hover:shadow-bullish/20 cursor-pointer"
                    >
                        <span className="text-bullish font-bold text-sm tracking-wider">CA</span>
                        <div className="h-4 w-[1px] bg-white/10" />
                        <span className="text-neutral-400 font-mono text-xs sm:text-sm group-hover:text-white transition-colors truncate max-w-[150px] sm:max-w-none">
                            {ca}
                        </span>
                        {copied ? (
                            <Check size={14} className="text-green-500" />
                        ) : (
                            <Copy size={14} className="text-neutral-500 group-hover:text-bullish transition-colors" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
