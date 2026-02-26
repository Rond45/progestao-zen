import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Scissors } from "lucide-react";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import VerticalsSection from "@/components/landing/VerticalsSection";
import PricingSection from "@/components/landing/PricingSection";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-foreground tracking-tight">
              ProGestão<span className="text-primary">+</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#funcionalidades"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Funcionalidades
            </a>
            <a
              href="#planos"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Planos
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
            >
              Entrar
            </Button>
            <Button
              variant="emerald"
              size="sm"
              onClick={() => navigate("/planos")}
            >
              Começar agora
            </Button>
          </div>
        </div>
      </header>

      <HeroSection />
      <FeaturesSection />
      <VerticalsSection />
      <PricingSection />

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                ProGestão<span className="text-primary">+</span>
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <a href="/termos" className="text-muted-foreground hover:text-foreground">Termos</a>
              <a href="/privacidade" className="text-muted-foreground hover:text-foreground">Privacidade</a>
              <a href="/suporte" className="text-muted-foreground hover:text-foreground">Suporte</a>
            </div>

            <p className="text-xs text-muted-foreground">
              Todos os direitos reservados. ProGestão+ 2026.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
