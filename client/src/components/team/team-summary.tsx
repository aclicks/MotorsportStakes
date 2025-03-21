import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Edit } from "lucide-react";
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
              <span className="ml-auto text-success font-medium">
                {team.engine.value}
              </span>
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
