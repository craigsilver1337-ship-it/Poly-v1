import { Hero } from "@/components/ui/hero-1";

export default function DemoOne() {
    return (
        <div className="flex flex-col gap-20">
            <Hero
                title="Build smarter tools for modern teams"
                subtitle="Streamline your workflow and boost productivity with intuitive solutions. Security, speed, and simplicity—all in one platform."
                eyebrow="Next-Gen Productivity"
                ctaLabel="Get Started"
                ctaHref="#"
            />
        </div>
    );
}
