import { useState } from "react";
import Sidebar from "./sidebar";
import { Button } from "@/components/ui/button";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col md:flex-row min-h-screen overflow-hidden">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen} 
        setIsMobileMenuOpen={setIsMobileMenuOpen} 
      />
      
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="md:hidden bg-secondary text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <i className="fas fa-flag-checkered text-primary text-xl"></i>
            <h1 className="text-xl font-bold">Motorsport Stakes</h1>
          </div>
          <Button
            variant="ghost"
            className="p-1 text-white"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <i className="fas fa-bars text-xl"></i>
          </Button>
        </div>
        {children}
      </main>
    </div>
  );
}
