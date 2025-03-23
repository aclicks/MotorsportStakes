import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Medal, Trophy, Star, Search, Users, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Interfaces for leaderboard data
interface PlayerRanking {
  rank: number;
  userId: number;
  username: string;
  totalCredits: number;
  totalTeams: number;
}

interface TeamRanking {
  rank: number;
  userId: number;
  username: string;
  teamId: number;
  teamName: string;
  credits: number;
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
    if (rank === 1) return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white"><Trophy size={12} className="mr-1" /> 1°</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 hover:bg-gray-500 text-white"><Medal size={12} className="mr-1" /> 2°</Badge>;
    if (rank === 3) return <Badge className="bg-amber-700 hover:bg-amber-800 text-white"><Star size={12} className="mr-1" /> 3°</Badge>;
    return <Badge variant="outline">{rank}°</Badge>;
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
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-red-500 text-transparent bg-clip-text">
          Leaderboard & Rankings
        </h1>
        <p className="text-neutral-500">See who's dominating the Motorsport Stakes season</p>
      </header>

      {/* Search and Refresh Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
          <Input
            type="text"
            placeholder="Search by player or team..."
            className="pl-8 w-full sm:w-[300px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full sm:w-auto"
          onClick={handleRefresh}
          disabled={isRefetching}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          {isRefetching ? 'Refreshing...' : 'Refresh Rankings'}
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <CardTitle>Loading Rankings</CardTitle>
            <CardDescription>Please wait while we fetch the latest data</CardDescription>
          </CardHeader>
          <CardContent>
            {renderLoadingState()}
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="global" className="relative">
              Global Rankings
              {filteredData?.global && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filteredData.global.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="premium" className="relative">
              Premium Teams
              {filteredData?.premium && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filteredData.premium.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="challenger" className="relative">
              Challenger Teams
              {filteredData?.challenger && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {filteredData.challenger.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="global">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Global Players Ranking
                </CardTitle>
                <CardDescription>
                  Combined credits of all teams for each player
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left font-medium">Rank</th>
                        <th className="px-4 py-3 text-left font-medium">Player</th>
                        <th className="px-4 py-3 text-right font-medium">Teams</th>
                        <th className="px-4 py-3 text-right font-medium">Total Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData?.global.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                            {searchQuery ? 'No players found matching your search' : 'No players found'}
                          </td>
                        </tr>
                      ) : (
                        filteredData?.global.map((player) => (
                          <tr key={player.userId} className="border-b hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              {getRankBadge(player.rank)}
                            </td>
                            <td className="px-4 py-3 font-medium">{player.username}</td>
                            <td className="px-4 py-3 text-right">{player.totalTeams}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex flex-col items-end">
                                <span className="font-bold text-primary">
                                  {player.totalCredits.toLocaleString()} credits
                                </span>
                                {/* Average per team */}
                                <span className="text-xs text-neutral-500">
                                  (avg: {(player.totalCredits / player.totalTeams).toFixed(0)} per team)
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
          
          <TabsContent value="premium">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="mr-2 h-5 w-5" />
                  Premium Teams Ranking
                </CardTitle>
                <CardDescription>
                  Teams with 1000 initial credits - ranked by credits
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
                      {filteredData?.premium.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                            {searchQuery ? 'No premium teams found matching your search' : 'No premium teams found'}
                          </td>
                        </tr>
                      ) : (
                        filteredData?.premium.map((team) => (
                          <tr key={`${team.userId}-${team.teamId}`} className="border-b hover:bg-neutral-50">
                            <td className="px-4 py-3">
                              {getRankBadge(team.rank)}
                            </td>
                            <td className="px-4 py-3 font-medium">{team.username}</td>
                            <td className="px-4 py-3">{team.teamName}</td>
                            <td className="px-4 py-3 text-right font-bold text-primary">
                              {team.credits.toLocaleString()} cr
                              {getCreditsTrendIndicator(team.credits, 1000)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-neutral-500">
                  <p className="flex items-center">
                    <Star className="h-4 w-4 mr-2 text-yellow-500" />
                    Premium teams start with 1000 credits - Performance is measured against this baseline
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
                  Teams with 700 initial credits - ranked by total budget
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
                            <td className="px-4 py-3 text-right font-bold text-primary">
                              {team.credits.toLocaleString()} cr
                              {getCreditsTrendIndicator(team.credits, 700)}
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