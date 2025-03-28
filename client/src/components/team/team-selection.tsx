import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Driver, Engine, Team, UserTeamComplete } from "@shared/schema";
import { Loader2, AlertTriangle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";

interface DriverWithTeam extends Driver {
  team?: Team;
  averagePosition?: number;
}

interface EngineWithAverage extends Engine {
  averagePosition?: number;
}

interface TeamWithAverage extends Team {
  averagePosition?: number;
}

interface TeamSelectionProps {
  team: UserTeamComplete;
  drivers: DriverWithTeam[];
  engines: EngineWithAverage[];
  teams: TeamWithAverage[];
  onSave: (data: {
    driver1Id: number | null;
    driver2Id: number | null;
    engineId: number | null;
    teamId: number | null;
  }) => void;
  isPending: boolean;
  disabled?: boolean;
}

export function TeamSelection({
  team,
  drivers,
  engines,
  teams,
  onSave,
  isPending,
  disabled = false,
}: TeamSelectionProps) {
  const [selectedDriver1Id, setSelectedDriver1Id] = useState<number | null>(team.driver1Id || null);
  const [selectedDriver2Id, setSelectedDriver2Id] = useState<number | null>(team.driver2Id || null);
  const [selectedEngineId, setSelectedEngineId] = useState<number | null>(team.engineId || null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(team.teamId || null);
  const [showDriverWarning, setShowDriverWarning] = useState(false);
  
  // Atualiza os estados quando o time muda (mudança entre abas)
  useEffect(() => {
    // Verificar se o piloto selecionado foi aposentado
    if (team.driver1Id) {
      const driver1 = drivers.find(d => d.id === team.driver1Id);
      if (driver1 && driver1.retired) {
        // Se o piloto foi aposentado, limpar a seleção
        setSelectedDriver1Id(null);
      } else {
        setSelectedDriver1Id(team.driver1Id);
      }
    } else {
      setSelectedDriver1Id(null);
    }
    
    // O mesmo para o driver 2
    if (team.driver2Id) {
      const driver2 = drivers.find(d => d.id === team.driver2Id);
      if (driver2 && driver2.retired) {
        setSelectedDriver2Id(null);
      } else {
        setSelectedDriver2Id(team.driver2Id);
      }
    } else {
      setSelectedDriver2Id(null);
    }
    
    setSelectedEngineId(team.engineId || null);
    setSelectedTeamId(team.teamId || null);
  }, [team.id, team.driver1Id, team.driver2Id, team.engineId, team.teamId, drivers]);

  const selectedDriver1 = drivers.find((d) => d.id === selectedDriver1Id);
  const selectedDriver2 = drivers.find((d) => d.id === selectedDriver2Id);
  const selectedEngine = engines.find((e) => e.id === selectedEngineId) as EngineWithAverage | undefined;
  const selectedTeam = teams.find((t) => t.id === selectedTeamId) as TeamWithAverage | undefined;

  const calculateTotalCost = () => {
    let cost = 0;
    if (selectedDriver1) cost += selectedDriver1.value;
    if (selectedDriver2) cost += selectedDriver2.value;
    if (selectedEngine) cost += selectedEngine.value;
    if (selectedTeam) cost += selectedTeam.value;
    return cost;
  };

  const totalCost = calculateTotalCost();
  const availableCredits = team.currentCredits - totalCost;
  const isOverBudget = availableCredits < 0;
  // Detectar aposentadoria de piloto como uma mudança
  const driver1Retired = team.driver1Id && drivers.find(d => d.id === team.driver1Id)?.retired;
  const driver2Retired = team.driver2Id && drivers.find(d => d.id === team.driver2Id)?.retired;
  
  const hasChanges =
    selectedDriver1Id !== team.driver1Id ||
    selectedDriver2Id !== team.driver2Id ||
    selectedEngineId !== team.engineId ||
    selectedTeamId !== team.teamId ||
    driver1Retired ||
    driver2Retired;

  const handleSave = () => {
    onSave({
      driver1Id: selectedDriver1Id,
      driver2Id: selectedDriver2Id,
      engineId: selectedEngineId,
      teamId: selectedTeamId,
    });
  };

  // Filter out the already selected driver from the other driver dropdown
  // Filtrar pilotos não aposentados e disponíveis para cada seleção
  const availableDriversForDriver1 = drivers.filter(
    (d) => d.id !== selectedDriver2Id && !d.retired
  );
  const availableDriversForDriver2 = drivers.filter(
    (d) => d.id !== selectedDriver1Id && !d.retired
  );

  return (
    <Card>
      {/* Driver restriction warning dialog */}
      <Dialog open={showDriverWarning} onOpenChange={setShowDriverWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              Driver Selection Restriction
            </DialogTitle>
            <DialogDescription className="pt-2">
              <p className="mb-4">
                In the Motorsport Stakes game, you cannot select the same driver across multiple teams.
              </p>
              <p className="mb-4">
                Each driver can only be selected once across all your teams. This encourages diverse team compositions and creates more strategic choices.
              </p>
              <p>
                You can use different engines and chassis across your teams, but drivers must be unique to each team.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowDriverWarning(false)}>I understand</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardContent className="pt-6 p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">{team.name}</h2>
            <p className="text-foreground font-medium mt-1">
              Select 2 drivers, 1 engine, and 1 chassis. 
              <Button 
                variant="link" 
                className="text-primary hover:text-primary/90 font-bold p-0 h-auto"
                onClick={() => setShowDriverWarning(true)}
              >
                Driver restrictions apply
              </Button>
            </p>
            <p className="text-foreground font-medium text-sm mt-1.5">
              Unspent credits from previous race are carried forward and added to your budget.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="bg-secondary/90 border border-secondary shadow-sm px-4 py-3 rounded-lg">
              <div className="flex items-center">
                <span className="text-sm font-bold text-white">Available Credits: </span>
                <span className={`font-bold text-lg ml-1.5 ${isOverBudget ? "text-red-100" : "text-white"}`}>
                  {Math.max(0, availableCredits)}
                </span>
                {isOverBudget && (
                  <span className="text-xs ml-2 text-red-100 font-bold">
                    (Over budget by {Math.abs(availableCredits)})
                  </span>
                )}
              </div>
              {team.unspentCredits > 0 && (
                <div className="text-sm mt-1 text-white font-bold">
                  Includes {team.unspentCredits} unspent credits from previous race
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Driver 1 Selection */}
          <div className="border border-neutral-300 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-neutral-800/5 p-4">
              <h3 className="font-bold text-foreground">Driver 1</h3>
            </div>
            <div className="p-4">
              <Select
                value={selectedDriver1Id?.toString()}
                onValueChange={(value) => setSelectedDriver1Id(value ? parseInt(value) : null)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Driver" />
                </SelectTrigger>
                <SelectContent>
                  {availableDriversForDriver1.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name} ({driver.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedDriver1 && (
                <div className="mt-4 bg-neutral-900 border border-neutral-700 rounded-lg p-4 shadow-md">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-base font-bold text-primary">{selectedDriver1.number}</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-bold text-foreground">{selectedDriver1.name}</p>
                      <p className="text-sm text-foreground font-medium">
                        {selectedDriver1.team?.name || "No Team"}
                      </p>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                      <span className="text-lg font-bold text-primary">{selectedDriver1.value}</span>
                      {selectedDriver1.averagePosition !== undefined && (
                        <span className="text-sm text-foreground font-medium">
                          Avg Pos: {selectedDriver1.averagePosition}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Driver 2 Selection */}
          <div className="border border-neutral-300 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-neutral-800/5 p-4">
              <h3 className="font-bold text-foreground">Driver 2</h3>
            </div>
            <div className="p-4">
              <Select
                value={selectedDriver2Id?.toString()}
                onValueChange={(value) => setSelectedDriver2Id(value ? parseInt(value) : null)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Driver" />
                </SelectTrigger>
                <SelectContent>
                  {availableDriversForDriver2.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name} ({driver.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedDriver2 && (
                <div className="mt-4 bg-neutral-900 border border-neutral-700 rounded-lg p-4 shadow-md">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-base font-bold text-primary">{selectedDriver2.number}</span>
                    </div>
                    <div className="ml-4">
                      <p className="font-bold text-foreground">{selectedDriver2.name}</p>
                      <p className="text-sm text-foreground font-medium">
                        {selectedDriver2.team?.name || "No Team"}
                      </p>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                      <span className="text-lg font-bold text-primary">{selectedDriver2.value}</span>
                      {selectedDriver2.averagePosition !== undefined && (
                        <span className="text-sm text-foreground font-medium">
                          Avg Pos: {selectedDriver2.averagePosition}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Engine Selection */}
          <div className="border border-neutral-300 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-neutral-800/5 p-4">
              <h3 className="font-bold text-foreground">Engine</h3>
            </div>
            <div className="p-4">
              <Select
                value={selectedEngineId?.toString()}
                onValueChange={(value) => setSelectedEngineId(value ? parseInt(value) : null)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Engine" />
                </SelectTrigger>
                <SelectContent>
                  {engines.map((engine) => (
                    <SelectItem key={engine.id} value={engine.id.toString()}>
                      {engine.name} ({engine.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedEngine && (
                <div className="mt-4 bg-neutral-900 border border-neutral-700 rounded-lg p-4 shadow-md">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="font-bold text-foreground">{selectedEngine.name}</p>
                      <p className="text-sm text-foreground font-medium">Engine</p>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                      <span className="text-lg font-bold text-primary">{selectedEngine.value}</span>
                      {selectedEngine.averagePosition !== undefined && (
                        <span className="text-sm text-foreground font-medium">
                          Avg Pos: {selectedEngine.averagePosition}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chassis Selection */}
          <div className="border border-neutral-300 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-neutral-800/5 p-4">
              <h3 className="font-bold text-foreground">Chassis</h3>
            </div>
            <div className="p-4">
              <Select
                value={selectedTeamId?.toString()}
                onValueChange={(value) => setSelectedTeamId(value ? parseInt(value) : null)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Chassis" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name} ({team.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedTeam && (
                <div className="mt-4 bg-neutral-900 border border-neutral-700 rounded-lg p-4 shadow-md">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-secondary">
                        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.5-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path>
                        <circle cx="7" cy="17" r="2"></circle>
                        <path d="M9 17h6"></path>
                        <circle cx="17" cy="17" r="2"></circle>
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="font-bold text-foreground">{selectedTeam.name}</p>
                      <p className="text-sm text-foreground font-medium">Chassis</p>
                    </div>
                    <div className="ml-auto flex flex-col items-end">
                      <span className="text-lg font-bold text-primary">{selectedTeam.value}</span>
                      {selectedTeam.averagePosition !== undefined && (
                        <span className="text-sm text-foreground font-medium">
                          Avg Pos: {selectedTeam.averagePosition}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-6 border-t border-neutral-300 mt-6">
          <div>
            {isOverBudget && (
              <div className="text-sm text-red-600 font-bold">
                Your team is over budget. Please adjust your selections.
              </div>
            )}
            {(!selectedDriver1Id && team.driver1Id || !selectedDriver2Id && team.driver2Id) && (
              <div className="text-sm text-amber-600 font-bold">
                A driver in your team has been retired. Please select a new driver.
              </div>
            )}
            {disabled && (
              <div className="text-sm text-amber-600 font-bold">
                Betting is currently closed. You cannot make changes to your team.
              </div>
            )}
            {!disabled && !hasChanges && !isOverBudget && !((!selectedDriver1Id && team.driver1Id) || (!selectedDriver2Id && team.driver2Id)) && (
              <div className="text-sm text-foreground font-medium">
                Make changes to your team to save.
              </div>
            )}
          </div>
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-white px-8 font-bold"
            disabled={isPending || isOverBudget || !hasChanges || disabled}
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Time"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}