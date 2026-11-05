import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrchestrator } from '@/lib/agents/orchestrator';
import { AssessmentState } from '@/types/assessment';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await req.json();
    const { rawSymptoms, patientDemographics, title } = body;

    if (!rawSymptoms || typeof rawSymptoms !== 'string' || rawSymptoms.trim().length === 0) {
      return NextResponse.json({ error: 'Symptoms description is required' }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // Create assessment record
    let assessmentId: string;
    let userId = user?.id;

    // If user is logged in, attach user_id. If guest/demo, generate UUID
    if (userId) {
      const { data: assessment, error: insertError } = await adminSupabase
        .from('assessments')
        .insert({
          user_id: userId,
          title: title || rawSymptoms.slice(0, 40) + '...',
          status: 'draft',
          urgency: null
        })
        .select()
        .single();

      if (insertError || !assessment) {
        throw new Error(insertError?.message || 'Failed to create assessment in database');
      }
      assessmentId = assessment.id;
    } else {
      // Demo / Guest mode
      assessmentId = 'guest-' + Date.now();
    }

    // Build initial state
    const initialState: AssessmentState = {
      assessmentId,
      userId,
      title: title || rawSymptoms.slice(0, 40) + '...',
      rawSymptoms: rawSymptoms.trim(),
      patientDemographics,
      structuredSymptoms: [],
      followUpQuestions: [],
      missingInformation: [],
      retrievedEvidence: [],
      possibleExplanations: [],
      riskAssessment: null,
      safetyValidation: null,
      finalReportSummary: null,
      reportGenerated: false
    };

    // Run Initial Triage & Follow-up generation
    const orchestrator = getOrchestrator();
    const triageState = await orchestrator.runInitialTriage(initialState);

    return NextResponse.json({
      success: true,
      assessmentId,
      triageRisk: triageState.triageRisk,
      triageReasoning: triageState.triageReasoning,
      missingInformation: triageState.missingInformation,
      followUpQuestions: triageState.followUpQuestions
    });
  } catch (error: any) {
    console.error('API /assessment/create error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
