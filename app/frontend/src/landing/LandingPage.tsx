import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { Features } from "./Features";
import { HowItWorks } from "./HowItWorks";
import { Pricing } from "./Pricing";
import { Footer } from "./Footer";

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#08090c] text-[#f4f4f6]">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}
