import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertRaceSchema, 
  insertDriverSchema, 
  insertEngineSchema, 
  insertTeamSchema,
  insertValuationTableSchema,
  insertRaceResultSchema,
  insertUserTeamSchema,
  updateRaceSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden - Admin access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // Rota para excluir usuário
  app.post("/api/delete-user", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }
      
      const success = await storage.deleteUserByEmail(email);
      
      if (success) {
        res.status(200).json({ message: `Usuário com email ${email} foi excluído com sucesso` });
      } else {
        res.status(404).json({ message: `Usuário com email ${email} não encontrado ou não pôde ser excluído` });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao excluir usuário", error: (error as Error).message });
    }
  });

  // Get current user's teams
  app.get("/api/my-teams", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const teams = await storage.getUserTeams(req.user.id);
      
      // Enhance teams with complete data
      const enhancedTeams = await Promise.all(teams.map(async (team) => {
        const driver1 = team.driver1Id ? await storage.getDriver(team.driver1Id) : undefined;
        const driver2 = team.driver2Id ? await storage.getDriver(team.driver2Id) : undefined;
        const engine = team.engineId ? await storage.getEngine(team.engineId) : undefined;
        const chassis = team.teamId ? await storage.getTeam(team.teamId) : undefined;
        
        // If drivers exist, add their team information
        const driver1WithTeam = driver1 && {
          ...driver1,
          team: driver1.teamId ? await storage.getTeam(driver1.teamId) : undefined
        };
        
        const driver2WithTeam = driver2 && {
          ...driver2,
          team: driver2.teamId ? await storage.getTeam(driver2.teamId) : undefined
        };
        
        // Calculate total value
        let totalValue = 0;
        if (driver1) totalValue += driver1.value;
        if (driver2) totalValue += driver2.value;
        if (engine) totalValue += engine.value;
        if (chassis) totalValue += chassis.value;
        
        return {
          ...team,
          driver1: driver1WithTeam,
          driver2: driver2WithTeam,
          engine,
          team: chassis,
          totalValue
        };
      }));
      
      res.json(enhancedTeams);
    } catch (error) {
      res.status(500).json({ message: "Error fetching teams", error: (error as Error).message });
    }
  });

  // Update user team
  app.patch("/api/my-teams/:id", isAuthenticated, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const teamId = parseInt(req.params.id);
      const team = await storage.getUserTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      if (team.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own teams" });
      }
      
      const { driver1Id, driver2Id, engineId, teamId: chassisId } = req.body;
      
      // Validate credit balance
      let totalCost = 0;
      
      if (driver1Id) {
        const driver = await storage.getDriver(driver1Id);
        if (!driver) return res.status(400).json({ message: "Driver 1 not found" });
        totalCost += driver.value;
      }
      
      if (driver2Id) {
        const driver = await storage.getDriver(driver2Id);
        if (!driver) return res.status(400).json({ message: "Driver 2 not found" });
        totalCost += driver.value;
      }
      
      if (engineId) {
        const engine = await storage.getEngine(engineId);
        if (!engine) return res.status(400).json({ message: "Engine not found" });
        totalCost += engine.value;
      }
      
      if (chassisId) {
        const chassis = await storage.getTeam(chassisId);
        if (!chassis) return res.status(400).json({ message: "Chassis not found" });
        totalCost += chassis.value;
      }
      
      if (totalCost > team.currentCredits) {
        return res.status(400).json({ message: "Insufficient credits" });
      }
      
      // Update team
      const updatedTeam = await storage.updateUserTeam(teamId, {
        driver1Id: driver1Id || null,
        driver2Id: driver2Id || null,
        engineId: engineId || null,
        teamId: chassisId || null,
      });
      
      res.json(updatedTeam);
    } catch (error) {
      res.status(500).json({ message: "Error updating team", error: error.message });
    }
  });

  // Get average position for an entity (driver, team, engine)
  app.get("/api/average-position/:type/:id", async (req, res) => {
    try {
      const { type, id } = req.params;
      const entityId = parseInt(id);
      
      if (!["driver", "team", "engine"].includes(type)) {
        return res.status(400).json({ message: "Type must be driver, team, or engine" });
      }
      
      if (isNaN(entityId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Get the performance history
      const history = await storage.getPerformanceHistory(entityId, type as 'driver' | 'team' | 'engine');
      
      if (history.length === 0) {
        return res.json({ averagePosition: null });
      }
      
      // Calculate average position
      const positions = history.map(entry => entry.position);
      const averagePosition = positions.reduce((sum, pos) => sum + pos, 0) / positions.length;
      
      res.json({ averagePosition: Math.round(averagePosition * 100) / 100 });
    } catch (error) {
      res.status(500).json({ message: "Error calculating average position", error: (error as Error).message });
    }
  });

  // Get market data (all available drivers, engines, chassis)
  app.get("/api/market", async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      const engines = await storage.getEngines();
      const teams = await storage.getTeams();
      
      // Enhance drivers with team data and average position
      const driversWithTeams = await Promise.all(drivers.map(async (driver) => {
        const team = driver.teamId ? await storage.getTeam(driver.teamId) : undefined;
        const history = await storage.getPerformanceHistory(driver.id, 'driver');
        
        let averagePosition = null;
        if (history.length > 0) {
          // Filter out any invalid positions (like 0 or null)
          const validPositions = history
            .map(entry => entry.position)
            .filter(pos => pos !== null && pos !== undefined && pos > 0);
            
          if (validPositions.length > 0) {
            averagePosition = validPositions.reduce((sum, pos) => sum + pos, 0) / validPositions.length;
            averagePosition = Math.round(averagePosition * 100) / 100;
          }
        }
        
        return { ...driver, team, averagePosition };
      }));
      
      // Calculate team data first to use for engine average calculations
      const teamsWithEngines = await Promise.all(teams.map(async (team) => {
        const engine = team.engineId ? await storage.getEngine(team.engineId) : null;
        return { ...team, engine };
      }));
      
      // Enhance engines with average position based on teams using this engine
      const enginesWithAverage = await Promise.all(engines.map(async (engine) => {
        // Find teams using this engine
        const engineTeams = teamsWithEngines.filter(team => team.engineId === engine.id);
        
        let averagePosition = null;
        if (engineTeams.length > 0) {
          // Find all drivers from teams using this engine
          const allEngineDrivers = driversWithTeams.filter(driver => 
            engineTeams.some(team => team.id === driver.teamId)
          );
          
          // Only consider drivers with valid average positions
          const driversWithPositions = allEngineDrivers.filter(driver => 
            driver.averagePosition !== null && driver.averagePosition !== undefined
          );
          
          // Calculate direct average of all drivers using this engine
          if (driversWithPositions.length > 0) {
            averagePosition = Math.round(
              (driversWithPositions.reduce(
                (sum, driver) => sum + (driver.averagePosition || 0), 0
              ) / driversWithPositions.length) * 100
            ) / 100;
          }
        }
        
        return { ...engine, averagePosition };
      }));
      
      // Enhance teams with average position based on their drivers' average positions
      const teamsWithAverage = await Promise.all(teams.map(async (team) => {
        // Find drivers belonging to this team
        const teamDrivers = driversWithTeams.filter(driver => driver.teamId === team.id);
        
        let averagePosition = null;
        if (teamDrivers.length > 0) {
          // Filter out drivers without average positions
          const driversWithPositions = teamDrivers.filter(driver => 
            driver.averagePosition !== null && driver.averagePosition !== undefined
          );
          
          if (driversWithPositions.length > 0) {
            // Calculate average of the drivers' average positions
            const totalAverage = driversWithPositions.reduce(
              (sum, driver) => sum + (driver.averagePosition || 0), 0
            ) / driversWithPositions.length;
            
            averagePosition = Math.round(totalAverage * 100) / 100;
          }
        }
        
        return { ...team, averagePosition };
      }));
      
      res.json({
        drivers: driversWithTeams,
        engines: enginesWithAverage,
        teams: teamsWithAverage
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching market data", error: error.message });
    }
  });

  // Get race calendar
  app.get("/api/races", async (req, res) => {
    try {
      const races = await storage.getRaces();
      res.json(races);
    } catch (error) {
      res.status(500).json({ message: "Error fetching races", error: error.message });
    }
  });

  // Get next race
  app.get("/api/races/next", async (req, res) => {
    try {
      const nextRace = await storage.getNextRace();
      
      if (!nextRace) {
        return res.status(404).json({ message: "No upcoming races found" });
      }
      
      res.json(nextRace);
    } catch (error) {
      res.status(500).json({ message: "Error fetching next race", error: error.message });
    }
  });

  // Get race results
  app.get("/api/races/:id/results", async (req, res) => {
    try {
      const raceId = parseInt(req.params.id);
      const race = await storage.getRace(raceId);
      
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }
      
      if (!race.resultsSubmitted) {
        return res.status(404).json({ message: "Race results not yet submitted" });
      }
      
      const results = await storage.getRaceResults(raceId);
      
      // Enhance results with driver and team data
      const enhancedResults = await Promise.all(results.map(async (result) => {
        const driver = await storage.getDriver(result.driverId);
        const team = driver?.teamId ? await storage.getTeam(driver.teamId) : undefined;
        
        return {
          ...result,
          driver,
          team
        };
      }));
      
      res.json(enhancedResults);
    } catch (error) {
      res.status(500).json({ message: "Error fetching race results", error: error.message });
    }
  });

  // Get valuation table
  app.get("/api/valuation-table", async (req, res) => {
    try {
      console.log("Fetching valuation table...");
      const valuationTable = await storage.getValuationTable();
      console.log("Valuation table data:", valuationTable);
      res.json(valuationTable);
    } catch (error) {
      console.error("Error fetching valuation table:", error);
      res.status(500).json({ message: "Error fetching valuation table", error: String(error) });
    }
  });
  
  // Get all users (temporary endpoint for setup)
  app.get("/api/users", async (req, res) => {
    try {
      // This is a memory storage hack to get all users
      const users = [];
      for (let i = 1; i <= 100; i++) {
        const user = await storage.getUser(i);
        if (user) {
          // Remove password for security
          const { password, ...safeUser } = user;
          users.push(safeUser);
        }
      }
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error: String(error) });
    }
  });
  
  // Get player leaderboard
  app.get("/api/leaderboard", async (req, res) => {
    try {
      // 1. Obter todos os usuários
      const users = [];
      for (let i = 1; i <= 100; i++) {
        const user = await storage.getUser(i);
        if (user) {
          // Remove password for security
          const { password, ...safeUser } = user;
          users.push(safeUser);
        }
      }
      
      // 2. Para cada usuário, obter seus times e calcular o valor total
      const leaderboardData = await Promise.all(users.map(async (user) => {
        const teams = await storage.getUserTeams(user.id);
        
        // Calcular valor total dos times do usuário
        let totalTeamValue = 0;
        for (const team of teams) {
          let teamValue = 0;
          
          if (team.driver1Id) {
            const driver1 = await storage.getDriver(team.driver1Id);
            if (driver1) teamValue += driver1.value;
          }
          
          if (team.driver2Id) {
            const driver2 = await storage.getDriver(team.driver2Id);
            if (driver2) teamValue += driver2.value;
          }
          
          if (team.engineId) {
            const engine = await storage.getEngine(team.engineId);
            if (engine) teamValue += engine.value;
          }
          
          if (team.teamId) {
            const chassis = await storage.getTeam(team.teamId);
            if (chassis) teamValue += chassis.value;
          }
          
          totalTeamValue += teamValue;
        }
        
        // Calcular a pontuação do jogador
        // Pontuação = Valor total dos times + número de times * 100
        const score = totalTeamValue + (teams.length * 100);
        
        return {
          userId: user.id,
          username: user.username,
          totalValue: totalTeamValue,
          totalTeams: teams.length,
          score
        };
      }));
      
      // 3. Ordenar por pontuação (maior para menor)
      leaderboardData.sort((a, b) => b.score - a.score);
      
      // 4. Adicionar posição no ranking
      const leaderboard = leaderboardData.map((item, index) => ({
        rank: index + 1,
        ...item
      }));
      
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ message: "Error fetching leaderboard", error: String(error) });
    }
  });

  // Make a user admin by email (special endpoint) - initially open for first admin setup
  app.post("/api/make-admin", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      const user = await storage.getUserByEmail(email);
      
      if (!user) {
        return res.status(404).json({ message: `User with email ${email} not found` });
      }
      
      const updatedUser = await storage.updateUser(user.id, { isAdmin: true });
      res.json({ message: `User ${updatedUser.username} (${email}) is now an admin`, user: updatedUser });
    } catch (error) {
      res.status(500).json({ message: "Error updating user", error: error.message });
    }
  });

  // Get driver standings
  app.get("/api/standings/drivers", async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      const sortedDrivers = [...drivers].sort((a, b) => b.value - a.value);
      
      // Enhance with team data
      const standings = await Promise.all(sortedDrivers.map(async (driver, index) => {
        const team = driver.teamId ? await storage.getTeam(driver.teamId) : undefined;
        return {
          position: index + 1,
          driver: { ...driver, team }
        };
      }));
      
      res.json(standings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching driver standings", error: error.message });
    }
  });

  // Get team standings
  app.get("/api/standings/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams();
      const sortedTeams = [...teams].sort((a, b) => b.value - a.value);
      
      const standings = sortedTeams.map((team, index) => ({
        position: index + 1,
        team
      }));
      
      res.json(standings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching team standings", error: error.message });
    }
  });

  // Get engine standings
  app.get("/api/standings/engines", async (req, res) => {
    try {
      const engines = await storage.getEngines();
      const sortedEngines = [...engines].sort((a, b) => b.value - a.value);
      
      const standings = sortedEngines.map((engine, index) => ({
        position: index + 1,
        engine
      }));
      
      res.json(standings);
    } catch (error) {
      res.status(500).json({ message: "Error fetching engine standings", error: error.message });
    }
  });
  
  // Get performance history for driver, team, or engine
  app.get("/api/performance-history/:type/:id", async (req, res) => {
    try {
      const { type, id } = req.params;
      const entityId = parseInt(id);
      
      if (!["driver", "team", "engine"].includes(type)) {
        return res.status(400).json({ message: "Type must be driver, team, or engine" });
      }
      
      if (isNaN(entityId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      if (type === "driver") {
        // For drivers, get the regular performance history
        const history = await storage.getPerformanceHistory(entityId, 'driver');
        
        // Get race information for each history entry
        const enhancedHistory = await Promise.all(history.map(async (entry) => {
          const race = await storage.getRace(entry.raceId);
          return {
            ...entry,
            race
          };
        }));
        
        // Sort by race date
        enhancedHistory.sort((a, b) => {
          return new Date(a.race!.date).getTime() - new Date(b.race!.date).getTime();
        });
        
        return res.json(enhancedHistory);
      }
      else if (type === "team") {
        // For teams, calculate the average position of the two drivers
        const races = await storage.getRaces();
        const team = await storage.getTeam(entityId);
        
        if (!team) {
          return res.status(404).json({ message: "Team not found" });
        }
        
        // Get all drivers from this team
        const allDrivers = await storage.getDrivers();
        const teamDrivers = allDrivers.filter(driver => driver.teamId === entityId);
        
        // Prepare history data for each race
        const historyData = await Promise.all(races.map(async (race) => {
          // Get results for this race
          const raceResults = await storage.getRaceResults(race.id);
          
          // Find results for the team's drivers
          const teamResults = raceResults.filter(result => 
            teamDrivers.some(driver => driver.id === result.driverId)
          );
          
          // Calculate average position if we have results
          let avgPosition = 0;
          if (teamResults.length > 0) {
            // Filter out any invalid positions (like 0 or null)
            const validPositions = teamResults
              .map(result => result.position)
              .filter(pos => pos !== null && pos !== undefined && pos > 0);
              
            if (validPositions.length > 0) {
              avgPosition = validPositions.reduce((sum, pos) => sum + pos, 0) / validPositions.length;
            }
          }
          
          return {
            id: 0, // Placeholder ID
            driverId: null,
            teamId: entityId,
            engineId: null,
            raceId: race.id,
            position: avgPosition,
            race
          };
        }));
        
        // Filter out races without results and sort by date
        const validHistory = historyData
          .filter(entry => entry.position > 0)
          .sort((a, b) => new Date(a.race.date).getTime() - new Date(b.race.date).getTime());
        
        return res.json(validHistory);
      } 
      else if (type === "engine") {
        // For engines, calculate the average position of all cars using this engine
        const races = await storage.getRaces();
        const engine = await storage.getEngine(entityId);
        
        if (!engine) {
          return res.status(404).json({ message: "Engine not found" });
        }
        
        // Get all teams using this engine
        const allTeams = await storage.getTeams();
        const engineTeams = allTeams.filter(team => team.engineId === entityId);
        
        // Get all drivers from these teams
        const allDrivers = await storage.getDrivers();
        const engineDrivers = allDrivers.filter(driver => 
          engineTeams.some(team => team.id === driver.teamId)
        );
        
        // Prepare history data for each race
        const historyData = await Promise.all(races.map(async (race) => {
          // Get results for this race
          const raceResults = await storage.getRaceResults(race.id);
          
          // Find results for the engine's drivers
          const engineResults = raceResults.filter(result => 
            engineDrivers.some(driver => driver.id === result.driverId)
          );
          
          // Calculate average position if we have results
          let avgPosition = 0;
          if (engineResults.length > 0) {
            // Filter out any invalid positions (like 0 or null)
            const validPositions = engineResults
              .map(result => result.position)
              .filter(pos => pos !== null && pos !== undefined && pos > 0);
              
            if (validPositions.length > 0) {
              avgPosition = validPositions.reduce((sum, pos) => sum + pos, 0) / validPositions.length;
            }
          }
          
          return {
            id: 0, // Placeholder ID
            driverId: null,
            teamId: null,
            engineId: entityId,
            raceId: race.id,
            position: avgPosition,
            race
          };
        }));
        
        // Filter out races without results and sort by date
        const validHistory = historyData
          .filter(entry => entry.position > 0)
          .sort((a, b) => new Date(a.race.date).getTime() - new Date(b.race.date).getTime());
        
        return res.json(validHistory);
      } 
      else {
        // Default case (should never happen due to the check above)
        const history = await storage.getPerformanceHistory(entityId, type as 'driver' | 'team' | 'engine');
        
        // Get race information for each history entry
        const enhancedHistory = await Promise.all(history.map(async (entry) => {
          const race = await storage.getRace(entry.raceId);
          return {
            ...entry,
            race
          };
        }));
        
        // Sort by race date
        enhancedHistory.sort((a, b) => {
          return new Date(a.race!.date).getTime() - new Date(b.race!.date).getTime();
        });
        
        return res.json(enhancedHistory);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching performance history", error: (error as Error).message });
    }
  });

  // Create user team
  app.post("/api/user-teams", isAuthenticated, async (req, res) => {
    try {
      const userData = insertUserTeamSchema.parse({
        ...req.body,
        userId: req.user!.id, // Ensure team is created for the authenticated user
      });
      
      const userTeam = await storage.createUserTeam(userData);
      res.status(201).json(userTeam);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating team", error: (error as Error).message });
    }
  });

  // Get betting status
  app.get("/api/betting-status", async (req, res) => {
    try {
      const isOpen = await storage.isBettingOpen();
      res.json({ isOpen });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Error getting betting status", error: errorMessage });
    }
  });

  // ADMIN ROUTES
  
  // Update betting status
  app.post("/api/admin/betting-status", isAdmin, async (req, res) => {
    try {
      const { isOpen } = req.body;
      
      if (typeof isOpen !== 'boolean') {
        return res.status(400).json({ message: "isOpen must be a boolean" });
      }
      
      await storage.setBettingStatus(isOpen);
      res.json({ 
        message: `Betting is now ${isOpen ? 'open' : 'closed'}`,
        isOpen
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Error updating betting status", error: errorMessage });
    }
  });

  // Create race
  app.post("/api/admin/races", isAdmin, async (req, res) => {
    try {
      console.log("Received race data:", JSON.stringify(req.body));
      
      // Extract date and rest of the body
      const { date, ...restBody } = req.body;
      
      console.log("Date value:", date);
      
      // Ensure we have a proper date string in ISO format
      let parsedDate = date;
      if (date) {
        try {
          // Handle both date objects and strings
          if (typeof date === 'string') {
            parsedDate = new Date(date).toISOString();
          } else if (date instanceof Date) {
            parsedDate = date.toISOString();
          } else if (typeof date === 'object' && date.toISOString) {
            parsedDate = date.toISOString();
          }
          console.log("Parsed date:", parsedDate);
        } catch (err) {
          console.error("Date parsing error:", err);
          return res.status(400).json({ message: "Invalid date format" });
        }
      } else {
        return res.status(400).json({ message: "Date is required" });
      }
      
      // Combine sanitized data
      const sanitizedData = { ...restBody, date: parsedDate };
      
      console.log("Sanitized data:", JSON.stringify(sanitizedData));
      
      // Validate and parse the data
      const raceData = insertRaceSchema.parse(sanitizedData);
      console.log("Validated race data:", JSON.stringify(raceData));
      
      const race = await storage.createRace(raceData);
      res.status(201).json(race);
    } catch (error) {
      console.error("Race creation error:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating race", error: String(error) });
    }
  });

  // Update race
  app.patch("/api/admin/races/:id", isAdmin, async (req, res) => {
    try {
      console.log("Updating race, received data:", JSON.stringify(req.body));
      
      const raceId = parseInt(req.params.id);
      const race = await storage.getRace(raceId);
      
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }
      
      const { date, ...restBody } = req.body;
      
      console.log("Date value for update:", date);
      
      // Ensure we have a proper Date object
      let parsedDate;
      if (date) {
        try {
          // Convert the string ISO date to a Date object
          if (typeof date === 'string') {
            parsedDate = new Date(date);
          } else if (date instanceof Date) {
            parsedDate = date;
          } else if (typeof date === 'object' && date.toISOString) {
            parsedDate = new Date(date.toISOString());
          }
          
          if (isNaN(parsedDate.getTime())) {
            throw new Error("Invalid date");
          }
          
          console.log("Parsed date for update:", parsedDate);
        } catch (err) {
          console.error("Date parsing error in update:", err);
          return res.status(400).json({ message: "Invalid date format" });
        }
      }
      
      // Combine sanitized data
      const sanitizedData = date ? { ...restBody, date: parsedDate } : restBody;
      
      console.log("Sanitized data for update:", JSON.stringify(sanitizedData));
      
      // Use the schema to validate the update
      const validatedData = updateRaceSchema.parse(sanitizedData);
      const updatedRace = await storage.updateRace(raceId, validatedData);
      res.json(updatedRace);
    } catch (error) {
      console.error("Race update error:", error);
      res.status(500).json({ message: "Error updating race", error: String(error) });
    }
  });
  
  // Delete race
  app.delete("/api/admin/races/:id", isAdmin, async (req, res) => {
    try {
      console.log("Deleting race");
      
      const raceId = parseInt(req.params.id);
      const race = await storage.getRace(raceId);
      
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }
      
      // If race had results submitted, we need to check if it's safe to delete
      if (race.resultsSubmitted) {
        return res.status(400).json({ 
          message: "Cannot delete race with submitted results. This would affect team valuations and player credits. Remove race results first." 
        });
      }
      
      const success = await storage.deleteRace(raceId);
      
      if (success) {
        res.status(200).json({ message: "Race deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete race" });
      }
    } catch (error) {
      console.error("Race deletion error:", error);
      res.status(500).json({ message: "Error deleting race", error: String(error) });
    }
  });

  // Submit race results
  app.post("/api/admin/races/:id/results", isAdmin, async (req, res) => {
    try {
      const raceId = parseInt(req.params.id);
      const race = await storage.getRace(raceId);
      
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }
      
      // Check if this is the first race of the season by checking round number
      const isFirstRace = race.round === 1;
      
      console.log(`Processing race ${race.name} (ID: ${raceId}, Round: ${race.round}), isFirstRace: ${isFirstRace}`);
      
      // Delete previous results if any
      await storage.deleteRaceResults(raceId);
      
      // Insert new results
      const results = req.body.results;
      
      if (!Array.isArray(results) || results.length === 0) {
        return res.status(400).json({ message: "Results must be a non-empty array" });
      }
      
      const allDrivers = await storage.getDrivers();
      const allDriverIds = new Set(allDrivers.map(d => d.id));
      
      // Validate results
      for (const result of results) {
        try {
          const validatedResult = insertRaceResultSchema.parse({
            ...result,
            raceId
          });

          // Check if driver exists
          if (!allDriverIds.has(validatedResult.driverId)) {
            return res.status(400).json({ message: `Driver with ID ${validatedResult.driverId} not found` });
          }
          
          await storage.createRaceResult(validatedResult);
        } catch (error) {
          if (error instanceof ZodError) {
            return res.status(400).json({ message: fromZodError(error).message });
          }
          throw error;
        }
      }
      
      // For the first race of the season, handle differently
      if (isFirstRace) {
        console.log("This is the first race of the season, using special handling");
        
        try {
          // Use the specialized handling in applyValuations for first race
          // This will set valuations to 0 and create performance history
          await storage.applyValuations(raceId);
          
          console.log("First race processing completed successfully");
          
          // Update race to mark results as submitted (in case it wasn't done in applyValuations)
          const raceUpdate = updateRaceSchema.parse({ resultsSubmitted: true });
          await storage.updateRace(raceId, raceUpdate);
          
          return res.status(201).json({ 
            message: "Race results submitted successfully. As this is the first race of the season, all valuation changes are set to 0."
          });
        } catch (error) {
          console.error("Error processing first race:", error);
          return res.status(500).json({
            message: "Error processing first race results",
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // For non-first races, calculate and apply valuations
      try {
        await storage.applyValuations(raceId);
        
        // Update race to mark results as submitted
        const raceUpdate = updateRaceSchema.parse({ resultsSubmitted: true });
        await storage.updateRace(raceId, raceUpdate);
        
        res.status(201).json({ message: "Race results submitted successfully" });
      } catch (error) {
        console.error("Error applying valuations:", error);
        res.status(500).json({ 
          message: "Error applying valuations. Results were saved but valuations could not be calculated.",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    } catch (error) {
      console.error("Error in race results submission:", error);
      res.status(500).json({ 
        message: "Error submitting race results", 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Update valuation table entry
  app.patch("/api/admin/valuation-table/:difference", isAdmin, async (req, res) => {
    try {
      const difference = parseInt(req.params.difference);
      const entry = await storage.getValuationEntry(difference);
      
      if (!entry) {
        return res.status(404).json({ message: "Valuation entry not found" });
      }
      
      try {
        const entryData = insertValuationTableSchema.partial().parse(req.body);
        const updatedEntry = await storage.updateValuationEntry(difference, entryData);
        res.json(updatedEntry);
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: fromZodError(error).message });
        }
        throw error;
      }
    } catch (error) {
      res.status(500).json({ message: "Error updating valuation entry", error: error.message });
    }
  });

  // Create driver
  app.post("/api/admin/drivers", isAdmin, async (req, res) => {
    try {
      const driverData = insertDriverSchema.parse(req.body);
      const driver = await storage.createDriver(driverData);
      res.status(201).json(driver);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating driver", error: error.message });
    }
  });

  // Update driver
  app.patch("/api/admin/drivers/:id", isAdmin, async (req, res) => {
    try {
      const driverId = parseInt(req.params.id);
      const driver = await storage.getDriver(driverId);
      
      if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
      }
      
      const driverData = req.body;
      const updatedDriver = await storage.updateDriver(driverId, driverData);
      res.json(updatedDriver);
    } catch (error) {
      res.status(500).json({ message: "Error updating driver", error: error.message });
    }
  });

  // Create engine
  app.post("/api/admin/engines", isAdmin, async (req, res) => {
    try {
      const engineData = insertEngineSchema.parse(req.body);
      const engine = await storage.createEngine(engineData);
      res.status(201).json(engine);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating engine", error: error.message });
    }
  });

  // Update engine
  app.patch("/api/admin/engines/:id", isAdmin, async (req, res) => {
    try {
      const engineId = parseInt(req.params.id);
      const engine = await storage.getEngine(engineId);
      
      if (!engine) {
        return res.status(404).json({ message: "Engine not found" });
      }
      
      const engineData = req.body;
      const updatedEngine = await storage.updateEngine(engineId, engineData);
      res.json(updatedEngine);
    } catch (error) {
      res.status(500).json({ message: "Error updating engine", error: error.message });
    }
  });

  // Create team (chassis)
  app.post("/api/admin/teams", isAdmin, async (req, res) => {
    try {
      const teamData = insertTeamSchema.parse(req.body);
      const team = await storage.createTeam(teamData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating team", error: error.message });
    }
  });

  // Update team (chassis)
  app.patch("/api/admin/teams/:id", isAdmin, async (req, res) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const teamData = req.body;
      const updatedTeam = await storage.updateTeam(teamId, teamData);
      res.json(updatedTeam);
    } catch (error) {
      res.status(500).json({ message: "Error updating team", error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
