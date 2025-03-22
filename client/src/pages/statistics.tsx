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
import { Driver, Team, Engine, PerformanceHistory } from "@shared/schema";
import { format } from "date-fns";

interface EnhancedPerformanceHistory extends PerformanceHistory {
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

  // Prepare data for the chart - filter out positions that are 0 (invalid)
  const chartData = history?.map((entry) => ({
    name: entry.race?.name || `Race ${entry.raceId}`,
    position: entry.position,
    date: entry.race?.date ? format(new Date(entry.race.date), "dd MMM yyyy") : "",
  })).filter(entry => entry.position > 0);
  
  // Get the average position from standings data when no valid history data
  let averagePosition: number | undefined;
  
  // First try to get it from race history data
  if (chartData && chartData.length > 0) {
    averagePosition = Number((chartData.reduce((sum, entry) => sum + entry.position, 0) / chartData.length).toFixed(2));
  } 
  // If no valid race history data, try to get the position from standings
  else if (selectedId) {
    const id = parseInt(selectedId);
    switch (entityType) {
      case "driver":
        const driverStanding = driversData?.find(item => item.driver.id === id);
        averagePosition = driverStanding?.position;
        break;
      case "team":
        const teamStanding = teamsData?.find(item => item.team.id === id);
        averagePosition = teamStanding?.position;
        break;
      case "engine":
        const engineStanding = enginesData?.find(item => item.engine.id === id);
        averagePosition = engineStanding?.position;
        break;
    }
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
                  {averagePosition !== undefined && (
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-md">
                      <span className="font-medium">Posição Média:</span> {averagePosition}
                    </div>
                  )}
                </div>
                {isLoadingHistory ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : !history || history.length === 0 || !chartData || chartData.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    {averagePosition !== undefined ? (
                      <>
                        <p className="mb-2">Sem dados históricos de corridas disponíveis para este {entityType === "driver" ? "piloto" : entityType === "team" ? "equipe" : "motor"}.</p>
                        <p>Posição atual no campeonato: <span className="font-semibold text-primary">{averagePosition}º lugar</span></p>
                      </>
                    ) : (
                      "Sem dados históricos disponíveis para esta seleção ou todos os dados de posição são inválidos (posição 0)."
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
                      <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#666' }}
                        tickSize={8}
                        axisLine={{ stroke: '#999' }}
                        tickMargin={10}
                      />
                      {/* Posição invertida para melhor visualização (menor = melhor) */}
                      <YAxis 
                        reversed 
                        domain={[1, 20]}
                        tick={{ fill: '#666' }}
                        axisLine={{ stroke: '#999' }}
                        tickSize={8}
                        tickCount={10}
                        label={{ 
                          value: 'Posição Final', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fill: '#666' }
                        }}
                      />
                      <Tooltip
                        formatter={(value: number) => {
                          return [
                            `${value}ª Posição`, 
                            value < (averagePosition || 10) 
                              ? 'Acima da Média 🔼' 
                              : value > (averagePosition || 10) 
                                ? 'Abaixo da Média 🔽' 
                                : 'Na Média ◼️'
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
                      <Line
                        type="monotone"
                        dataKey="position"
                        stroke="var(--primary)"
                        strokeWidth={3}
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
                        name="Posição"
                      />
                      {averagePosition !== undefined && (
                        <ReferenceLine
                          y={averagePosition}
                          stroke="#ff7300"
                          strokeDasharray="3 3"
                          label={{
                            value: `Média: ${averagePosition}`,
                            fill: '#ff7300',
                            fontSize: 12,
                            position: 'insideBottomRight'
                          }}
                        />
                      )}
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