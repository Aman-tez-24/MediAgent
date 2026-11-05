import { IAgent, AgentContext } from '@/types/agents';
import { AssessmentState, FollowUpQuestion } from '@/types/assessment';
import { callGeminiWithRetry } from '@/lib/gemini';
import { z } from 'zod';

const FollowUpSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    question: z.string(),
    question_type: z.enum(['text', 'boolean', 'select', 'multi_select', 'scale']),
    options: z.array(z.string()).optional(),
    rationale: z.string().optional()
  })).min(1).max(7)
});

export class FollowUpAgent implements IAgent {
  name = 'FollowUpAgent';

  async execute(context: AgentContext): Promise<AssessmentState> {
    const { state } = context;

    // If follow up questions already exist with answers, keep them
    if (state.followUpQuestions.length > 0 && state.followUpQuestions.some(q => q.answer)) {
      return state;
    }

    const prompt = `You are a clinical inquiry agent in a medical decision-support AI pipeline.
Your job is to formulate 4 to 6 concise, targeted follow-up questions to gather critical clinical details missing from the user's reported symptoms.

User's Reported Symptoms:
"${state.rawSymptoms}"

Identified Missing Information:
${state.missingInformation.map(m => `- ${m}`).join('\n')}

GUIDELINES:
1. Prioritize questions that help clarify symptom onset/duration, exact location, severity (1-10 scale), associated warning signs, and aggravating/relieving factors.
2. Use convenient types:
   - 'scale' for pain or symptom severity (e.g., 1 to 10)
   - 'select' or 'boolean' where options can be clearly presented (e.g. Yes / No, or specific locations)
   - 'text' for open description
3. Never ask redundant or overwhelming lists. Maximum 6 questions.
4. Keep question tone polite, empathetic, and clinical.
`;

    const response = await callGeminiWithRetry({
      agentName: 'FollowUpAgent',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  question: { type: 'string' },
                  question_type: { type: 'string', enum: ['text', 'boolean', 'select', 'multi_select', 'scale'] },
                  options: { type: 'array', items: { type: 'string' } },
                  rationale: { type: 'string' }
                },
                required: ['id', 'question', 'question_type']
              }
            }
          },
          required: ['questions']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const result = FollowUpSchema.parse(parsed);

    const formattedQuestions: FollowUpQuestion[] = result.questions.map((q, idx) => ({
      id: q.id || `q_${idx + 1}`,
      question: q.question,
      question_type: q.question_type,
      options: q.options || (q.question_type === 'boolean' ? ['Yes', 'No'] : undefined)
    }));

    return {
      ...state,
      followUpQuestions: formattedQuestions
    };
  }
}
