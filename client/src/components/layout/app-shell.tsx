import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen overflow-hidden bg-background">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />
      
      <main className="flex-1 overflow-y-auto bg-background relative">
        <div 
          className={`md:hidden bg-black text-white p-4 flex justify-between items-center transition-all duration-300 ${
            scrolled ? "shadow-md" : ""
          }`}
        >
          <div className="flex items-center space-x-2 animate-slide-right">
            <span className="text-primary text-2xl font-racing animate-pulse-subtle">F1</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Motorsport Stakes
            </h1>
          </div>
          <Button
            variant="ghost"
            className="p-1 text-white hover:bg-gray-800 transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
        <div className="p-4 md:p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
