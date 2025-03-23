import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Edit, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserTeamComplete } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

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
        isPositive: difference > 0 
      };
    }
    
    return null;
  };

  // Helper to render value change display
  const renderValueChange = (change: { value: number, percent: string, isPositive: boolean } | null) => {
    if (!change) return null;
    
    const Icon = change.isPositive ? TrendingUp : TrendingDown;
    const colorClass = change.isPositive ? "text-success" : "text-error";
    
    return (
      <div className={`flex items-center text-xs ml-1 ${colorClass}`}>
        <Icon className="h-3 w-3 mr-0.5" />
        <span>{change.isPositive ? '+' : ''}{change.percent}%</span>
      </div>
    );
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="bg-secondary text-white p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">{team.name}</h3>
          <div className="flex flex-col items-end">
            <span className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              team.name.includes("Premium") ? "bg-primary" : "bg-accent"
            )}>
              {team.currentCredits} Credits
            </span>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm text-neutral-500">Team Selection</h4>
          <Button asChild size="sm" variant="outline">
            <Link href="/teams">
              <Edit className="mr-1 h-3 w-3" />
              Edit Team
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Driver 1 */}
          <div className="flex items-center p-3 bg-neutral-100 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
              <span className="text-sm font-medium">
                {team.driver1?.number || "-"}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-neutral-800 truncate">
                {team.driver1?.name || "Select Driver"}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {team.driver1?.team?.name || "No Team"}
              </p>
            </div>
            {team.driver1 && (
              <div className="ml-auto flex flex-col items-end">
                <span className="text-success font-medium">
                  {team.driver1.value}
                </span>
                {team.driver1 && renderValueChange(getValueChange(team.driver1.id, 'driver'))}
              </div>
            )}
          </div>
          
          {/* Driver 2 */}
          <div className="flex items-center p-3 bg-neutral-100 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
              <span className="text-sm font-medium">
                {team.driver2?.number || "-"}
              </span>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-neutral-800 truncate">
                {team.driver2?.name || "Select Driver"}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {team.driver2?.team?.name || "No Team"}
              </p>
            </div>
            {team.driver2 && (
              <div className="ml-auto flex flex-col items-end">
                <span className="text-success font-medium">
                  {team.driver2.value}
                </span>
                {team.driver2 && renderValueChange(getValueChange(team.driver2.id, 'driver'))}
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Engine */}
          <div className="flex items-center p-3 bg-neutral-100 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-neutral-800 truncate">
                {team.engine?.name || "Select Engine"}
              </p>
              <p className="text-xs text-neutral-500">Engine</p>
            </div>
            {team.engine && (
              <div className="ml-auto flex flex-col items-end">
                <span className="text-success font-medium">
                  {team.engine.value}
                </span>
                {team.engine && renderValueChange(getValueChange(team.engine.id, 'engine'))}
              </div>
            )}
          </div>
          
          {/* Chassis */}
          <div className="flex items-center p-3 bg-neutral-100 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.5-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
                <circle cx="7" cy="17" r="2"></circle>
                <path d="M9 17h6"></path>
                <circle cx="17" cy="17" r="2"></circle>
              </svg>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-neutral-800 truncate">
                {team.team?.name || "Select Chassis"}
              </p>
              <p className="text-xs text-neutral-500">Chassis</p>
            </div>
            {team.team && (
              <div className="ml-auto flex flex-col items-end">
                <span className="text-success font-medium">
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
