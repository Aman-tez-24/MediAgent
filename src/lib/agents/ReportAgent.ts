import { IAgent, AgentContext } from '@/types/agents';
import { AssessmentState, PatientReportData } from '@/types/assessment';
import { createAdminClient } from '@/lib/supabase/admin';

export class ReportAgent implements IAgent {
  name = 'ReportAgent';

  async execute(context: AgentContext): Promise<AssessmentState> {
    const { state } = context;

    const primarySymptoms = state.structuredSymptoms.map(s => s.name).join(', ') || state.rawSymptoms.slice(0, 50);
    const urgency = state.riskAssessment?.urgency || 'routine';
    const riskExplanation = state.riskAssessment?.explanation || 'Presentation requires standard clinical evaluation.';
    const timeframe = state.riskAssessment?.timeframe || 'Within normal appointment schedule';
    const actionSetting = state.riskAssessment?.recommended_action || 'Consult a primary care doctor';
    const riskFlags = state.riskAssessment?.risk_flags || [];

    // Synthesize high-yield questions for the doctor tailored to the differential conditions
    const questionsForDoctor: string[] = [];
    if (state.possibleExplanations && state.possibleExplanations.length > 0) {
      const topCondition = state.possibleExplanations[0];
      questionsForDoctor.push(`Could my symptoms be consistent with ${topCondition.name}, and what physical exams or tests would confirm or rule this out?`);
      
      if (state.possibleExplanations.length > 1) {
        const secondCondition = state.possibleExplanations[1];
        questionsForDoctor.push(`Could ${secondCondition.name} be another possibility to consider?`);
      }
    } else {
      questionsForDoctor.push('What conditions could be causing these symptoms given my medical history?');
    }
    questionsForDoctor.push('Are there specific red-flag symptoms or changes that should prompt me to seek urgent care?');
    questionsForDoctor.push('What diagnostic evaluations (e.g. vitals, blood tests, or imaging) do you recommend at this stage?');
    questionsForDoctor.push('What supportive or lifestyle care steps are safest for symptom relief?');

    // Build structured symptom summary
    const symptomsSummary = state.structuredSymptoms.length > 0
      ? state.structuredSymptoms.map(s => {
          let line = `• ${s.name}`;
          if (s.severity) line += ` (Severity: ${s.severity})`;
          if (s.duration) line += ` - Duration: ${s.duration}`;
          if (s.location) line += ` - Location: ${s.location}`;
          if (s.associated_features && s.associated_features.length > 0) {
            line += ` - Associated: ${s.associated_features.join(', ')}`;
          }
          return line;
        }).join('\n')
      : state.rawSymptoms;

    const executiveSummary = `Based on your reported symptoms of ${primarySymptoms}, our clinical AI agents evaluated your case against evidence-based medical guidelines. This assessment has been categorized as ${urgency.toUpperCase()} urgency. ${riskExplanation} Please review the differential possibilities and discuss them with a licensed healthcare professional.`;

    const safetyNotes = `This report provides AI-generated educational decision-support information only and does NOT provide a definitive diagnosis, does NOT prescribe medication or dosages, and is NOT a substitute for professional medical evaluation by a licensed healthcare provider. If you experience sudden worsening, chest pain, difficulty breathing, or severe neurological deficits, seek emergency care immediately.`;

    const reportData: PatientReportData = {
      summary: executiveSummary,
      symptoms_summary: symptomsSummary,
      possible_explanations: state.possibleExplanations,
      risk_assessment: state.riskAssessment || {
        urgency,
        risk_flags: riskFlags,
        explanation: riskExplanation,
        recommended_action: actionSetting,
        timeframe
      },
      recommended_next_steps: {
        action_setting: actionSetting,
        timeframe,
        monitoring_instructions: riskFlags.length > 0 ? riskFlags : ['Monitor for symptom worsening or new signs'],
        questions_for_doctor: questionsForDoctor
      },
      safety_notes: safetyNotes
    };

    // Persist to Supabase reports table
    try {
      if (state.assessmentId && !state.assessmentId.startsWith('guest-')) {
        const supabase = createAdminClient();
        await supabase.from('reports').upsert({
          assessment_id: state.assessmentId,
          summary: reportData.summary,
          symptoms_summary: reportData.symptoms_summary,
          possible_explanations: reportData.possible_explanations,
          risk_assessment: reportData.risk_assessment,
          recommended_next_steps: reportData.recommended_next_steps,
          safety_notes: reportData.safety_notes
        }, { onConflict: 'assessment_id' });

        // Update assessment status to completed
        await supabase.from('assessments').update({
          status: 'completed',
          urgency: reportData.risk_assessment.urgency,
          completed_at: new Date().toISOString()
        }).eq('id', state.assessmentId);
      }
    } catch (err) {
      console.error('Failed to save report to database:', err);
    }

    return {
      ...state,
      finalReportSummary: reportData,
      reportGenerated: true
    };
  }
}
