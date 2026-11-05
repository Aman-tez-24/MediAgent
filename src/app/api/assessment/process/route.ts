import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrchestrator } from '@/lib/agents/orchestrator';
import { AssessmentState, FollowUpQuestion } from '@/types/assessment';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessmentId, answers, rawSymptoms, patientDemographics } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Fetch assessment record if not guest
    let currentSymptoms = rawSymptoms || '';
    let demographics = patientDemographics;

    if (!assessmentId.startsWith('guest-')) {
      const { data: assessment } = await adminSupabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessment && !currentSymptoms) {
        currentSymptoms = assessment.title || '';
      }

      // Update follow_up_questions answers in DB
      if (answers && Array.isArray(answers)) {
        for (const ans of answers) {
          if (ans.id && ans.answer) {
            await adminSupabase
              .from('follow_up_questions')
              .update({ answer: ans.answer })
              .eq('id', ans.id);
          }
        }
      }

      // Update status to analyzing
      await adminSupabase
        .from('assessments')
        .update({ status: 'analyzing' })
        .eq('id', assessmentId);
    }

    const followUpQuestions: FollowUpQuestion[] = (answers || []).map((a: any, idx: number) => ({
      id: a.id || `q_${idx + 1}`,
      question: a.question || '',
      question_type: a.question_type || 'text',
      options: a.options,
      answer: a.answer || ''
    }));

    const stateToProcess: AssessmentState = {
      assessmentId,
      rawSymptoms: currentSymptoms,
      patientDemographics: demographics,
      structuredSymptoms: [],
      followUpQuestions,
      missingInformation: [],
      retrievedEvidence: [],
      possibleExplanations: [],
      riskAssessment: null,
      safetyValidation: null,
      finalReportSummary: null,
      reportGenerated: false
    };

    const orchestrator = getOrchestrator();
    const finalState = await orchestrator.runFullAnalysis(stateToProcess);

    return NextResponse.json({
      success: true,
      assessmentId,
      reportGenerated: finalState.reportGenerated,
      riskAssessment: finalState.riskAssessment,
      reportSummary: finalState.finalReportSummary
    });
  } catch (error: any) {
    console.error('API /assessment/process error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
