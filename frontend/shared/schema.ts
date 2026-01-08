import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const fraudEvents = pgTable("fraud_events", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").notNull(),
  riskBand: text("risk_band").notNull(),
  decision: text("decision").notNull(),
  fraudProbability: doublePrecision("fraud_probability").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  source: text("source").notNull(),
  deviceOs: text("device_os").notNull(),
  paymentType: text("payment_type").notNull(),
  analystAction: text("analyst_action"),
});

export const insertFraudEventSchema = createInsertSchema(fraudEvents).omit({ id: true });
export type FraudEvent = typeof fraudEvents.$inferSelect;
export type InsertFraudEvent = z.infer<typeof insertFraudEventSchema>;

// Analyst Action Schema
export const analystActionSchema = z.object({
  transactionId: z.union([z.string(), z.number()]),
  action: z.enum(["approve", "escalate", "block"]),
});

export type AnalystActionRequest = z.infer<typeof analystActionSchema>;

// KPI Interface
export const kpisSchema = z.object({
  txn_per_min: z.number(),
  alerts_per_min: z.number(),
  high_risk_pct: z.number(),
  avg_latency_ms: z.number(),
});
export type KPIs = z.infer<typeof kpisSchema>;

// Prediction Schemas
export const predictionFeaturesSchema = z.object({
  income: z.number(),
  name_email_similarity: z.number(),
  prev_address_months_count: z.number(),
  current_address_months_count: z.number(),
  customer_age: z.number(),
  days_since_request: z.number(),
  intended_balcon_amount: z.number(),
  zip_count_4w: z.number(),
  velocity_6h: z.number(),
  velocity_24h: z.number(),
  payment_type: z.string(),
  employment_status: z.string(),
  housing_status: z.string(),
  source: z.string(),
  device_os: z.string(),
});

export const predictionRequestSchema = z.object({
  features: predictionFeaturesSchema
});

export const predictionResponseSchema = z.object({
  risk_band: z.string(),
  fraud_probability: z.number(),
  decision: z.string(),
  rule_id: z.string().optional(),
});

export type PredictionRequest = z.infer<typeof predictionRequestSchema>;
export type PredictionResponse = z.infer<typeof predictionResponseSchema>;

// WebSocket Message Types
export interface WsSnapshotMessage {
  type: "snapshot";
  kpis: KPIs;
  recent_events: FraudEvent[];
}

export interface WsTickMessage {
  type: "tick";
  kpis: KPIs;
  event: FraudEvent;
}

export type WsMessage = WsSnapshotMessage | WsTickMessage;
