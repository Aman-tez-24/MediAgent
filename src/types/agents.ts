import { AssessmentState } from './assessment';

export type AgentStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface AgentRunLog {
  id: string;
  agent_name: string;
  status: AgentStatus;
  execution_time?: number;
  input: any;
  output: any;
  error?: string;
  created_at: string;
}

export interface AgentContext {
  state: AssessmentState;
  logger: (log: Omit<AgentRunLog, 'id' | 'created_at'>) => Promise<void>;
}

export interface IAgent {
  name: string;
  execute(context: AgentContext): Promise<AssessmentState>;
}
