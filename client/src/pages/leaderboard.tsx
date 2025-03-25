import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Medal, Trophy, Star, Search, Users, RefreshCw, Info, Crown, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Interfaces for leaderboard data
interface PlayerRanking {
  rank: number;
  userId: number;
  username: string;
  totalCredits: number; // Changed from totalValue
  totalTeams: number;
}

interface TeamRanking {
  rank: number;
  userId: number;
  username: string;
  teamId: number;
  teamName: string;
  credits: number;
  unspentCredits: number;
  totalCredits: number; // Combined credits + unspent
}

interface LeaderboardData {
  global: PlayerRanking[];
  premium: TeamRanking[];
  challenger: TeamRanking[];
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<string>("global");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { toast } = useToast();

  // Loading leaderboard data
  const { 
    data: leaderboardData, 
    isLoading,
    isRefetching,
    refetch
  } = useQuery<LeaderboardData>({
    queryKey: ["/api/leaderboard"],
    staleTime: 30000, // 30 seconds
  });

  // Function to display badges for top three positions
  const getRankBadge = (rank: number) => {
    if (rank === 1) return (
      <div className="flex items-center">
        <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-none shadow-sm">
          <Trophy size={12} className="mr-1" /> 1°
        </Badge>
        <span className="ml-1 text-xs text-yellow-600 hidden sm:inline">Líder</span>
      </div>
    );
    if (rank === 2) return (
      <div className="flex items-center">
        <Badge className="bg-gradient-to-r from-gray-400 to-gray-500 text-white border-none shadow-sm">
          <Medal size={12} className="mr-1" /> 2°
        </Badge>
      </div>
    );
    if (rank === 3) return (
      <div className="flex items-center">
        <Badge className="bg-gradient-to-r from-amber-700 to-amber-800 text-white border-none shadow-sm">
          <Star size={12} className="mr-1" /> 3°
        </Badge>
      </div>
    );
    return <Badge variant="outline" className="shadow-sm border-neutral-300">{rank}°</Badge>;
  };

  // Function to display value trend indicators
  const getCreditsTrendIndicator = (credits: number, initialCredits: number) => {
    // For premium teams initial value is 1000, for challenger it's 700
    const diff = credits - initialCredits;
    const percentChange = ((diff / initialCredits) * 100).toFixed(1);
    
    if (diff > 0) {
      return (
        <span className="flex items-center text-green-500 text-xs">
          <TrendingUp size={14} className="mr-1" />
          +{percentChange}%
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="flex items-center text-red-500 text-xs">
          <TrendingDown size={14} className="mr-1" />
          {percentChange}%
        </span>
      );
    } else {
      return (
        <span className="flex items-center text-gray-500 text-xs">
          <Minus size={14} className="mr-1" />
          0%
        </span>
      );
    }
  };

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!leaderboardData || !searchQuery.trim()) {
      return leaderboardData;
    }

    const query = searchQuery.toLowerCase();
    
    return {
      global: leaderboardData.global.filter(player => 
        player.username.toLowerCase().includes(query)
      ),
      premium: leaderboardData.premium.filter(team => 
        team.username.toLowerCase().includes(query) || 
        team.teamName.toLowerCase().includes(query)
      ),
      challenger: leaderboardData.challenger.filter(team => 
        team.username.toLowerCase().includes(query) || 
        team.teamName.toLowerCase().includes(query)
      )
    };
  }, [leaderboardData, searchQuery]);

  // Handle refresh of leaderboard data
  const handleRefresh = () => {
    refetch().then(() => {
      toast({
        title: "Leaderboard Refreshed",
        description: "The latest rankings have been loaded.",
      });
    });
  };

  const renderLoadingState = () => (
    <div className="flex flex-col space-y-4">
      <div className="flex space-x-4 items-center">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center">
          <div className="flex space-x-4 items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <Skeleton className="h-4 w-[100px]" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-red-600 bg-clip-text text-transparent">
          Classificação Geral
        </h1>
        <p className="text-foreground/70">Acompanhe o desempenho de pilotos, equipes e compare estratégias</p>
      </header>

      {/* Search and Refresh Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200 shadow-sm">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            type="text"
            placeholder="Buscar jogador ou equipe..."
            className="pl-8 w-full sm:w-[300px] border-neutral-300 shadow-sm transition-all focus:border-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto border-neutral-300 hover:bg-neutral-100 transition-all duration-200"
                onClick={handleRefresh}
                disabled={isRefetching}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                {isRefetching ? 'Atualizando...' : 'Atualizar Rankings'}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Atualiza a classificação com os dados mais recentes</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isLoading ? (
        <Card className="border border-neutral-300 shadow-md">
          <CardHeader className="border-b border-neutral-200 pb-4">
            <CardTitle>Carregando Classificação</CardTitle>
            <CardDescription>Por favor, aguarde enquanto carregamos os dados mais recentes</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {renderLoadingState()}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 grid w-full grid-cols-3 bg-neutral-100 p-1 rounded-md">
            <TabsTrigger 
              value="global" 
              className="relative data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all duration-300"
            >
              <Users className="h-4 w-4 mr-1.5" />
              <span>Jogadores</span>
              {filteredData?.global && (
                <Badge variant="secondary" className="ml-2 text-xs bg-white/20 text-white">
                  {filteredData.global.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="premium" 
              className="relative data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all duration-300"
            >
              <Crown className="h-4 w-4 mr-1.5" />
              <span>Premium</span>
              {filteredData?.premium && (
                <Badge variant="secondary" className="ml-2 text-xs bg-white/20 text-white">
                  {filteredData.premium.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="challenger" 
              className="relative data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all duration-300"
            >
              <Award className="h-4 w-4 mr-1.5" />
              <span>Challenger</span>
              {filteredData?.challenger && (
                <Badge variant="secondary" className="ml-2 text-xs bg-white/20 text-white">
                  {filteredData.challenger.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="global" className="space-y-4">
            <Card className="border border-neutral-200 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
                <CardTitle className="flex items-center text-xl">
                  <Users className="mr-2 h-5 w-5 text-primary" />
                  <span className="bg-gradient-to-r from-primary to-red-600 bg-clip-text text-transparent">
                    Classificação Geral de Jogadores
                  </span>
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Ranking global por créditos combinados de todas as equipes de cada jogador
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">Posição</th>
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">Jogador</th>
                        <th className="px-4 py-3 text-right font-medium text-neutral-600">Equipes</th>
                        <th className="px-4 py-3 text-right font-medium text-neutral-600">Créditos Totais</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData?.global.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center">
                            <div className="flex flex-col items-center justify-center text-neutral-500 py-6">
                              <Users className="h-10 w-10 mb-2 text-neutral-400" />
                              <p className="font-medium mb-1">Nenhum jogador encontrado</p>
                              <p className="text-sm">
                                {searchQuery ? 'Tente uma busca diferente' : 'Ainda não há dados disponíveis'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredData?.global.map((player, index) => (
                          <tr 
                            key={player.userId} 
                            className={`border-b hover:bg-neutral-50 transition-colors ${index === 0 ? 'bg-yellow-50/30' : ''}`}
                          >
                            <td className="px-4 py-4">
                              {getRankBadge(player.rank)}
                            </td>
                            <td className="px-4 py-4 font-medium">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3 font-semibold text-sm">
                                  {player.username.substring(0, 2).toUpperCase()}
                                </div>
                                {player.username}
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <Badge variant="outline" className="font-normal">
                                {player.totalTeams} {player.totalTeams === 1 ? 'equipe' : 'equipes'}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-bold text-primary text-base">
                                  {player.totalCredits.toLocaleString()} cr
                                </span>
                                {/* Average per team */}
                                <span className="text-xs text-neutral-500 mt-1">
                                  (média: {(player.totalCredits / player.totalTeams).toFixed(0)} por equipe)
                                </span>
                              </div>
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
          
          <TabsContent value="premium" className="space-y-4">
            <Card className="border border-neutral-200 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
                <CardTitle className="flex items-center text-xl">
                  <Crown className="mr-2 h-5 w-5 text-yellow-600" />
                  <span className="bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">
                    Equipes Premium
                  </span>
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Equipes com 1000 créditos iniciais - classificadas pelo total atual de créditos
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">Posição</th>
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">Jogador</th>
                        <th className="px-4 py-3 text-left font-medium text-neutral-600">Equipe</th>
                        <th className="px-4 py-3 text-right font-medium text-neutral-600">Créditos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData?.premium.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center">
                            <div className="flex flex-col items-center justify-center text-neutral-500 py-6">
                              <Crown className="h-10 w-10 mb-2 text-yellow-500/60" />
                              <p className="font-medium mb-1">Nenhuma equipe premium encontrada</p>
                              <p className="text-sm">
                                {searchQuery ? 'Tente uma busca diferente' : 'Ainda não há dados disponíveis'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredData?.premium.map((team, index) => (
                          <tr 
                            key={`${team.userId}-${team.teamId}`} 
                            className={`border-b hover:bg-neutral-50 transition-colors ${index === 0 ? 'bg-yellow-50/30' : ''}`}
                          >
                            <td className="px-4 py-4">
                              {getRankBadge(team.rank)}
                            </td>
                            <td className="px-4 py-4 font-medium">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3 font-semibold text-sm">
                                  {team.username.substring(0, 2).toUpperCase()}
                                </div>
                                {team.username}
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-none">
                                {team.teamName}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex flex-col items-end">
                                <div className="flex items-center">
                                  <span className="font-bold text-primary text-base mr-2">
                                    {team.totalCredits.toLocaleString()} cr
                                  </span>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-neutral-400 cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent side="left">
                                        <p className="text-xs">Base inicial: 1000 créditos</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                                {team.unspentCredits > 0 && (
                                  <span className="text-xs text-green-600 font-medium">
                                    {team.credits.toLocaleString()} + {team.unspentCredits} créditos não utilizados
                                  </span>
                                )}
                                <div className="mt-1">
                                  {getCreditsTrendIndicator(team.totalCredits, 1000)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 mx-4 py-3 px-4 bg-yellow-50 rounded-md border border-yellow-200 text-sm text-yellow-800">
                  <p className="flex items-center">
                    <Info className="h-4 w-4 mr-2 text-yellow-600" />
                    Equipes Premium iniciam com 1000 créditos - O desempenho é medido em relação a esta linha de base
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="challenger">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="mr-2 h-5 w-5" />
                  Challenger Teams Ranking
                </CardTitle>
                <CardDescription>
                  Teams with 700 initial credits - ranked by credits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-medium">Rank</th>
                        <th className="px-4 py-3 text-left font-medium">Player</th>
                        <th className="px-4 py-3 text-left font-medium">Team</th>
                        <th className="px-4 py-3 text-right font-medium">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData?.challenger.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                            {searchQuery ? 'No challenger teams found matching your search' : 'No challenger teams found'}
                          </td>
                        </tr>
                      ) : (
                        filteredData?.challenger.map((team) => (
                          <tr key={`${team.userId}-${team.teamId}`} className="border-b hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              {getRankBadge(team.rank)}
                            </td>
                            <td className="px-4 py-3 font-medium">{team.username}</td>
                            <td className="px-4 py-3">{team.teamName}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-bold text-primary">
                                  {team.totalCredits.toLocaleString()} cr
                                </span>
                                {team.unspentCredits > 0 && (
                                  <span className="text-xs text-neutral-500">
                                    ({team.credits.toLocaleString()} + {team.unspentCredits} unspent)
                                  </span>
                                )}
                                {getCreditsTrendIndicator(team.totalCredits, 700)}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-neutral-500">
                  <p className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-amber-700" />
                    Challenger teams start with 700 credits - Performance is measured against this baseline
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      <div className="mt-8 p-6 bg-neutral-50 rounded-lg border border-neutral-200">
        <h3 className="text-lg font-semibold mb-3">How the Leaderboard Works</h3>
        <ul className="space-y-2 text-sm text-neutral-700">
          <li className="flex items-start">
            <span className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
            <span>Rankings are based on available credits</span>
          </li>
          <li className="flex items-start">
            <span className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
            <span>All teams start with the same initial credits (Premium: 1000 credits, Challenger: 700 credits)</span>
          </li>
          <li className="flex items-start">
            <span className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
            <span>Rankings are updated after each race when results are submitted and credits change</span>
          </li>
          <li className="flex items-start">
            <span className="bg-primary text-white rounded-full h-5 w-5 flex items-center justify-center text-xs mr-2 mt-0.5">4</span>
            <span>Performance trends show how teams are performing compared to their initial credits</span>
          </li>
        </ul>
      </div>
    </div>
  );
}