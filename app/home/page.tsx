'use client';

import { FullScreenScrollFX } from "@/components/ui/full-screen-scroll-fx";

const VideoBackground = () => (
    <div className="absolute inset-0">
        <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
        >
            <source src="/back3.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
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

export default function HomePage() {
    return (
        <div className="relative -mt-16 min-h-screen overflow-hidden bg-[#09090b]">
            <FullScreenScrollFX
                sections={sections}
                header={<><div>PulseForge</div><div>Intelligence</div></>}
                footer={<div>Scroll to Explore</div>}
                showProgress
                durations={{ change: 0.8, snap: 1000 }}
                colors={{
                    text: "rgba(245,245,245,0.92)",
                    overlay: "rgba(0,0,0,0.5)",
                    pageBg: "#09090b",
                    stageBg: "#000000",
                }}
            />
        </div>
    );
}
