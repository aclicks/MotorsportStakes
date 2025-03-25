import { useQuery } from "@tanstack/react-query";
import { Race, RaceResult, UserTeamComplete, AssetValueHistory } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  TrendingUp, 
  TrendingDown, 
  User, 
  Car, 
  Cpu, 
  Activity, 
  Medal, 
  AlertCircle 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

interface LastRacePerformanceProps {
  race: Race;
  userTeams: UserTeamComplete[];
  assetValueHistory: AssetValueHistory[];
}

interface TeamPerformanceData {
  teamId: number;
  userId: number;
  username: string;
  teamName: string;
  teamType: string;
  driver1: AssetPerformance | null;
  driver2: AssetPerformance | null;
  engine: AssetPerformance | null;
  chassis: AssetPerformance | null;
  totalValueChange: number;
  isCurrentUser: boolean;
}

interface AssetPerformance {
  id: number;
  name: string;
  valueChange: number;
}

export default function LastRacePerformance({ race, userTeams, assetValueHistory }: LastRacePerformanceProps) {
  const { user } = useAuth();
  const { data: results, isLoading: isLoadingResults } = useQuery<RaceResult[]>({
    queryKey: [`/api/races/${race.id}/results`],
  });

  const formattedDate = format(new Date(race.date), "MMMM d, yyyy");

  // Process the data to show performance for each team
  const processTeamPerformance = (): TeamPerformanceData[] => {
    if (!userTeams || !assetValueHistory || userTeams.length === 0) {
      return [];
    }

    const performanceData: TeamPerformanceData[] = [];

    // Process each team's performance
    for (const team of userTeams) {
      // Get asset value changes for each team component from the race
      const driver1Change = team.driver1Id ? getAssetValueChange(team.driver1Id, 'driver', race.id) : 0;
      const driver2Change = team.driver2Id ? getAssetValueChange(team.driver2Id, 'driver', race.id) : 0;
      const engineChange = team.engineId ? getAssetValueChange(team.engineId, 'engine', race.id) : 0;
      const chassisChange = team.teamId ? getAssetValueChange(team.teamId, 'team', race.id) : 0;

      const totalValueChange = driver1Change + driver2Change + engineChange + chassisChange;

      performanceData.push({
        teamId: team.id,
        userId: team.userId,
        username: user?.id === team.userId ? "You" : `User ${team.userId}`,
        teamName: team.name,
        teamType: team.initialCredits === 1000 ? 'Premium' : 'Challenger',
        driver1: team.driver1 ? {
          id: team.driver1.id,
          name: team.driver1.name,
          valueChange: driver1Change,
        } : null,
        driver2: team.driver2 ? {
          id: team.driver2.id,
          name: team.driver2.name,
          valueChange: driver2Change,
        } : null,
        engine: team.engine ? {
          id: team.engine.id,
          name: team.engine.name,
          valueChange: engineChange,
        } : null,
        chassis: team.team ? {
          id: team.team.id,
          name: team.team.name,
          valueChange: chassisChange,
        } : null,
        totalValueChange,
        isCurrentUser: user?.id === team.userId
      });
    }

    // Sort by: current user first, then by total value change (highest first)
    return performanceData.sort((a, b) => {
      if (a.isCurrentUser && !b.isCurrentUser) return -1;
      if (!a.isCurrentUser && b.isCurrentUser) return 1;
      return b.totalValueChange - a.totalValueChange;
    });
  };

  const getAssetValueChange = (entityId: number, type: 'driver' | 'team' | 'engine', raceId: number): number => {
    const historyItem = assetValueHistory?.find(
      h => h.entityId === entityId && h.entityType === type && h.raceId === raceId
    );
    // Calculate value difference manually
    if (!historyItem) return 0;
    
    // Find previous race value, if available
    const previousRace = race.round > 1 ? 
      assetValueHistory?.find(
        h => h.entityId === entityId && 
        h.entityType === type && 
        h.raceId < raceId
      ) : null;
      
    // If we have a previous value, calculate the difference
    if (previousRace) {
      return historyItem.value - previousRace.value;
    }
    
    return 0;
  };

  const teamPerformances = processTeamPerformance();

  // Format value change with + or - sign and credits text
  const formatValueChange = (change: number) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change} credits`;
  };

  // Determine badge color based on value
  const getBadgeVariant = (value: number) => {
    if (value > 0) return "success";
    if (value < 0) return "destructive";
    return "secondary";
  };

  if (isLoadingResults) {
    return (
      <Card className="card-racing">
        <CardContent className="p-6">
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Card className="card-racing-highlight">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No Race Results Available</h2>
          <p className="text-gray-400">
            Results for {race.name} have not been submitted yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (teamPerformances.length === 0) {
    return (
      <Card className="card-racing-highlight">
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">No Team Performance Data</h2>
          <p className="text-gray-400">
            No performance data available for {race.name}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-racing overflow-hidden border-primary/20 hover:border-primary/40 transition-all duration-300">
      <div className="bg-gradient-to-r from-card to-muted relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-secondary/5 rounded-tr-full"></div>
        
        <CardContent className="p-6 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">{race.name} Performance</h3>
              <p className="text-sm text-gray-400">{formattedDate}</p>
            </div>
            
            <Badge variant="outline" className="mt-2 md:mt-0 px-3 py-1 bg-muted border-none">
              <Medal className="h-4 w-4 mr-1 text-yellow-400" />
              <span className="text-white">Race {race.round}</span>
            </Badge>
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            {teamPerformances.map((team, index) => (
              <AccordionItem 
                key={team.teamId} 
                value={`team-${team.teamId}`}
                className={`border-gray-800 overflow-hidden transition-colors ${team.isCurrentUser ? 'bg-muted/30' : ''}`}
              >
                <AccordionTrigger className="px-4 py-3 hover:bg-muted/30 text-white">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${team.isCurrentUser ? 'bg-primary/20' : 'bg-gray-800'}`}>
                        <User className={`h-4 w-4 ${team.isCurrentUser ? 'text-primary' : 'text-gray-400'}`} />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-white flex items-center">
                          {team.username}
                          {team.isCurrentUser && (
                            <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center">
                          {team.teamName}
                          <span className="inline-block mx-2 w-1 h-1 rounded-full bg-gray-600"></span>
                          <Badge 
                            variant={team.teamType === 'Premium' ? 'premium' : 'challenger'}
                            className="text-xs px-1.5 py-0"
                          >
                            {team.teamType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <Badge 
                        variant={getBadgeVariant(team.totalValueChange)}
                        className="font-semibold"
                      >
                        {team.totalValueChange > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 mr-1" />
                        ) : team.totalValueChange < 0 ? (
                          <TrendingDown className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <Activity className="h-3.5 w-3.5 mr-1" />
                        )}
                        {formatValueChange(team.totalValueChange)}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="bg-muted/20 text-gray-300 px-4 py-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Drivers section */}
                    <div className="space-y-2">
                      <h4 className="text-sm text-gray-400 mb-2">Drivers</h4>
                      
                      {/* Driver 1 */}
                      {team.driver1 ? (
                        <div className="flex items-center justify-between rounded-md bg-muted/10 p-2">
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2">
                              <User className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm">{team.driver1.name}</span>
                          </div>
                          <Badge variant={getBadgeVariant(team.driver1.valueChange)} className="text-xs">
                            {formatValueChange(team.driver1.valueChange)}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-md bg-muted/10 p-2 opacity-50">
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2">
                              <User className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm">No Driver Selected</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">+0 credits</Badge>
                        </div>
                      )}
                      
                      {/* Driver 2 */}
                      {team.driver2 ? (
                        <div className="flex items-center justify-between rounded-md bg-muted/10 p-2">
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2">
                              <User className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm">{team.driver2.name}</span>
                          </div>
                          <Badge variant={getBadgeVariant(team.driver2.valueChange)} className="text-xs">
                            {formatValueChange(team.driver2.valueChange)}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-md bg-muted/10 p-2 opacity-50">
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2">
                              <User className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm">No Driver Selected</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">+0 credits</Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Chassis and Engine section */}
                    <div className="space-y-2">
                      <h4 className="text-sm text-gray-400 mb-2">Team & Engine</h4>
                      
                      {/* Chassis */}
                      {team.chassis ? (
                        <div className="flex items-center justify-between rounded-md bg-muted/10 p-2">
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2">
                              <Car className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm">{team.chassis.name}</span>
                          </div>
                          <Badge variant={getBadgeVariant(team.chassis.valueChange)} className="text-xs">
                            {formatValueChange(team.chassis.valueChange)}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-md bg-muted/10 p-2 opacity-50">
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2">
                              <Car className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm">No Team Selected</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">+0 credits</Badge>
                        </div>
                      )}
                      
                      {/* Engine */}
                      {team.engine ? (
                        <div className="flex items-center justify-between rounded-md bg-muted/10 p-2">
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2">
                              <Engine className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm">{team.engine.name}</span>
                          </div>
                          <Badge variant={getBadgeVariant(team.engine.valueChange)} className="text-xs">
                            {formatValueChange(team.engine.valueChange)}
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-md bg-muted/10 p-2 opacity-50">
                          <div className="flex items-center">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center mr-2">
                              <Engine className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm">No Engine Selected</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">+0 credits</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </div>
    </Card>
  );
}