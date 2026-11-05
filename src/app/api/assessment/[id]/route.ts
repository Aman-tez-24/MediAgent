import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminSupabase = createAdminClient();

    const { data: assessment, error: aError } = await adminSupabase
      .from('assessments')
      .select('*')
      .eq('id', id)
      .single();

    if (aError || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const { data: questions } = await adminSupabase
      .from('follow_up_questions')
      .select('*')
      .eq('assessment_id', id)
      .order('created_at', { ascending: true });

    const { data: report } = await adminSupabase
      .from('reports')
      .select('*')
      .eq('assessment_id', id)
      .single();

    const { data: agentRuns } = await adminSupabase
      .from('agent_runs')
      .select('*')
      .eq('assessment_id', id)
      .order('created_at', { ascending: true });

    return NextResponse.json({
      assessment,
      questions: questions || [],
      report: report || null,
      agentRuns: agentRuns || []
    });
  } catch (error: any) {
    console.error('API /assessment/[id] GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
