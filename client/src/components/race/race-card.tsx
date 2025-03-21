import { format, differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Race } from "@shared/schema";

interface RaceCardProps {
  race: Race;
}

export default function RaceCard({ race }: RaceCardProps) {
  const raceDate = new Date(race.date);
  const today = new Date();
  const daysToRace = differenceInDays(raceDate, today);
  
  const formattedDate = format(raceDate, "MMMM d, yyyy");
  const deadlineDate = new Date(raceDate);
  deadlineDate.setDate(deadlineDate.getDate() - 1);
  const formattedDeadline = format(deadlineDate, "MMMM d, HH:mm");
  
  return (
    <Card className="mb-8">
      <CardContent className="pt-6 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-800">Next Race</h2>
          <span className="text-sm text-neutral-500">Round {race.round}</span>
        </div>
        
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex flex-col items-center mb-4 md:mb-0">
            <div className="w-16 h-16 rounded-full bg-neutral-200 flex items-center justify-center mb-2">
              <i className={`fas fa-flag text-neutral-600 text-xl`}></i>
            </div>
            <h3 className="font-medium text-neutral-800">{race.name}</h3>
            <p className="text-sm text-neutral-500">{race.location}</p>
          </div>
          
          <div className="text-center">
            <div className="bg-neutral-100 rounded-lg px-4 py-2 inline-block">
              <span className="text-xl font-bold">{daysToRace}</span>
              <span className="text-sm text-neutral-500 ml-1">days</span>
            </div>
            <p className="text-sm text-neutral-500 mt-1">{formattedDate}</p>
          </div>
          
          <div className="text-center">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/teams">Team Selection</Link>
            </Button>
            <p className="text-xs text-neutral-500 mt-1">Deadline: {formattedDeadline} UTC</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
