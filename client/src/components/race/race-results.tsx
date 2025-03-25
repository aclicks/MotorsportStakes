import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Race, RaceResult, Driver } from "@shared/schema";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RaceResultsProps {
  race: Race;
}

interface EnhancedRaceResult extends RaceResult {
  driver?: {
    name: string;
    number: number;
    id: number;
  };
  team?: {
    name: string;
    id: number;
  };
  engine?: {
    name: string;
    id: number;
  };
}

export default function RaceResults({ race }: RaceResultsProps) {
  const { data: results, isLoading } = useQuery<EnhancedRaceResult[]>({
    queryKey: [`/api/races/${race.id}/results`],
  });

  // Get asset value changes from the history
  const { data: assetValueHistory } = useQuery({
    queryKey: ["/api/asset-value-history"],
  });

  const formattedDate = format(new Date(race.date), "dd/MM/yyyy");

  // Function to get the value change for an asset from the last race
  const getAssetValueChange = (entityId: number, entityType: 'driver' | 'team' | 'engine') => {
    if (!assetValueHistory || !Array.isArray(assetValueHistory)) return null;
    
    // Filter history by entity ID and type
    const history = assetValueHistory.filter(
      (h: any) => h.entityId === entityId && h.entityType === entityType && h.raceId === race.id
    );
    
    if (history.length === 0) return null;
    
    // Get the current race value change
    const valueChange = history[0];
    if (!valueChange.previousValue) return null;
    
    const difference = valueChange.value - valueChange.previousValue;
    const percentChange = ((difference / valueChange.previousValue) * 100).toFixed(1);
    
    return { 
      value: difference,
      percent: percentChange,
      isPositive: difference > 0 
    };
  };

  // Helper to render value change display
  const renderValueChange = (change: { value: number, percent: string, isPositive: boolean } | null) => {
    if (!change) return <span className="text-neutral-400">N/A</span>;
    
    const Icon = change.isPositive ? TrendingUp : TrendingDown;
    const colorClass = change.isPositive ? "text-success" : "text-error";
    const bgClass = change.isPositive ? "bg-success/10" : "bg-error/10";
    
    return (
      <div className={`flex items-center px-2 py-0.5 rounded-full ${bgClass} ${colorClass} text-xs font-medium`}>
        <Icon className="h-3 w-3 mr-1" />
        <span>{change.isPositive ? '+' : ''}{change.value} ({change.percent}%)</span>
      </div>
    );
  };

  // Group results by entity type
  const driverResults = results?.sort((a, b) => (a.position || 99) - (b.position || 99)) || [];
  
  // Extract team and engine IDs from results
  const getUniqueTeams = () => {
    const teams = new Set<number>();
    driverResults.forEach(result => {
      if (result.team?.id) teams.add(result.team.id);
    });
    return Array.from(teams);
  };
  
  const getUniqueEngines = () => {
    const engines = new Set<number>();
    driverResults.forEach(result => {
      if (result.engine?.id) engines.add(result.engine.id);
    });
    return Array.from(engines);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-semibold text-neutral-800">
              Last Race: {race.name}
            </CardTitle>
            <CardDescription className="text-neutral-500">
              {formattedDate}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-2">
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <Tabs defaultValue="drivers">
            <TabsList className="mb-4">
              <TabsTrigger value="drivers">Driver Results</TabsTrigger>
              <TabsTrigger value="assets">Asset Value Changes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="drivers">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-100">
                      <TableHead className="font-medium text-neutral-500">Position</TableHead>
                      <TableHead className="font-medium text-neutral-500">Driver</TableHead>
                      <TableHead className="font-medium text-neutral-500">Team</TableHead>
                      <TableHead className="font-medium text-neutral-500">Valuation Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driverResults.map((result) => (
                      <TableRow key={result.id} className="border-b border-neutral-200">
                        <TableCell>{result.position}</TableCell>
                        <TableCell>{result.driver?.name || "Unknown Driver"}</TableCell>
                        <TableCell>{result.team?.name || "Unknown Team"}</TableCell>
                        <TableCell>
                          {result.driver && renderValueChange(getAssetValueChange(result.driver.id, 'driver'))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="assets">
              <div className="space-y-6">
                {/* Driver value changes */}
                <div>
                  <h3 className="text-md font-medium mb-2">Driver Value Changes</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-neutral-100">
                          <TableHead className="font-medium text-neutral-500">Driver</TableHead>
                          <TableHead className="font-medium text-neutral-500">Team</TableHead>
                          <TableHead className="font-medium text-neutral-500">Position</TableHead>
                          <TableHead className="font-medium text-neutral-500">Value Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {driverResults.map((result) => (
                          <TableRow key={result.id} className="border-b border-neutral-200">
                            <TableCell>{result.driver?.name || "Unknown Driver"}</TableCell>
                            <TableCell>{result.team?.name || "Unknown Team"}</TableCell>
                            <TableCell>{result.position}</TableCell>
                            <TableCell>
                              {result.driver && renderValueChange(getAssetValueChange(result.driver.id, 'driver'))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Team value changes */}
                <div>
                  <h3 className="text-md font-medium mb-2">Team Value Changes</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-neutral-100">
                          <TableHead className="font-medium text-neutral-500">Team</TableHead>
                          <TableHead className="font-medium text-neutral-500">Value Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getUniqueTeams().map((teamId) => {
                          const teamName = driverResults.find(r => r.team?.id === teamId)?.team?.name;
                          return (
                            <TableRow key={teamId} className="border-b border-neutral-200">
                              <TableCell>{teamName || "Unknown Team"}</TableCell>
                              <TableCell>
                                {renderValueChange(getAssetValueChange(teamId, 'team'))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Engine value changes */}
                <div>
                  <h3 className="text-md font-medium mb-2">Engine Value Changes</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-neutral-100">
                          <TableHead className="font-medium text-neutral-500">Engine</TableHead>
                          <TableHead className="font-medium text-neutral-500">Value Change</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getUniqueEngines().map((engineId) => {
                          const engineName = driverResults.find(r => r.engine?.id === engineId)?.engine?.name;
                          return (
                            <TableRow key={engineId} className="border-b border-neutral-200">
                              <TableCell>{engineName || "Unknown Engine"}</TableCell>
                              <TableCell>
                                {renderValueChange(getAssetValueChange(engineId, 'engine'))}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
