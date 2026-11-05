'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Activity, AlertTriangle, ArrowRight, Bot, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function NewAssessmentPage() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [history, setHistory] = useState('');
  const [medications, setMedications] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError('Please describe your symptoms.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/assessment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawSymptoms: symptoms,
          patientDemographics: {
            age: age ? parseInt(age, 10) : undefined,
            sex: sex || undefined,
            medicalHistory: history || undefined,
            currentMedications: medications || undefined
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize assessment');
      }

      // Store current intake in sessionStorage for immediate processing
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`intake_${data.assessmentId}`, JSON.stringify({
          rawSymptoms: symptoms,
          demographics: { age, sex, history, medications },
          questions: data.followUpQuestions
        }));
      }

      // Redirect to follow-up questions
      router.push(`/assessment/${data.assessmentId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-teal-700 font-bold text-xl">
          <Activity className="h-6 w-6" />
          <span>HealthAssist AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
        {/* Safety Notice */}
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="font-semibold text-amber-900">Medical Emergency Warning</AlertTitle>
          <AlertDescription className="text-amber-800 text-sm mt-1">
            If you are experiencing severe chest pain, sudden weakness or numbness, difficulty speaking, severe shortness of breath, or thoughts of self-harm, please <strong>call 911 or your local emergency services immediately</strong>.
          </AlertDescription>
        </Alert>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 text-teal-600 text-sm font-semibold tracking-wide uppercase">
              <Sparkles className="h-4 w-4" />
              <span>Step 1 of 3: Clinical Intake</span>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Start Health Assessment</CardTitle>
            <CardDescription className="text-slate-600">
              Describe how you are feeling in your own words. Our AI Triage Agent will analyze your symptoms and generate tailored follow-up questions.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Chief Complaint */}
              <div className="space-y-2">
                <Label htmlFor="symptoms" className="text-base font-semibold text-slate-900">
                  What symptoms are you experiencing? <span className="text-rose-500">*</span>
                </Label>
                <textarea
                  id="symptoms"
                  rows={4}
                  required
                  placeholder="e.g., I have had a severe throbbing headache on the right side of my head for 2 days. Bright light hurts my eyes and I feel nauseous..."
                  className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400 bg-white"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                  Mention when the symptoms started, where they are located, and anything that makes them better or worse.
                </p>
              </div>

              {/* Patient Demographics & Context */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-800 mb-3">Optional Context (helps our AI agents provide more accurate analysis)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <input
                      id="age"
                      type="number"
                      placeholder="e.g. 35"
                      min="1"
                      max="120"
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sex">Biological Sex</Label>
                    <select
                      id="sex"
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
                      value={sex}
                      onChange={(e) => setSex(e.target.value)}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="history">Relevant Medical History</Label>
                    <input
                      id="history"
                      type="text"
                      placeholder="e.g., Asthma, Migraines, High blood pressure"
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      value={history}
                      onChange={(e) => setHistory(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="medications">Current Medications or Allergies</Label>
                    <input
                      id="medications"
                      type="text"
                      placeholder="e.g., Penicillin allergy, Daily multivitamins"
                      className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      value={medications}
                      onChange={(e) => setMedications(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Agent Pipeline Visual Hint */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-teal-600" />
                  <span>Powered by 8 specialized AI agents</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  <span>Evidence-based clinical guidelines</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4">
              <Link href="/dashboard">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button 
                type="submit" 
                disabled={loading || !symptoms.trim()}
                className="bg-teal-700 hover:bg-teal-800 text-white gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Running Triage Agent...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Follow-up</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
