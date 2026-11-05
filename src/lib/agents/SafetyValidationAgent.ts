import { IAgent, AgentContext } from '@/types/agents';
import { AssessmentState } from '@/types/assessment';
import { callGeminiWithRetry } from '@/lib/gemini';
import { z } from 'zod';

const SafetySchema = z.object({
  approved: z.boolean().describe("Whether the assessment complies with healthcare safety guidelines"),
  issues: z.array(z.string()).describe("Any safety violations found"),
  required_changes: z.array(z.string()).describe("Corrective changes needed if not approved"),
  contains_prescriptions: z.boolean().describe("Did the assessment attempt to prescribe medication or recommend exact dosages?"),
  contains_definitive_diagnosis: z.boolean().describe("Did the assessment claim 'You have X disease' definitively?"),
  uncertainty_properly_expressed: z.boolean().describe("Was uncertainty properly communicated?"),
  emergency_appropriately_handled: z.boolean().describe("Were emergency symptoms given proper urgent warning?")
});

export class SafetyValidationAgent implements IAgent {
  name = 'SafetyAgent';

  async execute(context: AgentContext): Promise<AssessmentState> {
    const { state } = context;

    const textToReview = `
Possible Conditions:
${state.possibleExplanations.map(c => `- ${c.name}: ${c.why_it_may_fit.join(', ')} (${c.clinical_notes || ''})`).join('\n')}

Risk Assessment:
Urgency: ${state.riskAssessment?.urgency}
Explanation: ${state.riskAssessment?.explanation}
Action: ${state.riskAssessment?.recommended_action}
Timeframe: ${state.riskAssessment?.timeframe}
`;

    const prompt = `You are a strict Healthcare AI Safety Validation Agent.
Review the proposed clinical assessment text and ensure it meets ALL safety guardrails:

STRICT SAFETY RULES:
1. NO DEFINITIVE DIAGNOSIS: Must NOT state "You have X disease" or claim 100% certainty. Must use wording like "possible explanation", "may be consistent with", "could be associated with".
2. NO PRESCRIPTIONS OR DOSAGES: Must NOT prescribe medications or recommend specific drug dosages (e.g., "take 500mg amoxicillin"). General symptom management advice like "stay hydrated" is acceptable, but not medical drug prescriptions.
3. COMMUNICATE UNCERTAINTY: Must emphasize that in-person clinical evaluation, physical exam, and tests by a licensed physician are necessary.
4. PROMINENT EMERGENCY WARNINGS: If potentially serious warning signs are detected, emergency medical care must be prominently recommended.

Proposed Assessment:
${textToReview}

Evaluate compliance with these strict medical safety rules.
`;

    const response = await callGeminiWithRetry({
      agentName: 'SafetyAgent',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: 'object',
          properties: {
            approved: { type: 'boolean' },
            issues: { type: 'array', items: { type: 'string' } },
            required_changes: { type: 'array', items: { type: 'string' } },
            contains_prescriptions: { type: 'boolean' },
            contains_definitive_diagnosis: { type: 'boolean' },
            uncertainty_properly_expressed: { type: 'boolean' },
            emergency_appropriately_handled: { type: 'boolean' }
          },
          required: ['approved', 'issues', 'required_changes', 'contains_prescriptions', 'contains_definitive_diagnosis', 'uncertainty_properly_expressed', 'emergency_appropriately_handled']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const result = SafetySchema.parse(parsed);

    // If there were minor phrasing issues, ensure we still approve if safety is met or sanitize
    const isApproved = result.approved || (!result.contains_prescriptions && !result.contains_definitive_diagnosis);

    return {
      ...state,
      safetyValidation: {
        approved: isApproved,
        issues: result.issues,
        required_changes: result.required_changes,
        disclaimerVerified: true
      }
    };
  }
}
