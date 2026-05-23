-- CallAgents Database Schema
-- Ejecuta esto en: Supabase Dashboard > SQL Editor > New Query

-- Enums
CREATE TYPE call_status AS ENUM ('pending', 'in_progress', 'completed', 'failed', 'voicemail', 'no_answer', 'busy');
CREATE TYPE lead_stage AS ENUM ('new', 'contacted', 'qualified', 'demo_scheduled', 'demo_completed', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost', 'unqualified');
CREATE TYPE call_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE agent_type AS ENUM ('orchestrator', 'outbound_sales', 'inbound_sales', 'objection_handler', 'follow_up');

-- Leads / Contacts
CREATE TABLE leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  full_name text,
  email text,
  company text,
  role text,
  industry text,
  language text DEFAULT 'es',
  stage lead_stage DEFAULT 'new',
  score integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  notes text,
  last_contacted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Call Sessions
CREATE TABLE calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retell_call_id text UNIQUE,
  lead_id uuid REFERENCES leads(id),
  direction call_direction NOT NULL,
  status call_status DEFAULT 'pending',
  agent_type agent_type NOT NULL,
  from_number text,
  to_number text,
  transcript text,
  transcript_json jsonb,
  recording_url text,
  duration_ms integer,
  sentiment text,
  disconnection_reason text,
  call_successful boolean,
  call_summary text,
  analysis_data jsonb,
  metadata jsonb DEFAULT '{}',
  handoff_from uuid REFERENCES calls(id),
  handoff_reason text,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Agent Configs
CREATE TABLE agent_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type agent_type NOT NULL UNIQUE,
  name text NOT NULL,
  language text DEFAULT 'es',
  voice_id text,
  llm_model text DEFAULT 'gpt-4.1',
  general_prompt text NOT NULL,
  begin_message text,
  responsiveness integer DEFAULT 1,
  interruption_sensitivity integer DEFAULT 50,
  enable_backchannel boolean DEFAULT false,
  boosted_keywords jsonb DEFAULT '[]',
  end_call_after_silence_ms integer DEFAULT 15000,
  max_call_duration_ms integer DEFAULT 600000,
  retell_agent_id text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Follow-up Tasks
CREATE TABLE follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid REFERENCES calls(id),
  lead_id uuid REFERENCES leads(id),
  type text NOT NULL,
  status text DEFAULT 'pending',
  content text,
  scheduled_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Campaigns
CREATE TABLE campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  agent_type agent_type DEFAULT 'outbound_sales',
  goal text,
  target_metrics jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert default agent configs
INSERT INTO agent_configs (type, name, language, general_prompt, begin_message) VALUES
('outbound_sales', 'Outbound Sales Agent', 'es', 'Agente de ventas salientes B2B SaaS.', 'Hola, soy un agente de CallAgents. ¿Cómo estás?'),
('inbound_sales', 'Inbound Sales Agent', 'es', 'Agente de ventas entrantes B2B SaaS.', '¡Hola! Gracias por contactarnos. ¿En qué puedo ayudarte?'),
('objection_handler', 'Objection Handler Agent', 'es', 'Especialista en manejo de objeciones.', 'Entiendo tu punto. Déjame ayudarte con eso.'),
('follow_up', 'Follow-up Agent', 'es', 'Agente de seguimiento post-llamada.', ''),
('orchestrator', 'Orchestrator Agent', 'es', 'Orquestador de agentes.', '');
