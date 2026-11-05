'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertOctagon, 
  AlertTriangle, 
  ArrowLeft, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Download, 
  HelpCircle, 
  Info, 
  Loader2, 
  Printer, 
  ShieldAlert, 
  Stethoscope 
} from 'lucide-react';
import Link from 'next/link';

export default function ReportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/assessment/${id}`);
        if (!res.ok) throw new Error('Could not load report');
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchReport();
    }
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-slate-600 font-medium">Loading clinical assessment report...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 text-center space-y-4">
          <AlertOctagon className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Report Not Found</h2>
          <p className="text-sm text-slate-500">{error || 'The requested health assessment report could not be found or has not finished processing yet.'}</p>
          <Link href="/dashboard">
            <Button>Return to Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const { report, assessment } = data;
  const risk = report.risk_assessment || {};
  const urgency = risk.urgency || assessment.urgency || 'routine';
  const nextSteps = report.recommended_next_steps || {};
  const possibleConditions = report.possible_explanations || [];

  const getUrgencyConfig = (level: string) => {
    switch (level) {
      case 'emergency':
        return {
          bg: 'bg-rose-50 border-rose-300 text-rose-900',
          badge: 'bg-rose-600 text-white',
          title: 'Immediate Emergency Care Recommended',
          icon: AlertOctagon
        };
      case 'urgent':
        return {
          bg: 'bg-amber-50 border-amber-300 text-amber-900',
          badge: 'bg-amber-600 text-white',
          title: 'Urgent Medical Attention Advised (Within 12-24 Hours)',
          icon: AlertTriangle
        };
      case 'soon':
        return {
          bg: 'bg-blue-50 border-blue-300 text-blue-900',
          badge: 'bg-blue-600 text-white',
          title: 'Medical Evaluation Recommended Within 2-7 Days',
          icon: Clock
        };
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
          badge: 'bg-emerald-600 text-white',
          title: 'Routine Care / Self-Monitoring',
          icon: CheckCircle2
        };
    }
  };

  const urgencyConfig = getUrgencyConfig(urgency);
  const UrgencyIcon = urgencyConfig.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col print:bg-white">
      {/* Header (Hidden when printing) */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between print:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 text-teal-700 font-bold text-xl">
          <Activity className="h-6 w-6" />
          <span>HealthAssist AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </Button>
          <Link href="/dashboard">
            <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white">Done</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6 print:p-0 print:space-y-4">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Clinical Health Assessment Report
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Assessment ID: <span className="font-mono">{id}</span> &bull; Generated: {new Date(report.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="print:hidden">
            <Link href="/history" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to History
            </Link>
          </div>
        </div>

        {/* Mandatory Safety Disclaimer */}
        <Alert className="bg-slate-100 border-slate-300 text-slate-800">
          <ShieldAlert className="h-5 w-5 text-slate-700" />
          <AlertTitle className="font-semibold text-slate-900">Important Medical Disclaimer</AlertTitle>
          <AlertDescription className="text-xs text-slate-700 mt-1 leading-relaxed">
            {report.safety_notes || "This report provides AI-generated health information for educational and decision-support purposes only. It does NOT provide a definitive diagnosis, does NOT prescribe medications or dosages, and is NOT a substitute for professional medical evaluation by a licensed healthcare provider."}
          </AlertDescription>
        </Alert>

        {/* Urgency Alert Banner */}
        <div className={`p-4 rounded-xl border flex items-start gap-4 ${urgencyConfig.bg}`}>
          <UrgencyIcon className="h-6 w-6 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${urgencyConfig.badge}`}>
                {urgency}
              </span>
              <h3 className="font-bold text-base">{urgencyConfig.title}</h3>
            </div>
            <p className="text-sm leading-relaxed opacity-90">{risk.explanation || risk.recommended_action}</p>
            {risk.timeframe && (
              <p className="text-xs font-semibold pt-1">
                Recommended Action Window: <span className="underline">{risk.timeframe}</span>
              </p>
            )}
          </div>
        </div>

        {/* Executive Summary Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-teal-600" />
              <span>Assessment Summary</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <p className="bg-slate-50 p-4 rounded-lg border border-slate-100 italic">
              {report.summary}
            </p>
            {report.symptoms_summary && (
              <div>
                <h4 className="font-semibold text-slate-900 text-xs uppercase tracking-wider mb-1">Reported Symptoms Profile:</h4>
                <p className="text-xs text-slate-600">{report.symptoms_summary}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Differential Possibilities */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-teal-600" />
              <span>Possible Explanations to Discuss with a Clinician</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              The following conditions may be consistent with your symptoms. Only an in-person physical examination and diagnostic testing can confirm a diagnosis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {possibleConditions.map((cond: any, idx: number) => (
              <div key={idx} className="p-4 rounded-lg border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-base">{cond.name}</h4>
                  {cond.likelihood && (
                    <span className="text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {cond.likelihood.replace('_', ' ')}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-100">
                    <span className="font-semibold text-emerald-900 block mb-1">Features that fit:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-emerald-800">
                      {(cond.why_it_may_fit || []).map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded bg-slate-50 border border-slate-100">
                    <span className="font-semibold text-slate-800 block mb-1">Features that do not fit or are missing:</span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                      {(cond.features_that_do_not_fit || []).map((f: string, i: number) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {cond.clinical_notes && (
                  <p className="text-xs text-slate-500 italic pt-1">{cond.clinical_notes}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recommended Next Steps & Questions for Doctor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-600" />
                <span>Recommended Next Steps</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="font-semibold text-slate-900 block">Care Setting:</span>
                <span>{nextSteps.action_setting || 'Primary Care Provider'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-100">
                <span className="font-semibold text-slate-900 block">Timeframe:</span>
                <span>{nextSteps.timeframe || 'Within normal appointment schedule'}</span>
              </div>
              {nextSteps.monitoring_instructions && nextSteps.monitoring_instructions.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-900 block mb-1">What to monitor:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {nextSteps.monitoring_instructions.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-teal-600" />
                <span>Questions for Your Doctor</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-slate-700">
                {(nextSteps.questions_for_doctor || []).map((q: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="font-bold text-teal-700">{i + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Warning Flags to Watch For */}
        {risk.risk_flags && risk.risk_flags.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/40 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Warning Signs Requiring Prompt Re-evaluation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-900">
                {risk.risk_flags.map((flag: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-600" />
                    <span>{flag}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
