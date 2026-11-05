import { IAgent, AgentContext } from '@/types/agents';
import { AssessmentState, PossibleCondition } from '@/types/assessment';
import { callGeminiWithRetry } from '@/lib/gemini';
import { z } from 'zod';

const DifferentialSchema = z.object({
  conditions: z.array(z.object({
    name: z.string(),
    likelihood: z.enum(['more_likely', 'possible', 'less_likely']),
    why_it_may_fit: z.array(z.string()),
    features_that_do_not_fit: z.array(z.string()),
    information_missing: z.array(z.string()),
    evidence_sources: z.array(z.string()),
    clinical_notes: z.string()
  })).min(1).max(5)
});

export class DifferentialAssessmentAgent implements IAgent {
  name = 'DifferentialAssessmentAgent';

  async execute(context: AgentContext): Promise<AssessmentState> {
    const { state } = context;

    const symptomsDescription = state.structuredSymptoms.map(s => 
      `- ${s.name}: severity ${s.severity || 'unspecified'}, duration ${s.duration || 'unspecified'}, location ${s.location || 'unspecified'}, progression ${s.progression || 'unspecified'}. Associated: ${(s.associated_features || []).join(', ') || 'none'}`
    ).join('\n');

    const evidenceText = state.retrievedEvidence.map(e => 
      `Source: ${e.source_title}\nGuidance: ${e.content_snippet}`
    ).join('\n\n');

    const prompt = `You are a Differential Assessment Medical AI Agent.
Analyze the following patient presentation and formulate 2 to 4 potential clinical explanations.

MANDATORY MEDICAL SAFETY REQUIREMENTS:
- DO NOT claim that the system provides a definitive diagnosis.
- DO NOT say "You have X disease."
- ALWAYS use phrasing such as "Possible explanation", "May be consistent with", "Could be associated with", or "Consider discussing with a doctor."
- Clearly communicate diagnostic uncertainty.
- For each condition, explain BOTH what fits and what does NOT fit.

Patient Symptoms:
${symptomsDescription}

Retrieved Medical Evidence:
${evidenceText || 'Standard clinical diagnostic reference guidelines.'}

${state.patientDemographics ? `Patient Context: Age ${state.patientDemographics.age || 'Unknown'}, Sex ${state.patientDemographics.sex || 'Unknown'}, History: ${state.patientDemographics.medicalHistory || 'None'}` : ''}

Generate structured possibilities with:
- condition name (e.g. "Migraine headache without aura", "Tension-type headache")
- likelihood ('more_likely', 'possible', 'less_likely')
- why_it_may_fit (list of symptoms that align)
- features_that_do_not_fit (symptoms atypical for this or counter-indications)
- information_missing (tests or exams only a clinician could perform, e.g. neurological exam, vitals, blood tests)
- evidence_sources (cite the retrieved clinical guidelines)
- clinical_notes (educational explanation emphasizing that only an in-person doctor can confirm)
`;

    const response = await callGeminiWithRetry({
      agentName: 'DifferentialAssessmentAgent',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: 'object',
          properties: {
            conditions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  likelihood: { type: 'string', enum: ['more_likely', 'possible', 'less_likely'] },
                  why_it_may_fit: { type: 'array', items: { type: 'string' } },
                  features_that_do_not_fit: { type: 'array', items: { type: 'string' } },
                  information_missing: { type: 'array', items: { type: 'string' } },
                  evidence_sources: { type: 'array', items: { type: 'string' } },
                  clinical_notes: { type: 'string' }
                },
                required: ['name', 'likelihood', 'why_it_may_fit', 'features_that_do_not_fit', 'information_missing', 'evidence_sources', 'clinical_notes']
              }
            }
          },
          required: ['conditions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const result = DifferentialSchema.parse(parsed);

    const possibleConditions: PossibleCondition[] = result.conditions.map(c => ({
      name: c.name,
      likelihood: c.likelihood,
      why_it_may_fit: c.why_it_may_fit,
      features_that_do_not_fit: c.features_that_do_not_fit,
      information_missing: c.information_missing,
      evidence_sources: c.evidence_sources,
      clinical_notes: c.clinical_notes
    }));

    return {
      ...state,
      possibleExplanations: possibleConditions
    };
  }
}
