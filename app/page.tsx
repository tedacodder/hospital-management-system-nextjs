import { CtaSection } from "@/components/marketing/CtaSection";
import { Features } from "@/components/marketing/Features";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { Journey } from "@/components/marketing/Journey";
import { Navbar } from "@/components/marketing/Navbar";
import { Security } from "@/components/marketing/Security";
import { TrustStrip } from "@/components/marketing/TrustStrip";

// Server component end to end: the only client code on this page is the
// mobile menu button inside <Navbar>. Nothing here reads data, so the page
// is prerendered.

export default function LandingPage() {
  return (
    <div className="page-enter min-h-screen bg-paper">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <TrustStrip />
        <Features />
        <Journey />
        <Security />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
