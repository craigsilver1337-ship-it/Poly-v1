"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import Image from "next/image";

export function HeroScrollDemo() {
    return (
        <div className="flex flex-col overflow-hidden bg-black pt-0 pb-0 -mt-20">
            <ContainerScroll
                titleComponent={
                    <>
                        <h1 className="text-4xl font-semibold text-white">
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
        </div>
    );
}
