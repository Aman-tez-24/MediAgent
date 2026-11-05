import { IAgent, AgentContext } from '@/types/agents';
import { AssessmentState, Symptom } from '@/types/assessment';
import { callGeminiWithRetry } from '@/lib/gemini';
import { z } from 'zod';

const SymptomAnalysisSchema = z.object({
  structured_symptoms: z.array(z.object({
    name: z.string(),
    duration: z.string().optional(),
    severity: z.string().optional(),
    location: z.string().optional(),
    progression: z.string().optional(),
    associated_features: z.array(z.string()).optional(),
    triggers: z.array(z.string()).optional(),
    relieving_factors: z.array(z.string()).optional()
  })),
  clinical_summary: z.string().describe("A concise medical paragraph synthesizing the patient's reported symptom profile.")
});

export class SymptomAnalysisAgent implements IAgent {
  name = 'SymptomAnalysisAgent';

  async execute(context: AgentContext): Promise<AssessmentState> {
    const { state } = context;

    let prompt = `You are a Symptom Analysis AI agent.
Your objective is to combine the patient's initial reported symptoms and their responses to follow-up questions into a formal, structured medical symptom profile.

Initial Symptoms:
"${state.rawSymptoms}"
`;

    if (state.followUpQuestions.length > 0) {
      prompt += `\nFollow-up Questions & Answers:\n`;
      state.followUpQuestions.forEach((q, i) => {
        prompt += `${i + 1}. Q: ${q.question}\n   A: ${q.answer || 'No answer provided'}\n`;
      });
    }

    if (state.patientDemographics) {
      prompt += `\nPatient Demographics:
Age: ${state.patientDemographics.age || 'N/A'}
Sex: ${state.patientDemographics.sex || 'N/A'}
History: ${state.patientDemographics.medicalHistory || 'N/A'}
Current Meds: ${state.patientDemographics.currentMedications || 'N/A'}
`;
    }

    prompt += `\nExtract all reported symptoms into structured items with normalized names, duration, severity, location, progression (improving, worsening, stable), triggers, and associated features.`;

    const response = await callGeminiWithRetry({
      agentName: 'SymptomAnalysisAgent',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: 'object',
          properties: {
            structured_symptoms: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  duration: { type: 'string' },
                  severity: { type: 'string' },
                  location: { type: 'string' },
                  progression: { type: 'string' },
                  associated_features: { type: 'array', items: { type: 'string' } },
                  triggers: { type: 'array', items: { type: 'string' } },
                  relieving_factors: { type: 'array', items: { type: 'string' } }
                },
                required: ['name']
              }
            },
            clinical_summary: { type: 'string' }
          },
          required: ['structured_symptoms', 'clinical_summary']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const result = SymptomAnalysisSchema.parse(parsed);

    const formattedSymptoms: Symptom[] = result.structured_symptoms.map(s => ({
      name: s.name,
      duration: s.duration,
      severity: s.severity,
      location: s.location,
      progression: s.progression,
      associated_features: s.associated_features || [],
      triggers: s.triggers || [],
      relieving_factors: s.relieving_factors || []
    }));

    return {
      ...state,
      structuredSymptoms: formattedSymptoms
    };
  }
}
