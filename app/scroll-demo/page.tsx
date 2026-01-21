"use client";

import React from "react";
import { FullScreenScrollFX, FullScreenFXAPI } from "@/components/ui/full-screen-scroll-fx";

const sections = [
    {
        leftLabel: "Silence",
        title: <>Absence</>,
        rightLabel: "Silence",
        background: "https://images.pexels.com/photos/3289156/pexels-photo-3289156.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
    {
        leftLabel: "Essence",
        title: <>Stillness</>,
        rightLabel: "Essence",
        background: "https://images.pexels.com/photos/163790/at-night-under-a-lantern-guy-night-city-163790.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
    {
        leftLabel: "Rebirth",
        title: <>Growth</>,
        rightLabel: "Rebirth",
        background: "https://images.pexels.com/photos/9817/pexels-photo-9817.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
    {
        leftLabel: "Change",
        title: <>Opportunity</>,
        rightLabel: "Change",
        background: "https://images.pexels.com/photos/939807/pexels-photo-939807.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    },
];

export default function ScrollDemoPage() {
    const apiRef = React.useRef<FullScreenFXAPI>(null);

    return (
        <div className="bg-[#09090b]">
            <FullScreenScrollFX
                sections={sections}
                header={<><div>The Creative</div><div>Process</div></>}
                footer={<div>Scroll Down</div>}
                showProgress
                durations={{ change: 0.7, snap: 800 }}
                apiRef={apiRef}
                colors={{
                    text: "rgba(245,245,245,0.92)",
                    overlay: "rgba(0,0,0,0.45)",
                    pageBg: "#09090b",
                    stageBg: "#000000",
                }}
            />
        </div>
    );
}
