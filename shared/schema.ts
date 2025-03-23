import { pgTable, text, serial, integer, boolean, timestamp, numeric, json, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  googleId: true,
});

// Race model
export const races = pgTable("races", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  date: timestamp("date").notNull(),
  round: integer("round").notNull(),
  resultsSubmitted: boolean("results_submitted").default(false).notNull(),
});

// Create a custom insert schema with date validation
export const insertRaceSchema = createInsertSchema(races)
  .omit({
    id: true,
    resultsSubmitted: true,
  })
  
// Schema for race updates that includes resultsSubmitted field
export const updateRaceSchema = createInsertSchema(races)
  .partial()
  .extend({
    resultsSubmitted: z.boolean().optional(),
  })
  // Make the date optional but validate it if provided
  .extend({
    date: z.preprocess(
      (arg) => {
        if (arg === undefined) return undefined;
        if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
        return arg;
      },
      z.date({
        invalid_type_error: "Invalid date format",
      }).optional(),
    ),
  });

// Team (Constructor/Chassis) model
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  value: integer("value").notNull(),
  engineId: integer("engine_id"),
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
});

// Engine model
export const engines = pgTable("engines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  value: integer("value").notNull(),
  valueUpdatedAt: timestamp("value_updated_at"),
});

export const insertEngineSchema = createInsertSchema(engines).omit({
  id: true,
});

// Relações das equipes
export const teamsRelations = relations(teams, ({ one }) => ({
  engine: one(engines, {
    fields: [teams.engineId],
    references: [engines.id],
  }),
}));

// Driver model
export const drivers = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  number: integer("number").notNull().unique(),
  teamId: integer("team_id").notNull(),
  value: integer("value").notNull(),
  retired: boolean("retired").default(false).notNull(),
  lastRace1Position: integer("last_race1_position"),
  lastRace2Position: integer("last_race2_position"),
  lastRace3Position: integer("last_race3_position"),
  valueUpdatedAt: timestamp("value_updated_at"),
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
});

// Relações dos pilotos
export const driversRelations = relations(drivers, ({ one }) => ({
  team: one(teams, {
    fields: [drivers.teamId],
    references: [teams.id],
  }),
}));

// Race Result model
export const raceResults = pgTable("race_results", {
  id: serial("id").primaryKey(),
  raceId: integer("race_id").notNull(),
  driverId: integer("driver_id").notNull(),
  position: integer("position").notNull(),
  valuation: integer("valuation"),
});

export const insertRaceResultSchema = createInsertSchema(raceResults).omit({
  id: true,
  valuation: true,
});

// Schema for race result updates that includes valuation field
export const updateRaceResultSchema = createInsertSchema(raceResults)
  .partial()
  .extend({
    valuation: z.number().nullable().optional(),
  });

// Relações dos resultados das corridas
export const raceResultsRelations = relations(raceResults, ({ one }) => ({
  race: one(races, {
    fields: [raceResults.raceId],
    references: [races.id],
  }),
  driver: one(drivers, {
    fields: [raceResults.driverId],
    references: [drivers.id],
  }),
}));

// Performance History model
export const performanceHistory = pgTable("performance_history", {
  id: serial("id").primaryKey(),
  driverId: integer("driver_id"),
  teamId: integer("team_id"),
  engineId: integer("engine_id"),
  raceId: integer("race_id").notNull(),
  position: integer("position").notNull(),
});

export const insertPerformanceHistorySchema = createInsertSchema(performanceHistory).omit({
  id: true,
});

// Relações do histórico de performance
export const performanceHistoryRelations = relations(performanceHistory, ({ one }) => ({
  race: one(races, {
    fields: [performanceHistory.raceId],
    references: [races.id],
  }),
  driver: one(drivers, {
    fields: [performanceHistory.driverId],
    references: [drivers.id],
  }),
  team: one(teams, {
    fields: [performanceHistory.teamId],
    references: [teams.id],
  }),
  engine: one(engines, {
    fields: [performanceHistory.engineId],
    references: [engines.id],
  }),
}));

// Valuation Table model
export const valuationTable = pgTable("valuation_table", {
  difference: integer("difference").primaryKey(),
  description: text("description").notNull(),
  percentageChange: numeric("percentage_change").notNull().default("0"),
});

export const insertValuationTableSchema = createInsertSchema(valuationTable);

// User Teams model
export const userTeams = pgTable("user_teams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  initialCredits: integer("initial_credits").notNull(),
  currentCredits: integer("current_credits").notNull(),
  driver1Id: integer("driver1_id"),
  driver2Id: integer("driver2_id"),
  engineId: integer("engine_id"),
  teamId: integer("team_id"),
});

export const insertUserTeamSchema = createInsertSchema(userTeams).omit({
  id: true,
});

// Relações dos times dos usuários
export const userTeamsRelations = relations(userTeams, ({ one }) => ({
  user: one(users, {
    fields: [userTeams.userId],
    references: [users.id],
  }),
  driver1: one(drivers, {
    fields: [userTeams.driver1Id],
    references: [drivers.id],
  }),
  driver2: one(drivers, {
    fields: [userTeams.driver2Id],
    references: [drivers.id],
  }),
  engine: one(engines, {
    fields: [userTeams.engineId],
    references: [engines.id],
  }),
  team: one(teams, {
    fields: [userTeams.teamId],
    references: [teams.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Race = typeof races.$inferSelect;
export type InsertRace = z.infer<typeof insertRaceSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type Engine = typeof engines.$inferSelect;
export type InsertEngine = z.infer<typeof insertEngineSchema>;

export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export type RaceResult = typeof raceResults.$inferSelect;
export type InsertRaceResult = z.infer<typeof insertRaceResultSchema>;

export type PerformanceHistory = typeof performanceHistory.$inferSelect;
export type InsertPerformanceHistory = z.infer<typeof insertPerformanceHistorySchema>;

export type ValuationTable = typeof valuationTable.$inferSelect;
export type InsertValuationTable = z.infer<typeof insertValuationTableSchema>;

export type UserTeam = typeof userTeams.$inferSelect;
export type InsertUserTeam = z.infer<typeof insertUserTeamSchema>;

// Enhanced types for frontend
// Game settings table for global configurations
export const gameSettings = pgTable("game_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGameSettingsSchema = createInsertSchema(gameSettings);
export type GameSetting = typeof gameSettings.$inferSelect;
export type InsertGameSetting = z.infer<typeof insertGameSettingsSchema>;

export type DriverWithTeam = Driver & { team: Team };
// Asset value history
export const assetValueHistory = pgTable("asset_value_history", {
  id: serial("id").primaryKey(),
  entityId: integer("entity_id").notNull(),
  entityType: text("entity_type", { enum: ["driver", "team", "engine"] }).notNull(),
  raceId: integer("race_id").notNull().references(() => races.id, { onDelete: "cascade" }),
  value: integer("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAssetValueHistorySchema = createInsertSchema(assetValueHistory).omit({
  id: true,
  createdAt: true,
});

export type AssetValueHistory = typeof assetValueHistory.$inferSelect;
export type InsertAssetValueHistory = z.infer<typeof insertAssetValueHistorySchema>;

export const assetValueHistoryRelations = relations(assetValueHistory, ({ one }) => ({
  race: one(races, {
    fields: [assetValueHistory.raceId],
    references: [races.id],
  }),
}));

export type UserTeamComplete = UserTeam & {
  driver1?: DriverWithTeam;
  driver2?: DriverWithTeam;
  engine?: Engine;
  team?: Team;
  totalValue?: number;
};
