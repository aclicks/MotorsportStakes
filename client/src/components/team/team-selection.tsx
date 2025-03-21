import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Driver, Engine, Team, UserTeamComplete } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface DriverWithTeam extends Driver {
  team?: Team;
}

interface TeamSelectionProps {
  team: UserTeamComplete;
  drivers: DriverWithTeam[];
  engines: Engine[];
  teams: Team[];
  onSave: (data: {
    driver1Id: number | null;
    driver2Id: number | null;
    engineId: number | null;
    teamId: number | null;
  }) => void;
  isPending: boolean;
}

export function TeamSelection({
  team,
  drivers,
  engines,
  teams,
  onSave,
  isPending,
}: TeamSelectionProps) {
  const [selectedDriver1Id, setSelectedDriver1Id] = useState<number | null>(team.driver1Id || null);
  const [selectedDriver2Id, setSelectedDriver2Id] = useState<number | null>(team.driver2Id || null);
  const [selectedEngineId, setSelectedEngineId] = useState<number | null>(team.engineId || null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(team.teamId || null);

  const selectedDriver1 = drivers.find((d) => d.id === selectedDriver1Id);
  const selectedDriver2 = drivers.find((d) => d.id === selectedDriver2Id);
  const selectedEngine = engines.find((e) => e.id === selectedEngineId);
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  const calculateTotalCost = () => {
    let cost = 0;
    if (selectedDriver1) cost += selectedDriver1.value;
    if (selectedDriver2) cost += selectedDriver2.value;
    if (selectedEngine) cost += selectedEngine.value;
    if (selectedTeam) cost += selectedTeam.value;
    return cost;
  };

  const isOverBudget = calculateTotalCost() > team.currentCredits;
  const hasChanges =
    selectedDriver1Id !== team.driver1Id ||
    selectedDriver2Id !== team.driver2Id ||
    selectedEngineId !== team.engineId ||
    selectedTeamId !== team.teamId;

  const handleSave = () => {
    onSave({
      driver1Id: selectedDriver1Id,
      driver2Id: selectedDriver2Id,
      engineId: selectedEngineId,
      teamId: selectedTeamId,
    });
  };

  // Filter out the already selected driver from the other driver dropdown
  const availableDriversForDriver1 = drivers.filter((d) => d.id !== selectedDriver2Id);
  const availableDriversForDriver2 = drivers.filter((d) => d.id !== selectedDriver1Id);

  return (
    <Card>
      <CardContent className="pt-6 p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800">{team.name}</h2>
            <p className="text-neutral-500">Select 2 drivers, 1 engine, and 1 chassis.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="bg-secondary text-white px-4 py-2 rounded-lg">
              <span className="text-sm">Available Credits: </span>
              <span className={`font-bold ${isOverBudget ? "text-red-300" : ""}`}>
                {team.currentCredits - calculateTotalCost()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Driver 1 Selection */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-100 p-4">
              <h3 className="font-medium">Driver 1</h3>
            </div>
            <div className="p-4">
              <Select
                value={selectedDriver1Id?.toString() || ""}
                onValueChange={(value) => setSelectedDriver1Id(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select Driver</SelectItem>
                  {availableDriversForDriver1.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name} ({driver.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedDriver1 && (
                <div className="mt-4 bg-white border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
                      <span className="text-base font-medium">{selectedDriver1.number}</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-neutral-800">{selectedDriver1.name}</p>
                      <p className="text-sm text-neutral-500">
                        {selectedDriver1.team?.name || "No Team"}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-lg font-bold text-primary">{selectedDriver1.value}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Driver 2 Selection */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-100 p-4">
              <h3 className="font-medium">Driver 2</h3>
            </div>
            <div className="p-4">
              <Select
                value={selectedDriver2Id?.toString() || ""}
                onValueChange={(value) => setSelectedDriver2Id(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Driver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select Driver</SelectItem>
                  {availableDriversForDriver2.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name} ({driver.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedDriver2 && (
                <div className="mt-4 bg-white border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
                      <span className="text-base font-medium">{selectedDriver2.number}</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-neutral-800">{selectedDriver2.name}</p>
                      <p className="text-sm text-neutral-500">
                        {selectedDriver2.team?.name || "No Team"}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-lg font-bold text-primary">{selectedDriver2.value}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Engine Selection */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-100 p-4">
              <h3 className="font-medium">Engine</h3>
            </div>
            <div className="p-4">
              <Select
                value={selectedEngineId?.toString() || ""}
                onValueChange={(value) => setSelectedEngineId(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Engine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select Engine</SelectItem>
                  {engines.map((engine) => (
                    <SelectItem key={engine.id} value={engine.id.toString()}>
                      {engine.name} ({engine.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedEngine && (
                <div className="mt-4 bg-white border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
                      <i className="fas fa-cog text-neutral-400"></i>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-neutral-800">{selectedEngine.name}</p>
                      <p className="text-sm text-neutral-500">Engine</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-lg font-bold text-primary">{selectedEngine.value}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chassis Selection */}
          <div className="border border-neutral-200 rounded-lg overflow-hidden">
            <div className="bg-neutral-100 p-4">
              <h3 className="font-medium">Chassis</h3>
            </div>
            <div className="p-4">
              <Select
                value={selectedTeamId?.toString() || ""}
                onValueChange={(value) => setSelectedTeamId(value ? parseInt(value) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Chassis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Select Chassis</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name} ({team.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTeam && (
                <div className="mt-4 bg-white border border-neutral-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
                      <i className="fas fa-car text-neutral-400"></i>
                    </div>
                    <div className="ml-4">
                      <p className="font-medium text-neutral-800">{selectedTeam.name}</p>
                      <p className="text-sm text-neutral-500">Chassis</p>
                    </div>
                    <div className="ml-auto">
                      <span className="text-lg font-bold text-primary">{selectedTeam.value}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90"
            disabled={isPending || isOverBudget || !hasChanges}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Team"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
