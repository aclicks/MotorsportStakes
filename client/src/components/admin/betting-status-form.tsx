import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function BettingStatusForm() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch current betting status
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/betting-status"],
    queryFn: async () => {
      const res = await fetch("/api/betting-status");
      if (!res.ok) {
        throw new Error("Failed to fetch betting status");
      }
      return res.json();
    }
  });

  // Update betting status mutation
  const { mutate, isPending } = useMutation({
    mutationFn: async (newStatus: boolean) => {
      const res = await apiRequest("POST", "/api/admin/betting-status", { isOpen: newStatus });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Betting status updated",
        description: `Betting is now ${data.isOpen ? "open" : "closed"}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/betting-status"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating betting status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update local state when data is loaded
  useEffect(() => {
    if (data) {
      setIsOpen(data.isOpen);
    }
  }, [data]);

  const handleToggle = (checked: boolean) => {
    setIsOpen(checked);
    mutate(checked);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>Error loading betting status.</p>
        <Button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/betting-status"] })}
          className="mt-2"
          variant="outline"
          size="sm"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Betting Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Allow Team Changes</h3>
            <p className="text-sm text-muted-foreground">
              {isOpen 
                ? "Betting is currently OPEN. Players can make changes to their teams." 
                : "Betting is currently CLOSED. Players cannot make changes to their teams."}
            </p>
          </div>
          <div className="flex items-center">
            <Switch 
              checked={isOpen} 
              onCheckedChange={handleToggle}
              disabled={isPending}
              className="data-[state=checked]:bg-green-500"
            />
            {isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}