import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TeamSelection } from "@/components/team/team-selection";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserTeamComplete } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Lock } from "lucide-react";

export default function Teams() {
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);
  const { toast } = useToast();

  // Fetch betting status
  const { 
    data: bettingStatus, 
    isLoading: isLoadingBettingStatus 
  } = useQuery({
    queryKey: ["/api/betting-status"],
    staleTime: 60000, // 1 minute
  });
  
  const isBettingOpen = bettingStatus?.isOpen;

  // Fetch user teams
  const { 
    data: teams, 
    isLoading,
    isError,
    error
  } = useQuery<UserTeamComplete[]>({
    queryKey: ["/api/my-teams"],
    onSuccess: (data) => {
      if (data.length > 0 && !activeTeamId) {
        setActiveTeamId(data[0].id);
      }
    },
    retry: 1 // Limiting retries to avoid infinite loop in case of authentication error
  });

  // Fetch market data
  const { 
    data: marketData 
  } = useQuery({
    queryKey: ["/api/market"],
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async ({ teamId, data }: { teamId: number, data: any }) => {
      // Check if betting is closed before attempting to update
      if (!isBettingOpen) {
        throw new Error("Betting is currently closed. Team changes are not allowed at this time.");
      }
      
      const res = await apiRequest("PATCH", `/api/my-teams/${teamId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-teams"] });
      toast({
        title: "Team Updated",
        description: "Your team has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Find active team
  const activeTeam = teams?.find(team => team.id === activeTeamId);

  // If there's an authentication error (401)
  if (isError) {
    const isAuthError = error?.message?.includes("401") || error?.message?.includes("Unauthorized");
    
    if (isAuthError) {
      return (
        <div className="p-6">
          <div className="max-w-md mx-auto mt-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V8a3 3 0 00-3-3H6.5a2.5 2.5 0 000 5H9m9 0h3.5a2.5 2.5 0 000-5H18c-1.9 0-3.5 1.6-3.5 3.5m0 10V14" />
            </svg>
            <h2 className="text-2xl font-bold text-neutral-800 mb-2">Authentication Error</h2>
            <p className="text-neutral-500 mb-6">
              You need to be logged in to access this page. Please log in or create an account.
            </p>
            <a 
              href="/auth" 
              className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to login page
            </a>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Team Management</h1>
        <p className="text-neutral-500">Manage your teams for the upcoming race.</p>
      </header>
      
      {/* Betting Status Alert */}
      {!isLoadingBettingStatus && !isBettingOpen && (
        <Alert className="mb-6 border-yellow-500 bg-yellow-50">
          <Lock className="h-4 w-4 text-yellow-500" />
          <AlertTitle className="text-yellow-800">Betting is closed</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Team changes are currently not allowed. The administrator has closed betting for the upcoming race.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Team Selection Tabs */}
      {isLoading ? (
        <Skeleton className="h-[50px] w-full mb-6" />
      ) : teams?.length ? (
        <div className="mb-6">
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex">
              {teams.map(team => (
                <button
                  key={team.id}
                  className={`py-3 px-6 border-b-2 font-medium ${
                    team.id === activeTeamId
                      ? "border-primary text-primary"
                      : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
                  onClick={() => setActiveTeamId(team.id)}
                >
                  {team.name} ({team.initialCredits} Credits)
                </button>
              ))}
            </nav>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-neutral-500">No teams found.</p>
        </div>
      )}
      
      {/* Team Selection Content */}
      {isLoading || !marketData ? (
        <Skeleton className="h-[600px] w-full" />
      ) : activeTeam ? (
        <TeamSelection 
          team={activeTeam}
          drivers={marketData.drivers || []}
          engines={marketData.engines || []}
          teams={marketData.teams || []}
          onSave={(data) => updateTeamMutation.mutate({ teamId: activeTeam.id, data })}
          isPending={updateTeamMutation.isPending}
          disabled={!isBettingOpen}
        />
      ) : (
        <div className="text-center py-8">
          <p className="text-neutral-500">Select a team to manage.</p>
        </div>
      )}
    </div>
  );
}
