import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Teams from "@/pages/teams";
import Market from "@/pages/market";
import Races from "@/pages/races";
import Statistics from "@/pages/statistics";
import Admin from "@/pages/admin";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import AppShell from "./components/layout/app-shell";
import { useEffect, useState } from "react";

// Import additional pages
import Leaderboard from "@/pages/leaderboard";
import ValuationTable from "@/pages/valuation-table";

// Page transition component
const AnimatedPage = ({ children }: { children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      className={`transition-all duration-300 ease-in-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </div>
  );
};

function Router() {
  const [location] = useLocation();
  const [prevPath, setPrevPath] = useState(location);
  
  useEffect(() => {
    setPrevPath(location);
  }, [location]);
  
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute 
        path="/" 
        component={() => (
          <AppShell>
            <AnimatedPage>
              <Dashboard />
            </AnimatedPage>
          </AppShell>
        )} 
      />
      <ProtectedRoute 
        path="/teams" 
        component={() => (
          <AppShell>
            <AnimatedPage>
              <Teams />
            </AnimatedPage>
          </AppShell>
        )} 
      />
      <ProtectedRoute 
        path="/market" 
        component={() => (
          <AppShell>
            <AnimatedPage>
              <Market />
            </AnimatedPage>
          </AppShell>
        )} 
      />
      <ProtectedRoute 
        path="/races" 
        component={() => (
          <AppShell>
            <AnimatedPage>
              <Races />
            </AnimatedPage>
          </AppShell>
        )} 
      />

      <ProtectedRoute 
        path="/statistics" 
        component={() => (
          <AppShell>
            <AnimatedPage>
              <Statistics />
            </AnimatedPage>
          </AppShell>
        )} 
      />
      <ProtectedRoute 
        path="/leaderboard" 
        component={() => (
          <AppShell>
            <AnimatedPage>
              <Leaderboard />
            </AnimatedPage>
          </AppShell>
        )} 
      />
      <ProtectedRoute 
        path="/valuation-table" 
        component={() => (
          <AppShell>
            <AnimatedPage>
              <ValuationTable />
            </AnimatedPage>
          </AppShell>
        )} 
      />
      <ProtectedRoute 
        path="/admin" 
        component={() => (
          <AppShell>
            <AnimatedPage>
              <Admin />
            </AnimatedPage>
          </AppShell>
        )} 
      />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="bg-background text-foreground min-h-screen">
          <Router />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
