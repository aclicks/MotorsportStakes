import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TeamSelection } from "@/components/team/team-selection";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserTeamComplete, Race } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Lock, 
  Timer, 
  User, 
  Car, 
  Settings, 
  Award, 
  ChevronRight, 
  ShieldAlert,
  Clock
} from "lucide-react";

export default function Teams() {
  const [activeTeamId, setActiveTeamId] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const { toast } = useToast();

  // Fetch next race data
  const { data: nextRace } = useQuery<Race>({
    queryKey: ["/api/races/next"],
  });

  // Fetch betting status
  const { 
    data: bettingStatus, 
    isLoading: isLoadingBettingStatus 
  } = useQuery({
    queryKey: ["/api/betting-status"],
    staleTime: 60000, // 1 minute
  });
  
  const isBettingOpen = bettingStatus?.isOpen;

  // Setup countdown timer
  useEffect(() => {
    if (!nextRace || !nextRace.date) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const raceDate = new Date(nextRace.date);
      const difference = raceDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setCountdown("Race underway");
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      setCountdown(`${days}d ${hours}h ${minutes}m`);
    };
    
    // Update immediately
    updateCountdown();
    
    // Update every minute
    const timer = setInterval(updateCountdown, 60000);
    
    return () => clearInterval(timer);
  }, [nextRace]);

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
            <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Authentication Required
            </h2>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to access your teams. Please login or create an account to continue.
            </p>
            <a 
              href="/auth" 
              className="inline-flex items-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to login page
              <ChevronRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
      );
    }
  }

  // Helper to determine team type
  const getTeamTypeInfo = (team: UserTeamComplete) => {
    const isPremium = team.initialCredits === 1000 || 
                      team.name.includes("Premium") || 
                      team.name.includes("Principal");
    
    return {
      type: isPremium ? "premium" : "challenger",
      label: isPremium ? "Premium" : "Challenger",
      budget: isPremium ? 1000 : 700,
      icon: isPremium ? <Award className="h-4 w-4" /> : <Car className="h-4 w-4" />
    };
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
          Team Management
        </h1>
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            Manage your teams for the upcoming race: <span className="font-medium text-foreground">{nextRace?.name}</span>
          </p>
          
          {/* Race countdown */}
          {nextRace && countdown && (
            <div className="flex items-center text-sm bg-muted/80 px-3 py-1 rounded-full border border-muted">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-primary" />
              <span className="font-medium text-foreground">{countdown}</span>
              <span className="ml-1.5 text-foreground/80">until race</span>
            </div>
          )}
        </div>
      </header>
      
      {/* Betting Status Alert */}
      {!isLoadingBettingStatus && (
        <Alert className={`mb-6 ${isBettingOpen ? 'border-green-600 bg-green-950/30' : 'border-yellow-600 bg-yellow-950/30'}`}>
          {isBettingOpen ? (
            <Timer className="h-4 w-4 text-green-400" />
          ) : (
            <Lock className="h-4 w-4 text-yellow-400" />
          )}
          <AlertTitle className={`font-bold ${isBettingOpen ? "text-green-400" : "text-yellow-400"}`}>
            {isBettingOpen ? "Betting is open" : "Betting is closed"}
          </AlertTitle>
          <AlertDescription className="text-foreground/90">
            {isBettingOpen 
              ? "You can make changes to your team lineup until betting closes before the race." 
              : "Team changes are currently not allowed. The administrator has closed betting for the upcoming race."}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Team Selection Tabs */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Skeleton className="h-[80px]" />
          <Skeleton className="h-[80px]" />
        </div>
      ) : teams?.length ? (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map(team => {
              const teamInfo = getTeamTypeInfo(team);
              return (
                <Card 
                  key={team.id}
                  className={`cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-md ${
                    team.id === activeTeamId 
                      ? 'ring-2 ring-primary/50 transform scale-[1.01]' 
                      : 'hover:border-primary/20'
                  }`}
                  onClick={() => setActiveTeamId(team.id)}
                >
                  <div className={`h-1 ${teamInfo.type === 'premium' ? 'bg-primary' : 'bg-secondary'}`}></div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className={`w-12 h-12 rounded-full ${
                          teamInfo.type === 'premium' ? 'bg-primary/10' : 'bg-secondary/10'
                        } flex items-center justify-center mr-3`}>
                          {team.driver1 ? (
                            <span className={`text-lg font-bold ${
                              teamInfo.type === 'premium' ? 'text-primary' : 'text-secondary'
                            }`}>
                              {team.driver1.number}
                            </span>
                          ) : (
                            <User className={teamInfo.type === 'premium' ? 'text-primary' : 'text-secondary'} />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-bold">{team.name}</h3>
                            <Badge variant={teamInfo.type} className="ml-2">
                              {teamInfo.icon}
                              <span className="ml-1">{teamInfo.label}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center text-sm text-foreground/80 space-x-4 mt-1">
                            <div className="flex items-center">
                              <User className="h-3.5 w-3.5 mr-1 text-foreground/80" />
                              <span>{team.driver1?.name || "No driver"} / {team.driver2?.name || "No driver"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{team.currentCredits}</div>
                        <div className="text-xs text-foreground/80">Available credits</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg bg-muted/20">
          <ShieldAlert className="mx-auto h-10 w-10 text-foreground/70 mb-3" />
          <p className="text-foreground/90 font-medium">No teams found for your account.</p>
        </div>
      )}
      
      {/* Team Details */}
      {!isLoading && activeTeam && (
        <div className="mt-8">
          {/* Team Selection */}
          {!marketData ? (
            <Skeleton className="h-[600px] w-full" />
          ) : (
            <TeamSelection 
              team={activeTeam}
              drivers={marketData.drivers || []}
              engines={marketData.engines || []}
              teams={marketData.teams || []}
              onSave={(data) => updateTeamMutation.mutate({ teamId: activeTeam.id, data })}
              isPending={updateTeamMutation.isPending}
              disabled={!isBettingOpen}
            />
          )}
        </div>
      )}
    </div>
  );
}
