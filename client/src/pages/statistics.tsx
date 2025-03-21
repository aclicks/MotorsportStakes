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

  // Fetch drivers, teams, and engines for dropdowns
  const { data: driversData, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ["/api/standings/drivers"],
  });
  const drivers = driversData?.map(item => item.driver);

  const { data: teamsData, isLoading: isLoadingTeams } = useQuery({
    queryKey: ["/api/standings/teams"],
  });
  const teams = teamsData?.map(item => item.team);

  const { data: enginesData, isLoading: isLoadingEngines } = useQuery({
    queryKey: ["/api/standings/engines"],
  });
  const engines = enginesData?.map(item => item.engine);

  // Fetch performance history for selected entity
  const { data: history, isLoading: isLoadingHistory } = useQuery<EnhancedPerformanceHistory[]>({
    queryKey: ["/api/performance-history", entityType, selectedId],
    enabled: !!selectedId,
  });

  // Prepare data for the chart
  const chartData = history?.map((entry) => ({
    name: entry.race?.name || `Race ${entry.raceId}`,
    position: entry.position,
    date: entry.race?.date ? format(new Date(entry.race.date), "dd MMM yyyy") : "",
  }));

  // Find the name of the selected entity
  const getEntityName = () => {
    if (!selectedId) return "";
    
    const id = parseInt(selectedId);
    switch (entityType) {
      case "driver":
        return drivers?.find(d => d.id === id)?.name || "";
      case "team":
        return teams?.find(t => t.id === id)?.name || "";
      case "engine":
        return engines?.find(e => e.id === id)?.name || "";
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
                      drivers?.map((driver) => (
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
                      teams?.map((team) => (
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
                      engines?.map((engine) => (
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
                <h3 className="text-lg font-medium mb-4">
                  Histórico de Desempenho: {getEntityName()}
                </h3>
                {isLoadingHistory ? (
                  <Skeleton className="h-[400px] w-full" />
                ) : !history || history.length === 0 ? (
                  <div className="text-center py-12 text-neutral-500">
                    Sem dados históricos disponíveis para esta seleção.
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
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      {/* Posição invertida para melhor visualização (menor = melhor) */}
                      <YAxis reversed domain={[1, 20]} />
                      <Tooltip
                        formatter={(value: number) => [`Posição: ${value}`, 'Posição']}
                        labelFormatter={(label) => `Corrida: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="position"
                        stroke="#8884d8"
                        activeDot={{ r: 8 }}
                        name="Posição"
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