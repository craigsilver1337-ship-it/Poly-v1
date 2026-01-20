"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { ArrowRight, Timer, BarChart2 } from "lucide-react";

export interface MarketCardProps {
    id: string;
    title: string;
    image: string; // URL to the market image
    outcomeYesPercent: number; // e.g., 27.1
    priceChange24h: number; // e.g., +0.3
    volume: string; // e.g., "$6.5M"
    endDate: string; // e.g., "Ends in 2 weeks"
    isLive: boolean;
    PriceHistory: any[]; // Data for Recharts
    onResearch?: () => void;
    isInCluster?: boolean;
}

export const FuturisticMarketCard: React.FC<MarketCardProps> = ({
    id,
    title,
    image,
    outcomeYesPercent,
    priceChange24h,
    volume,
    endDate,
    isLive,
    PriceHistory,
    onResearch,
    isInCluster,
}) => {
    return (
        <motion.div
            className="group relative w-full h-[320px] rounded-2xl p-[1px] overflow-hidden cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
        >
            {/* 1. Container & Border Glow */}
            <div className={`absolute inset-0 bg-gradient-to-r ${isInCluster ? 'from-green-500 via-emerald-400 to-green-500' : 'from-blue-900 via-blue-600 to-blue-900'} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />

            {/* Main card container */}
            <div className="relative h-full w-full bg-zinc-950/90 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col">

                {/* 2. Immersive Image Banner */}
                <div className="relative h-[40%] w-full">
                    <Image
                        src={image}
                        alt={title}
                        layout="fill"
                        objectFit="cover"
                        className="opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                        {isInCluster && (
                            <div className="bg-green-500 text-white p-1 rounded-full shadow-lg shadow-green-500/50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                        )}
                        {isLive && (
                            <div className="flex items-center space-x-1 bg-zinc-950/50 backdrop-blur-sm px-2 py-1 rounded-full border border-blue-600/20">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] uppercase tracking-wider text-blue-500 font-mono font-bold">
                                    Live
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col justify-between p-4">

                    {/* 3. Typography & Neon Text */}
                    <div className="space-y-1">
                        <h3 className="text-lg font-sans font-semibold text-white line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors">
                            {title}
                        </h3>

                        <div className="flex items-end space-x-3">
                            <span className="text-3xl font-mono font-bold text-blue-500 drop-shadow-[0_0_8px_rgba(37,99,235,0.8)]">
                                {outcomeYesPercent}%
                            </span>
                            <div className={`flex items-center text-xs font-mono mb-1.5 ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {priceChange24h >= 0 ? '+' : ''}{priceChange24h}%
                            </div>
                        </div>
                    </div>

                    {/* 4. Glowing Sparkline Chart */}
                    <div className="h-12 w-full my-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={PriceHistory}>
                                <defs>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>
                                <Line
                                    type="monotone"
                                    dataKey="value" // Assuming PriceHistory has { value: number } objects
                                    stroke="#2563eb" // blue-600 (bullish)
                                    strokeWidth={2}
                                    dot={false}
                                    filter="url(#glow)"
                                    isAnimationActive={true}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 5. Icons & Buttons */}
                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">

                        {/* Meta Data */}
                        <div className="flex items-center space-x-4 text-xs text-zinc-400 font-mono">
                            <div className="flex items-center space-x-1">
                                <BarChart2 className="w-3.5 h-3.5 text-blue-600/70" />
                                <span>{volume}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <Timer className="w-3.5 h-3.5 text-blue-600/70" />
                                <span>{endDate}</span>
                            </div>
                        </div>

                        {/* Research Button */}
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onResearch?.();
                            }}
                            className="group/btn flex items-center space-x-1 text-sm font-sans font-medium text-white hover:text-blue-500 transition-colors"
                        >
                            <span>Research</span>
                            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-1 text-blue-600" />
                        </button>

                    </div>
                </div>
            </div>
        </motion.div>
    );
};
