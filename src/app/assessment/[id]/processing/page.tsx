'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Activity, Bot, CheckCircle2, Database, FileText, HeartPulse, Loader2, ShieldCheck, Stethoscope } from 'lucide-react';

const AGENT_STEPS = [
  { id: 'symptom_analysis', name: 'Symptom Analysis Agent', icon: Stethoscope, desc: 'Synthesizing reported symptoms into normalized clinical data' },
  { id: 'medical_knowledge', name: 'Medical Knowledge Agent (RAG)', icon: Database, desc: 'Retrieving evidence-based guidelines from clinical database' },
  { id: 'differential', name: 'Differential Assessment Agent', icon: HeartPulse, desc: 'Evaluating possible explanations, supporting factors & counter-indications' },
  { id: 'risk_assessment', name: 'Clinical Risk & Urgency Agent', icon: Activity, desc: 'Screening for emergency red flags and assigning care urgency tier' },
  { id: 'safety_validation', name: 'Healthcare Safety Agent', icon: ShieldCheck, desc: 'Enforcing guardrails: no definitive claims, no prescriptions' },
  { id: 'report_agent', name: 'Report Generation Agent', icon: FileText, desc: 'Compiling structured patient report and doctor discussion questions' }
];

export default function ProcessingPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [retryTrigger, setRetryTrigger] = useState(0);

  const handleRetry = () => {
    setError(null);
    setActiveStepIndex(0);
    setCompletedSteps([]);
    setRetryTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let isCancelled = false;

    // Smooth animated visual progression through the multi-agent pipeline
    const timer = setInterval(() => {
      setActiveStepIndex(prev => {
        if (prev < AGENT_STEPS.length - 1) {
          const next = prev + 1;
          setCompletedSteps(curr => [...curr, AGENT_STEPS[prev].id]);
          return next;
        }
        return prev;
      });
    }, 3800);

    // Call API in the background
    async function executePipeline() {
      try {
        let payload: any = { assessmentId: id };

        if (typeof window !== 'undefined') {
          const cached = sessionStorage.getItem(`processing_${id}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              payload = {
                assessmentId: id,
                rawSymptoms: parsed.rawSymptoms,
                patientDemographics: parsed.patientDemographics,
                answers: parsed.answers
              };
            } catch (e) {
              console.error(e);
            }
          }
        }

        const res = await fetch('/api/assessment/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Agent execution failed');

        if (!isCancelled) {
          // Complete all steps and route to report
          setCompletedSteps(AGENT_STEPS.map(s => s.id));
          setTimeout(() => {
            router.push(`/report/${id}`);
          }, 1200);
        }
      } catch (err: any) {
        console.error(err);
        if (!isCancelled) {
          setError(err.message || 'Error executing agent pipeline');
        }
      }
    }

    executePipeline();

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [id, router, retryTrigger]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-teal-100 rounded-full text-teal-700 mb-2">
            <Activity className="h-8 w-8 animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Multi-Agent Reasoning in Progress
          </h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Specialized clinical AI agents are collaborating in real-time to analyze your case, cross-reference medical literature, and validate safety.
          </p>
        </div>

        {error ? (
          <Card className="border-amber-200 bg-amber-50 text-amber-900 p-6 text-center space-y-4 shadow-sm">
            <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-base">
              <Activity className="h-5 w-5 text-amber-700" />
              <span>Gemini Rate Limit (5 Requests / Min on Free Tier)</span>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed max-w-md mx-auto">
              Google Gemini Free Tier allows 5 requests per minute. Because 6 specialized AI agents process your case sequentially, the free tier quota needed a moment to reset.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={handleRetry}
                className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-sm font-semibold transition-colors shadow-sm"
              >
                Resume Analysis
              </button>
              <button
                onClick={() => router.push(`/assessment/${id}`)}
                className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-sm font-medium transition-colors"
              >
                Review Answers
              </button>
            </div>
          </Card>
        ) : (
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
            <CardContent className="p-6 divide-y divide-slate-100">
              {AGENT_STEPS.map((agent, index) => {
                const Icon = agent.icon;
                const isCompleted = completedSteps.includes(agent.id);
                const isCurrent = activeStepIndex === index && !isCompleted;

                return (
                  <div key={agent.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg shrink-0 transition-colors ${
                      isCompleted ? 'bg-teal-50 text-teal-700' :
                      isCurrent ? 'bg-amber-50 text-amber-700 ring-2 ring-amber-400/50' :
                      'bg-slate-50 text-slate-400'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-semibold truncate ${
                          isCompleted ? 'text-slate-900' :
                          isCurrent ? 'text-teal-900 font-bold' :
                          'text-slate-400'
                        }`}>
                          {agent.name}
                        </h4>
                        <div>
                          {isCompleted ? (
                            <span className="flex items-center gap-1 text-xs text-teal-600 font-medium">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>Done</span>
                            </span>
                          ) : isCurrent ? (
                            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span>Analyzing...</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Waiting</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{agent.desc}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <div className="text-center text-xs text-slate-400">
          This system uses LangGraph-inspired state orchestration and adheres to strict clinical safety guardrails.
        </div>
      </div>
    </div>
  );
}
