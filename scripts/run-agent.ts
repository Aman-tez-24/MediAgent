import { getOrchestrator } from '../src/lib/agents/orchestrator';
import { AssessmentState } from '../src/types/assessment';

async function runDemo() {
  console.log('\n===============================================================');
  console.log('🩺 HEALTHCARE DIAGNOSIS ASSISTANT — MULTI-AGENT EXECUTION DEMO');
  console.log('===============================================================\n');

  const rawSymptoms = 'I have had a severe throbbing headache on the right side of my head for 2 days. Bright light and loud noises hurt my eyes and head, and I feel nauseous.';
  console.log(`👤 Patient Chief Complaint:`);
  console.log(`"${rawSymptoms}"\n`);

  const orchestrator = getOrchestrator();

  const initialState: AssessmentState = {
    assessmentId: 'demo-cli-run-' + Date.now(),
    rawSymptoms,
    patientDemographics: {
      age: 34,
      sex: 'Female',
      medicalHistory: 'Occasional mild tension headaches in the past. No history of stroke or hypertension.',
      currentMedications: 'None',
      allergies: ['Penicillin']
    },
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

  // STEP 1: INITIAL TRIAGE & DYNAMIC FOLLOW-UP GENERATION
  console.log('---------------------------------------------------------------');
  console.log('🤖 STEP 1: RUNNING TRIAGE & FOLLOW-UP INQUIRY AGENTS...');
  console.log('---------------------------------------------------------------');

  const triageState = await orchestrator.runInitialTriage(initialState);

  console.log(`\n✅ Triage Complete:`);
  console.log(`   Initial Risk Tier: ${triageState.triageRisk?.toUpperCase()}`);
  console.log(`   Triage Reasoning: ${triageState.triageReasoning}`);
  console.log(`   Missing Information:`, triageState.missingInformation);
  console.log(`   Follow-up Questions Generated (${triageState.followUpQuestions.length}):`);
  
  triageState.followUpQuestions.forEach((q, idx) => {
    console.log(`   ${idx + 1}. [${q.question_type}] ${q.question}`);
    if (q.options) console.log(`      Options: ${q.options.join(', ')}`);
  });

  // STEP 2: SIMULATE PATIENT ANSWERS
  console.log('\n---------------------------------------------------------------');
  console.log('📝 STEP 2: SIMULATING USER RESPONSES TO FOLLOW-UP QUESTIONS...');
  console.log('---------------------------------------------------------------');

  const answeredQuestions = triageState.followUpQuestions.map(q => {
    let simulatedAnswer = 'No';
    const text = q.question.toLowerCase();
    if (text.includes('scale') || text.includes('severe') || text.includes('rate') || q.question_type === 'scale') {
      simulatedAnswer = '8 out of 10';
    } else if (text.includes('sudden') || text.includes('thunderclap') || text.includes('seconds')) {
      simulatedAnswer = 'No, it built up gradually over a few hours.';
    } else if (text.includes('fever') || text.includes('neck') || text.includes('stiff')) {
      simulatedAnswer = 'No fever, and my neck is flexible without stiffness.';
    } else if (text.includes('vision') || text.includes('weakness') || text.includes('numbness')) {
      simulatedAnswer = 'No weakness, tingling, or loss of vision, just sensitive to bright light.';
    } else if (text.includes('vomit') || text.includes('throw up')) {
      simulatedAnswer = 'Nausea only, no actual vomiting.';
    } else {
      simulatedAnswer = 'Symptoms worsen with movement and bright light. Resting in a dark quiet room helps slightly.';
    }
    console.log(`Q: ${q.question}`);
    console.log(`A: ${simulatedAnswer}\n`);
    return { ...q, answer: simulatedAnswer };
  });

  // STEP 3: RUN FULL MULTI-AGENT CLINICAL REASONING PIPELINE
  console.log('---------------------------------------------------------------');
  console.log('🔬 STEP 3: EXECUTING MULTI-AGENT CLINICAL PIPELINE...');
  console.log('   (Symptom Analysis -> Medical RAG -> Differential -> Risk -> Safety -> Report)');
  console.log('---------------------------------------------------------------');

  const stateWithAnswers: AssessmentState = {
    ...triageState,
    followUpQuestions: answeredQuestions
  };

  const finalState = await orchestrator.runFullAnalysis(stateWithAnswers);

  console.log('\n===============================================================');
  console.log('📊 MULTI-AGENT EXECUTION SUMMARY:');
  console.log('===============================================================');

  console.log('\n1️⃣ Structured Clinical Symptoms:');
  finalState.structuredSymptoms.forEach(s => {
    console.log(`   • ${s.name} | Severity: ${s.severity || 'N/A'} | Location: ${s.location || 'N/A'} | Duration: ${s.duration || 'N/A'}`);
  });

  console.log('\n2️⃣ Retrieved Medical Knowledge (RAG Evidence):');
  finalState.retrievedEvidence.forEach(e => {
    console.log(`   • [${e.source_title}] (${e.source_url})`);
    console.log(`     Relevance: ${e.relevance}`);
  });

  console.log('\n3️⃣ Differential Clinical Considerations:');
  finalState.possibleExplanations.forEach(c => {
    console.log(`   • ${c.name} [Likelihood: ${c.likelihood?.toUpperCase()}]`);
    console.log(`     - Supporting: ${c.why_it_may_fit.join('; ')}`);
    console.log(`     - Contradicting/Missing: ${c.features_that_do_not_fit.join('; ')}`);
  });

  console.log('\n4️⃣ Clinical Risk & Urgency Assessment:');
  console.log(`   • Assigned Urgency: ${finalState.riskAssessment?.urgency?.toUpperCase()}`);
  console.log(`   • Timeframe: ${finalState.riskAssessment?.timeframe}`);
  console.log(`   • Recommended Action: ${finalState.riskAssessment?.recommended_action}`);
  console.log(`   • Warning Flags to Monitor: ${finalState.riskAssessment?.risk_flags.join(', ')}`);

  console.log('\n5️⃣ Healthcare AI Safety Validation:');
  console.log(`   • Safety Guardrails Passed: ${finalState.safetyValidation?.approved ? 'APPROVED ✅' : 'FLAGGED ❌'}`);
  console.log(`   • No Prescriptions / Safe Language Verified: ${finalState.safetyValidation?.disclaimerVerified ? 'YES' : 'NO'}`);

  console.log('\n6️⃣ Final Generated Patient Health Report:');
  console.log('---------------------------------------------------------------');
  console.log(finalState.finalReportSummary?.summary);
  console.log('---------------------------------------------------------------');
  console.log('Recommended Next Steps:');
  console.log(`Setting: ${finalState.finalReportSummary?.recommended_next_steps.action_setting}`);
  console.log(`Timeframe: ${finalState.finalReportSummary?.recommended_next_steps.timeframe}`);
  console.log('Questions For Your Doctor:');
  finalState.finalReportSummary?.recommended_next_steps.questions_for_doctor.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q}`);
  });
  console.log('---------------------------------------------------------------');
  console.log('Safety Disclaimer:');
  console.log(finalState.finalReportSummary?.safety_notes);
  console.log('===============================================================\n');
  console.log('🎉 AGENT RUN COMPLETED SUCCESSFULLY!\n');
}

runDemo().catch(err => {
  console.error('\n❌ Error executing multi-agent pipeline:', err);
  process.exit(1);
});
