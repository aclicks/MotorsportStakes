import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Race, RaceResult } from "@shared/schema";

interface RaceResultsProps {
  race: Race;
}

interface EnhancedRaceResult extends RaceResult {
  driver?: {
    name: string;
    number: number;
  };
  team?: {
    name: string;
  };
}

export default function RaceResults({ race }: RaceResultsProps) {
  const { data: results, isLoading } = useQuery<EnhancedRaceResult[]>({
    queryKey: [`/api/races/${race.id}/results`],
  });

  const formattedDate = format(new Date(race.date), "MMMM d, yyyy");

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-neutral-800">
            Last Race: {race.name}
          </h2>
          <span className="text-sm text-neutral-500">{formattedDate}</span>
        </div>
        
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-100">
                  <TableHead className="font-medium text-neutral-500">Position</TableHead>
                  <TableHead className="font-medium text-neutral-500">Driver</TableHead>
                  <TableHead className="font-medium text-neutral-500">Team</TableHead>
                  <TableHead className="font-medium text-neutral-500">Valuation Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results?.map((result) => (
                  <TableRow key={result.id} className="border-b border-neutral-200">
                    <TableCell>{result.position}</TableCell>
                    <TableCell>{result.driver?.name || "Unknown Driver"}</TableCell>
                    <TableCell>{result.team?.name || "Unknown Team"}</TableCell>
                    <TableCell>
                      {result.valuation ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          result.valuation > 0 
                            ? "bg-success bg-opacity-10 text-success"
                            : result.valuation < 0
                              ? "bg-error bg-opacity-10 text-error"
                              : "bg-neutral-100 text-neutral-500"
                        }`}>
                          {result.valuation > 0 && <i className="fas fa-arrow-up mr-1"></i>}
                          {result.valuation < 0 && <i className="fas fa-arrow-down mr-1"></i>}
                          {result.valuation > 0 ? `+${result.valuation}` : result.valuation}
                        </span>
                      ) : (
                        <span className="text-neutral-400">N/A</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
