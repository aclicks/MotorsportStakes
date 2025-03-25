import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Edit, TrendingUp, TrendingDown, Settings, User, Car, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserTeamComplete } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TeamSummaryProps {
  team: UserTeamComplete;
}

export default function TeamSummary({ team }: TeamSummaryProps) {
  // Query to fetch asset value history for dynamic display of value changes
  const { data: assetValueHistory } = useQuery({
    queryKey: ["/api/asset-value-history"],
    enabled: !!team.id,
  });

  // Function to get the value change for an asset
  const getValueChange = (entityId: number, entityType: 'driver' | 'team' | 'engine') => {
    if (!assetValueHistory || !Array.isArray(assetValueHistory)) return null;
    
    // Filter history by entity ID and type
    const history = assetValueHistory.filter(
      (h: any) => h.entityId === entityId && h.entityType === entityType
    );
    
    // Sort by race date descending
    const sortedHistory = [...history].sort((a: any, b: any) => {
      return new Date(b.race?.date || 0).getTime() - new Date(a.race?.date || 0).getTime();
    });
    
    // Get the two most recent values
    if (sortedHistory.length >= 2) {
      const current = sortedHistory[0].value;
      const previous = sortedHistory[1].value;
      const difference = current - previous;
      const percentChange = ((difference / previous) * 100).toFixed(1);
      
      return { 
        value: difference,
        percent: percentChange,
        isPositive: difference > 0,
        raceName: sortedHistory[0].race?.name || 'Last Race'
      };
    }
    
    return null;
  };

  // Helper to render value change display
  const renderValueChange = (change: { value: number, percent: string, isPositive: boolean, raceName: string } | null) => {
    if (!change) return null;
    
    const Icon = change.isPositive ? TrendingUp : TrendingDown;
    const colorClass = change.isPositive ? "text-green-500" : "text-red-500";
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center text-xs ml-1 ${colorClass} font-medium`}>
              <Icon className="h-3 w-3 mr-0.5" />
              <span>{change.isPositive ? '+' : ''}{change.percent}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Change after {change.raceName}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  // Helper to determine the team type for styling
  const isPremium = team.name.includes("Premium") || team.name.includes("Principal");
  const teamTypeColor = isPremium ? "from-primary to-primary/70" : "from-secondary to-secondary/70";
  
  return (
    <Card className="card-racing overflow-hidden hover:border-primary/30 hover:shadow-glow-red transition-all duration-300">
      <CardHeader className={`bg-gradient-to-r ${teamTypeColor} p-4 pb-5 text-white flex flex-col space-y-1`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Award className={`${isPremium ? 'text-white' : 'text-black/80'} h-5 w-5`} />
            <h3 className="font-bold text-lg">{team.name}</h3>
          </div>
          <Button asChild size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
            <Link href="/teams">
              <Edit className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-white/90">Total Value:</span>
          <div className="flex items-center">
            <span className="text-xl font-bold">{team.currentCredits}</span>
            <span className="ml-1 text-xs opacity-90">credits</span>
          </div>
        </div>
        
        {team.unspentCredits > 0 && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-white/70">Unspent:</span>
            <div className="flex items-center">
              <span className="text-sm font-medium">{team.unspentCredits}</span>
              <span className="ml-1 text-xs opacity-70">credits</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 bg-card">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Driver 1 */}
          <div className={`flex items-center p-3 rounded-lg ${team.driver1 ? 'bg-muted hover:shadow-inner-white' : 'bg-black/20 border border-dashed border-gray-700'} transition-all duration-200 hover-scale`}>
            <div className={`w-10 h-10 rounded-full ${team.driver1 ? 'bg-card' : 'bg-black/30'} flex items-center justify-center mr-3 ring-1 ring-white/10`}>
              {team.driver1?.number ? (
                <span className={`text-sm font-racing text-white font-bold ${isPremium ? 'text-primary' : 'text-secondary'}`}>
                  {team.driver1.number}
                </span>
              ) : (
                <User className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className={`font-medium ${team.driver1 ? 'text-white' : 'text-gray-500'} truncate`}>
                {team.driver1?.name || "Select Driver"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {team.driver1?.team?.name || "No Team"}
              </p>
            </div>
            {team.driver1 && (
              <div className="ml-auto flex flex-col items-end">
                <span className="text-white font-medium">
                  {team.driver1.value}
                </span>
                {team.driver1 && renderValueChange(getValueChange(team.driver1.id, 'driver'))}
              </div>
            )}
          </div>
          
          {/* Driver 2 */}
          <div className={`flex items-center p-3 rounded-lg ${team.driver2 ? 'bg-muted hover:shadow-inner-white' : 'bg-black/20 border border-dashed border-gray-700'} transition-all duration-200 hover-scale`}>
            <div className={`w-10 h-10 rounded-full ${team.driver2 ? 'bg-card' : 'bg-black/30'} flex items-center justify-center mr-3 ring-1 ring-white/10`}>
              {team.driver2?.number ? (
                <span className={`text-sm font-racing text-white font-bold ${isPremium ? 'text-primary' : 'text-secondary'}`}>
                  {team.driver2.number}
                </span>
              ) : (
                <User className="h-5 w-5 text-gray-500" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className={`font-medium ${team.driver2 ? 'text-white' : 'text-gray-500'} truncate`}>
                {team.driver2?.name || "Select Driver"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {team.driver2?.team?.name || "No Team"}
              </p>
            </div>
            {team.driver2 && (
              <div className="ml-auto flex flex-col items-end">
                <span className="text-white font-medium">
                  {team.driver2.value}
                </span>
                {team.driver2 && renderValueChange(getValueChange(team.driver2.id, 'driver'))}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Engine */}
          <div className={`flex items-center p-3 rounded-lg ${team.engine ? 'bg-muted hover:shadow-inner-white' : 'bg-black/20 border border-dashed border-gray-700'} transition-all duration-200 hover-scale`}>
            <div className={`w-10 h-10 rounded-full ${team.engine ? 'bg-card' : 'bg-black/30'} flex items-center justify-center mr-3 ring-1 ring-white/10`}>
              <Settings className={`h-5 w-5 ${team.engine ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
            <div className="overflow-hidden">
              <p className={`font-medium ${team.engine ? 'text-white' : 'text-gray-500'} truncate`}>
                {team.engine?.name || "Select Engine"}
              </p>
              <p className="text-xs text-gray-500">Engine</p>
            </div>
            {team.engine && (
              <div className="ml-auto flex flex-col items-end">
                <span className="text-white font-medium">
                  {team.engine.value}
                </span>
                {team.engine && renderValueChange(getValueChange(team.engine.id, 'engine'))}
              </div>
            )}
          </div>
          
          {/* Chassis */}
          <div className={`flex items-center p-3 rounded-lg ${team.team ? 'bg-muted hover:shadow-inner-white' : 'bg-black/20 border border-dashed border-gray-700'} transition-all duration-200 hover-scale`}>
            <div className={`w-10 h-10 rounded-full ${team.team ? 'bg-card' : 'bg-black/30'} flex items-center justify-center mr-3 ring-1 ring-white/10`}>
              <Car className={`h-5 w-5 ${team.team ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
            <div className="overflow-hidden">
              <p className={`font-medium ${team.team ? 'text-white' : 'text-gray-500'} truncate`}>
                {team.team?.name || "Select Chassis"}
              </p>
              <p className="text-xs text-gray-500">Chassis</p>
            </div>
            {team.team && (
              <div className="ml-auto flex flex-col items-end">
                <span className="text-white font-medium">
                  {team.team.value}
                </span>
                {team.team && renderValueChange(getValueChange(team.team.id, 'team'))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
