import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

// Interfaces for leaderboard data
interface PlayerRanking {
  rank: number;
  userId: number;
  username: string;
  totalValue: number;
  totalTeams: number;
}

interface TeamRanking {
  rank: number;
  userId: number;
  username: string;
  teamId: number;
  teamName: string;
  value: number;
  credits: number;
  totalBudget: number;
}

interface LeaderboardData {
  global: PlayerRanking[];
  premium: TeamRanking[];
  challenger: TeamRanking[];
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<string>("global");

  // Carregando dados de todos os leaderboards
  const { 
    data: leaderboardData, 
    isLoading
  } = useQuery<LeaderboardData>({
    queryKey: ["/api/leaderboard"],
  });

  // Função para exibir medalhas para os três primeiros colocados
  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-white">🏆 1º</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-white">🥈 2º</Badge>;
    if (rank === 3) return <Badge className="bg-amber-700 text-white">🥉 3º</Badge>;
    return <Badge variant="outline">{rank}º</Badge>;
  };

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Classificação de Jogadores</h1>
        <p className="text-neutral-500">Veja quem está dominando a temporada de Motorsport Stakes</p>
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-neutral-600">Carregando classificações...</span>
        </div>
      ) : (
        <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="global">Classificação Global</TabsTrigger>
            <TabsTrigger value="premium">Times Premium</TabsTrigger>
            <TabsTrigger value="challenger">Times Challenger</TabsTrigger>
          </TabsList>
          
          <TabsContent value="global">
            <Card>
              <CardHeader>
                <CardTitle>Classificação Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-medium">Posição</th>
                        <th className="px-4 py-3 text-left font-medium">Jogador</th>
                        <th className="px-4 py-3 text-right font-medium">Times</th>
                        <th className="px-4 py-3 text-right font-medium">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData?.global.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                            Nenhum jogador encontrado
                          </td>
                        </tr>
                      ) : (
                        leaderboardData?.global.map((player) => (
                          <tr key={player.userId} className="border-b hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              {getRankBadge(player.rank)}
                            </td>
                            <td className="px-4 py-3 font-medium">{player.username}</td>
                            <td className="px-4 py-3 text-right">{player.totalTeams}</td>
                            <td className="px-4 py-3 text-right font-bold text-primary">
                              {player.totalValue.toLocaleString()} créditos
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="premium">
            <Card>
              <CardHeader>
                <CardTitle>Classificação de Times Premium</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-medium">Posição</th>
                        <th className="px-4 py-3 text-left font-medium">Jogador</th>
                        <th className="px-4 py-3 text-left font-medium">Time</th>
                        <th className="px-4 py-3 text-right font-medium">Créditos</th>
                        <th className="px-4 py-3 text-right font-medium">Valor dos Ativos</th>
                        <th className="px-4 py-3 text-right font-medium">Budget Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData?.premium.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                            Nenhum time premium encontrado
                          </td>
                        </tr>
                      ) : (
                        leaderboardData?.premium.map((team) => (
                          <tr key={`${team.userId}-${team.teamId}`} className="border-b hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              {getRankBadge(team.rank)}
                            </td>
                            <td className="px-4 py-3 font-medium">{team.username}</td>
                            <td className="px-4 py-3">{team.teamName}</td>
                            <td className="px-4 py-3 text-right">
                              {team.credits.toLocaleString()} créditos
                            </td>
                            <td className="px-4 py-3 text-right">
                              {team.value.toLocaleString()} créditos
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-primary">
                              {(team.totalBudget ?? (team.value + team.credits)).toLocaleString()} créditos
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-neutral-500">
                  <p>Times Premium começam com 1000 créditos iniciais.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="challenger">
            <Card>
              <CardHeader>
                <CardTitle>Classificação de Times Challenger</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-medium">Posição</th>
                        <th className="px-4 py-3 text-left font-medium">Jogador</th>
                        <th className="px-4 py-3 text-left font-medium">Time</th>
                        <th className="px-4 py-3 text-right font-medium">Créditos</th>
                        <th className="px-4 py-3 text-right font-medium">Valor dos Ativos</th>
                        <th className="px-4 py-3 text-right font-medium">Budget Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData?.challenger.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                            Nenhum time challenger encontrado
                          </td>
                        </tr>
                      ) : (
                        leaderboardData?.challenger.map((team) => (
                          <tr key={`${team.userId}-${team.teamId}`} className="border-b hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              {getRankBadge(team.rank)}
                            </td>
                            <td className="px-4 py-3 font-medium">{team.username}</td>
                            <td className="px-4 py-3">{team.teamName}</td>
                            <td className="px-4 py-3 text-right">
                              {team.credits.toLocaleString()} créditos
                            </td>
                            <td className="px-4 py-3 text-right">
                              {team.value.toLocaleString()} créditos
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-primary">
                              {(team.totalBudget ?? (team.value + team.credits)).toLocaleString()} créditos
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-neutral-500">
                  <p>Times Challenger começam com 700 créditos iniciais.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      <div className="mt-8 text-sm text-center text-neutral-500">
        <p>A classificação é baseada no budget total (valor dos ativos + créditos disponíveis).</p>
        <p>Todos os times iniciam com o mesmo budget total (1000 ou 700 créditos).</p>
        <p>Classificação atualizada após a submissão de resultados de cada corrida.</p>
      </div>
    </div>
  );
}