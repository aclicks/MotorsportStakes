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
        <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:text-green-700 font-normal animate-fadeIn">
          <TrendingUp size={14} className="mr-1" />
          +{percentChange}%
        </Badge>
      );
    } else if (diff < 0) {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700 font-normal animate-fadeIn">
          <TrendingDown size={14} className="mr-1" />
          {percentChange}%
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100 hover:text-neutral-700 font-normal animate-fadeIn">
          <Minus size={14} className="mr-1" />
          0%
        </Badge>
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
        title: "Classificação atualizada!",
        description: "Os dados mais recentes foram carregados com sucesso.",
        variant: "default",
      });
    }).catch(() => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível carregar os dados mais recentes. Tente novamente.",
        variant: "destructive",
      });
    });
  };

  const renderLoadingState = () => (
    <div className="flex flex-col space-y-6 p-2">
      <div className="flex space-x-4 items-center">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex justify-between items-center border-b border-neutral-100 pb-4">
          <div className="flex space-x-4 items-center">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Skeleton className="h-5 w-[100px]" />
            <Skeleton className="h-3 w-[80px]" />
          </div>
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
          
          <TabsContent value="challenger" className="space-y-4">
            <Card className="border border-neutral-200 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200">
                <CardTitle className="flex items-center text-xl">
                  <Award className="mr-2 h-5 w-5 text-amber-700" />
                  <span className="bg-gradient-to-r from-amber-700 to-red-600 bg-clip-text text-transparent">
                    Equipes Challenger
                  </span>
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Equipes com 700 créditos iniciais - classificadas pelo total atual de créditos
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
                      {filteredData?.challenger.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center">
                            <div className="flex flex-col items-center justify-center text-neutral-500 py-6">
                              <Award className="h-10 w-10 mb-2 text-amber-700/60" />
                              <p className="font-medium mb-1">Nenhuma equipe challenger encontrada</p>
                              <p className="text-sm">
                                {searchQuery ? 'Tente uma busca diferente' : 'Ainda não há dados disponíveis'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredData?.challenger.map((team, index) => (
                          <tr 
                            key={`${team.userId}-${team.teamId}`} 
                            className={`border-b hover:bg-neutral-50 transition-colors ${index === 0 ? 'bg-amber-50/30' : ''}`}
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
                              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none">
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
                                        <p className="text-xs">Base inicial: 700 créditos</p>
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
                                  {getCreditsTrendIndicator(team.totalCredits, 700)}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 mx-4 py-3 px-4 bg-amber-50 rounded-md border border-amber-200 text-sm text-amber-800">
                  <p className="flex items-center">
                    <Info className="h-4 w-4 mr-2 text-amber-700" />
                    Equipes Challenger iniciam com 700 créditos - O desempenho é medido em relação a esta linha de base
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      <Card className="mt-8 border border-neutral-200 shadow-md overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-neutral-50 to-neutral-100 border-b border-neutral-200 pb-4">
          <CardTitle className="flex items-center text-lg">
            <Info className="mr-2 h-5 w-5 text-primary" />
            Como funciona a classificação
          </CardTitle>
          <CardDescription>
            Entenda como o sistema de ranqueamento calcula as posições
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-md border border-neutral-200 shadow-sm">
              <div className="flex items-center mb-2">
                <div className="bg-gradient-to-r from-primary to-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs mr-2">1</div>
                <h4 className="font-semibold text-sm">Pontuação por créditos</h4>
              </div>
              <p className="text-sm text-foreground/70 pl-8">
                O ranking é baseado nos créditos disponíveis para cada equipe ou jogador
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-neutral-200 shadow-sm">
              <div className="flex items-center mb-2">
                <div className="bg-gradient-to-r from-primary to-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs mr-2">2</div>
                <h4 className="font-semibold text-sm">Base inicial padronizada</h4>
              </div>
              <p className="text-sm text-foreground/70 pl-8">
                Todas as equipes iniciam com valores padrão (Premium: 1000 créditos, Challenger: 700 créditos)
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-neutral-200 shadow-sm">
              <div className="flex items-center mb-2">
                <div className="bg-gradient-to-r from-primary to-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs mr-2">3</div>
                <h4 className="font-semibold text-sm">Atualização pós-corrida</h4>
              </div>
              <p className="text-sm text-foreground/70 pl-8">
                Os rankings são atualizados após cada corrida quando os resultados são enviados e os créditos mudam
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-md border border-neutral-200 shadow-sm">
              <div className="flex items-center mb-2">
                <div className="bg-gradient-to-r from-primary to-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs mr-2">4</div>
                <h4 className="font-semibold text-sm">Indicadores de tendência</h4>
              </div>
              <p className="text-sm text-foreground/70 pl-8">
                Os indicadores de performance mostram como as equipes estão se saindo em comparação aos créditos iniciais
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}