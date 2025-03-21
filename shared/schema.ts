import { pgTable, text, serial, integer, boolean, timestamp, numeric, json, primaryKey } from "drizzle-orm/pg-core";
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

export const insertRaceSchema = createInsertSchema(races).omit({
  id: true,
  resultsSubmitted: true,
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
});

export const insertEngineSchema = createInsertSchema(engines).omit({
  id: true,
});

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
});

export const insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
});

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
export type DriverWithTeam = Driver & { team: Team };
export type UserTeamComplete = UserTeam & {
  driver1?: DriverWithTeam;
  driver2?: DriverWithTeam;
  engine?: Engine;
  team?: Team;
  totalValue?: number;
};
