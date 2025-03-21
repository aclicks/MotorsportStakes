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
import connectPg from "connect-pg-simple";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, desc, lt, gt, isNull, asc } from 'drizzle-orm';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

// Configuração para PostgreSQL
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Configuração do store de sessão para PostgreSQL ou memória
const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUserByEmail(email: string): Promise<boolean>;
  
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
  deleteRace(id: number): Promise<boolean>;
  
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
  sessionStore: any; // session.Store
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
  
  sessionStore: any; // session.Store
  
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
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.googleId === googleId,
    );
  }
  
  async updateUser(id: number, user: Partial<InsertUser> & { isAdmin?: boolean }): Promise<User> {
    const existingUser = await this.getUser(id);
    if (!existingUser) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      isAdmin: false,
      googleId: insertUser.googleId || null,
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async deleteUserByEmail(email: string): Promise<boolean> {
    const user = await this.getUserByEmail(email);
    if (!user) {
      return false;
    }
    
    // Delete user teams
    const userTeams = await this.getUserTeams(user.id);
    for (const team of userTeams) {
      this.userTeams.delete(team.id);
    }
    
    // Delete user
    this.users.delete(user.id);
    return true;
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
  
  async deleteRace(id: number): Promise<boolean> {
    const race = await this.getRace(id);
    if (!race) {
      return false;
    }
    
    // First, delete all associated race results
    await this.deleteRaceResults(id);
    
    // Delete any performance history related to this race
    const allHistory = Array.from(this.performanceHistory.entries())
      .filter(([_, history]) => history.raceId === id);
    
    for (const [historyId, _] of allHistory) {
      this.performanceHistory.delete(historyId);
    }
    
    // Finally, delete the race
    this.races.delete(id);
    return true;
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
    const newHistory: PerformanceHistory = { 
      ...history, 
      id,
      driverId: history.driverId ?? null,
      teamId: history.teamId ?? null,
      engineId: history.engineId ?? null
    };
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
    const newTeam: UserTeam = { 
      ...team, 
      id,
      teamId: team.teamId ?? null,
      engineId: team.engineId ?? null,
      driver1Id: team.driver1Id ?? null,
      driver2Id: team.driver2Id ?? null
    };
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

// Implementação da classe DatabaseStorage usando PostgreSQL e Drizzle ORM
export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
        ssl: true,
      },
      createTableIfMissing: true,
    });
    
    // Inicializa o banco de dados na primeira execução
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    try {
      // Verificar se já existem usuários no banco de dados
      const existingUsers = await db.select().from(users).limit(1);
      
      if (existingUsers.length === 0) {
        console.log("Inicializando banco de dados com dados padrão...");
        // Começar com os mesmos dados de exemplo do MemStorage
        await this.createDemoData();
      }
    } catch (error) {
      console.error("Erro ao inicializar banco de dados:", error);
    }
  }

  private async createDemoData() {
    // Import hashPassword from auth.ts
    const { hashPassword } = await import('./auth');
    
    // Admin user
    const adminUser = await this.createUser({
      username: "admin",
      password: await hashPassword("admin123"),
      email: "admin@example.com",
    });
    
    // Tornar admin
    await this.updateUser(adminUser.id, { isAdmin: true });
    
    // Teams
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
    
    const createdTeams: Team[] = [];
    for (const team of teams) {
      createdTeams.push(await this.createTeam(team));
    }
    
    // Engines
    const engines = [
      { name: "Honda", value: 185 },
      { name: "Mercedes", value: 170 },
      { name: "Ferrari", value: 160 },
      { name: "Renault", value: 145 }
    ];
    
    const createdEngines: Engine[] = [];
    for (const engine of engines) {
      createdEngines.push(await this.createEngine(engine));
    }
    
    // Drivers
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
    
    // Races
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
    
    // Valuation table
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
  
  // Métodos de usuário
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result[0];
  }
  
  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const result = await db.select().from(users)
      .where(eq(users.googleId, googleId))
      .limit(1);
    return result[0];
  }
  
  async deleteUserByEmail(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        return false;
      }
      
      // Primeiro excluir os times do usuário
      const userTeamsList = await this.getUserTeams(user.id);
      for (const team of userTeamsList) {
        await db.delete(userTeams).where(eq(userTeams.id, team.id));
      }
      
      // Agora excluir o usuário
      await db.delete(users).where(eq(users.id, user.id));
      
      return true;
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      return false;
    }
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users)
      .values({
        ...user,
        isAdmin: false,
        googleId: user.googleId || null,
        createdAt: new Date()
      })
      .returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<InsertUser> & { isAdmin?: boolean }): Promise<User> {
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Usuário com id ${id} não encontrado`);
    }
    
    return result[0];
  }
  
  // Métodos de piloto
  async getDrivers(): Promise<Driver[]> {
    return await db.select().from(drivers);
  }
  
  async getDriver(id: number): Promise<Driver | undefined> {
    const result = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
    return result[0];
  }
  
  async createDriver(driver: InsertDriver): Promise<Driver> {
    const result = await db.insert(drivers).values(driver).returning();
    return result[0];
  }
  
  async updateDriver(id: number, driverData: Partial<InsertDriver>): Promise<Driver> {
    const result = await db.update(drivers)
      .set(driverData)
      .where(eq(drivers.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Piloto com id ${id} não encontrado`);
    }
    
    return result[0];
  }
  
  // Métodos de motor
  async getEngines(): Promise<Engine[]> {
    return await db.select().from(engines);
  }
  
  async getEngine(id: number): Promise<Engine | undefined> {
    const result = await db.select().from(engines).where(eq(engines.id, id)).limit(1);
    return result[0];
  }
  
  async createEngine(engine: InsertEngine): Promise<Engine> {
    const result = await db.insert(engines).values(engine).returning();
    return result[0];
  }
  
  async updateEngine(id: number, engineData: Partial<InsertEngine>): Promise<Engine> {
    const result = await db.update(engines)
      .set(engineData)
      .where(eq(engines.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Motor com id ${id} não encontrado`);
    }
    
    return result[0];
  }
  
  // Métodos de equipe
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams);
  }
  
  async getTeam(id: number): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    return result[0];
  }
  
  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    return result[0];
  }
  
  async updateTeam(id: number, teamData: Partial<InsertTeam>): Promise<Team> {
    const result = await db.update(teams)
      .set(teamData)
      .where(eq(teams.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Equipe com id ${id} não encontrada`);
    }
    
    return result[0];
  }
  
  // Métodos de corrida
  async getRaces(): Promise<Race[]> {
    return await db.select().from(races).orderBy(asc(races.date));
  }
  
  async getRace(id: number): Promise<Race | undefined> {
    const result = await db.select().from(races).where(eq(races.id, id)).limit(1);
    return result[0];
  }
  
  async getNextRace(): Promise<Race | undefined> {
    const today = new Date();
    const result = await db.select()
      .from(races)
      .where(gt(races.date, today))
      .orderBy(asc(races.date))
      .limit(1);
    return result[0];
  }
  
  async createRace(race: InsertRace): Promise<Race> {
    const result = await db.insert(races)
      .values({
        ...race,
        resultsSubmitted: false
      })
      .returning();
    return result[0];
  }
  
  async updateRace(id: number, raceData: Partial<InsertRace>): Promise<Race> {
    const result = await db.update(races)
      .set(raceData)
      .where(eq(races.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Corrida com id ${id} não encontrada`);
    }
    
    return result[0];
  }
  
  async deleteRace(id: number): Promise<boolean> {
    try {
      // First, delete all associated race results
      await this.deleteRaceResults(id);
      
      // Delete performance history related to this race
      await db
        .delete(performanceHistory)
        .where(eq(performanceHistory.raceId, id));
      
      // Finally, delete the race itself
      const result = await db
        .delete(races)
        .where(eq(races.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting race:", error);
      return false;
    }
  }
  
  // Métodos de resultados de corrida
  async getRaceResults(raceId: number): Promise<RaceResult[]> {
    return await db.select()
      .from(raceResults)
      .where(eq(raceResults.raceId, raceId))
      .orderBy(asc(raceResults.position));
  }
  
  async createRaceResult(result: InsertRaceResult): Promise<RaceResult> {
    const resultData = {
      ...result,
      valuation: null
    };
    const inserted = await db.insert(raceResults).values(resultData).returning();
    return inserted[0];
  }
  
  async updateRaceResult(id: number, resultData: Partial<InsertRaceResult>): Promise<RaceResult> {
    const result = await db.update(raceResults)
      .set(resultData)
      .where(eq(raceResults.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Resultado de corrida com id ${id} não encontrado`);
    }
    
    return result[0];
  }
  
  async deleteRaceResults(raceId: number): Promise<void> {
    // Remover resultados
    await db.delete(raceResults).where(eq(raceResults.raceId, raceId));
    
    // Atualizar corrida para não ter resultados
    const race = await this.getRace(raceId);
    if (race) {
      await this.updateRace(raceId, { resultsSubmitted: false });
    }
  }
  
  // Métodos de histórico de performance
  async getPerformanceHistory(entityId: number, type: 'driver' | 'team' | 'engine'): Promise<PerformanceHistory[]> {
    let query;
    
    if (type === 'driver') {
      query = eq(performanceHistory.driverId, entityId);
    } else if (type === 'team') {
      query = eq(performanceHistory.teamId, entityId);
    } else if (type === 'engine') {
      query = eq(performanceHistory.engineId, entityId);
    } else {
      throw new Error('Tipo inválido');
    }
    
    return await db.select()
      .from(performanceHistory)
      .where(query)
      .orderBy(asc(performanceHistory.raceId));
  }
  
  async createPerformanceHistory(history: InsertPerformanceHistory): Promise<PerformanceHistory> {
    const historyData = {
      ...history,
      driverId: history.driverId ?? null,
      teamId: history.teamId ?? null,
      engineId: history.engineId ?? null
    };
    
    const result = await db.insert(performanceHistory)
      .values(historyData)
      .returning();
    return result[0];
  }
  
  // Métodos da tabela de valorização
  async getValuationTable(): Promise<ValuationTable[]> {
    return await db.select()
      .from(valuationTable)
      .orderBy(asc(valuationTable.difference));
  }
  
  async getValuationEntry(difference: number): Promise<ValuationTable | undefined> {
    const result = await db.select()
      .from(valuationTable)
      .where(eq(valuationTable.difference, difference))
      .limit(1);
    return result[0];
  }
  
  async createValuationEntry(entry: InsertValuationTable): Promise<ValuationTable> {
    const result = await db.insert(valuationTable)
      .values(entry)
      .returning();
    return result[0];
  }
  
  async updateValuationEntry(difference: number, entry: Partial<InsertValuationTable>): Promise<ValuationTable> {
    const result = await db.update(valuationTable)
      .set(entry)
      .where(eq(valuationTable.difference, difference))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Entrada de valorização com diferença ${difference} não encontrada`);
    }
    
    return result[0];
  }
  
  // Métodos de equipe do usuário
  async getUserTeams(userId: number): Promise<UserTeam[]> {
    return await db.select()
      .from(userTeams)
      .where(eq(userTeams.userId, userId));
  }
  
  async getUserTeam(id: number): Promise<UserTeam | undefined> {
    const result = await db.select()
      .from(userTeams)
      .where(eq(userTeams.id, id))
      .limit(1);
    return result[0];
  }
  
  async createUserTeam(team: InsertUserTeam): Promise<UserTeam> {
    const teamData = {
      ...team,
      teamId: team.teamId ?? null,
      engineId: team.engineId ?? null,
      driver1Id: team.driver1Id ?? null,
      driver2Id: team.driver2Id ?? null
    };
    
    const result = await db.insert(userTeams)
      .values(teamData)
      .returning();
    return result[0];
  }
  
  async updateUserTeam(id: number, team: Partial<InsertUserTeam>): Promise<UserTeam> {
    const result = await db.update(userTeams)
      .set(team)
      .where(eq(userTeams.id, id))
      .returning();
      
    if (result.length === 0) {
      throw new Error(`Equipe de usuário com id ${id} não encontrada`);
    }
    
    return result[0];
  }
  
  // Métodos de lógica do jogo
  async calculateDriverValuation(driverId: number, raceId: number): Promise<number> {
    // Obter resultado atual da corrida
    const results = await this.getRaceResults(raceId);
    const currentResult = results.find(r => r.driverId === driverId);
    if (!currentResult) {
      throw new Error(`Nenhum resultado encontrado para o piloto ${driverId} na corrida ${raceId}`);
    }
    
    // Obter histórico de performance das 3 corridas anteriores
    const allRaces = await this.getRaces();
    const raceIndex = allRaces.findIndex(r => r.id === raceId);
    if (raceIndex < 3) {
      // Não há corridas suficientes para comparação
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
    
    // Calcular média dos resultados anteriores
    const averagePosition = previousResults.reduce((sum, pos) => sum + pos, 0) / previousResults.length;
    
    // Calcular diferença
    const difference = Math.round(averagePosition - currentResult.position);
    
    // Buscar valorização
    const valuation = await this.getValuationEntry(difference);
    return valuation ? parseFloat(valuation.percentageChange.toString()) : 0;
  }
  
  async calculateEngineValuation(engineId: number, raceId: number): Promise<number> {
    // Obter todos os pilotos que usam este motor
    const allDrivers = await this.getDrivers();
    const allTeams = await this.getTeams();
    
    // Obter times que usam este motor
    const teamsWithEngine = allTeams.filter(team => {
      // Em uma implementação real, isso verificaria quais times usam este motor
      // Por simplicidade, usaremos team.id % 4 + 1 para atribuir motores
      return team.id % 4 + 1 === engineId;
    });
    
    // Obter pilotos desses times
    const driversWithEngine = allDrivers.filter(driver => 
      teamsWithEngine.some(team => team.id === driver.teamId)
    );
    
    if (driversWithEngine.length === 0) {
      return 0;
    }
    
    // Calcular valorização média para todos os pilotos
    let totalValuation = 0;
    for (const driver of driversWithEngine) {
      const valuation = await this.calculateDriverValuation(driver.id, raceId);
      totalValuation += valuation;
    }
    
    return Math.round(totalValuation / driversWithEngine.length);
  }
  
  async calculateTeamValuation(teamId: number, raceId: number): Promise<number> {
    // Obter todos os pilotos neste time
    const allDrivers = await this.getDrivers();
    const teamDrivers = allDrivers.filter(driver => driver.teamId === teamId);
    
    if (teamDrivers.length === 0) {
      return 0;
    }
    
    // Calcular valorização média para todos os pilotos do time
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
      throw new Error(`Corrida com id ${raceId} não encontrada`);
    }
    
    // Obter todos os resultados para esta corrida
    const results = await this.getRaceResults(raceId);
    if (results.length === 0) {
      throw new Error(`Nenhum resultado encontrado para a corrida ${raceId}`);
    }
    
    // Marcar corrida como tendo resultados
    await this.updateRace(raceId, { resultsSubmitted: true });
    
    // Calcular valorizações para pilotos
    const allDrivers = await this.getDrivers();
    for (const driver of allDrivers) {
      const valuation = await this.calculateDriverValuation(driver.id, raceId);
      
      // Atualizar valor do piloto
      driver.value += valuation;
      if (driver.value < 100) driver.value = 100; // Valor mínimo
      await this.updateDriver(driver.id, { value: driver.value });
      
      // Atualizar resultado com valorização
      const result = results.find(r => r.driverId === driver.id);
      if (result) {
        await this.updateRaceResult(result.id, { valuation: valuation });
      }
      
      // Armazenar no histórico de performance
      await this.createPerformanceHistory({
        driverId: driver.id,
        teamId: null,
        engineId: null,
        raceId,
        position: result ? result.position : 0,
      });
    }
    
    // Calcular valorizações para motores
    const allEngines = await this.getEngines();
    for (const engine of allEngines) {
      const valuation = await this.calculateEngineValuation(engine.id, raceId);
      
      // Atualizar valor do motor
      engine.value += valuation;
      if (engine.value < 100) engine.value = 100; // Valor mínimo
      await this.updateEngine(engine.id, { value: engine.value });
      
      // Armazenar no histórico de performance (com posição média 0 já que não é aplicável)
      await this.createPerformanceHistory({
        driverId: null,
        teamId: null,
        engineId: engine.id,
        raceId,
        position: 0,
      });
    }
    
    // Calcular valorizações para times
    const allTeams = await this.getTeams();
    for (const team of allTeams) {
      const valuation = await this.calculateTeamValuation(team.id, raceId);
      
      // Atualizar valor do time
      team.value += valuation;
      if (team.value < 100) team.value = 100; // Valor mínimo
      await this.updateTeam(team.id, { value: team.value });
      
      // Armazenar no histórico de performance (com posição média 0 já que não é aplicável)
      await this.createPerformanceHistory({
        driverId: null,
        teamId: team.id,
        engineId: null,
        raceId,
        position: 0,
      });
    }
    
    // Atualizar créditos das equipes dos usuários com base em suas seleções
    const allUserTeams = await db.select().from(userTeams);
    for (const userTeam of allUserTeams) {
      let creditsGained = 0;
      
      // Adicionar valorização do piloto
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
      
      // Adicionar valorização do motor
      if (userTeam.engineId) {
        const engine = await this.getEngine(userTeam.engineId);
        if (engine) {
          const valuation = await this.calculateEngineValuation(engine.id, raceId);
          creditsGained += valuation;
        }
      }
      
      // Adicionar valorização do time
      if (userTeam.teamId) {
        const team = await this.getTeam(userTeam.teamId);
        if (team) {
          const valuation = await this.calculateTeamValuation(team.id, raceId);
          creditsGained += valuation;
        }
      }
      
      // Atualizar créditos
      if (creditsGained !== 0) {
        userTeam.currentCredits += creditsGained;
        await this.updateUserTeam(userTeam.id, { currentCredits: userTeam.currentCredits });
      }
    }
  }
}

// Decide qual implementação usar com base na disponibilidade do DATABASE_URL
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new MemStorage();
