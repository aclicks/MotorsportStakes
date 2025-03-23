import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ValuationTable } from "@shared/schema";

export default function ValuationTablePage() {
  const { data: valuationTable, isLoading } = useQuery<ValuationTable[]>({
    queryKey: ["/api/valuation-table"],
  });

  return (
    <div className="p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-800">Valuation System</h1>
        <p className="text-neutral-500">
          This table shows how asset values change based on performance compared to 3-race averages.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Valuation Table</CardTitle>
          <CardDescription>
            When a driver, team, or engine performs better or worse than their 3-race average position,
            their value changes according to this table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-100">
                    <TableHead className="font-medium text-neutral-500">Position Difference</TableHead>
                    <TableHead className="font-medium text-neutral-500">Description</TableHead>
                    <TableHead className="font-medium text-neutral-500">Value Change (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {valuationTable?.sort((a, b) => b.difference - a.difference).map((entry) => (
                    <TableRow 
                      key={entry.difference} 
                      className={`border-b border-neutral-200 ${
                        entry.difference === 0 
                          ? "bg-neutral-50" 
                          : Number(entry.difference) > 0 
                            ? "hover:bg-green-50" 
                            : "hover:bg-red-50"
                      }`}
                    >
                      <TableCell className="font-medium">
                        {Number(entry.difference) > 0 ? `+${entry.difference}` : entry.difference}
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell className={`font-medium ${
                        Number(entry.percentageChange) > 0 
                          ? "text-success" 
                          : Number(entry.percentageChange) < 0 
                            ? "text-error" 
                            : ""
                      }`}>
                        {Number(entry.percentageChange) > 0 ? `+${entry.percentageChange}` : `${entry.percentageChange}`}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How Valuation Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Every asset (driver, team, or engine) has a value in credits. This value changes after each race based on performance.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-medium">For Drivers:</h3>
            <p>
              We compare a driver's position in the current race with their average position over the last three races. 
              If they performed better than their average, their value increases. If worse, their value decreases.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">For Teams:</h3>
            <p>
              Team valuation is based on the average performance of their two drivers, compared to the team's
              three-race average position.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">For Engines:</h3>
            <p>
              Engine valuation is based on the average performance of all drivers using that engine, compared to
              the engine's three-race average position.
            </p>
          </div>
          
          <div className="bg-neutral-100 p-4 rounded-lg mt-4">
            <p className="font-medium">Formula:</p>
            <p>New Value = Current Value × (1 + Percentage Change/100)</p>
            <p className="text-sm text-neutral-500 mt-2">
              Example: If a driver worth 200 credits finishes 3 places better than their 3-race average,
              they get an 8% increase: 200 × (1 + 8/100) = 216 credits
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}