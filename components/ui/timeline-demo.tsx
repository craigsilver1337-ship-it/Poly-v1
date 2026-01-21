"use client";
import Image from "next/image";
import React from "react";
import { Timeline } from "@/components/ui/timeline";

export function TimelineDemo() {
    const data = [
        {
            title: "2024",
            content: (
                <div>
                    <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8 uppercase tracking-widest">
                        Launched PolyPulse Pro with advanced AI Market Intelligence.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <Image
                            src="https://images.unsplash.com/photo-1611974717483-9b25026bdad6?q=80&w=1000&auto=format&fit=crop"
                            alt="market analytics"
                            width={500}
                            height={500}
                            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-2xl"
                        />
                        <Image
                            src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1000&auto=format&fit=crop"
                            alt="data visualization"
                            width={500}
                            height={500}
                            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-2xl"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "Late 2023",
            content: (
                <div>
                    <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8 uppercase tracking-widest">
                        Strategic partnership with global prediction market providers.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <Image
                            src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1000&auto=format&fit=crop"
                            alt="crypto trading"
                            width={500}
                            height={500}
                            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-2xl"
                        />
                        <Image
                            src="https://images.unsplash.com/photo-1611974717429-ca913009a059?q=80&w=1000&auto=format&fit=crop"
                            alt="market analysis"
                            width={500}
                            height={500}
                            className="rounded-lg object-cover h-20 md:h-44 lg:h-60 w-full shadow-2xl"
                        />
                    </div>
                </div>
            ),
        },
        {
            title: "Genesis",
            content: (
                <div>
                    <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-4 uppercase tracking-widest">
                        PolyPulse was born out of a need for institutional-grade prediction tools.
                    </p>
                    <div className="mb-8 space-y-2">
                        <div className="flex gap-2 items-center text-neutral-700 dark:text-neutral-300 text-xs md:text-sm uppercase font-bold">
                            ✅ Proprietary Spread Algorithms
                        </div>
                        <div className="flex gap-2 items-center text-neutral-700 dark:text-neutral-300 text-xs md:text-sm uppercase font-bold">
                            ✅ Sentiment Analysis Engine
                        </div>
                        <div className="flex gap-2 items-center text-neutral-700 dark:text-neutral-300 text-xs md:text-sm uppercase font-bold">
                            ✅ Real-time Polymarket Integration
                        </div>
                    </div>
                </div>
            ),
        },
    ];
    return (
        <div className="w-full bg-black">
            <Timeline data={data} />
        </div>
    );
}
