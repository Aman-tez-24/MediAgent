import { AssessmentState } from '@/types/assessment';
import { AgentContext, IAgent } from '@/types/agents';
import { createAdminClient } from '@/lib/supabase/admin';
import { TriageAgent } from './TriageAgent';
import { FollowUpAgent } from './FollowUpAgent';
import { SymptomAnalysisAgent } from './SymptomAnalysisAgent';
import { MedicalKnowledgeAgent } from './MedicalKnowledgeAgent';
import { DifferentialAssessmentAgent } from './DifferentialAssessmentAgent';
import { RiskAssessmentAgent } from './RiskAssessmentAgent';
import { SafetyValidationAgent } from './SafetyValidationAgent';
import { ReportAgent } from './ReportAgent';

export class Orchestrator {
  private agents: Map<string, IAgent> = new Map();

  constructor() {
    this.registerAgent(new TriageAgent());
    this.registerAgent(new FollowUpAgent());
    this.registerAgent(new SymptomAnalysisAgent());
    this.registerAgent(new MedicalKnowledgeAgent());
    this.registerAgent(new DifferentialAssessmentAgent());
    this.registerAgent(new RiskAssessmentAgent());
    this.registerAgent(new SafetyValidationAgent());
    this.registerAgent(new ReportAgent());
  }

  registerAgent(agent: IAgent) {
    this.agents.set(agent.name, agent);
  }

  /**
   * Phase 1: Initial Triage and Follow-Up Generation
   */
  async runInitialTriage(initialState: AssessmentState): Promise<AssessmentState> {
    let currentState = { ...initialState };

    // 1. Triage Agent
    currentState = await this.executeAgent('TriageAgent', currentState);

    // 2. If information is missing and follow-up questions needed, generate them
    if (currentState.missingInformation.length > 0 && (!currentState.followUpQuestions || currentState.followUpQuestions.length === 0)) {
      currentState = await this.executeAgent('FollowUpAgent', currentState);

      // Persist generated follow-up questions to database if assessmentId exists
      if (currentState.assessmentId && currentState.followUpQuestions.length > 0) {
        try {
          const supabase = createAdminClient();
          const rowsToInsert = currentState.followUpQuestions.map(q => ({
            assessment_id: currentState.assessmentId,
            question: q.question,
            question_type: q.question_type,
            answer: q.answer || null
          }));
          await supabase.from('follow_up_questions').insert(rowsToInsert);
          await supabase.from('assessments').update({ status: 'in_progress' }).eq('id', currentState.assessmentId);
        } catch (dbErr) {
          console.error('Failed to persist follow-up questions:', dbErr);
        }
      }
    }

    return currentState;
  }

  /**
   * Phase 2: Full Multi-Agent Clinical Analysis & Report Generation
   */
  async runFullAnalysis(initialState: AssessmentState): Promise<AssessmentState> {
    let currentState = { ...initialState };
    const paceDelay = (ms: number) => new Promise(r => setTimeout(r, ms));

    // 1. Symptom Analysis Agent: Normalizes & structures symptoms
    currentState = await this.executeAgent('SymptomAnalysisAgent', currentState);
    await paceDelay(1000);

    // 2. Medical Knowledge Agent: Retrieves clinical reference evidence via RAG
    currentState = await this.executeAgent('MedicalKnowledgeAgent', currentState);

    // 3. Differential Assessment Agent: Explores potential explanations
    currentState = await this.executeAgent('DifferentialAssessmentAgent', currentState);
    await paceDelay(1000);

    // 4. Risk Assessment Agent: Determines urgency tier & red flags
    currentState = await this.executeAgent('RiskAssessmentAgent', currentState);
    await paceDelay(800);

    // 5. Safety Validation Agent: Audits outputs against clinical AI safety guardrails
    currentState = await this.executeAgent('SafetyAgent', currentState);

    // 6. Report Agent: Fast deterministic synthesis of final patient report & saves to DB
    currentState = await this.executeAgent('ReportAgent', currentState);

    return currentState;
  }

  /**
   * Complete workflow dispatcher based on current state
   */
  async runWorkflow(initialState: AssessmentState): Promise<AssessmentState> {
    let currentState = { ...initialState };

    // If follow up questions have not been answered yet and we haven't done triage:
    const hasAnswers = currentState.followUpQuestions.some(q => q.answer && q.answer.trim().length > 0);
    
    if (!hasAnswers && (!currentState.followUpQuestions || currentState.followUpQuestions.length === 0)) {
      currentState = await this.runInitialTriage(currentState);
      if (currentState.followUpQuestions.length > 0) {
        return currentState; // Return to client so user can answer
      }
    }

    // If we have answers or no follow-up was required, run full analysis
    return await this.runFullAnalysis(currentState);
  }

  private async executeAgent(agentName: string, state: AssessmentState): Promise<AssessmentState> {
    const agent = this.agents.get(agentName);
    if (!agent) {
      throw new Error(`Agent ${agentName} is not registered in Orchestrator`);
    }

    const startTime = Date.now();
    let status: 'completed' | 'failed' = 'completed';
    let output: any = null;
    let error: string | undefined;

    const logger = async (logData: any) => {
      console.log(`[Agent: ${agentName}] status=${logData.status} (${logData.execution_time}ms)`);
      
      try {
        if (state.assessmentId) {
          const supabase = createAdminClient();
          await supabase.from('agent_runs').insert({
            assessment_id: state.assessmentId,
            agent_name: agentName,
            status: logData.status,
            execution_time: logData.execution_time,
            input: logData.input,
            output: logData.output,
            error: logData.error
          });
        }
      } catch (err) {
        // Non-blocking for agent run logging
        console.error(`Failed to log agent run ${agentName}:`, err);
      }
    };

    const context: AgentContext = { state, logger };

    try {
      const nextState = await agent.execute(context);
      const executionTime = Date.now() - startTime;
      
      await logger({
        agent_name: agentName,
        status: 'completed',
        execution_time: executionTime,
        input: {
          symptoms: state.rawSymptoms,
          questionsCount: state.followUpQuestions?.length || 0
        },
        output: {
          success: true,
          structuredCount: nextState.structuredSymptoms?.length || 0,
          conditionsCount: nextState.possibleExplanations?.length || 0,
          urgency: nextState.riskAssessment?.urgency || null,
          reportGenerated: nextState.reportGenerated
        }
      });
      
      return nextState;
    } catch (e: any) {
      status = 'failed';
      error = e.message;
      
      await logger({
        agent_name: agentName,
        status: 'failed',
        execution_time: Date.now() - startTime,
        input: { symptoms: state.rawSymptoms },
        output: null,
        error
      });
      
      throw e;
    }
  }
}

let orchestratorInstance: Orchestrator | null = null;

export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator();
  }
  return orchestratorInstance;
}
