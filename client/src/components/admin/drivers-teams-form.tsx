import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { Driver, Team, Engine } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DriversTeamsForm() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("drivers");
  
  // State for editing
  const [isEditingDriver, setIsEditingDriver] = useState(false);
  const [isEditingTeam, setIsEditingTeam] = useState(false);
  const [isEditingEngine, setIsEditingEngine] = useState(false);
  
  // State for form values
  const [driverForm, setDriverForm] = useState({
    id: 0,
    name: "",
    number: 0,
    teamId: 0,
    value: 150,
    retired: false,
    lastRace1Position: null,
    lastRace2Position: null,
    lastRace3Position: null,
  });
  
  const [teamForm, setTeamForm] = useState({
    id: 0,
    name: "",
    value: 150,
  });
  
  const [engineForm, setEngineForm] = useState({
    id: 0,
    name: "",
    value: 150,
  });

  // Fetch market data
  const { data: marketData, isLoading } = useQuery({
    queryKey: ["/api/market"],
  });

  const drivers: Driver[] = marketData?.drivers || [];
  const teams: Team[] = marketData?.teams || [];
  const engines: Engine[] = marketData?.engines || [];

  // Create driver mutation
  const createDriverMutation = useMutation({
    mutationFn: async (data: Omit<Driver, "id">) => {
      const res = await apiRequest("POST", "/api/admin/drivers", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Driver Created",
        description: "The driver has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      resetDriverForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Driver",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update driver mutation
  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<Driver, "id">> }) => {
      const res = await apiRequest("PATCH", `/api/admin/drivers/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Driver Updated",
        description: "The driver has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      resetDriverForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Driver",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create team mutation
  const createTeamMutation = useMutation({
    mutationFn: async (data: Omit<Team, "id">) => {
      const res = await apiRequest("POST", "/api/admin/teams", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Team Created",
        description: "The team has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      resetTeamForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<Team, "id">> }) => {
      const res = await apiRequest("PATCH", `/api/admin/teams/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Team Updated",
        description: "The team has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      resetTeamForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Team",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create engine mutation
  const createEngineMutation = useMutation({
    mutationFn: async (data: Omit<Engine, "id">) => {
      const res = await apiRequest("POST", "/api/admin/engines", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Engine Created",
        description: "The engine has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      resetEngineForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Engine",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update engine mutation
  const updateEngineMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Omit<Engine, "id">> }) => {
      const res = await apiRequest("PATCH", `/api/admin/engines/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Engine Updated",
        description: "The engine has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/market"] });
      resetEngineForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Engine",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset form functions
  const resetDriverForm = () => {
    setDriverForm({
      id: 0,
      name: "",
      number: 0,
      teamId: 0,
      value: 150,
      retired: false,
      lastRace1Position: null,
      lastRace2Position: null,
      lastRace3Position: null,
    });
    setIsEditingDriver(false);
  };

  const resetTeamForm = () => {
    setTeamForm({
      id: 0,
      name: "",
      value: 150,
    });
    setIsEditingTeam(false);
  };

  const resetEngineForm = () => {
    setEngineForm({
      id: 0,
      name: "",
      value: 150,
    });
    setIsEditingEngine(false);
  };

  // Handle edit functions
  const handleEditDriver = (driver: Driver) => {
    setDriverForm({
      id: driver.id,
      name: driver.name,
      number: driver.number,
      teamId: driver.teamId,
      value: driver.value,
      retired: driver.retired || false,
      lastRace1Position: driver.lastRace1Position || null,
      lastRace2Position: driver.lastRace2Position || null,
      lastRace3Position: driver.lastRace3Position || null,
    });
    setIsEditingDriver(true);
  };

  const handleEditTeam = (team: Team) => {
    setTeamForm({
      id: team.id,
      name: team.name,
      value: team.value,
    });
    setIsEditingTeam(true);
  };

  const handleEditEngine = (engine: Engine) => {
    setEngineForm({
      id: engine.id,
      name: engine.name,
      value: engine.value,
    });
    setIsEditingEngine(true);
  };

  // Submit functions
  const handleDriverSubmit = () => {
    if (!driverForm.name || driverForm.number <= 0 || driverForm.teamId <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill all required fields correctly.",
        variant: "destructive",
      });
      return;
    }

    if (isEditingDriver) {
      updateDriverMutation.mutate({
        id: driverForm.id,
        data: {
          name: driverForm.name,
          number: driverForm.number,
          teamId: driverForm.teamId,
          value: driverForm.value,
        },
      });
    } else {
      createDriverMutation.mutate({
        name: driverForm.name,
        number: driverForm.number,
        teamId: driverForm.teamId,
        value: driverForm.value,
      });
    }
  };

  const handleTeamSubmit = () => {
    if (!teamForm.name) {
      toast({
        title: "Validation Error",
        description: "Please enter a team name.",
        variant: "destructive",
      });
      return;
    }

    if (isEditingTeam) {
      updateTeamMutation.mutate({
        id: teamForm.id,
        data: {
          name: teamForm.name,
          value: teamForm.value,
        },
      });
    } else {
      createTeamMutation.mutate({
        name: teamForm.name,
        value: teamForm.value,
      });
    }
  };

  const handleEngineSubmit = () => {
    if (!engineForm.name) {
      toast({
        title: "Validation Error",
        description: "Please enter an engine name.",
        variant: "destructive",
      });
      return;
    }

    if (isEditingEngine) {
      updateEngineMutation.mutate({
        id: engineForm.id,
        data: {
          name: engineForm.name,
          value: engineForm.value,
        },
      });
    } else {
      createEngineMutation.mutate({
        name: engineForm.name,
        value: engineForm.value,
      });
    }
  };

  // Determine if any mutation is pending
  const isDriverMutationPending = createDriverMutation.isPending || updateDriverMutation.isPending;
  const isTeamMutationPending = createTeamMutation.isPending || updateTeamMutation.isPending;
  const isEngineMutationPending = createEngineMutation.isPending || updateEngineMutation.isPending;

  return (
    <div>
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="engines">Engines</TabsTrigger>
        </TabsList>

        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle>Drivers</CardTitle>
              <CardDescription>Manage Formula 1 drivers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex justify-end">
                <Dialog open={isEditingDriver} onOpenChange={setIsEditingDriver}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      {isEditingDriver ? "Edit Driver" : "Add Driver"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isEditingDriver ? "Edit Driver" : "Add New Driver"}</DialogTitle>
                      <DialogDescription>
                        {isEditingDriver
                          ? "Update driver information"
                          : "Enter driver details to add them to the system"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={driverForm.name}
                          onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="number" className="text-right">
                          Number
                        </Label>
                        <Input
                          id="number"
                          type="number"
                          value={driverForm.number}
                          onChange={(e) =>
                            setDriverForm({
                              ...driverForm,
                              number: parseInt(e.target.value) || 0,
                            })
                          }
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="team" className="text-right">
                          Team
                        </Label>
                        <Select
                          value={driverForm.teamId.toString()}
                          onValueChange={(value) =>
                            setDriverForm({
                              ...driverForm,
                              teamId: parseInt(value),
                            })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select Team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id.toString()}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="value" className="text-right">
                          Value
                        </Label>
                        <Input
                          id="value"
                          type="number"
                          value={driverForm.value}
                          onChange={(e) =>
                            setDriverForm({
                              ...driverForm,
                              value: parseInt(e.target.value) || 150,
                            })
                          }
                          className="col-span-3"
                          min={100}
                          max={250}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={resetDriverForm}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-primary hover:bg-primary/90"
                        onClick={handleDriverSubmit}
                        disabled={isDriverMutationPending}
                      >
                        {isDriverMutationPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isEditingDriver ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          isEditingDriver ? "Update Driver" : "Add Driver"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-100">
                        <TableHead className="w-12">Number</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {drivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell className="font-medium">{driver.number}</TableCell>
                          <TableCell>{driver.name}</TableCell>
                          <TableCell>
                            {teams.find((t) => t.id === driver.teamId)?.name || "Unknown"}
                          </TableCell>
                          <TableCell>{driver.value}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditDriver(driver)}
                              disabled={isDriverMutationPending}
                            >
                              Edit
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
        </TabsContent>

        <TabsContent value="teams">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>Manage Formula 1 teams (chassis)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex justify-end">
                <Dialog open={isEditingTeam} onOpenChange={setIsEditingTeam}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      {isEditingTeam ? "Edit Team" : "Add Team"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{isEditingTeam ? "Edit Team" : "Add New Team"}</DialogTitle>
                      <DialogDescription>
                        {isEditingTeam
                          ? "Update team information"
                          : "Enter team details to add them to the system"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="team-name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="team-name"
                          value={teamForm.name}
                          onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="team-value" className="text-right">
                          Value
                        </Label>
                        <Input
                          id="team-value"
                          type="number"
                          value={teamForm.value}
                          onChange={(e) =>
                            setTeamForm({
                              ...teamForm,
                              value: parseInt(e.target.value) || 150,
                            })
                          }
                          className="col-span-3"
                          min={100}
                          max={250}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={resetTeamForm}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-primary hover:bg-primary/90"
                        onClick={handleTeamSubmit}
                        disabled={isTeamMutationPending}
                      >
                        {isTeamMutationPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isEditingTeam ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          isEditingTeam ? "Update Team" : "Add Team"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-100">
                        <TableHead>Name</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teams.map((team) => (
                        <TableRow key={team.id}>
                          <TableCell className="font-medium">{team.name}</TableCell>
                          <TableCell>{team.value}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTeam(team)}
                              disabled={isTeamMutationPending}
                            >
                              Edit
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
        </TabsContent>

        <TabsContent value="engines">
          <Card>
            <CardHeader>
              <CardTitle>Engines</CardTitle>
              <CardDescription>Manage Formula 1 engines</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6 flex justify-end">
                <Dialog open={isEditingEngine} onOpenChange={setIsEditingEngine}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary hover:bg-primary/90">
                      {isEditingEngine ? "Edit Engine" : "Add Engine"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {isEditingEngine ? "Edit Engine" : "Add New Engine"}
                      </DialogTitle>
                      <DialogDescription>
                        {isEditingEngine
                          ? "Update engine information"
                          : "Enter engine details to add them to the system"}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="engine-name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="engine-name"
                          value={engineForm.name}
                          onChange={(e) => setEngineForm({ ...engineForm, name: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="engine-value" className="text-right">
                          Value
                        </Label>
                        <Input
                          id="engine-value"
                          type="number"
                          value={engineForm.value}
                          onChange={(e) =>
                            setEngineForm({
                              ...engineForm,
                              value: parseInt(e.target.value) || 150,
                            })
                          }
                          className="col-span-3"
                          min={100}
                          max={250}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={resetEngineForm}>
                        Cancel
                      </Button>
                      <Button
                        className="bg-primary hover:bg-primary/90"
                        onClick={handleEngineSubmit}
                        disabled={isEngineMutationPending}
                      >
                        {isEngineMutationPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isEditingEngine ? "Updating..." : "Creating..."}
                          </>
                        ) : (
                          isEditingEngine ? "Update Engine" : "Add Engine"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {isLoading ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-neutral-100">
                        <TableHead>Name</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {engines.map((engine) => (
                        <TableRow key={engine.id}>
                          <TableCell className="font-medium">{engine.name}</TableCell>
                          <TableCell>{engine.value}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEngine(engine)}
                              disabled={isEngineMutationPending}
                            >
                              Edit
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
