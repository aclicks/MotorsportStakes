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
  ResponsiveContainer 
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Driver, Team, Engine, PerformanceHistory, AssetValueHistory } from "@shared/schema";
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

  // Get the current value of the selected entity
  let currentValue: number | undefined;
  let entityPositionInStandings: number | undefined;
  
  if (selectedId) {
    const id = parseInt(selectedId);
    switch (entityType) {
      case "driver":
        const driverStanding = driversData?.find(item => item.driver.id === id);
        currentValue = driverStanding?.driver.value;
        entityPositionInStandings = driverStanding?.position;
        break;
      case "team":
        const teamStanding = teamsData?.find(item => item.team.id === id);
        currentValue = teamStanding?.team.value;
        entityPositionInStandings = teamStanding?.position;
        break;
      case "engine":
        const engineStanding = enginesData?.find(item => item.engine.id === id);
        currentValue = engineStanding?.engine.value;
        entityPositionInStandings = engineStanding?.position;
        break;
    }
  }
  
  // Prepare performance data for the chart (race positions)
  const positionData = history?.map((entry) => ({
    name: entry.race?.name || `Race ${entry.raceId}`,
    position: entry.position,
    date: entry.race?.date ? format(new Date(entry.race.date), "dd MMM yyyy") : "",
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
          date: entry.race?.date ? format(new Date(entry.race.date), "dd MMM yyyy") : "",
          raceId: entry.raceId,
          timestamp: entry.race?.date ? new Date(entry.race.date).getTime() : 0
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
    console.log(`Using real asset value history data for ${entityType} ${selectedId}:`, chartData);
  } else if (positionData && positionData.length > 0 && currentValue) {
    // Fallback to position data with current value
    chartData = positionData.map(race => ({
      name: race.name,
      date: race.date,
      value: currentValue
    }));
    console.log(`Using fallback data for ${entityType} ${selectedId}:`, chartData);
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
        <h1 className="text-2xl font-bold text-neutral-800">Estatísticas de Desempenho</h1>
        <p className="text-neutral-500">Visualize o desempenho histórico de pilotos, equipes e motores ao longo da temporada.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Desempenho Histórico</CardTitle>
          <CardDescription>
            Selecione um piloto, equipe ou motor para visualizar seu desempenho ao longo do tempo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="driver" className="w-full" onValueChange={(value) => {
            setEntityType(value as "driver" | "team" | "engine");
            setSelectedId("");
          }}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="driver">Pilotos</TabsTrigger>
              <TabsTrigger value="team">Equipes</TabsTrigger>
              <TabsTrigger value="engine">Motores</TabsTrigger>
            </TabsList>

            <TabsContent value="driver">
              <div className="mb-6">
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um piloto" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingDrivers ? (
                      <div className="p-2">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ) : (
                      drivers.map((driver: Driver) => (
                        <SelectItem key={driver.id} value={driver.id.toString()}>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma equipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingTeams ? (
                      <div className="p-2">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ) : (
                      teams.map((team: Team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um motor" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingEngines ? (
                      <div className="p-2">
                        <Skeleton className="h-5 w-full" />
                      </div>
                    ) : (
                      engines.map((engine: Engine) => (
                        <SelectItem key={engine.id} value={engine.id.toString()}>
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">
                    Histórico de Desempenho: {getEntityName()}
                  </h3>
                  {currentValue !== undefined && (
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-md">
                      <span className="font-medium">Valor Atual:</span> {currentValue.toLocaleString()} créditos
                    </div>
                  )}
                </div>
                {isLoadingHistory || isLoadingAssetValueHistory ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : !chartData || chartData.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    {currentValue !== undefined ? (
                      <>
                        <p className="mb-2">Sem dados históricos de corridas disponíveis para este {entityType === "driver" ? "piloto" : entityType === "team" ? "equipe" : "motor"}.</p>
                        <p>Valor atual: <span className="font-semibold text-primary">{currentValue.toLocaleString()} créditos</span></p>
                        {entityPositionInStandings && (
                          <p className="mt-2 text-sm">Posição atual: {entityPositionInStandings}º lugar</p>
                        )}
                      </>
                    ) : (
                      "Sem dados históricos disponíveis para esta seleção."
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
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
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
                        formatter={(value: number) => {
                          return [
                            `${value.toLocaleString()} créditos`,
                            ""
                          ];
                        }}
                        labelFormatter={(label, entries) => {
                          const entry = entries[0]?.payload;
                          return entry?.date 
                            ? `${label} | ${entry.date}` 
                            : `${label}`;
                        }}
                        contentStyle={{ 
                          backgroundColor: "rgba(255, 255, 255, 0.8)",
                          borderRadius: "5px",
                          padding: "10px",
                          border: "1px solid #ccc" 
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="var(--primary)"
                        strokeWidth={2}
                        fill="url(#colorValue)"
                        fillOpacity={1}
                        connectNulls
                        dot={{ 
                          stroke: 'var(--primary)', 
                          strokeWidth: 2, 
                          r: 6,
                          fill: 'white' 
                        }}
                        activeDot={{ 
                          r: 8, 
                          stroke: 'var(--primary)',
                          strokeWidth: 2,
                          fill: 'var(--primary)' 
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