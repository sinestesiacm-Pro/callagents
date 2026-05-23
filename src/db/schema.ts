import { pgTable, text, timestamp, uuid, integer, boolean, jsonb, pgEnum, type AnyPgColumn } from "drizzle-orm/pg-core";

export const callStatusEnum = pgEnum("call_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "voicemail",
  "no_answer",
  "busy",
]);

export const leadStageEnum = pgEnum("lead_stage", [
  "new",
  "contacted",
  "qualified",
  "demo_scheduled",
  "demo_completed",
  "proposal_sent",
  "negotiation",
  "closed_won",
  "closed_lost",
  "unqualified",
]);

export const callDirectionEnum = pgEnum("call_direction", ["inbound", "outbound"]);

export const agentTypeEnum = pgEnum("agent_type", [
  "orchestrator",
  "outbound_sales",
  "inbound_sales",
  "objection_handler",
  "follow_up",
]);

// ── Leads / Contacts ──
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  phone: text("phone").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  company: text("company"),
  role: text("role"),
  industry: text("industry"),
  language: text("language").default("es"),
  stage: leadStageEnum("stage").default("new"),
  score: integer("score").default(0),
  metadata: jsonb("metadata").default({}),
  notes: text("notes"),
  lastContactedAt: timestamp("last_contacted_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Call Sessions ──
export const calls = pgTable("calls", {
  id: uuid("id").primaryKey().defaultRandom(),
  retellCallId: text("retell_call_id").unique(),
  leadId: uuid("lead_id").references(() => leads.id),
  direction: callDirectionEnum("direction").notNull(),
  status: callStatusEnum("status").default("pending"),
  agentType: agentTypeEnum("agent_type").notNull(),
  fromNumber: text("from_number"),
  toNumber: text("to_number"),
  transcript: text("transcript"),
  transcriptJson: jsonb("transcript_json"),
  recordingUrl: text("recording_url"),
  durationMs: integer("duration_ms"),
  sentiment: text("sentiment"),
  disconnectionReason: text("disconnection_reason"),
  callSuccessful: boolean("call_successful"),
  callSummary: text("call_summary"),
  analysisData: jsonb("analysis_data"),
  metadata: jsonb("metadata").default({}),
  handoffFrom: uuid("handoff_from").references((): AnyPgColumn => calls.id),
  handoffReason: text("handoff_reason"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Agent Configs ──
export const agentConfigs = pgTable("agent_configs", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: agentTypeEnum("type").notNull().unique(),
  name: text("name").notNull(),
  language: text("language").default("es"),
  voiceId: text("voice_id"),
  llmModel: text("llm_model").default("gpt-4o"),
  generalPrompt: text("general_prompt").notNull(),
  beginMessage: text("begin_message"),
  responsiveness: integer("responsiveness").default(1),
  interruptionSensitivity: integer("interruption_sensitivity").default(50),
  enableBackchannel: boolean("enable_backchannel").default(false),
  boostedKeywords: jsonb("boosted_keywords").default([]),
  endCallAfterSilenceMs: integer("end_call_after_silence_ms").default(15000),
  maxCallDurationMs: integer("max_call_duration_ms").default(600000),
  retellAgentId: text("retell_agent_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ── Follow-up Tasks ──
export const followUps = pgTable("follow_ups", {
  id: uuid("id").primaryKey().defaultRandom(),
  callId: uuid("call_id").references(() => calls.id),
  leadId: uuid("lead_id").references(() => leads.id),
  type: text("type").notNull(), // email, sms, callback, linkedin
  status: text("status").default("pending"),
  content: text("content"),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ── Campaigns ──
export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  agentType: agentTypeEnum("agent_type").default("outbound_sales"),
  goal: text("goal"),
  targetMetrics: jsonb("target_metrics").default({}),
  isActive: boolean("is_active").default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});
