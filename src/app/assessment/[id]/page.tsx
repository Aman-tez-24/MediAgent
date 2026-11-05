'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity, ArrowRight, Bot, CheckCircle2, HelpCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface QuestionItem {
  id: string;
  question: string;
  question_type: 'text' | 'boolean' | 'select' | 'multi_select' | 'scale';
  options?: string[];
  answer?: string;
}

export default function AssessmentQuestionsPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [rawSymptoms, setRawSymptoms] = useState('');
  const [demographics, setDemographics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      // First try sessionStorage for immediate flow
      if (typeof window !== 'undefined') {
        const cached = sessionStorage.getItem(`intake_${id}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setRawSymptoms(parsed.rawSymptoms || '');
            setDemographics(parsed.demographics || null);
            if (parsed.questions && parsed.questions.length > 0) {
              setQuestions(parsed.questions);
              const initialAnswers: Record<string, string> = {};
              parsed.questions.forEach((q: any) => {
                initialAnswers[q.id] = q.answer || '';
              });
              setAnswers(initialAnswers);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Session storage parse error', e);
          }
        }
      }

      // Fallback: fetch from API
      try {
        const res = await fetch(`/api/assessment/${id}`);
        if (!res.ok) throw new Error('Failed to load assessment data');
        const data = await res.json();
        setRawSymptoms(data.assessment?.title || '');
        setQuestions(data.questions || []);
        const initialAnswers: Record<string, string> = {};
        (data.questions || []).forEach((q: any) => {
          initialAnswers[q.id] = q.answer || '';
        });
        setAnswers(initialAnswers);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch assessment questions');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  const handleAnswerChange = (questionId: string, val: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Prepare questions with answers
    const formattedAnswers = questions.map(q => ({
      id: q.id,
      question: q.question,
      question_type: q.question_type,
      options: q.options,
      answer: answers[q.id] || 'Not specified'
    }));

    // Save to session storage for the processing screen to pick up
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`processing_${id}`, JSON.stringify({
        assessmentId: id,
        rawSymptoms,
        patientDemographics: demographics,
        answers: formattedAnswers
      }));
    }

    // Navigate to visual multi-agent processing screen
    router.push(`/assessment/${id}/processing`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto" />
          <p className="text-slate-600 font-medium">Loading clinical follow-up questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-teal-700 font-bold text-xl">
          <Activity className="h-6 w-6" />
          <span>HealthAssist AI</span>
        </Link>
        <span className="text-sm text-slate-500">Step 2 of 3: Follow-Up Questions</span>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6 space-y-6">
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-start gap-3">
          <Bot className="h-5 w-5 text-teal-700 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-teal-900 text-sm">Triage Agent Analysis Complete</h3>
            <p className="text-xs text-teal-800 mt-1">
              Based on your reported symptoms, our AI generated the following targeted clinical questions to help clarify your presentation and evaluate any warning signs.
            </p>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-slate-900">Follow-up Questionnaire</CardTitle>
            <CardDescription className="text-slate-600">
              Please answer the following questions as accurately as possible.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {questions.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <p>No follow-up questions needed! You can proceed directly to analysis.</p>
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3">
                    <div className="flex items-start gap-2">
                      <span className="flex items-center justify-center h-6 w-6 rounded-full bg-teal-100 text-teal-800 text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <Label className="text-sm font-semibold text-slate-900 leading-snug">
                        {q.question}
                      </Label>
                    </div>

                    {/* Scale Question */}
                    {q.question_type === 'scale' && (
                      <div className="space-y-2 pt-1 pl-8">
                        <div className="grid grid-cols-10 gap-1.5 max-w-md">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                            const isSelected = answers[q.id] === String(num) || answers[q.id]?.startsWith(`${num} `);
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleAnswerChange(q.id, `${num} out of 10`)}
                                className={`h-10 rounded border text-sm font-semibold transition-colors ${
                                  isSelected
                                    ? 'bg-teal-700 text-white border-teal-700'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-xs text-slate-400 max-w-md px-1">
                          <span>1 (Mild)</span>
                          <span>10 (Worst pain)</span>
                        </div>
                      </div>
                    )}

                    {/* Boolean Question */}
                    {q.question_type === 'boolean' && (
                      <div className="flex gap-3 pl-8 pt-1">
                        {['Yes', 'No'].map((opt) => {
                          const isSelected = answers[q.id]?.toLowerCase() === opt.toLowerCase();
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleAnswerChange(q.id, opt)}
                              className={`px-6 py-2 rounded-md border text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Select Question */}
                    {q.question_type === 'select' && q.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-8 pt-1">
                        {q.options.map((opt) => {
                          const isSelected = answers[q.id] === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleAnswerChange(q.id, opt)}
                              className={`p-2.5 text-left rounded-md border text-xs font-medium transition-colors ${
                                isSelected
                                  ? 'bg-teal-50 border-teal-600 text-teal-900 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Text / Default Question */}
                    {(q.question_type === 'text' || (!q.options && q.question_type !== 'scale' && q.question_type !== 'boolean')) && (
                      <div className="pl-8 pt-1">
                        <input
                          type="text"
                          placeholder="Your answer..."
                          className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>

            <CardFooter className="flex items-center justify-between border-t border-slate-100 pt-4">
              <Link href="/dashboard">
                <Button type="button" variant="outline">Save for later</Button>
              </Link>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-teal-700 hover:bg-teal-800 text-white gap-2 font-semibold"
              >
                <span>Run Multi-Agent Analysis</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  );
}
