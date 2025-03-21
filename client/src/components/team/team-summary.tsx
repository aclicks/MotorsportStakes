import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { UserTeamComplete } from "@shared/schema";

interface TeamSummaryProps {
  team: UserTeamComplete;
}

export default function TeamSummary({ team }: TeamSummaryProps) {
  return (
    <Card className="overflow-hidden">
      <div className="bg-secondary text-white p-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">{team.name}</h3>
          <span className={cn(
            "rounded-full px-3 py-1 text-xs font-medium",
            team.name.includes("Premium") ? "bg-primary" : "bg-accent"
          )}>
            {team.initialCredits} Credits
          </span>
        </div>
      </div>
      
      <CardContent className="p-4">
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
              <span className="ml-auto text-success font-medium">
                {team.driver1.value}
              </span>
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
              <span className="ml-auto text-success font-medium">
                {team.driver2.value}
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {/* Engine */}
          <div className="flex items-center p-3 bg-neutral-100 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
              <i className="fas fa-cog text-neutral-400"></i>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-neutral-800 truncate">
                {team.engine?.name || "Select Engine"}
              </p>
              <p className="text-xs text-neutral-500">Engine</p>
            </div>
            {team.engine && (
              <span className="ml-auto text-success font-medium">
                {team.engine.value}
              </span>
            )}
          </div>
          
          {/* Chassis */}
          <div className="flex items-center p-3 bg-neutral-100 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
              <i className="fas fa-car text-neutral-400"></i>
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-neutral-800 truncate">
                {team.team?.name || "Select Chassis"}
              </p>
              <p className="text-xs text-neutral-500">Chassis</p>
            </div>
            {team.team && (
              <span className="ml-auto text-success font-medium">
                {team.team.value}
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-4 border-t border-neutral-200 pt-4">
          <div className="flex justify-between">
            <span className="text-neutral-500">Total Value:</span>
            <span className="font-semibold text-neutral-800">
              {team.totalValue || 0} Credits
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Remaining Budget:</span>
            <span className="font-semibold text-neutral-800">
              {team.currentCredits} Credits
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
