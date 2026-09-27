import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/HeroSection";
import FeatureStrip from "@/components/FeatureStrip";
import HighlightsStrip from "@/components/HighlightsStrip";
import ProductsStrip from "@/components/ProductsStrip";
import MetricsStrip from "@/components/MetricsStrip";
import CTASection from "@/components/CTASection";
import TrustFAQSection from "@/components/TrustFAQSection";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <HeroSection />
        <div className="bg-[url('/images/background-02.png')] bg-cover bg-center bg-no-repeat">
          <FeatureStrip />
          <HighlightsStrip />
          <ProductsStrip />
          <MetricsStrip />
          <CTASection />
          <TrustFAQSection />
          <Footer />
        </div>
      </main>
    </>
  );
}