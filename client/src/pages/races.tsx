import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Race } from "@shared/schema";
import { Flag, Calendar, MapPin, Clock, Trophy, AlertTriangle } from "lucide-react";

export default function Races() {
  const { data: races, isLoading } = useQuery<Race[]>({
    queryKey: ["/api/races"],
  });

  const today = new Date();
  
  const getPastRaces = () => 
    races?.filter(race => new Date(race.date) < today && race.id !== 9999) // Exclude the Initial Values race
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
      
  const getUpcomingRaces = () => 
    races?.filter(race => new Date(race.date) >= today && race.id !== 9999) // Exclude the Initial Values race
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

  const pastRaces = races ? getPastRaces() : [];
  const upcomingRaces = races ? getUpcomingRaces() : [];

  // Function to get a darker color for alternating rows
  const getRowBgColor = (index: number, isNextRace: boolean = false) => {
    if (isNextRace) return "bg-red-950/20 hover:bg-red-950/30";
    return index % 2 === 0 ? "hover:bg-zinc-800/50" : "bg-zinc-800/30 hover:bg-zinc-800/50";
  };

  return (
    <div className="p-6 animate-fadeIn">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-primary to-red-600 bg-clip-text text-transparent mb-2">
          Calendário de Corridas
        </h1>
        <p className="text-zinc-400">Visualize todas as corridas da temporada atual e seus resultados.</p>
      </header>

      {/* Upcoming Races */}
      <Card className="mb-8 border border-zinc-800 shadow-xl overflow-hidden bg-zinc-900 animate-slideUp">
        <CardHeader className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-700/40 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
              Próximas Corridas
            </CardTitle>
          </div>
          <CardDescription className="text-zinc-400">
            Calendário das corridas que ainda acontecerão nesta temporada
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-[300px] w-full bg-zinc-800/50" />
            </div>
          ) : upcomingRaces.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-800 border-b border-zinc-700/50">
                    <TableHead className="text-zinc-300">Etapa</TableHead>
                    <TableHead className="text-zinc-300">Grande Prêmio</TableHead>
                    <TableHead className="text-zinc-300">Localização</TableHead>
                    <TableHead className="text-zinc-300">Data</TableHead>
                    <TableHead className="text-right text-zinc-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingRaces.map((race, index) => {
                    const isNextRace = upcomingRaces[0].id === race.id;
                    return (
                      <TableRow 
                        key={race.id} 
                        className={`border-b border-zinc-800 transition-colors ${getRowBgColor(index, isNextRace)}`}
                      >
                        <TableCell className="font-medium text-white">
                          <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-r from-red-600 to-yellow-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">
                              {race.round}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-100">
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-zinc-400" />
                            <span className={isNextRace ? "font-semibold text-primary" : ""}>
                              {race.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-zinc-400" />
                            {race.location}
                          </div>
                        </TableCell>
                        <TableCell className="text-zinc-300">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-zinc-400" />
                            {format(new Date(race.date), "d MMMM, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            className={`${isNextRace 
                              ? "bg-primary/80 text-white hover:bg-primary animate-pulse" 
                              : "bg-zinc-700 text-zinc-200 hover:bg-zinc-600"
                            } transition-all duration-300 shadow-md`}
                          >
                            {isNextRace ? "Próxima Corrida" : "Em Breve"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <Calendar className="h-12 w-12 text-zinc-600 mx-auto mb-3 opacity-50" />
              <p className="text-zinc-400 font-medium">Não há corridas futuras agendadas nesta temporada.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Races */}
      <Card className="border border-zinc-800 shadow-xl overflow-hidden bg-zinc-900 animate-slideUp animation-delay-150">
        <CardHeader className="bg-gradient-to-r from-zinc-900 to-zinc-800 border-b border-zinc-700/40 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent">
              Corridas Concluídas
            </CardTitle>
          </div>
          <CardDescription className="text-zinc-400">
            Histórico das corridas já realizadas e seus resultados
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-[300px] w-full bg-zinc-800/50" />
            </div>
          ) : pastRaces.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-zinc-800 border-b border-zinc-700/50">
                    <TableHead className="text-zinc-300">Etapa</TableHead>
                    <TableHead className="text-zinc-300">Grande Prêmio</TableHead>
                    <TableHead className="text-zinc-300">Localização</TableHead>
                    <TableHead className="text-zinc-300">Data</TableHead>
                    <TableHead className="text-right text-zinc-300">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastRaces.map((race, index) => (
                    <TableRow 
                      key={race.id} 
                      className={`border-b border-zinc-800 transition-colors ${getRowBgColor(index)}`}
                    >
                      <TableCell className="font-medium text-white">
                        <div className="flex items-center gap-2">
                          <div className="bg-gradient-to-r from-zinc-700 to-zinc-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">
                            {race.round}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-100">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4 text-zinc-400" />
                          {race.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-zinc-400" />
                          {race.location}
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-zinc-400" />
                          {format(new Date(race.date), "d MMMM, yyyy")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {race.resultsSubmitted ? (
                          <Badge 
                            className="bg-green-900/70 text-green-300 hover:bg-green-900 transition-all duration-300 shadow-md"
                          >
                            <Trophy className="h-3 w-3 mr-1" />
                            Resultados Publicados
                          </Badge>
                        ) : (
                          <Badge 
                            className="bg-amber-900/70 text-amber-300 hover:bg-amber-900 transition-all duration-300 shadow-md"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Aguardando Resultados
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 px-4">
              <Trophy className="h-12 w-12 text-zinc-600 mx-auto mb-3 opacity-50" />
              <p className="text-zinc-400 font-medium">Nenhuma corrida concluída até o momento.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
