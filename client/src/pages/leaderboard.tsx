import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface PlayerRanking {
  rank: number;
  userId: number;
  username: string;
  totalValue: number;
  totalTeams: number;
  score: number;
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<string>("global");

  // Carregar dados do leaderboard
  const { 
    data: players, 
    isLoading: isLoadingPlayers 
  } = useQuery<PlayerRanking[]>({
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
                      <th className="px-4 py-3 text-right font-medium">Pontuação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingPlayers ? (
                      Array(10).fill(0).map((_, index) => (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-3"><Skeleton className="h-6 w-12" /></td>
                          <td className="px-4 py-3"><Skeleton className="h-6 w-40" /></td>
                          <td className="px-4 py-3 text-right"><Skeleton className="h-6 w-12 ml-auto" /></td>
                          <td className="px-4 py-3 text-right"><Skeleton className="h-6 w-20 ml-auto" /></td>
                          <td className="px-4 py-3 text-right"><Skeleton className="h-6 w-16 ml-auto" /></td>
                        </tr>
                      ))
                    ) : players?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                          Nenhum jogador encontrado
                        </td>
                      </tr>
                    ) : (
                      players?.map((player) => (
                        <tr key={player.userId} className="border-b hover:bg-neutral-50">
                          <td className="px-4 py-3">
                            {getRankBadge(player.rank)}
                          </td>
                          <td className="px-4 py-3 font-medium">{player.username}</td>
                          <td className="px-4 py-3 text-right">{player.totalTeams}</td>
                          <td className="px-4 py-3 text-right">
                            {player.totalValue.toLocaleString()} créditos
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-primary">
                            {player.score.toLocaleString()}
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
              <div className="flex items-center justify-center py-12">
                <p className="text-neutral-500">Classificação por times premium em breve...</p>
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
              <div className="flex items-center justify-center py-12">
                <p className="text-neutral-500">Classificação por times challenger em breve...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8 text-sm text-center text-neutral-500">
        <p>A pontuação é calculada com base no valor total de seus times e o número de times gerenciados.</p>
        <p>Classificação atualizada após a submissão de resultados de cada corrida.</p>
      </div>
    </div>
  );
}