import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Driver, Engine, Team } from "@shared/schema";

interface MarketData {
  drivers: (Driver & { team?: Team; averagePosition?: number })[];
  engines: (Engine & { averagePosition?: number })[];
  teams: (Team & { averagePosition?: number })[];
}

export default function Market() {
  const { data, isLoading } = useQuery<MarketData>({
    queryKey: ["/api/market"],
  });

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Market</h1>
        <p className="text-neutral-500">View current values for all drivers, engines, and chassis.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Market Values</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="drivers" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="drivers">Drivers</TabsTrigger>
              <TabsTrigger value="engines">Engines</TabsTrigger>
              <TabsTrigger value="chassis">Chassis</TabsTrigger>
            </TabsList>

            <TabsContent value="drivers">
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-100">
                        <TableHead className="w-16">Number</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Avg Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.drivers.sort((a, b) => b.value - a.value).map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell className="font-medium">
                            <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                              {driver.number}
                            </div>
                          </TableCell>
                          <TableCell>{driver.name}</TableCell>
                          <TableCell>{driver.team?.name}</TableCell>
                          <TableCell className="text-right font-medium text-success">
                            {driver.value}
                          </TableCell>
                          <TableCell className="text-right">
                            {driver.averagePosition !== undefined ? driver.averagePosition : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="engines">
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-100">
                        <TableHead>Engine</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Avg Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.engines.sort((a, b) => b.value - a.value).map((engine) => (
                        <TableRow key={engine.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                                <i className="fas fa-cog text-neutral-400"></i>
                              </div>
                              {engine.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-success">
                            {engine.value}
                          </TableCell>
                          <TableCell className="text-right">
                            {engine.averagePosition !== undefined ? engine.averagePosition : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="chassis">
              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-100">
                        <TableHead>Chassis</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                        <TableHead className="text-right">Avg Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.teams.sort((a, b) => b.value - a.value).map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center mr-3">
                                <i className="fas fa-car text-neutral-400"></i>
                              </div>
                              {team.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium text-success">
                            {team.value}
                          </TableCell>
                          <TableCell className="text-right">
                            {team.averagePosition !== undefined ? team.averagePosition : "—"}
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
