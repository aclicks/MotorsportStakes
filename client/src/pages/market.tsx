import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Driver, Engine, Team, AssetValueHistory } from "@shared/schema";
import { ArrowUp, ArrowDown, Minus, CarFront, Cpu, User, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MarketData {
  drivers: (Driver & { team?: Team; averagePosition?: number })[];
  engines: (Engine & { averagePosition?: number })[];
  teams: (Team & { averagePosition?: number })[];
}

export default function Market() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: marketData, isLoading: isMarketLoading } = useQuery<MarketData>({
    queryKey: ["/api/market"],
  });
  
  const { data: assetHistory } = useQuery<AssetValueHistory[]>({
    queryKey: ["/api/asset-value-history"],
  });

  // Get the value change for a specific asset
  const getValueChange = (entityId: number, entityType: 'driver' | 'team' | 'engine') => {
    if (!assetHistory) return null;
    
    const history = assetHistory
      .filter(h => h.entityId === entityId && h.entityType === entityType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    if (history.length < 2) return null;
    
    return history[0].value - history[1].value;
  };

  // Filter function for all asset types
  const filterBySearch = (name: string) => {
    if (!searchTerm) return true;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Render the value change badge
  const renderValueChange = (change: number | null) => {
    if (change === null) return <Badge variant="outline"><Minus size={14} /></Badge>;
    
    if (change > 0) {
      return (
        <Badge variant="success" className="ml-2 animate-fade-in">
          <ArrowUp size={14} className="mr-1" /> +{change}
        </Badge>
      );
    } else if (change < 0) {
      return (
        <Badge variant="destructive" className="ml-2 animate-fade-in">
          <ArrowDown size={14} className="mr-1" /> {change}
        </Badge>
      );
    } else {
      return <Badge variant="outline" className="ml-2"><Minus size={14} /></Badge>;
    }
  };

  // Card for individual assets
  const AssetCard = ({ 
    name, 
    value, 
    subtitle, 
    icon, 
    valueChange,
    averagePosition,
    extraInfo
  }: { 
    name: string; 
    value: number; 
    subtitle?: string; 
    icon: JSX.Element; 
    valueChange: number | null;
    averagePosition?: number | null;
    extraInfo?: React.ReactNode;
  }) => (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md group bg-neutral-900 border-neutral-800">
      <div className="h-1 bg-gradient-to-r from-primary to-secondary"></div>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mr-3">
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-md group-hover:text-primary transition-colors text-white">{name}</h3>
              {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end">
              <span className="font-bold text-lg text-white">
                {value}
              </span>
              {renderValueChange(valueChange)}
            </div>
            <div className="text-xs text-neutral-400">
              Avg. Position: {averagePosition !== undefined && averagePosition !== null ? averagePosition.toFixed(1) : '—'}
            </div>
          </div>
        </div>
        {extraInfo}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-6xl bg-neutral-950">
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-red-600 bg-clip-text text-transparent mb-2">
          Asset Market
        </h1>
        <p className="text-gray-400">
          Track values of all assets in the fantasy league. Values change after each race based on performance.
        </p>
      </header>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input 
          placeholder="Search for drivers, teams, or engines..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-primary focus:ring-primary"
        />
      </div>

      <Card className="shadow-sm overflow-hidden border-t-2 border-t-primary bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-2 border-b border-neutral-800">
          <CardTitle className="text-2xl font-bold bg-gradient-to-br from-primary to-amber-500 bg-clip-text text-transparent">Market Values</CardTitle>
          <CardDescription className="text-neutral-400">
            All assets are sorted by their current value. Values change after each race.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="drivers" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-neutral-800 p-1 rounded-md">
              <TabsTrigger value="drivers" className="group data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-neutral-400 font-medium transition-all duration-300">
                <User size={16} className="mr-2 text-inherit" />
                Drivers
              </TabsTrigger>
              <TabsTrigger value="engines" className="group data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-neutral-400 font-medium transition-all duration-300">
                <Cpu size={16} className="mr-2 text-inherit" />
                Engines
              </TabsTrigger>
              <TabsTrigger value="chassis" className="group data-[state=active]:bg-primary data-[state=active]:text-white data-[state=inactive]:text-neutral-400 font-medium transition-all duration-300">
                <CarFront size={16} className="mr-2 text-inherit" />
                Chassis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="drivers">
              {isMarketLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full bg-neutral-800" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketData?.drivers
                    .filter(driver => filterBySearch(driver.name))
                    .sort((a, b) => b.value - a.value)
                    .map((driver) => (
                      <AssetCard
                        key={driver.id}
                        name={driver.name}
                        value={driver.value}
                        subtitle={driver.team?.name}
                        icon={
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                            {driver.number}
                          </div>
                        }
                        valueChange={getValueChange(driver.id, 'driver')}
                        averagePosition={driver.averagePosition}
                        extraInfo={
                          driver.retired ? (
                            <Badge variant="outline" className="mt-2 bg-red-50 text-red-500 border-red-200">Retired</Badge>
                          ) : undefined
                        }
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="engines">
              {isMarketLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketData?.engines
                    .filter(engine => filterBySearch(engine.name))
                    .sort((a, b) => b.value - a.value)
                    .map((engine) => (
                      <AssetCard
                        key={engine.id}
                        name={engine.name}
                        value={engine.value}
                        icon={<Cpu size={18} className="text-primary" />}
                        valueChange={getValueChange(engine.id, 'engine')}
                        averagePosition={engine.averagePosition}
                      />
                    ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="chassis">
              {isMarketLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-[100px] w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketData?.teams
                    .filter(team => filterBySearch(team.name))
                    .sort((a, b) => b.value - a.value)
                    .map((team) => (
                      <AssetCard
                        key={team.id}
                        name={team.name}
                        value={team.value}
                        icon={<CarFront size={18} className="text-primary" />}
                        valueChange={getValueChange(team.id, 'team')}
                        averagePosition={team.averagePosition}
                      />
                    ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
