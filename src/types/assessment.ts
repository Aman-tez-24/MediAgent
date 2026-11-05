export type AssessmentUrgency = 'routine' | 'soon' | 'urgent' | 'emergency';

export interface Symptom {
  name: string;
  duration?: string;
  severity?: string;
  associated_features?: string[];
  location?: string;
  progression?: string;
  triggers?: string[];
  relieving_factors?: string[];
}

export interface FollowUpQuestion {
  id: string;
  question: string;
  question_type: 'text' | 'boolean' | 'select' | 'multi_select' | 'scale';
  options?: string[]; // for select/multi_select
  answer?: string;
}

export interface Evidence {
  source_title: string;
  source_url: string;
  relevance: string;
  content_snippet: string;
}

export interface PossibleCondition {
  name: string;
  likelihood?: 'more_likely' | 'possible' | 'less_likely';
  why_it_may_fit: string[];
  features_that_do_not_fit: string[];
  information_missing: string[];
  evidence_sources: string[];
  clinical_notes?: string;
}

export interface RiskAssessment {
  urgency: AssessmentUrgency;
  risk_flags: string[];
  explanation: string;
  recommended_action: string;
  timeframe?: string;
}

export interface PatientReportData {
  summary: string;
  symptoms_summary: string;
  possible_explanations: PossibleCondition[];
  risk_assessment: RiskAssessment;
  recommended_next_steps: {
    action_setting: string;
    timeframe: string;
    monitoring_instructions: string[];
    questions_for_doctor: string[];
  };
  safety_notes: string;
}

export interface AssessmentState {
  assessmentId: string;
  userId?: string;
  title?: string;
  rawSymptoms: string;
  patientDemographics?: {
    age?: number;
    sex?: string;
    medicalHistory?: string;
    currentMedications?: string;
    allergies?: string[];
  };
  structuredSymptoms: Symptom[];
  followUpQuestions: FollowUpQuestion[];
  missingInformation: string[];
  triageRisk?: 'low' | 'moderate' | 'high';
  redFlags?: string[];
  triageReasoning?: string;
  retrievedEvidence: Evidence[];
  possibleExplanations: PossibleCondition[];
  riskAssessment: RiskAssessment | null;
  safetyValidation: {
    approved: boolean;
    issues: string[];
    required_changes: string[];
    disclaimerVerified: boolean;
  } | null;
  finalReportSummary: PatientReportData | null;
  reportGenerated: boolean;
}
