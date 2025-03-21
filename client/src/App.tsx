import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Teams from "@/pages/teams";
import Market from "@/pages/market";
import Races from "@/pages/races";
import Standings from "@/pages/standings";
import Statistics from "@/pages/statistics";
import Admin from "@/pages/admin";
import AuthPage from "@/pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import AppShell from "./components/layout/app-shell";

// Importando a nova página de leaderboard
import Leaderboard from "@/pages/leaderboard";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={() => <AppShell><Dashboard /></AppShell>} />
      <ProtectedRoute path="/teams" component={() => <AppShell><Teams /></AppShell>} />
      <ProtectedRoute path="/market" component={() => <AppShell><Market /></AppShell>} />
      <ProtectedRoute path="/races" component={() => <AppShell><Races /></AppShell>} />
      <ProtectedRoute path="/standings" component={() => <AppShell><Standings /></AppShell>} />
      <ProtectedRoute path="/statistics" component={() => <AppShell><Statistics /></AppShell>} />
      <ProtectedRoute path="/leaderboard" component={() => <AppShell><Leaderboard /></AppShell>} />
      <ProtectedRoute path="/admin" component={() => <AppShell><Admin /></AppShell>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
