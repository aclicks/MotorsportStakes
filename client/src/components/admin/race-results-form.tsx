import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Race, Driver } from "@shared/schema";

export default function RaceResultsForm() {
  const { toast } = useToast();
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [results, setResults] = useState<Array<{ driverId: number; position: number }>>([]);

  // Fetch races
  const { data: races, isLoading: isLoadingRaces } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  // Fetch drivers
  const { data: marketData, isLoading: isLoadingMarket } = useQuery({
    queryKey: ["/api/market"],
  });

  // Get drivers from market data
  const drivers: Driver[] = marketData?.drivers || [];

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

    // Initialize positions for all drivers
    if (drivers.length > 0) {
      const initialResults = drivers.map((driver, index) => ({
        driverId: driver.id,
        position: index + 1,
      }));
      setResults(initialResults);
    }
  };

  // Handle position change
  const handlePositionChange = (driverId: number, position: number) => {
    const updatedResults = results.map((result) => {
      if (result.driverId === driverId) {
        return { ...result, position };
      }
      return result;
    });
    setResults(updatedResults);
  };

  // Calculate valuation change (mock function for display purposes)
  const calculateValuationChange = (driver: Driver, position: number): number => {
    // This is a simplified representation - the real calculation happens on the server
    const lastAvg = 5; // Placeholder, would be replaced with real data
    const diff = lastAvg - position;
    return diff > 0 ? diff * 2 : diff * 2;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!selectedRaceId || results.length === 0) {
      toast({
        title: "Error",
        description: "Please select a race and enter positions for all drivers.",
        variant: "destructive",
      });
      return;
    }

    // Validate that all positions are between 1 and the number of drivers
    const validPositions = results.every(
      (result) => result.position >= 1 && result.position <= drivers.length
    );

    if (!validPositions) {
      toast({
        title: "Invalid Positions",
        description: `Positions must be between 1 and ${drivers.length}.`,
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate positions
    const positions = results.map((result) => result.position);
    const uniquePositions = new Set(positions);
    
    if (positions.length !== uniquePositions.size) {
      toast({
        title: "Duplicate Positions",
        description: "Each driver must have a unique position.",
        variant: "destructive",
      });
      return;
    }

    // Submit the results
    submitResultsMutation.mutate({
      raceId: selectedRaceId,
      results: results,
    });
  };

  const handleReset = () => {
    // Initialize positions for all drivers
    if (drivers.length > 0) {
      const initialResults = drivers.map((driver, index) => ({
        driverId: driver.id,
        position: index + 1,
      }));
      setResults(initialResults);
    }
  };

  // Find the selected race
  const selectedRace = races?.find((race) => race.id === selectedRaceId);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-800">Enter Race Results</h2>
          <p className="text-neutral-500">Input the final positions for the selected race.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          {isLoadingRaces ? (
            <Skeleton className="h-10 w-48" />
          ) : (
            <Select value={selectedRaceId?.toString() || ""} onValueChange={handleRaceChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Race" />
              </SelectTrigger>
              <SelectContent>
                {races
                  ?.filter((race) => new Date(race.date) < new Date())
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((race) => (
                    <SelectItem key={race.id} value={race.id.toString()}>
                      {race.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isLoadingMarket || !selectedRaceId ? (
        <Skeleton className="h-[400px] w-full" />
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-100">
                  <TableHead className="font-medium text-neutral-500">Position</TableHead>
                  <TableHead className="font-medium text-neutral-500">Driver</TableHead>
                  <TableHead className="font-medium text-neutral-500">Team</TableHead>
                  <TableHead className="font-medium text-neutral-500">Engine</TableHead>
                  <TableHead className="font-medium text-neutral-500">Last 3 Avg</TableHead>
                  <TableHead className="font-medium text-neutral-500">Valuation Δ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers
                  .map((driver) => {
                    const result = results.find((r) => r.driverId === driver.id);
                    const position = result ? result.position : 0;
                    const valuationChange = calculateValuationChange(driver, position);

                    return (
                      <TableRow key={driver.id}>
                        <TableCell>
                          <Input
                            type="number"
                            className="w-20"
                            value={position}
                            min={1}
                            max={drivers.length}
                            onChange={(e) =>
                              handlePositionChange(driver.id, parseInt(e.target.value) || 0)
                            }
                          />
                        </TableCell>
                        <TableCell>{driver.name}</TableCell>
                        <TableCell>{driver.team?.name}</TableCell>
                        <TableCell>
                          {/* This would be replaced with real engine data */}
                          {driver.team?.name === "Red Bull Racing" || driver.team?.name === "AlphaTauri"
                            ? "Honda"
                            : driver.team?.name === "Mercedes" || driver.team?.name === "Aston Martin" || driver.team?.name === "Williams"
                            ? "Mercedes"
                            : driver.team?.name === "Ferrari" || driver.team?.name === "Alfa Romeo" || driver.team?.name === "Haas"
                            ? "Ferrari"
                            : "Renault"}
                        </TableCell>
                        <TableCell>
                          {/* Placeholder for last 3 average */}
                          {(Math.random() * 10 + 1).toFixed(1)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              valuationChange > 0
                                ? "bg-success bg-opacity-10 text-success"
                                : valuationChange < 0
                                ? "bg-error bg-opacity-10 text-error"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {valuationChange > 0 ? "+" : ""}
                            {valuationChange}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              className="mr-3"
              onClick={handleReset}
              disabled={submitResultsMutation.isPending}
            >
              Reset
            </Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleSubmit}
              disabled={submitResultsMutation.isPending || !selectedRace}
            >
              {submitResultsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Results"
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
