import { IAgent, AgentContext } from '@/types/agents';
import { AssessmentState } from '@/types/assessment';
import { callGeminiWithRetry } from '@/lib/gemini';
import { z } from 'zod';

const TriageSchema = z.object({
  symptoms: z.array(z.string()).describe("List of identified symptoms"),
  missing_information: z.array(z.string()).describe("Any critical missing information (e.g., duration, severity, location, accompanying symptoms)"),
  follow_up_required: z.boolean().describe("Whether follow-up questions are needed to clarify the symptoms"),
  initial_risk: z.enum(['low', 'moderate', 'high']).describe("Initial estimation of risk level"),
  red_flags: z.array(z.string()).describe("Any potential emergency warning signs detected"),
  reasoning_summary: z.string().describe("Concise reasoning summary for the triage assessment (max 2 sentences)")
});

export class TriageAgent implements IAgent {
  name = 'TriageAgent';

  async execute(context: AgentContext): Promise<AssessmentState> {
    const { state } = context;

    let prompt = `You are a specialized Medical Triage AI agent.
Your role is to perform initial triage on reported patient symptoms, detect missing information, spot potential emergency red flags, and decide if follow-up clarification questions are needed.

CRITICAL MEDICAL SAFETY RULES:
- You are NOT providing a definitive medical diagnosis.
- Detect any potential emergency warning signs (e.g., sudden severe onset, chest pain with shortness of breath, neurological deficits, severe peritoneal signs).
- If key details (duration, exact location, severity, associated features) are missing, flag them in missing_information.

Reported Symptoms:
"""
${state.rawSymptoms}
"""
`;

    if (state.patientDemographics) {
      prompt += `\nPatient Demographics:
Age: ${state.patientDemographics.age || 'Unknown'}
Sex: ${state.patientDemographics.sex || 'Unknown'}
Past Medical History: ${state.patientDemographics.medicalHistory || 'None reported'}
Current Medications: ${state.patientDemographics.currentMedications || 'None reported'}
Allergies: ${(state.patientDemographics.allergies || []).join(', ') || 'None reported'}
`;
    }

    if (state.followUpQuestions && state.followUpQuestions.length > 0) {
      prompt += `\nFollow-up Q&A already gathered:\n`;
      state.followUpQuestions.forEach((q, idx) => {
        prompt += `${idx + 1}. Q: ${q.question}\n   A: ${q.answer || 'Not answered'}\n`;
      });
    }

    const response = await callGeminiWithRetry({
      agentName: 'TriageAgent',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: 'object',
          properties: {
            symptoms: { type: 'array', items: { type: 'string' } },
            missing_information: { type: 'array', items: { type: 'string' } },
            follow_up_required: { type: 'boolean' },
            initial_risk: { type: 'string', enum: ['low', 'moderate', 'high'] },
            red_flags: { type: 'array', items: { type: 'string' } },
            reasoning_summary: { type: 'string' }
          },
          required: ['symptoms', 'missing_information', 'follow_up_required', 'initial_risk', 'red_flags', 'reasoning_summary']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const result = TriageSchema.parse(parsed);

    // If answers were already provided, don't demand endless follow ups
    const hasAnswers = state.followUpQuestions.some(q => q.answer && q.answer.trim().length > 0);
    const followUpNeeded = hasAnswers ? false : (result.follow_up_required && result.missing_information.length > 0);

    return {
      ...state,
      missingInformation: followUpNeeded ? result.missing_information : [],
      triageRisk: result.initial_risk,
      redFlags: result.red_flags,
      triageReasoning: result.reasoning_summary
    };
  }
}
