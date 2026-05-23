export type AgentType =
  | "orchestrator"
  | "outbound_sales"
  | "inbound_sales"
  | "objection_handler"
  | "follow_up";

export interface AgentDefinition {
  type: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  beginMessage?: string;
  handoffTriggers: string[];
  languages: string[];
}

export interface AgentContext {
  leadId?: string;
  leadName: string;
  leadCompany?: string;
  leadRole?: string;
  leadIndustry?: string;
  leadLanguage: string;
  callDirection: "inbound" | "outbound";
  previousAgent?: AgentType;
  handoffReason?: string;
  campaignGoal?: string;
  productName: string;
  productHighlights: string[];
  pricingModel?: string;
}
