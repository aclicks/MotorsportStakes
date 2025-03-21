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
  insertRaceResultSchema
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
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: "Forbidden - Admin access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);

  // Get current user's teams
  app.get("/api/my-teams", isAuthenticated, async (req, res) => {
    try {
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
      res.status(500).json({ message: "Error fetching teams", error: error.message });
    }
  });

  // Update user team
  app.patch("/api/my-teams/:id", isAuthenticated, async (req, res) => {
    try {
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

  // Get market data (all available drivers, engines, chassis)
  app.get("/api/market", async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      const engines = await storage.getEngines();
      const teams = await storage.getTeams();
      
      // Enhance drivers with team data
      const driversWithTeams = await Promise.all(drivers.map(async (driver) => {
        const team = driver.teamId ? await storage.getTeam(driver.teamId) : undefined;
        return { ...driver, team };
      }));
      
      res.json({
        drivers: driversWithTeams,
        engines,
        teams
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
      const valuationTable = await storage.getValuationTable();
      res.json(valuationTable);
    } catch (error) {
      res.status(500).json({ message: "Error fetching valuation table", error: error.message });
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

  // ADMIN ROUTES

  // Create race
  app.post("/api/admin/races", isAdmin, async (req, res) => {
    try {
      const raceData = insertRaceSchema.parse(req.body);
      const race = await storage.createRace(raceData);
      res.status(201).json(race);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Error creating race", error: error.message });
    }
  });

  // Update race
  app.patch("/api/admin/races/:id", isAdmin, async (req, res) => {
    try {
      const raceId = parseInt(req.params.id);
      const race = await storage.getRace(raceId);
      
      if (!race) {
        return res.status(404).json({ message: "Race not found" });
      }
      
      const raceData = req.body;
      const updatedRace = await storage.updateRace(raceId, raceData);
      res.json(updatedRace);
    } catch (error) {
      res.status(500).json({ message: "Error updating race", error: error.message });
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
      
      // Calculate and apply valuations
      await storage.applyValuations(raceId);
      
      res.status(201).json({ message: "Race results submitted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error submitting race results", error: error.message });
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
