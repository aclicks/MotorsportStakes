import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import RaceCard from "@/components/race/race-card";
import TeamSummary from "@/components/team/team-summary";
import RaceResults from "@/components/race/race-results";
import LastRacePerformance from "@/components/race/last-race-performance";
import { Race, UserTeamComplete, AssetValueHistory } from "@shared/schema";

// Extend UserTeamComplete type to include credits
interface EnhancedUserTeam extends UserTeamComplete {
  credits?: number;
}
import { 
  Trophy, 
  Calendar, 
  Flag, 
  Users, 
  AlertCircle, 
  Clock, 
  TrendingUp 
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Fetch user teams
  const { 
    data: teams, 
    isLoading: isLoadingTeams 
  } = useQuery<EnhancedUserTeam[]>({
    queryKey: ["/api/my-teams"],
  });

  // Fetch next race
  const { 
    data: nextRace, 
    isLoading: isLoadingNextRace 
  } = useQuery<Race>({
    queryKey: ["/api/races/next"],
  });

  // Fetch all races to get the last completed race
  const { 
    data: races, 
    isLoading: isLoadingRaces 
  } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });
  
  // Fetch betting status
  const {
    data: bettingStatus,
    isLoading: isLoadingBettingStatus
  } = useQuery<{ isOpen: boolean }>({
    queryKey: ["/api/betting-status"],
  });
  
  // Fetch asset value history for performance tracking
  const {
    data: assetValueHistory,
    isLoading: isLoadingAssetHistory
  } = useQuery<AssetValueHistory[]>({
    queryKey: ["/api/asset-value-history"],
  });

  // Find the last completed race
  const lastRace = races?.filter(race => 
    race.resultsSubmitted && new Date(race.date) < new Date()
  ).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
  
  // Calculate time until next race
  const [timeUntilRace, setTimeUntilRace] = useState("");
  
  useEffect(() => {
    if (!nextRace) return;
    
    const calculateTimeLeft = () => {
      const raceDate = new Date(nextRace.date);
      const now = new Date();
      const difference = raceDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setTimeUntilRace("Race day!");
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilRace(`${days}d ${hours}h ${minutes}m`);
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 60000);
    
    return () => clearInterval(timer);
  }, [nextRace]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <header className="mb-8 animate-slide-down">
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
          <span className="bg-gradient-to-r from-white via-primary to-secondary bg-clip-text text-transparent">
            Dashboard
          </span>
        </h1>
        <p className="text-gray-400 text-lg">Welcome to your Motorsport Stakes command center.</p>
      </header>
      
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Next Race Countdown */}
        <Card className={`card-racing border-primary/20 hover:border-primary/50 transition-all duration-300 ${isMounted ? 'animate-slide-up' : 'opacity-0'}`} style={{animationDelay: '100ms'}}>
          <CardContent className="p-0">
            <div className="p-5 flex items-center">
              <div className="mr-4 bg-primary/10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Next Race In</p>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {isLoadingNextRace ? (
                    <Skeleton className="h-7 w-24" />
                  ) : nextRace ? (
                    timeUntilRace
                  ) : (
                    "No races scheduled"
                  )}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Betting Status */}
        <Card className={`card-racing ${bettingStatus?.isOpen ? 'border-green-600/30 hover:border-green-600/60' : 'border-red-500/30 hover:border-red-500/60'} transition-all duration-300 ${isMounted ? 'animate-slide-up' : 'opacity-0'}`} style={{animationDelay: '200ms'}}>
          <CardContent className="p-0">
            <div className="p-5 flex items-center">
              <div className={`mr-4 ${bettingStatus?.isOpen ? 'bg-green-600/10' : 'bg-red-500/10'} p-3 rounded-full`}>
                <Flag className={`h-6 w-6 ${bettingStatus?.isOpen ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Betting Status</p>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {isLoadingBettingStatus ? (
                    <Skeleton className="h-7 w-24" />
                  ) : (
                    bettingStatus?.isOpen ? "Open" : "Closed"
                  )}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Teams Value */}
        <Card className={`card-racing border-secondary/20 hover:border-secondary/50 transition-all duration-300 ${isMounted ? 'animate-slide-up' : 'opacity-0'}`} style={{animationDelay: '300ms'}}>
          <CardContent className="p-0">
            <div className="p-5 flex items-center">
              <div className="mr-4 bg-secondary/10 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">Portfolio Value</p>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {isLoadingTeams ? (
                    <Skeleton className="h-7 w-24" />
                  ) : teams?.length ? (
                    `${teams.reduce((sum, team) => sum + (team.currentCredits || 0), 0)} Credits`
                  ) : (
                    "0 Credits"
                  )}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Next Race Card */}
      <div className={`mb-8 ${isMounted ? 'animate-slide-up' : 'opacity-0'}`} style={{animationDelay: '400ms'}}>
        <div className="flex items-center mb-4">
          <Calendar className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-white">Next Race</h2>
        </div>
        
        {isLoadingNextRace ? (
          <Card className="card-racing">
            <CardContent className="p-6">
              <Skeleton className="h-[180px] w-full rounded-lg" />
            </CardContent>
          </Card>
        ) : nextRace ? (
          <RaceCard race={nextRace} />
        ) : (
          <Card className="card-racing-highlight">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">No Upcoming Races</h2>
              <p className="text-gray-400 mb-4">There are no upcoming races scheduled at the moment.</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Teams Overview */}
      <div className={`mb-8 ${isMounted ? 'animate-slide-up' : 'opacity-0'}`} style={{animationDelay: '500ms'}}>
        <div className="flex items-center mb-4">
          <Users className="mr-2 h-5 w-5 text-secondary" />
          <h2 className="text-xl font-bold text-white">Your Teams</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {isLoadingTeams ? (
            <>
              <Skeleton className="h-[300px] w-full rounded-lg" />
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </>
          ) : teams?.length ? (
            teams.map(team => (
              <TeamSummary key={team.id} team={team} />
            ))
          ) : (
            <Card className="card-racing-highlight col-span-2">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-white mb-2">No Teams Found</h2>
                <p className="text-gray-400 mb-6">You haven't created any teams yet.</p>
                <Button variant="default" size="lg" asChild className="font-medium btn-primary-glow">
                  <Link href="/teams">Go to Team Management</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      
      {/* Last Race Performance */}
      <div className={`${isMounted ? 'animate-slide-up' : 'opacity-0'}`} style={{animationDelay: '600ms'}}>
        <div className="flex items-center mb-4">
          <Trophy className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-white">Last Race Performance</h2>
        </div>
        
        {isLoadingRaces || isLoadingTeams || isLoadingAssetHistory ? (
          <Card className="card-racing">
            <CardContent className="p-6">
              <Skeleton className="h-[350px] w-full rounded-lg" />
            </CardContent>
          </Card>
        ) : lastRace && teams && assetValueHistory ? (
          <LastRacePerformance 
            race={lastRace} 
            userTeams={teams}
            assetValueHistory={assetValueHistory} 
          />
        ) : (
          <Card className="card-racing-highlight">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-white mb-2">No Performance Data Available</h2>
              <p className="text-gray-400">Team performance data will appear here once races are completed.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
