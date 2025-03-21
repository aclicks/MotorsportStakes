import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Loader2, GripVertical, AlertCircle } from "lucide-react";
import { Race, Driver, Team } from "@shared/schema";
import { Badge } from "@/components/ui/badge";

export default function RaceResultsForm() {
  const { toast } = useToast();
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [driversByPosition, setDriversByPosition] = useState<any[]>([]);

  // Fetch races
  const { data: races, isLoading: isLoadingRaces } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  // Fetch market data which includes drivers with their teams
  const { data: marketData, isLoading: isLoadingMarket } = useQuery({
    queryKey: ["/api/market"],
  });
  
  // Effect to initialize driver positions when drivers data is loaded or race is selected
  useEffect(() => {
    if (marketData?.drivers?.length > 0 && selectedRaceId) {
      // Get all drivers for race results - we need exactly 20 drivers
      // In F1, there are 10 teams with 2 drivers each = 20 drivers
      // Sort by team order, so teammates appear together
      const allDrivers = [...marketData.drivers]
        .sort((a, b) => {
          // First sort by team ID to group drivers by team
          if (a.teamId !== b.teamId) {
            return a.teamId - b.teamId;
          }
          // Then sort by value (higher value drivers first)
          return b.value - a.value;
        })
        .slice(0, 20); // Always take exactly 20 drivers
        
      setDriversByPosition(allDrivers);
    }
  }, [marketData, selectedRaceId]);

  // Submit race results
  const submitResultsMutation = useMutation({
    mutationFn: async (data: { raceId: number; results: Array<{ driverId: number; position: number }> }) => {
      const res = await apiRequest("POST", `/api/admin/races/${data.raceId}/results`, {
        results: data.results,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Race Results Submitted",
        description: "The race results have been saved and valuations updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/races"] });
      queryClient.invalidateQueries({ queryKey: [`/api/races/${selectedRaceId}/results`] });
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings/teams"] });
      queryClient.invalidateQueries({ queryKey: ["/api/standings/engines"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle race selection
  const handleRaceChange = (value: string) => {
    const raceId = parseInt(value);
    setSelectedRaceId(raceId);
  };

  // Calculate valuation change based on actual driver data
  const calculateValuationChange = (driver: any, position: number): number => {
    // Use the actual race position history from the driver data
    const lastRace1 = driver.lastRace1Position || 0;
    const lastRace2 = driver.lastRace2Position || 0;
    const lastRace3 = driver.lastRace3Position || 0;
    
    // Count valid races (non-zero positions)
    let validRaces = 0;
    let totalPositions = 0;
    
    if (lastRace1 > 0) {
      validRaces++;
      totalPositions += lastRace1;
    }
    
    if (lastRace2 > 0) {
      validRaces++;
      totalPositions += lastRace2;
    }
    
    if (lastRace3 > 0) {
      validRaces++;
      totalPositions += lastRace3;
    }
    
    // If no valid race history, assume zero change
    if (validRaces === 0) return 0;
    
    // Calculate the average position from last valid races
    const lastAvg = totalPositions / validRaces;
    
    // Calculate the difference (improvement or decline)
    const diff = Math.round(lastAvg - position);
    
    // Apply percentage change based on the difference
    // Using similar scaling to the actual valuation calculation
    return diff * 2.5;
  };

  // Handle reordering of drivers (drag and drop)
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(driversByPosition);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setDriversByPosition(items);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedRaceId || driversByPosition.length === 0) {
      toast({
        title: "Error",
        description: "Please select a race and arrange all drivers.",
        variant: "destructive",
      });
      return;
    }

    // Create results array from the current order of drivers
    const results = driversByPosition.map((driver, index) => ({
      driverId: driver.id,
      position: index + 1,
    }));

    // Submit the results
    submitResultsMutation.mutate({
      raceId: selectedRaceId,
      results: results,
    });
  };

  // Handle reset to alphabetical order
  const handleAlphabeticalReset = () => {
    if (marketData?.drivers?.length > 0) {
      // Sort the existing driversByPosition array alphabetically
      // This preserves the same 20 drivers we already have
      const sortedDrivers = [...driversByPosition].sort((a, b) => a.name.localeCompare(b.name));
      setDriversByPosition(sortedDrivers);
    }
  };

  // Find the selected race
  const selectedRace = races?.find((race) => race.id === selectedRaceId);
  const isRaceResultsAlreadySubmitted = selectedRace?.resultsSubmitted;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-neutral-800">Enter Race Results</h2>
          <p className="text-neutral-500">Drag drivers to arrange them in order of race finish (1st to last).</p>
        </div>
        <div className="mt-4 sm:mt-0">
          {isLoadingRaces ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            <Select value={selectedRaceId?.toString() || ""} onValueChange={handleRaceChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select Race" />
              </SelectTrigger>
              <SelectContent>
                {races
                  ?.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((race) => (
                    <SelectItem key={race.id} value={race.id.toString()}>
                      {race.name} {race.resultsSubmitted && "(Results Submitted)"}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isRaceResultsAlreadySubmitted && (
        <Alert className="mb-6 border-amber-500 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription>
            Results have already been submitted for this race. Submitting new results will update driver, team, and engine valuations.
          </AlertDescription>
        </Alert>
      )}

      {isLoadingMarket || !selectedRaceId ? (
        <Skeleton className="h-[400px] w-full" />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Arrange Drivers by Finish Position</CardTitle>
              <CardDescription>
                Drag drivers to arrange them in the exact order they finished the race, with the winner at the top.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="droppable">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {driversByPosition.map((driver, index) => (
                        <Draggable key={driver.id.toString()} draggableId={driver.id.toString()} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="flex items-center p-2 rounded-md border border-gray-200 bg-white hover:bg-gray-50"
                            >
                              <div {...provided.dragHandleProps} className="mr-3 text-gray-400">
                                <GripVertical size={20} />
                              </div>
                              <Badge className="mr-3 min-w-[2rem] flex justify-center">{index + 1}</Badge>
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">{driver.name}</p>
                                <p className="text-sm text-gray-500">{driver.team?.name}</p>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={handleAlphabeticalReset}
                  disabled={submitResultsMutation.isPending}
                  className="w-full"
                >
                  Reset to Alphabetical Order
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Estimated Valuation Changes</CardTitle>
              <CardDescription>
                Preview of potential valuation changes based on the race results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-100">
                      <TableHead className="font-medium text-neutral-500 w-12">Pos</TableHead>
                      <TableHead className="font-medium text-neutral-500">Driver</TableHead>
                      <TableHead className="font-medium text-neutral-500 text-right">Valuation Δ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {driversByPosition.map((driver, index) => {
                      const position = index + 1;
                      const valuationChange = calculateValuationChange(driver, position);

                      return (
                        <TableRow key={`valuation-${driver.id}`}>
                          <TableCell className="font-medium">{position}</TableCell>
                          <TableCell>
                            <div className="font-medium">{driver.name}</div>
                            <div className="text-sm text-gray-500">{driver.team?.name}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                valuationChange > 0
                                  ? "bg-green-100 text-green-800"
                                  : valuationChange < 0
                                  ? "bg-red-100 text-red-800"
                                  : "bg-neutral-100 text-neutral-500"
                              }`}
                            >
                              {valuationChange > 0 ? "+" : ""}
                              {valuationChange}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="md:col-span-2 flex justify-end mt-4">
            <Button
              className="bg-primary hover:bg-primary/90 py-2 px-6"
              onClick={handleSubmit}
              disabled={submitResultsMutation.isPending || !selectedRace || driversByPosition.length === 0}
            >
              {submitResultsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Submit Race Results"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
