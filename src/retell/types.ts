export interface RetellCallResponse {
  call_id: string;
  status: "registered" | "ongoing" | "ended" | "error";
  call_type: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  direction: "inbound" | "outbound";
  start_timestamp: number;
  end_timestamp?: number;
  transcript?: string;
  transcript_object?: TranscriptEntry[];
  recording_url?: string;
  disconnection_reason?: string;
  call_analysis?: CallAnalysis;
}

export interface TranscriptEntry {
  role: "agent" | "customer";
  content: string;
  timestamp: number;
}

export interface CallAnalysis {
  call_successful: boolean | null;
  call_summary: string | null;
  user_sentiment: "Positive" | "Negative" | "Neutral" | "Unknown";
  call_completion: "Completed" | "Incomplete" | "Unknown";
  agent_task_completion: "Complete" | "Incomplete" | "Unknown";
  custom_analysis_data: Record<string, unknown>;
}

export interface RetellAgentConfig {
  agent_name: string;
  language: string;
  voice_id: string;
  llm_model: string;
  general_prompt: string;
  begin_message?: string;
  responsiveness?: number;
  interruption_sensitivity?: number;
  enable_backchannel?: boolean;
  backchannel_frequency?: number;
  ambient_sound?: string;
  boosted_keywords?: string[];
  end_call_after_silence_ms?: number;
  max_call_duration_ms?: number;
}

export interface WebhookPayload {
  call_id: string;
  event: CallEvent;
  access_token: string;
  call_type: "inbound" | "outbound";
  from_number: string;
  to_number: string;
  direction: "inbound" | "outbound";
  start_timestamp: number;
  end_timestamp?: number;
  transcript?: string;
  transcript_object?: TranscriptEntry[];
  recording_url?: string;
  disconnection_reason?: string;
  call_analysis?: CallAnalysis;
  retell_llm_dynamic_variables?: Record<string, string>;
}

export type CallEvent =
  | "call_started"
  | "call_ended"
  | "call_analyzed"
  | "call_transfer"
  | "error";

export interface AgentHandoffPayload {
  call_id: string;
  new_agent_id: string;
  reason: string;
}
