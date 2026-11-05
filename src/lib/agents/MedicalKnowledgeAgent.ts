import { IAgent, AgentContext } from '@/types/agents';
import { AssessmentState, Evidence } from '@/types/assessment';
import { createAdminClient } from '@/lib/supabase/admin';

export class MedicalKnowledgeAgent implements IAgent {
  name = 'MedicalKnowledgeAgent';

  async execute(context: AgentContext): Promise<AssessmentState> {
    const { state } = context;
    const supabase = createAdminClient();

    // Query seeded clinical knowledge sources from database
    const { data: sources, error } = await supabase
      .from('knowledge_sources')
      .select('id, title, description, source_url, content, category');

    const retrievedEvidence: Evidence[] = [];

    if (!error && sources && sources.length > 0) {
      // Determine relevant knowledge entries based on symptom keywords
      const textToSearch = `${state.rawSymptoms} ${state.structuredSymptoms.map(s => s.name).join(' ')}`.toLowerCase();

      for (const src of sources) {
        let isRelevant = false;
        let matchReason = '';

        if (textToSearch.includes('head') || textToSearch.includes('migraine') || textToSearch.includes('throbbing')) {
          if (src.category === 'Neurology' || src.title.toLowerCase().includes('headache')) {
            isRelevant = true;
            matchReason = 'Directly applicable clinical guidelines for acute and chronic headache triage.';
          }
        }
        
        if (textToSearch.includes('stomach') || textToSearch.includes('abdo') || textToSearch.includes('belly') || textToSearch.includes('nausea') || textToSearch.includes('vomit') || textToSearch.includes('diarrhea')) {
          if (src.category === 'Gastroenterology') {
            isRelevant = true;
            matchReason = 'Relevant emergency and clinical triage policy for acute abdominal symptoms.';
          }
        }

        if (textToSearch.includes('chest') || textToSearch.includes('heart') || textToSearch.includes('palpitation') || textToSearch.includes('breath') || textToSearch.includes('shortness')) {
          if (src.category === 'Cardiology' || src.category === 'Infectious Disease') {
            isRelevant = true;
            matchReason = 'Clinical criteria for evaluating acute cardiopulmonary warning signs.';
          }
        }

        if (textToSearch.includes('cough') || textToSearch.includes('fever') || textToSearch.includes('chills') || textToSearch.includes('throat')) {
          if (src.category === 'Infectious Disease') {
            isRelevant = true;
            matchReason = 'CDC guidelines for acute respiratory illness and systemic fever.';
          }
        }

        if (textToSearch.includes('rash') || textToSearch.includes('skin') || textToSearch.includes('itch') || textToSearch.includes('redness')) {
          if (src.category === 'Dermatology') {
            isRelevant = true;
            matchReason = 'Dermatological guidelines differentiating benign rashes from critical red flags.';
          }
        }

        if (isRelevant) {
          retrievedEvidence.push({
            source_title: src.title,
            source_url: src.source_url || 'https://www.ncbi.nlm.nih.gov/',
            relevance: matchReason,
            content_snippet: src.content.slice(0, 300) + '...'
          });
        }
      }

      // If no specific match, include the general clinical evaluation source
      if (retrievedEvidence.length === 0 && sources.length > 0) {
        const fallback = sources[0];
        retrievedEvidence.push({
          source_title: fallback.title,
          source_url: fallback.source_url,
          relevance: 'Standard evidence-based clinical assessment principles.',
          content_snippet: fallback.content.slice(0, 300) + '...'
        });
      }
    }

    return {
      ...state,
      retrievedEvidence
    };
  }
}
