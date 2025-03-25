import { format, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Race } from "@shared/schema";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar, Flag, MapPin, Clock, AlarmClock } from "lucide-react";

interface RaceCardProps {
  race: Race;
}

export default function RaceCard({ race }: RaceCardProps) {
  const isMobile = useIsMobile();
  const raceDate = new Date(race.date);
  const today = new Date();
  const daysToRace = Math.max(0, differenceInDays(raceDate, today));
  
  const formattedDate = format(raceDate, "dd/MM/yyyy");
  const deadlineDate = new Date(raceDate);
  deadlineDate.setDate(deadlineDate.getDate() - 1);
  deadlineDate.setHours(deadlineDate.getHours() - 4); // 4 hours before race day
  const formattedDeadline = format(deadlineDate, "dd/MM/yyyy HH:mm");
  
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlineDate.getTime()]);

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
  
  const isBettingClosed = timeRemaining.total <= 0;
  
  return (
    <Card className="card-racing overflow-hidden border-primary/20 hover:border-primary/40 transition-all duration-300">
      <div className="bg-gradient-to-r from-card to-muted relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-secondary/10 rounded-tr-full"></div>
        
        <CardContent className="p-6 relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Flag className="h-5 w-5 text-primary mr-2" />
              <h2 className="text-lg font-bold text-white">{race.name}</h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-muted text-primary font-medium text-sm">
              Round {race.round}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Location */}
            <div className="flex flex-col">
              <div className="flex items-center mb-2">
                <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-400">Location</span>
              </div>
              <p className="text-white font-medium">{race.location}</p>
            </div>
            
            {/* Date */}
            <div className="flex flex-col">
              <div className="flex items-center mb-2">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-400">Race Date</span>
              </div>
              <p className="text-white font-medium">{formattedDate}</p>
            </div>
            
            {/* Days to Race */}
            <div className="flex flex-col">
              <div className="flex items-center mb-2">
                <Clock className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-400">Race in</span>
              </div>
              <div className="flex items-baseline">
                <span className="text-xl font-bold text-white">{daysToRace}</span>
                <span className="text-sm text-gray-400 ml-1">days</span>
              </div>
            </div>
          </div>
          
          {/* Betting Section */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <AlarmClock className={`h-5 w-5 ${isBettingClosed ? 'text-red-500' : 'text-green-500'} mr-2`} />
                <div>
                  <div className="text-sm text-gray-400">Betting Deadline</div>
                  <div className="text-white">{formattedDeadline} UTC</div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className={`text-sm font-medium ${isBettingClosed ? 'text-red-500' : 'text-green-500'}`}>
                  {isBettingClosed ? (
                    <span className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                      Betting Closed
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                      Time Remaining: {getCountdownDisplay()}
                    </span>
                  )}
                </div>
                
                <Button 
                  asChild 
                  variant="default"
                  className="btn-primary-glow font-medium"
                  disabled={isBettingClosed}
                >
                  <Link href="/teams">
                    Select Your Team
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
