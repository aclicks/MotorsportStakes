import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface Standing<T> {
  position: number;
  [key: string]: any;
}

export default function Standings() {
  const { data: driverStandings, isLoading: isLoadingDrivers } = useQuery<Standing<any>[]>({
    queryKey: ["/api/standings/drivers"],
  });

  const { data: teamStandings, isLoading: isLoadingTeams } = useQuery<Standing<any>[]>({
    queryKey: ["/api/standings/teams"],
  });

  const { data: engineStandings, isLoading: isLoadingEngines } = useQuery<Standing<any>[]>({
    queryKey: ["/api/standings/engines"],
  });

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Standings</h1>
        <p className="text-neutral-500">Current standings for drivers, teams, and engines.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Current Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="drivers" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="drivers">Drivers</TabsTrigger>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="engines">Engines</TabsTrigger>
            </TabsList>

            <TabsContent value="drivers">
              {isLoadingDrivers ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-100">
                        <TableHead className="w-16">Pos</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {driverStandings?.map((standing) => (
                        <TableRow key={standing.driver.id}>
                          <TableCell className="font-medium">{standing.position}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                                <span className="text-xs font-medium">{standing.driver.number}</span>
                              </div>
                              {standing.driver.name}
                            </div>
                          </TableCell>
                          <TableCell>{standing.driver.team?.name}</TableCell>
                          <TableCell className="text-right font-medium text-success">
                            {standing.driver.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="teams">
              {isLoadingTeams ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-100">
                        <TableHead className="w-16">Pos</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamStandings?.map((standing) => (
                        <TableRow key={standing.team.id}>
                          <TableCell className="font-medium">{standing.position}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                                <i className="fas fa-car text-neutral-400"></i>
                              </div>
                              {standing.team.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-success">
                            {standing.team.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="engines">
              {isLoadingEngines ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-100">
                        <TableHead className="w-16">Pos</TableHead>
                        <TableHead>Engine</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {engineStandings?.map((standing) => (
                        <TableRow key={standing.engine.id}>
                          <TableCell className="font-medium">{standing.position}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                                <i className="fas fa-cog text-neutral-400"></i>
                              </div>
                              {standing.engine.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-success">
                            {standing.engine.value}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
