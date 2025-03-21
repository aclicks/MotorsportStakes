import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Race } from "@shared/schema";
import { format } from "date-fns";

// Define schema for race form
const raceSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  location: z.string().min(1, { message: "Location is required" }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  round: z.number().min(1, { message: "Round must be at least 1" }),
});

type RaceFormValues = z.infer<typeof raceSchema>;

export default function RaceCalendarForm() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editingRaceId, setEditingRaceId] = useState<number | null>(null);

  // Fetch races
  const { data: races, isLoading } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  // Form for adding/editing races
  const form = useForm<RaceFormValues>({
    resolver: zodResolver(raceSchema),
    defaultValues: {
      name: "",
      location: "",
      date: new Date().toISOString().split("T")[0],
      round: 1,
    },
  });

  // Create race mutation
  const createRaceMutation = useMutation({
    mutationFn: async (data: RaceFormValues) => {
      // Convert date string to ISO format
      const formattedData = {
        ...data,
        date: new Date(data.date).toISOString(),
      };
      
      const res = await apiRequest("POST", "/api/admin/races", formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Race Created",
        description: "The race has been added to the calendar.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/races"] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Race",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update race mutation
  const updateRaceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: RaceFormValues }) => {
      // Convert date string to ISO format
      const formattedData = {
        ...data,
        date: new Date(data.date).toISOString(),
      };
      
      const res = await apiRequest("PATCH", `/api/admin/races/${id}`, formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Race Updated",
        description: "The race has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/races"] });
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Race",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form and editing state
  const resetForm = () => {
    form.reset({
      name: "",
      location: "",
      date: new Date().toISOString().split("T")[0],
      round: 1,
    });
    setIsEditing(false);
    setEditingRaceId(null);
  };

  // Handle edit button click
  const handleEdit = (race: Race) => {
    setIsEditing(true);
    setEditingRaceId(race.id);
    form.reset({
      name: race.name,
      location: race.location,
      date: new Date(race.date).toISOString().split("T")[0],
      round: race.round,
    });
  };

  // Handle form submission
  const onSubmit = (data: RaceFormValues) => {
    if (isEditing && editingRaceId) {
      updateRaceMutation.mutate({ id: editingRaceId, data });
    } else {
      createRaceMutation.mutate(data);
    }
  };

  const isPending = createRaceMutation.isPending || updateRaceMutation.isPending;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? "Edit Race" : "Add New Race"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Race Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. British Grand Prix" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Silverstone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="round"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Round</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          value={value}
                          onChange={(e) => onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isPending}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    isEditing ? "Update Race" : "Add Race"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Race Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : races && races.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-neutral-100">
                    <TableHead className="font-medium text-neutral-500">Round</TableHead>
                    <TableHead className="font-medium text-neutral-500">Race</TableHead>
                    <TableHead className="font-medium text-neutral-500">Location</TableHead>
                    <TableHead className="font-medium text-neutral-500">Date</TableHead>
                    <TableHead className="font-medium text-neutral-500">Status</TableHead>
                    <TableHead className="font-medium text-neutral-500">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {races
                    .sort((a, b) => a.round - b.round)
                    .map((race) => (
                      <TableRow key={race.id}>
                        <TableCell>{race.round}</TableCell>
                        <TableCell>{race.name}</TableCell>
                        <TableCell>{race.location}</TableCell>
                        <TableCell>{format(new Date(race.date), "MMMM d, yyyy")}</TableCell>
                        <TableCell>
                          {new Date(race.date) < new Date()
                            ? race.resultsSubmitted
                              ? "Completed"
                              : "Results Pending"
                            : "Upcoming"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(race)}
                            disabled={isPending}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-500">No races found. Add your first race above.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
