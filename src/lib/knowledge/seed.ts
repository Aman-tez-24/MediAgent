import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export const KNOWLEDGE_SOURCES = [
  {
    title: 'NICE Clinical Knowledge Summaries: Headache - Assessment',
    description: 'Guidelines on assessing primary and secondary headaches, red flags (SNOOP criteria), and when to refer urgently.',
    source_url: 'https://cks.nice.org.uk/topics/headache-assessment/',
    category: 'Neurology',
    content: 'Headache red flags include: sudden onset headache reaching peak intensity within minutes (thunderclap headache), new onset neurological deficit, fever with neck stiffness and photophobia, headache worsening with coughing or bending, new headache in persons over 50 years, or headache with visual disturbance or jaw claudication. Primary headaches include migraine (often unilateral, pulsating, moderate to severe, with nausea/photophobia), tension-type (bilateral, pressing, mild to moderate), and cluster headaches.'
  },
  {
    title: 'CDC Clinical Guidance: Acute Respiratory Illness & Influenza-like Symptoms',
    description: 'Evaluating acute fever, cough, shortness of breath, and differentiation between viral URTI, influenza, and pneumonia.',
    source_url: 'https://www.cdc.gov/flu/professionals/diagnosis/index.htm',
    category: 'Infectious Disease',
    content: 'Symptoms of uncomplicated influenza and viral respiratory infections include fever, chills, cough, sore throat, runny or stuffy nose, muscle or body aches, headaches, and fatigue. Warning signs indicating need for emergency medical care include: difficulty breathing or shortness of breath, persistent pain or pressure in the chest, persistent dizziness or confusion, inability to stay hydrated, or symptoms that improve but then return with worse fever and cough.'
  },
  {
    title: 'American College of Emergency Physicians: Acute Abdominal Pain Triage',
    description: 'Clinical evaluation of acute abdominal pain, localization, peritoneal signs, and high-risk surgical conditions.',
    source_url: 'https://www.acep.org/patient-care/clinical-policies/acute-abdominal-pain',
    category: 'Gastroenterology',
    content: 'Acute abdominal pain evaluation requires consideration of pain location, onset, and associated systemic features. Right lower quadrant pain migrating from periumbilical region with fever, anorexia, and localized tenderness suggests acute appendicitis. Epigastric pain radiating to the back with vomiting suggests acute pancreatitis. Right upper quadrant pain following fatty meals suggests acute cholecystitis. Warning signs include hemodynamic instability, rigid abdomen (guarding/rebound tenderness), high fever, haematemesis, or melena, warranting immediate emergency department evaluation.'
  },
  {
    title: 'American Heart Association: Early Warning Signs of Acute Coronary Syndrome',
    description: 'Recognizing ischemic chest pain, atypical presentations, and immediate emergency referral criteria.',
    source_url: 'https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack',
    category: 'Cardiology',
    content: 'Chest discomfort in the center of the chest lasting more than a few minutes or going away and coming back (pressure, squeezing, fullness, or pain). Discomfort radiating to one or both arms, the back, neck, jaw, or stomach. Shortness of breath with or without chest discomfort. Other signs include cold sweats, nausea, lightheadedness. Any suspicion of acute coronary syndrome requires immediate emergency medical services (911/ambulance); patient should not drive themselves.'
  },
  {
    title: 'NHS Clinical Guidelines: Acute Gastroenteritis and Dehydration Assessment',
    description: 'Evaluating acute diarrhea, vomiting, electrolyte risk, and dehydration indicators across age groups.',
    source_url: 'https://www.nhs.uk/conditions/diarrhoea-and-vomiting/',
    category: 'Gastroenterology',
    content: 'Acute gastroenteritis typically presents with sudden onset watery diarrhea, nausea, vomiting, low-grade fever, and cramping abdominal pain. Most cases resolve with oral rehydration within 3 to 7 days. Warning signs for urgent medical evaluation include inability to retain fluids for over 24 hours, signs of severe dehydration (dry mouth, sunken eyes, dark concentrated urine or no urination, lethargy, postural dizziness), blood in vomit or stool, high persistent fever, or severe constant localized abdominal pain.'
  },
  {
    title: 'American Academy of Dermatology: Rashes and Acute Dermatologic Red Flags',
    description: 'Distinguishing common benign dermatoses from life-threatening rashes requiring emergency intervention.',
    source_url: 'https://www.aad.org/public/diseases/rashes',
    category: 'Dermatology',
    content: 'Common rashes include contact dermatitis (pruritic erythematous papules/plaques following allergen exposure), viral exanthems, and urticaria (transient pruritic wheals). Critical red flags requiring emergency care include: non-blanching purpuric or petechial rash (suggestive of meningococcemia or severe thrombocytopenia), rash accompanied by fever and mucosal involvement (eyes, lips, genitals - suggestive of SJS/TEN), rapidly spreading erythema with blistering or skin sloughing, or rash associated with facial swelling, lip swelling, or airway difficulty (anaphylaxis).'
  }
];

export async function seedKnowledge() {
  console.log('Seeding medical knowledge sources...');
  
  const { data: existing } = await supabase.from('knowledge_sources').select('id, title');
  if (existing && existing.length > 0) {
    console.log(`Knowledge sources already contain ${existing.length} entries.`);
    return;
  }

  for (const item of KNOWLEDGE_SOURCES) {
    const { error } = await supabase.from('knowledge_sources').insert(item);
    if (error) {
      console.error(`Failed to insert "${item.title}":`, error.message);
    } else {
      console.log(`Inserted: "${item.title}"`);
    }
  }
  console.log('Knowledge seeding completed.');
}

if (process.argv[1]?.includes('seed')) {
  seedKnowledge().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
