import { IAgent, AgentContext } from '@/types/agents';
import { AssessmentState, RiskAssessment, AssessmentUrgency } from '@/types/assessment';
import { callGeminiWithRetry } from '@/lib/gemini';
import { z } from 'zod';

const RiskSchema = z.object({
  urgency: z.enum(['routine', 'soon', 'urgent', 'emergency']),
  risk_flags: z.array(z.string()).describe("List of warning signs or red flags detected or to monitor"),
  explanation: z.string().describe("Clinical explanation of why this urgency level was designated"),
  recommended_action: z.string().describe("Clear, direct recommendation of next medical step"),
  timeframe: z.string().describe("Recommended timeframe to seek medical attention")
});

export class RiskAssessmentAgent implements IAgent {
  name = 'RiskAssessmentAgent';

  async execute(context: AgentContext): Promise<AssessmentState> {
    const { state } = context;

    const prompt = `You are a Risk Assessment and Clinical Urgency Medical AI Agent.
Evaluate the severity and urgency of the patient's reported condition.

URGENCY CRITERIA:
- 'emergency': Immediate emergency services (911 / Emergency Department). Examples: signs of myocardial infarction, stroke (FAST symptoms), sudden thunderclap headache, acute peritoneal abdomen, anaphylaxis, severe respiratory distress, acute severe neurological deficits.
- 'urgent': Evaluation within 12 to 24 hours (Urgent Care / Same-day physician clinic). Examples: persistent high fever, moderate dehydration, severe uncontrolled pain without shock, suspicion of acute infection requiring timely antibiotics.
- 'soon': Evaluation within 2 to 7 days by primary care physician. Examples: subacute recurrent symptoms, unresolved symptoms over 1-2 weeks without acute distress.
- 'routine': Non-urgent consultation during normal healthcare visits or routine follow-up.

Patient Presentation:
Raw Input: "${state.rawSymptoms}"
Structured Symptoms: ${JSON.stringify(state.structuredSymptoms)}
Red Flags Initially Detected: ${(state.redFlags || []).join(', ') || 'None'}
Possible Conditions Considered: ${state.possibleExplanations.map(c => c.name).join(', ')}

Provide:
1. Urgency tier ('routine' | 'soon' | 'urgent' | 'emergency')
2. Warning flags to watch for (red flags that would escalate urgency)
3. Direct, actionable clinical recommendation
4. Clear recommended timeframe
`;

    const response = await callGeminiWithRetry({
      agentName: 'RiskAssessmentAgent',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: 'object',
          properties: {
            urgency: { type: 'string', enum: ['routine', 'soon', 'urgent', 'emergency'] },
            risk_flags: { type: 'array', items: { type: 'string' } },
            explanation: { type: 'string' },
            recommended_action: { type: 'string' },
            timeframe: { type: 'string' }
          },
          required: ['urgency', 'risk_flags', 'explanation', 'recommended_action', 'timeframe']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const result = RiskSchema.parse(parsed);

    const riskAssessment: RiskAssessment = {
      urgency: result.urgency as AssessmentUrgency,
      risk_flags: result.risk_flags,
      explanation: result.explanation,
      recommended_action: result.recommended_action,
      timeframe: result.timeframe
    };

    return {
      ...state,
      riskAssessment
    };
  }
}
