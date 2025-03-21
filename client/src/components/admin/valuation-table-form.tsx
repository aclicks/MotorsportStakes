import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { ValuationTable } from "@shared/schema";

export default function ValuationTableForm() {
  const { toast } = useToast();
  const [editValues, setEditValues] = useState<Record<number, number>>({});

  // Fetch valuation table
  const { data: valuationTable, isLoading } = useQuery<ValuationTable[]>({
    queryKey: ["/api/valuation-table"],
  });

  // Update valuation entry mutation
  const updateValuationMutation = useMutation({
    mutationFn: async ({ difference, percentageChange }: { difference: number; percentageChange: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/valuation-table/${difference}`, {
        percentageChange,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Valuation Updated",
        description: "The valuation entry has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/valuation-table"] });
      setEditValues({});
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle input change
  const handleInputChange = (difference: number, value: string) => {
    const numValue = parseInt(value);
    setEditValues({
      ...editValues,
      [difference]: isNaN(numValue) ? 0 : numValue,
    });
  };

  // Handle save button click
  const handleSave = (difference: number) => {
    const percentageValue = editValues[difference];
    if (percentageValue !== undefined) {
      // Convert to string for the numeric field in the database
      const percentageChange = percentageValue.toString();
      updateValuationMutation.mutate({ difference, percentageChange });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Valuation Table</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <p className="text-neutral-500">
            Edit the valuation table ranging from -20 to +20. These values determine what percentage of their value 
            drivers, engines, and teams gain or lose based on their performance compared to the 
            average of their last 3 races. For example, a value of 5 means a 5% change in valuation.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-neutral-100">
                  <TableHead className="font-medium text-neutral-500">Value</TableHead>
                  <TableHead className="font-medium text-neutral-500">Description</TableHead>
                  <TableHead className="font-medium text-neutral-500">Percentage Change (%)</TableHead>
                  <TableHead className="font-medium text-neutral-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {valuationTable
                  ?.sort((a, b) => b.difference - a.difference)
                  .map((entry) => (
                    <TableRow key={entry.difference}>
                      <TableCell
                        className={`font-medium ${
                          entry.difference > 0
                            ? "text-success"
                            : entry.difference < 0
                            ? "text-error"
                            : "text-neutral-800"
                        }`}
                      >
                        {entry.difference > 0 ? "+" : ""}
                        {entry.difference}
                      </TableCell>
                      <TableCell>{entry.description}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-24"
                          value={
                            editValues[entry.difference] !== undefined
                              ? editValues[entry.difference]
                              : parseFloat(entry.percentageChange.toString())
                          }
                          onChange={(e) => handleInputChange(entry.difference, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleSave(entry.difference)}
                          disabled={
                            updateValuationMutation.isPending ||
                            editValues[entry.difference] === undefined ||
                            editValues[entry.difference] === parseFloat(entry.percentageChange.toString())
                          }
                          className="text-primary hover:text-primary/90"
                          variant="ghost"
                          size="sm"
                        >
                          {updateValuationMutation.isPending &&
                          updateValuationMutation.variables?.difference === entry.difference ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <i className="fas fa-save"></i>
                          )}
                        </Button>
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
