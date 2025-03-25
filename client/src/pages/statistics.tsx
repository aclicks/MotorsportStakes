import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Area
} from "recharts";
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Driver, Team, Engine, PerformanceHistory, AssetValueHistory, ValuationTable } from "@shared/schema";
import { format } from "date-fns";

interface EnhancedPerformanceHistory extends PerformanceHistory {
  race?: {
    name: string;
    date: string;
  };
}

interface EnhancedAssetValueHistory extends AssetValueHistory {
  race?: {
    name: string;
    date: string;
  };
}

export default function Statistics() {
  const [entityType, setEntityType] = useState<"driver" | "team" | "engine">("driver");
  const [selectedId, setSelectedId] = useState<string>("");

  // Define tipos para os dados de classificação
  type DriverStanding = { position: number; driver: Driver & { team?: Team } };
  type TeamStanding = { position: number; team: Team };
  type EngineStanding = { position: number; engine: Engine };

  // Fetch drivers, teams, and engines for dropdowns
  const { data: driversData, isLoading: isLoadingDrivers } = useQuery<DriverStanding[]>({
    queryKey: ["/api/standings/drivers"],
  });
  const drivers = driversData ? driversData.map(item => item.driver) : [];

  const { data: teamsData, isLoading: isLoadingTeams } = useQuery<TeamStanding[]>({
    queryKey: ["/api/standings/teams"],
  });
  const teams = teamsData ? teamsData.map(item => item.team) : [];

  const { data: enginesData, isLoading: isLoadingEngines } = useQuery<EngineStanding[]>({
    queryKey: ["/api/standings/engines"],
  });
  const engines = enginesData ? enginesData.map(item => item.engine) : [];

  // Fetch performance history for selected entity
  const { data: history, isLoading: isLoadingHistory } = useQuery<EnhancedPerformanceHistory[]>({
    queryKey: [selectedId ? `/api/performance-history/${entityType}/${selectedId}` : "/api/performance-history"],
    enabled: !!selectedId,
  });
  
  // Fetch asset value history for selected entity
  const { data: assetValueHistory, isLoading: isLoadingAssetValueHistory } = useQuery<EnhancedAssetValueHistory[]>({
    queryKey: [selectedId ? `/api/asset-value-history/${entityType}/${selectedId}` : "/api/asset-value-history"],
    enabled: !!selectedId,
  });
  
  // Fetch valuation table for reference percentages
  const { data: valuationTable, isLoading: isLoadingValuationTable } = useQuery<ValuationTable[]>({
    queryKey: ["/api/valuation-table"],
  });

  // Get the current value of the selected entity
  let databaseValue: number | undefined;
  let currentValue: number | undefined;
  let entityPositionInStandings: number | undefined;
  
  if (selectedId) {
    const id = parseInt(selectedId);
    switch (entityType) {
      case "driver":
        const driverStanding = driversData?.find(item => item.driver.id === id);
        databaseValue = driverStanding?.driver.value;
        entityPositionInStandings = driverStanding?.position;
        break;
      case "team":
        const teamStanding = teamsData?.find(item => item.team.id === id);
        databaseValue = teamStanding?.team.value;
        entityPositionInStandings = teamStanding?.position;
        break;
      case "engine":
        const engineStanding = enginesData?.find(item => item.engine.id === id);
        databaseValue = engineStanding?.engine.value;
        entityPositionInStandings = engineStanding?.position;
        break;
    }
  }
  
  // Prepare performance data for the chart (race positions)
  const positionData = history?.map((entry) => ({
    name: entry.race?.name || `Race ${entry.raceId}`,
    position: entry.position,
    date: entry.race?.date ? format(new Date(entry.race.date), "dd/MM/yyyy") : "",
  })).filter(entry => entry.position > 0);
  
  // Prepare asset value data for the chart
  // Process the asset value history to ensure we have only one data point per race
  // Use a Map to deduplicate entries by raceId, keeping the latest entry
  const valueDataMap = new Map();
  
  if (assetValueHistory && assetValueHistory.length > 0) {
    // First, sort by createdAt to ensure we keep the latest entry for each race
    const sortedHistory = [...assetValueHistory].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Latest first
    });
    
    // Then, use a Map to deduplicate by raceId
    sortedHistory.forEach(entry => {
      if (!valueDataMap.has(entry.raceId)) {
        valueDataMap.set(entry.raceId, {
          name: entry.race?.name || `Race ${entry.raceId}`,
          value: entry.value,
          date: entry.race?.date ? format(new Date(entry.race.date), "dd/MM/yyyy") : "",
          raceId: entry.raceId,
          timestamp: entry.race?.date ? new Date(entry.race.date).getTime() : 0,
          previousRaceId: entry.raceId > 1 ? entry.raceId - 1 : null
        });
      }
    });
  }
  
  // Convert the Map values to an array and sort by race date
  const valueData = Array.from(valueDataMap.values())
    .sort((a, b) => a.timestamp - b.timestamp); // Sort chronologically
  
  // Create the chart data using asset value history if available
  // If no asset value history is available, use the current value for all races
  let chartData: any[] = [];
  
  if (valueData && valueData.length > 0) {
    // Use actual asset value history data
    chartData = valueData;
    
    // Get the most recent value for the "Valor Atual" display
    const latestValueData = [...valueData].sort((a, b) => b.timestamp - a.timestamp)[0];
    if (latestValueData) {
      currentValue = latestValueData.value;
    }
    
    console.log(`Using real asset value history data for ${entityType} ${selectedId}:`, chartData);
  } else if (positionData && positionData.length > 0 && databaseValue) {
    // Fallback to position data with database value
    chartData = positionData.map(race => ({
      name: race.name,
      date: race.date,
      value: databaseValue
    }));
    currentValue = databaseValue;
    console.log(`Using fallback data for ${entityType} ${selectedId}:`, chartData);
  } else {
    // No data available, use database value if available
    currentValue = databaseValue;
  }
  
  // Log data for debugging
  console.log(`Statistics chart data for ${entityType} ${selectedId}:`, chartData);
  
  // For position average, continue to use position data (for reference in UI)
  let averagePosition: number | undefined;
  
  if (positionData && positionData.length > 0) {
    averagePosition = Number((positionData.reduce((sum, entry) => sum + entry.position, 0) / positionData.length).toFixed(2));
  }
  else if (selectedId) {
    averagePosition = entityPositionInStandings;
  }

  // Find the name of the selected entity
  const getEntityName = (): string => {
    if (!selectedId) return "";
    
    const id = parseInt(selectedId);
    switch (entityType) {
      case "driver":
        return drivers?.find((d: Driver) => d.id === id)?.name || "";
      case "team":
        return teams?.find((t: Team) => t.id === id)?.name || "";
      case "engine":
        return engines?.find((e: Engine) => e.id === id)?.name || "";
      default:
        return "";
    }
  };

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-red-600 bg-clip-text text-transparent">Estatísticas de Desempenho</h1>
        <p className="text-foreground/70">Visualize o desempenho histórico de pilotos, equipes e motores ao longo da temporada.</p>
      </header>

      <Card className="border border-neutral-300 shadow-md">
        <CardHeader className="border-b border-neutral-200 pb-4">
          <CardTitle className="text-2xl font-bold bg-gradient-to-br from-primary to-amber-500 bg-clip-text text-transparent">Desempenho Histórico</CardTitle>
          <CardDescription className="text-foreground/70">
            Selecione um piloto, equipe ou motor para visualizar seu desempenho ao longo do tempo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="driver" className="w-full" onValueChange={(value) => {
            setEntityType(value as "driver" | "team" | "engine");
            setSelectedId("");
          }}>
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-zinc-800 p-1 rounded-md border border-zinc-700/50 shadow-md">
              <TabsTrigger value="driver" className="data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all duration-300 text-zinc-300 hover:text-white hover:bg-zinc-700/50">Pilotos</TabsTrigger>
              <TabsTrigger value="team" className="data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all duration-300 text-zinc-300 hover:text-white hover:bg-zinc-700/50">Equipes</TabsTrigger>
              <TabsTrigger value="engine" className="data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all duration-300 text-zinc-300 hover:text-white hover:bg-zinc-700/50">Motores</TabsTrigger>
            </TabsList>

            <TabsContent value="driver">
              <div className="mb-6">
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="border-neutral-300 transition-all duration-200 hover:border-primary focus:border-primary shadow-sm">
                    <SelectValue placeholder="Selecione um piloto" />
                  </SelectTrigger>
                  <SelectContent className="border-neutral-300 shadow-md">
                    {isLoadingDrivers ? (
                      <div className="p-2">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ) : (
                      drivers.map((driver: Driver) => (
                        <SelectItem 
                          key={driver.id} 
                          value={driver.id.toString()}
                          className="transition-colors hover:bg-neutral-100"
                        >
                          {driver.name} ({driver.number})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="team">
              <div className="mb-6">
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="border-neutral-300 transition-all duration-200 hover:border-primary focus:border-primary shadow-sm">
                    <SelectValue placeholder="Selecione uma equipe" />
                  </SelectTrigger>
                  <SelectContent className="border-neutral-300 shadow-md">
                    {isLoadingTeams ? (
                      <div className="p-2">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ) : (
                      teams.map((team: Team) => (
                        <SelectItem 
                          key={team.id} 
                          value={team.id.toString()}
                          className="transition-colors hover:bg-neutral-100"
                        >
                          {team.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="engine">
              <div className="mb-6">
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger className="border-neutral-300 transition-all duration-200 hover:border-primary focus:border-primary shadow-sm">
                    <SelectValue placeholder="Selecione um motor" />
                  </SelectTrigger>
                  <SelectContent className="border-neutral-300 shadow-md">
                    {isLoadingEngines ? (
                      <div className="p-2">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ) : (
                      engines.map((engine: Engine) => (
                        <SelectItem 
                          key={engine.id} 
                          value={engine.id.toString()}
                          className="transition-colors hover:bg-neutral-100"
                        >
                          {engine.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            {selectedId && (
              <div className="mt-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 bg-neutral-50 p-4 rounded-lg border border-neutral-200 shadow-sm">
                  <h3 className="text-xl font-bold text-neutral-800">
                    <span className="bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">{getEntityName()}</span>
                  </h3>
                  
                  {currentValue !== undefined && (
                    <div className="flex flex-col sm:items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-neutral-800">{currentValue.toLocaleString()} créditos</span>
                        {entityPositionInStandings && (
                          <span className="bg-neutral-800 text-white text-xs font-medium px-2 py-1 rounded-full">
                            {entityPositionInStandings}º
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-neutral-500">Valor atual no mercado</span>
                    </div>
                  )}
                </div>
                {isLoadingHistory || isLoadingAssetValueHistory ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : !chartData || chartData.length === 0 ? (
                  <div className="text-center py-12 px-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                    {currentValue !== undefined ? (
                      <>
                        <div className="mb-6">
                          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3 opacity-70" />
                          <h4 className="text-lg font-semibold text-neutral-800 mb-2">Sem histórico disponível</h4>
                          <p className="text-neutral-600 max-w-md mx-auto">
                            Não existem dados históricos de corridas disponíveis para 
                            {entityType === "driver" ? " este piloto" : entityType === "team" ? " esta equipe" : " este motor"}.
                          </p>
                        </div>
                        
                        <div className="inline-flex items-center justify-center px-4 py-2 bg-white border border-neutral-200 rounded-lg shadow-sm">
                          <div className="flex flex-col">
                            <span className="text-xs text-neutral-500 uppercase tracking-wider">Valor Inicial</span>
                            <span className="font-bold text-primary">{currentValue.toLocaleString()} créditos</span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-neutral-500">
                        <AlertCircle className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p>Sem dados históricos disponíveis para esta seleção.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={chartData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#FACC15" stopOpacity={0.8}/>
                          <stop offset="50%" stopColor="#EAB308" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#FACC15" stopOpacity={0.8}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} stroke="#ccc" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#666' }}
                        tickSize={8}
                        axisLine={{ stroke: '#999' }}
                        tickMargin={10}
                      />
                      <YAxis 
                        domain={['auto', 'auto']}
                        tick={{ fill: '#666' }}
                        axisLine={{ stroke: '#999' }}
                        tickSize={8}
                        tickCount={10}
                        label={{ 
                          value: 'Valor (créditos)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fill: '#666' }
                        }}
                      />
                      <Tooltip
                        formatter={(value: number, name: any) => {
                          // Get the current entry index to calculate percentage change
                          const currentIndex = chartData.findIndex(item => item.value === value);
                          let percentChange = null;
                          let valuePercentage = null;
                          
                          // Get chart data for the current point
                          const currentPoint = chartData[currentIndex];
                          const raceId = currentPoint?.raceId;
                          const previousRaceId = currentPoint?.previousRaceId;
                          
                          // Find the actual race results to find the valuation difference
                          if (history && history.length > 0 && raceId) {
                            // Find performance history entries for the current and previous race
                            const currentRacePerf = history.find(entry => entry.raceId === raceId);
                            const previousRaces = history.filter(entry => 
                              entry.raceId < raceId
                            ).sort((a, b) => b.raceId - a.raceId);
                            
                            // Calculate the average previous position (last 3 races)
                            if (currentRacePerf && previousRaces.length > 0) {
                              // Get positions from up to 3 previous races
                              const previousPositions = previousRaces.slice(0, 3)
                                .map(entry => entry.position)
                                .filter(pos => pos > 0);
                                
                              if (previousPositions.length > 0) {
                                const avgPrevPosition = previousPositions.reduce((sum, pos) => sum + pos, 0) / previousPositions.length;
                                const posDifference = Math.round(avgPrevPosition - currentRacePerf.position);
                                
                                // Look up the actual valuation percentage from the table
                                if (valuationTable && valuationTable.length > 0) {
                                  const valuationEntry = valuationTable.find(entry => entry.difference === posDifference);
                                  if (valuationEntry) {
                                    valuePercentage = Number(valuationEntry.percentageChange);
                                  }
                                }
                              }
                            }
                          }
                          
                          // If we don't find the exact percentage, calculate it from values as fallback
                          if (valuePercentage === null && currentIndex > 0) {
                            const previousValue = chartData[currentIndex - 1].value;
                            percentChange = ((value - previousValue) / previousValue) * 100;
                          }
                          
                          // Use the exact valuation percentage if available, otherwise use calculated
                          const displayPercentage = valuePercentage !== null ? valuePercentage : percentChange;
                          
                          return [
                            <>
                              <span>{value.toLocaleString()} créditos</span>
                              {displayPercentage !== null && (
                                <div className="mt-1">
                                  <span className={`font-semibold ${displayPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {displayPercentage >= 0 ? '▲' : '▼'} {Math.abs(displayPercentage).toFixed(2)}%
                                  </span>
                                  <span className="text-gray-500 text-xs ml-1">
                                    {valuePercentage !== null 
                                      ? '(tabela de valorização)' 
                                      : 'vs anterior'
                                    }
                                  </span>
                                </div>
                              )}
                            </>,
                            ""
                          ];
                        }}
                        labelFormatter={(label: any) => {
                          // Find the entry with this label
                          const entry = chartData.find(item => item.name === label);
                          return entry?.date 
                            ? `${label} | ${entry.date}` 
                            : `${label}`;
                        }}
                        contentStyle={{ 
                          backgroundColor: "rgba(18, 18, 18, 0.9)",
                          borderRadius: "5px",
                          padding: "10px",
                          border: "1px solid #333",
                          color: "#eee"
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="url(#colorValue)"
                        strokeWidth={3}
                        connectNulls
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-in-out"
                        dot={{ 
                          stroke: '#EAB308', 
                          strokeWidth: 2, 
                          r: 6,
                          fill: 'white',
                          strokeDasharray: ''
                        }}
                        activeDot={{ 
                          r: 8, 
                          stroke: '#EAB308',
                          strokeWidth: 2,
                          fill: '#EAB308',
                          strokeOpacity: 0.8
                        }}
                        name="Valor"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}