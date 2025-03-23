import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import RaceResultsForm from "@/components/admin/race-results-form";
import RaceCalendarForm from "@/components/admin/race-calendar-form";
import ValuationTableForm from "@/components/admin/valuation-table-form";
import DriversTeamsForm from "@/components/admin/drivers-teams-form";
import BettingStatusForm from "@/components/admin/betting-status-form";
import { Redirect } from "wouter";

export default function Admin() {
  const [activeTab, setActiveTab] = useState("race-results");
  const { user } = useAuth();
  const { toast } = useToast();

  // Revert Chinese GP valuations to Australian GP values
  const revertChineseGPMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/revert-chinese-gp-valuations", {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Chinese GP Valuations Reverted",
        description: "Successfully reverted Chinese GP valuations to Australian GP values.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings/engines"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Reversion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle revert Chinese GP valuations action
  const handleRevertChineseGP = () => {
    if (confirm("Are you sure you want to revert Chinese GP valuations to Australian GP values? This action cannot be undone.")) {
      revertChineseGPMutation.mutate();
    }
  };

  // Redirect if not admin
  if (user && !user.isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="p-6">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-800">Admin Panel</h1>
            <p className="text-neutral-500">Manage race results, calendar, and game data.</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleRevertChineseGP}
              disabled={revertChineseGPMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 ${revertChineseGPMutation.isPending ? 'animate-spin' : ''}`} />
              {revertChineseGPMutation.isPending ? 'Reverting...' : 'Revert Chinese GP'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => window.open('/add-races.html', '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
              Import 2025 Races
            </Button>
          </div>
        </div>
      </header>

      {/* Betting Status Control */}
      <div className="mb-6">
        <BettingStatusForm />
      </div>

      {/* Admin Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-neutral-200">
          <nav className="-mb-px flex flex-wrap">
            <button
              className={`py-3 px-4 sm:px-6 border-b-2 font-medium ${
                activeTab === "race-results"
                  ? "border-primary text-primary"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setActiveTab("race-results")}
            >
              Race Results
            </button>
            <button
              className={`py-3 px-4 sm:px-6 border-b-2 font-medium ${
                activeTab === "race-calendar"
                  ? "border-primary text-primary"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setActiveTab("race-calendar")}
            >
              Race Calendar
            </button>
            <button
              className={`py-3 px-4 sm:px-6 border-b-2 font-medium ${
                activeTab === "drivers-teams"
                  ? "border-primary text-primary"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setActiveTab("drivers-teams")}
            >
              Drivers & Teams
            </button>
            <button
              className={`py-3 px-4 sm:px-6 border-b-2 font-medium ${
                activeTab === "valuation-table"
                  ? "border-primary text-primary"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              }`}
              onClick={() => setActiveTab("valuation-table")}
            >
              Valuation Table
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <Card>
        <CardContent className="p-6">
          {activeTab === "race-results" && <RaceResultsForm />}
          {activeTab === "race-calendar" && <RaceCalendarForm />}
          {activeTab === "drivers-teams" && <DriversTeamsForm />}
          {activeTab === "valuation-table" && <ValuationTableForm />}
        </CardContent>
      </Card>
    </div>
  );
}
