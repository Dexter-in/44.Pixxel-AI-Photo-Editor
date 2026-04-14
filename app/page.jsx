import FeaturesSection from "@/components/features";
import InteractiveStats from "@/components/InteractiveStats";
import PricingSection from "@/components/pricing";
import { Button } from "@/components/ui/button";
import HeroSection from "@/components/ui/hero";
import Link from "next/link";


export default function Home() {
  return (
    <div className="pt-36">

      {/* {Hero} */}
      <HeroSection />
      {/* {stats} */}
      <InteractiveStats />
      {/* <StatsSection /> */}
      {/* {features} */}
      <FeaturesSection />
      {/* {pricing} */}
      <PricingSection />


      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-5xl font-bold  mb-6">
            Ready to {" "}
            <span className="bg-linear-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Create Something Amazing
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of creators who are already using AI to
            transform their images and bring vision to life</p>
          <Link href="/dashboard">
            <Button variant="primary">
              ⭐ Start Creating Now
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
