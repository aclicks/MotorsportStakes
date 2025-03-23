import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Race } from "@shared/schema";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";

interface RaceCardProps {
  race: Race;
}

export default function RaceCard({ race }: RaceCardProps) {
  const isMobile = useIsMobile();
  const raceDate = new Date(race.date);
  const today = new Date();
  const daysToRace = differenceInDays(raceDate, today);
  
  const formattedDate = format(raceDate, "MMMM d, yyyy");
  const deadlineDate = new Date(raceDate);
  deadlineDate.setDate(deadlineDate.getDate() - 1);
  deadlineDate.setHours(deadlineDate.getHours() - 4); // 4 hours before race day
  const formattedDeadline = format(deadlineDate, "MMMM d, HH:mm");
  
  // For countdown timer
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });
  
  const [bettingLocked, setBettingLocked] = useState(false);
  
  // Mutation to auto-lock betting
  const lockBettingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/betting/lock");
    },
    onSuccess: () => {
      setBettingLocked(true);
      queryClient.invalidateQueries({ queryKey: ["/api/betting/status"] });
    },
  });

  // Update countdown timer every second
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = deadlineDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        // Time has expired, auto-lock betting
        if (!bettingLocked) {
          lockBettingMutation.mutate();
        }
        
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0
        });
        return;
      }
      
      const days = differenceInDays(deadlineDate, now);
      const hours = differenceInHours(deadlineDate, now) % 24;
      const minutes = differenceInMinutes(deadlineDate, now) % 60;
      const seconds = differenceInSeconds(deadlineDate, now) % 60;
      
      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        total: diff
      });
    };
    
    // Initial update
    updateCountdown();
    
    // Update countdown every second
    const interval = setInterval(updateCountdown, 1000);
    
    // Cleanup
    return () => clearInterval(interval);
  }, [deadlineDate, bettingLocked, lockBettingMutation]);

  // Format countdown display
  const getCountdownDisplay = () => {
    if (timeRemaining.total <= 0) {
      return "Betting Closed";
    }
    
    if (isMobile) {
      return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m`;
    }
    
    return `${timeRemaining.days}d ${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  };
  
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
            <Button 
              asChild 
              className="bg-primary hover:bg-primary/90"
              disabled={timeRemaining.total <= 0}
            >
              <Link href="/teams">Team Selection</Link>
            </Button>
            <div className="mt-1">
              <p className="text-xs font-medium text-primary">
                {getCountdownDisplay()}
              </p>
              <p className="text-xs text-neutral-500">Betting Locks: {formattedDeadline} UTC</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
