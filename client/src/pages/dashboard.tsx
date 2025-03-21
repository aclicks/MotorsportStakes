import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import RaceCard from "@/components/race/race-card";
import TeamSummary from "@/components/team/team-summary";
import RaceResults from "@/components/race/race-results";
import { Race, UserTeamComplete } from "@shared/schema";

export default function Dashboard() {
  // Fetch user teams
  const { 
    data: teams, 
    isLoading: isLoadingTeams 
  } = useQuery<UserTeamComplete[]>({
    queryKey: ["/api/my-teams"],
  });

  // Fetch next race
  const { 
    data: nextRace, 
    isLoading: isLoadingNextRace 
  } = useQuery<Race>({
    queryKey: ["/api/races/next"],
  });

  // Fetch all races to get the last completed race
  const { 
    data: races, 
    isLoading: isLoadingRaces 
  } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  // Find the last completed race
  const lastRace = races?.filter(race => 
    race.resultsSubmitted && new Date(race.date) < new Date()
  ).sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
        <p className="text-neutral-500">Welcome back! Here's how your teams are performing.</p>
      </header>
      
      {/* Next Race Card */}
      {isLoadingNextRace ? (
        <Card className="mb-8">
          <CardContent className="p-6">
            <Skeleton className="h-[180px] w-full rounded-lg" />
          </CardContent>
        </Card>
      ) : nextRace ? (
        <RaceCard race={nextRace} />
      ) : (
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">No Upcoming Races</h2>
            <p className="text-neutral-500 mb-4">There are no upcoming races scheduled at the moment.</p>
          </CardContent>
        </Card>
      )}
      
      {/* Teams Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {isLoadingTeams ? (
          <>
            <Skeleton className="h-[300px] w-full rounded-lg" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </>
        ) : teams?.length ? (
          teams.map(team => (
            <TeamSummary key={team.id} team={team} />
          ))
        ) : (
          <Card className="col-span-2">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-neutral-800 mb-2">No Teams Found</h2>
              <p className="text-neutral-500 mb-4">You haven't created any teams yet.</p>
              <Button asChild>
                <Link href="/teams">Go to Team Management</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Last Race Results */}
      {isLoadingRaces ? (
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
      ) : lastRace ? (
        <RaceResults race={lastRace} />
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold text-neutral-800 mb-2">No Race Results Available</h2>
            <p className="text-neutral-500">Race results will appear here once races are completed.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
