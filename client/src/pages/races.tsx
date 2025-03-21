import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Race } from "@shared/schema";

export default function Races() {
  const { data: races, isLoading } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  const today = new Date();
  
  const getPastRaces = () => 
    races?.filter(race => new Date(race.date) < today)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
      
  const getUpcomingRaces = () => 
    races?.filter(race => new Date(race.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const pastRaces = races ? getPastRaces() : [];
  const upcomingRaces = races ? getUpcomingRaces() : [];

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Race Calendar</h1>
        <p className="text-neutral-500">View the schedule for all races in the season.</p>
      </header>

      {/* Upcoming Races */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upcoming Races</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : upcomingRaces.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-100">
                    <TableHead>Round</TableHead>
                    <TableHead>Race</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingRaces.map((race) => (
                    <TableRow key={race.id}>
                      <TableCell className="font-medium">{race.round}</TableCell>
                      <TableCell>{race.name}</TableCell>
                      <TableCell>{race.location}</TableCell>
                      <TableCell>{format(new Date(race.date), "MMMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-accent">{
                          upcomingRaces[0].id === race.id 
                            ? "Next Race" 
                            : "Upcoming"
                        }</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500">No upcoming races scheduled.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Races */}
      <Card>
        <CardHeader>
          <CardTitle>Past Races</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : pastRaces.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-100">
                    <TableHead>Round</TableHead>
                    <TableHead>Race</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastRaces.map((race) => (
                    <TableRow key={race.id}>
                      <TableCell className="font-medium">{race.round}</TableCell>
                      <TableCell>{race.name}</TableCell>
                      <TableCell>{race.location}</TableCell>
                      <TableCell>{format(new Date(race.date), "MMMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={race.resultsSubmitted ? "bg-success" : "bg-warning"}>
                          {race.resultsSubmitted ? "Completed" : "Pending Results"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500">No past races available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
