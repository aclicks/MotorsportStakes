import { 
  users, drivers, engines, teams, races, raceResults, 
  performanceHistory, valuationTable, userTeams,
  User, InsertUser, Driver, InsertDriver, 
  Engine, InsertEngine, Team, InsertTeam, 
  Race, InsertRace, RaceResult, InsertRaceResult,
  PerformanceHistory, InsertPerformanceHistory, 
  ValuationTable, InsertValuationTable,
  UserTeam, InsertUserTeam
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Driver methods
  getDrivers(): Promise<Driver[]>;
  getDriver(id: number): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver>;
  
  // Engine methods
  getEngines(): Promise<Engine[]>;
  getEngine(id: number): Promise<Engine | undefined>;
  createEngine(engine: InsertEngine): Promise<Engine>;
  updateEngine(id: number, engine: Partial<InsertEngine>): Promise<Engine>;
  
  // Team methods
  getTeams(): Promise<Team[]>;
  getTeam(id: number): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team>;
  
  // Race methods
  getRaces(): Promise<Race[]>;
  getRace(id: number): Promise<Race | undefined>;
  getNextRace(): Promise<Race | undefined>;
  createRace(race: InsertRace): Promise<Race>;
  updateRace(id: number, race: Partial<InsertRace>): Promise<Race>;
  
  // Race results methods
  getRaceResults(raceId: number): Promise<RaceResult[]>;
  createRaceResult(result: InsertRaceResult): Promise<RaceResult>;
  updateRaceResult(id: number, result: Partial<InsertRaceResult>): Promise<RaceResult>;
  deleteRaceResults(raceId: number): Promise<void>;
  
  // Performance history methods
  getPerformanceHistory(entityId: number, type: 'driver' | 'team' | 'engine'): Promise<PerformanceHistory[]>;
  createPerformanceHistory(history: InsertPerformanceHistory): Promise<PerformanceHistory>;
  
  // Valuation table methods
  getValuationTable(): Promise<ValuationTable[]>;
  getValuationEntry(difference: number): Promise<ValuationTable | undefined>;
  createValuationEntry(entry: InsertValuationTable): Promise<ValuationTable>;
  updateValuationEntry(difference: number, entry: Partial<InsertValuationTable>): Promise<ValuationTable>;
  
  // User team methods
  getUserTeams(userId: number): Promise<UserTeam[]>;
  getUserTeam(id: number): Promise<UserTeam | undefined>;
  createUserTeam(team: InsertUserTeam): Promise<UserTeam>;
  updateUserTeam(id: number, team: Partial<InsertUserTeam>): Promise<UserTeam>;
  
  // Game logic methods
  calculateDriverValuation(driverId: number, raceId: number): Promise<number>;
  calculateEngineValuation(engineId: number, raceId: number): Promise<number>;
  calculateTeamValuation(teamId: number, raceId: number): Promise<number>;
  applyValuations(raceId: number): Promise<void>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private drivers: Map<number, Driver>;
  private engines: Map<number, Engine>;
  private teams: Map<number, Team>;
  private races: Map<number, Race>;
  private raceResults: Map<number, RaceResult>;
  private performanceHistory: Map<number, PerformanceHistory>;
  private valuationTable: Map<number, ValuationTable>;
  private userTeams: Map<number, UserTeam>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private driverIdCounter: number;
  private engineIdCounter: number;
  private teamIdCounter: number;
  private raceIdCounter: number;
  private raceResultIdCounter: number;
  private performanceHistoryIdCounter: number;
  private userTeamIdCounter: number;

  constructor() {
    this.users = new Map();
    this.drivers = new Map();
    this.engines = new Map();
    this.teams = new Map();
    this.races = new Map();
    this.raceResults = new Map();
    this.performanceHistory = new Map();
    this.valuationTable = new Map();
    this.userTeams = new Map();
    
    this.userIdCounter = 1;
    this.driverIdCounter = 1;
    this.engineIdCounter = 1;
    this.teamIdCounter = 1;
    this.raceIdCounter = 1;
    this.raceResultIdCounter = 1;
    this.performanceHistoryIdCounter = 1;
    this.userTeamIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with some sample data
    this.initializeData();
  }

  // Initialize with sample data
  private async initializeData() {
    // Create admin user
    await this.createUser({
      username: "admin",
      password: "$2b$10$X/hP9YiKZ8yTJl0mNDlkN.YX4EDmCQZ4wpzwp7NF6/oQxoo7CYS9S", // "admin123"
      email: "admin@example.com",
    });
    
    // Set as admin
    const adminUser = await this.getUserByUsername("admin");
    if (adminUser) {
      adminUser.isAdmin = true;
      this.users.set(adminUser.id, adminUser);
    }
    
    // Create teams (constructors)
    const teams = [
      { name: "Red Bull Racing", value: 210 },
      { name: "Mercedes", value: 180 },
      { name: "Ferrari", value: 175 },
      { name: "McLaren", value: 150 },
      { name: "Aston Martin", value: 145 },
      { name: "Alpine", value: 140 },
      { name: "Williams", value: 135 },
      { name: "AlphaTauri", value: 130 },
      { name: "Alfa Romeo", value: 125 },
      { name: "Haas", value: 120 }
    ];
    
    for (const team of teams) {
      await this.createTeam(team);
    }
    
    // Create engines
    const engines = [
      { name: "Honda", value: 185 },
      { name: "Mercedes", value: 170 },
      { name: "Ferrari", value: 160 },
      { name: "Renault", value: 145 }
    ];
    
    for (const engine of engines) {
      await this.createEngine(engine);
    }
    
    // Create drivers
    const drivers = [
      { name: "Max Verstappen", number: 1, teamId: 1, value: 230 },
      { name: "Sergio Perez", number: 11, teamId: 1, value: 192 },
      { name: "Lewis Hamilton", number: 44, teamId: 2, value: 175 },
      { name: "George Russell", number: 63, teamId: 2, value: 170 },
      { name: "Charles Leclerc", number: 16, teamId: 3, value: 168 },
      { name: "Carlos Sainz", number: 55, teamId: 3, value: 165 },
      { name: "Lando Norris", number: 4, teamId: 4, value: 160 },
      { name: "Oscar Piastri", number: 81, teamId: 4, value: 150 },
      { name: "Fernando Alonso", number: 14, teamId: 5, value: 160 },
      { name: "Lance Stroll", number: 18, teamId: 5, value: 130 },
      { name: "Esteban Ocon", number: 31, teamId: 6, value: 140 },
      { name: "Pierre Gasly", number: 10, teamId: 6, value: 135 },
      { name: "Alex Albon", number: 23, teamId: 7, value: 130 },
      { name: "Logan Sargeant", number: 2, teamId: 7, value: 100 },
      { name: "Yuki Tsunoda", number: 22, teamId: 8, value: 120 },
      { name: "Daniel Ricciardo", number: 3, teamId: 8, value: 125 },
      { name: "Valtteri Bottas", number: 77, teamId: 9, value: 115 },
      { name: "Zhou Guanyu", number: 24, teamId: 9, value: 110 },
      { name: "Kevin Magnussen", number: 20, teamId: 10, value: 105 },
      { name: "Nico Hulkenberg", number: 27, teamId: 10, value: 110 }
    ];
    
    for (const driver of drivers) {
      await this.createDriver(driver);
    }
    
    // Create races
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const threeWeeksAgo = new Date(today);
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    
    const twoWeeksFromNow = new Date(today);
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);
    
    await this.createRace({
      name: "Monaco Grand Prix",
      location: "Monaco",
      date: threeWeeksAgo,
      round: 7,
    });
    
    await this.createRace({
      name: "Canadian Grand Prix",
      location: "Montreal",
      date: twoWeeksAgo,
      round: 8,
    });
    
    await this.createRace({
      name: "Spanish Grand Prix",
      location: "Barcelona",
      date: oneWeekAgo,
      round: 9,
    });
    
    await this.createRace({
      name: "British Grand Prix",
      location: "Silverstone",
      date: twoWeeksFromNow,
      round: 10,
    });
    
    // Create valuation table
    for (let i = -20; i <= 20; i++) {
      let creditChange = 0;
      if (i < 0) {
        creditChange = i * 2.5;
      } else if (i > 0) {
        creditChange = i * 2.5;
      }
      
      await this.createValuationEntry({
        difference: i,
        description: i === 0 
          ? "Current position same as 3-race average" 
          : i > 0 
            ? `Current position ${i} places better than 3-race average` 
            : `Current position ${Math.abs(i)} places worse than 3-race average`,
        creditChange: Math.round(creditChange),
      });
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: false,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Driver methods
  async getDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getDriver(id: number): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const id = this.driverIdCounter++;
    const newDriver: Driver = { ...driver, id };
    this.drivers.set(id, newDriver);
    return newDriver;
  }

  async updateDriver(id: number, driver: Partial<InsertDriver>): Promise<Driver> {
    const existingDriver = await this.getDriver(id);
    if (!existingDriver) {
      throw new Error(`Driver with id ${id} not found`);
    }
    
    const updatedDriver = { ...existingDriver, ...driver };
    this.drivers.set(id, updatedDriver);
    return updatedDriver;
  }

  // Engine methods
  async getEngines(): Promise<Engine[]> {
    return Array.from(this.engines.values());
  }

  async getEngine(id: number): Promise<Engine | undefined> {
    return this.engines.get(id);
  }

  async createEngine(engine: InsertEngine): Promise<Engine> {
    const id = this.engineIdCounter++;
    const newEngine: Engine = { ...engine, id };
    this.engines.set(id, newEngine);
    return newEngine;
  }

  async updateEngine(id: number, engine: Partial<InsertEngine>): Promise<Engine> {
    const existingEngine = await this.getEngine(id);
    if (!existingEngine) {
      throw new Error(`Engine with id ${id} not found`);
    }
    
    const updatedEngine = { ...existingEngine, ...engine };
    this.engines.set(id, updatedEngine);
    return updatedEngine;
  }

  // Team methods
  async getTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.teamIdCounter++;
    const newTeam: Team = { ...team, id };
    this.teams.set(id, newTeam);
    return newTeam;
  }

  async updateTeam(id: number, team: Partial<InsertTeam>): Promise<Team> {
    const existingTeam = await this.getTeam(id);
    if (!existingTeam) {
      throw new Error(`Team with id ${id} not found`);
    }
    
    const updatedTeam = { ...existingTeam, ...team };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  // Race methods
  async getRaces(): Promise<Race[]> {
    return Array.from(this.races.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getRace(id: number): Promise<Race | undefined> {
    return this.races.get(id);
  }

  async getNextRace(): Promise<Race | undefined> {
    const today = new Date();
    return Array.from(this.races.values())
      .filter(race => new Date(race.date) > today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }

  async createRace(race: InsertRace): Promise<Race> {
    const id = this.raceIdCounter++;
    const newRace: Race = { ...race, id, resultsSubmitted: false };
    this.races.set(id, newRace);
    return newRace;
  }

  async updateRace(id: number, race: Partial<InsertRace>): Promise<Race> {
    const existingRace = await this.getRace(id);
    if (!existingRace) {
      throw new Error(`Race with id ${id} not found`);
    }
    
    const updatedRace = { ...existingRace, ...race };
    this.races.set(id, updatedRace);
    return updatedRace;
  }

  // Race results methods
  async getRaceResults(raceId: number): Promise<RaceResult[]> {
    return Array.from(this.raceResults.values())
      .filter(result => result.raceId === raceId)
      .sort((a, b) => a.position - b.position);
  }

  async createRaceResult(result: InsertRaceResult): Promise<RaceResult> {
    const id = this.raceResultIdCounter++;
    const newResult: RaceResult = { ...result, id, valuation: null };
    this.raceResults.set(id, newResult);
    return newResult;
  }

  async updateRaceResult(id: number, result: Partial<InsertRaceResult>): Promise<RaceResult> {
    const existingResult = this.raceResults.get(id);
    if (!existingResult) {
      throw new Error(`Race result with id ${id} not found`);
    }
    
    const updatedResult = { ...existingResult, ...result };
    this.raceResults.set(id, updatedResult);
    return updatedResult;
  }

  async deleteRaceResults(raceId: number): Promise<void> {
    const resultsToDelete = Array.from(this.raceResults.entries())
      .filter(([_, result]) => result.raceId === raceId);
    
    for (const [id, _] of resultsToDelete) {
      this.raceResults.delete(id);
    }
    
    // Mark race as not having results
    const race = await this.getRace(raceId);
    if (race) {
      race.resultsSubmitted = false;
      this.races.set(raceId, race);
    }
  }

  // Performance history methods
  async getPerformanceHistory(entityId: number, type: 'driver' | 'team' | 'engine'): Promise<PerformanceHistory[]> {
    return Array.from(this.performanceHistory.values())
      .filter(history => {
        if (type === 'driver') return history.driverId === entityId;
        if (type === 'team') return history.teamId === entityId;
        if (type === 'engine') return history.engineId === entityId;
        return false;
      })
      .sort((a, b) => a.raceId - b.raceId);
  }

  async createPerformanceHistory(history: InsertPerformanceHistory): Promise<PerformanceHistory> {
    const id = this.performanceHistoryIdCounter++;
    const newHistory: PerformanceHistory = { ...history, id };
    this.performanceHistory.set(id, newHistory);
    return newHistory;
  }

  // Valuation table methods
  async getValuationTable(): Promise<ValuationTable[]> {
    return Array.from(this.valuationTable.values())
      .sort((a, b) => a.difference - b.difference);
  }

  async getValuationEntry(difference: number): Promise<ValuationTable | undefined> {
    return this.valuationTable.get(difference);
  }

  async createValuationEntry(entry: InsertValuationTable): Promise<ValuationTable> {
    const newEntry: ValuationTable = { ...entry };
    this.valuationTable.set(entry.difference, newEntry);
    return newEntry;
  }

  async updateValuationEntry(difference: number, entry: Partial<InsertValuationTable>): Promise<ValuationTable> {
    const existingEntry = await this.getValuationEntry(difference);
    if (!existingEntry) {
      throw new Error(`Valuation entry with difference ${difference} not found`);
    }
    
    const updatedEntry = { ...existingEntry, ...entry };
    this.valuationTable.set(difference, updatedEntry);
    return updatedEntry;
  }

  // User team methods
  async getUserTeams(userId: number): Promise<UserTeam[]> {
    return Array.from(this.userTeams.values())
      .filter(team => team.userId === userId);
  }

  async getUserTeam(id: number): Promise<UserTeam | undefined> {
    return this.userTeams.get(id);
  }

  async createUserTeam(team: InsertUserTeam): Promise<UserTeam> {
    const id = this.userTeamIdCounter++;
    const newTeam: UserTeam = { ...team, id };
    this.userTeams.set(id, newTeam);
    return newTeam;
  }

  async updateUserTeam(id: number, team: Partial<InsertUserTeam>): Promise<UserTeam> {
    const existingTeam = await this.getUserTeam(id);
    if (!existingTeam) {
      throw new Error(`User team with id ${id} not found`);
    }
    
    const updatedTeam = { ...existingTeam, ...team };
    this.userTeams.set(id, updatedTeam);
    return updatedTeam;
  }

  // Game logic methods
  async calculateDriverValuation(driverId: number, raceId: number): Promise<number> {
    // Get current race result
    const results = await this.getRaceResults(raceId);
    const currentResult = results.find(r => r.driverId === driverId);
    if (!currentResult) {
      throw new Error(`No result found for driver ${driverId} in race ${raceId}`);
    }
    
    // Get previous 3 race performance history
    const allRaces = await this.getRaces();
    const raceIndex = allRaces.findIndex(r => r.id === raceId);
    if (raceIndex < 3) {
      // Not enough previous races for proper comparison
      return 0;
    }
    
    const previousRaces = allRaces.slice(raceIndex - 3, raceIndex);
    const previousResults: number[] = [];
    
    for (const race of previousRaces) {
      const raceResults = await this.getRaceResults(race.id);
      const driverResult = raceResults.find(r => r.driverId === driverId);
      if (driverResult) {
        previousResults.push(driverResult.position);
      }
    }
    
    if (previousResults.length === 0) {
      return 0;
    }
    
    // Calculate average of previous results
    const averagePosition = previousResults.reduce((sum, pos) => sum + pos, 0) / previousResults.length;
    
    // Calculate difference
    const difference = Math.round(averagePosition - currentResult.position);
    
    // Look up valuation
    const valuation = await this.getValuationEntry(difference);
    return valuation ? valuation.creditChange : 0;
  }

  async calculateEngineValuation(engineId: number, raceId: number): Promise<number> {
    // Get all drivers using this engine
    const allDrivers = await this.getDrivers();
    const allTeams = await this.getTeams();
    
    // Get teams using this engine
    const teamsWithEngine = allTeams.filter(team => {
      // In real implementation, this would check which teams use this engine
      // For simplicity, we'll use team.id % 4 + 1 to assign engines
      return team.id % 4 + 1 === engineId;
    });
    
    // Get drivers from those teams
    const driversWithEngine = allDrivers.filter(driver => 
      teamsWithEngine.some(team => team.id === driver.teamId)
    );
    
    if (driversWithEngine.length === 0) {
      return 0;
    }
    
    // Calculate average valuation for all drivers
    let totalValuation = 0;
    for (const driver of driversWithEngine) {
      const valuation = await this.calculateDriverValuation(driver.id, raceId);
      totalValuation += valuation;
    }
    
    return Math.round(totalValuation / driversWithEngine.length);
  }

  async calculateTeamValuation(teamId: number, raceId: number): Promise<number> {
    // Get all drivers in this team
    const allDrivers = await this.getDrivers();
    const teamDrivers = allDrivers.filter(driver => driver.teamId === teamId);
    
    if (teamDrivers.length === 0) {
      return 0;
    }
    
    // Calculate average valuation for all team drivers
    let totalValuation = 0;
    for (const driver of teamDrivers) {
      const valuation = await this.calculateDriverValuation(driver.id, raceId);
      totalValuation += valuation;
    }
    
    return Math.round(totalValuation / teamDrivers.length);
  }

  async applyValuations(raceId: number): Promise<void> {
    const race = await this.getRace(raceId);
    if (!race) {
      throw new Error(`Race with id ${raceId} not found`);
    }
    
    // Get all results for this race
    const results = await this.getRaceResults(raceId);
    if (results.length === 0) {
      throw new Error(`No results found for race ${raceId}`);
    }
    
    // Mark race as having results
    race.resultsSubmitted = true;
    this.races.set(raceId, race);
    
    // Calculate valuations for drivers
    const allDrivers = await this.getDrivers();
    for (const driver of allDrivers) {
      const valuation = await this.calculateDriverValuation(driver.id, raceId);
      
      // Update driver value
      driver.value += valuation;
      if (driver.value < 100) driver.value = 100; // Minimum value
      this.drivers.set(driver.id, driver);
      
      // Update result with valuation
      const result = results.find(r => r.driverId === driver.id);
      if (result) {
        result.valuation = valuation;
        this.raceResults.set(result.id, result);
      }
      
      // Store in performance history
      await this.createPerformanceHistory({
        driverId: driver.id,
        teamId: null,
        engineId: null,
        raceId,
        position: result ? result.position : 0,
      });
    }
    
    // Calculate valuations for engines
    const allEngines = await this.getEngines();
    for (const engine of allEngines) {
      const valuation = await this.calculateEngineValuation(engine.id, raceId);
      
      // Update engine value
      engine.value += valuation;
      if (engine.value < 100) engine.value = 100; // Minimum value
      this.engines.set(engine.id, engine);
      
      // Store in performance history (with average position 0 since it's not applicable)
      await this.createPerformanceHistory({
        driverId: null,
        teamId: null,
        engineId: engine.id,
        raceId,
        position: 0,
      });
    }
    
    // Calculate valuations for teams
    const allTeams = await this.getTeams();
    for (const team of allTeams) {
      const valuation = await this.calculateTeamValuation(team.id, raceId);
      
      // Update team value
      team.value += valuation;
      if (team.value < 100) team.value = 100; // Minimum value
      this.teams.set(team.id, team);
      
      // Store in performance history (with average position 0 since it's not applicable)
      await this.createPerformanceHistory({
        driverId: null,
        teamId: team.id,
        engineId: null,
        raceId,
        position: 0,
      });
    }
    
    // Update user teams' credits based on their selections
    const allUserTeams = Array.from(this.userTeams.values());
    for (const userTeam of allUserTeams) {
      let creditsGained = 0;
      
      // Add driver valuation
      if (userTeam.driver1Id) {
        const driver = await this.getDriver(userTeam.driver1Id);
        if (driver) {
          const driverResult = results.find(r => r.driverId === driver.id);
          if (driverResult && driverResult.valuation !== null) {
            creditsGained += driverResult.valuation;
          }
        }
      }
      
      if (userTeam.driver2Id) {
        const driver = await this.getDriver(userTeam.driver2Id);
        if (driver) {
          const driverResult = results.find(r => r.driverId === driver.id);
          if (driverResult && driverResult.valuation !== null) {
            creditsGained += driverResult.valuation;
          }
        }
      }
      
      // Add engine valuation
      if (userTeam.engineId) {
        const engine = await this.getEngine(userTeam.engineId);
        if (engine) {
          const valuation = await this.calculateEngineValuation(engine.id, raceId);
          creditsGained += valuation;
        }
      }
      
      // Add team valuation
      if (userTeam.teamId) {
        const team = await this.getTeam(userTeam.teamId);
        if (team) {
          const valuation = await this.calculateTeamValuation(team.id, raceId);
          creditsGained += valuation;
        }
      }
      
      // Update credits
      userTeam.currentCredits += creditsGained;
      this.userTeams.set(userTeam.id, userTeam);
    }
  }
}

export const storage = new MemStorage();
