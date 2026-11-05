import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ArrowLeft, Calendar, FileText, PlusCircle } from 'lucide-react';

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let assessments: any[] = [];
  if (user) {
    const { data } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    assessments = data || [];
  }

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'emergency':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'urgent':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'soon':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-teal-700 font-bold text-xl">
          <Activity className="h-6 w-6" />
          <span>HealthAssist AI</span>
        </Link>
        <Link href="/assessment/new">
          <Button size="sm" className="bg-teal-700 hover:bg-teal-800 text-white gap-2">
            <PlusCircle className="h-4 w-4" />
            <span>New Assessment</span>
          </Button>
        </Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assessment History</h1>
            <p className="text-sm text-slate-500 mt-1">Review your past health assessments and clinical reports.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-teal-600 hover:underline flex items-center gap-1 font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        {assessments.length === 0 ? (
          <Card className="p-8 text-center border-slate-200 shadow-sm space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">No assessments found</h3>
              <p className="text-sm text-slate-500 mt-1">You haven't completed any health assessments yet.</p>
            </div>
            <Link href="/assessment/new">
              <Button className="bg-teal-700 hover:bg-teal-800 text-white">Start Your First Assessment</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4">
            {assessments.map((a: any) => (
              <Card key={a.id} className="border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-colors">
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base">
                        {a.title || 'Health Assessment'}
                      </h3>
                      {a.urgency && (
                        <span className={`text-xs px-2 py-0.5 rounded border uppercase font-semibold tracking-wide ${getUrgencyBadge(a.urgency)}`}>
                          {a.urgency}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(a.created_at).toLocaleDateString()}
                      </span>
                      <span>&bull;</span>
                      <span className="capitalize">Status: {a.status.replace('_', ' ')}</span>
                    </div>
                  </div>

                  <div>
                    {a.status === 'completed' ? (
                      <Link href={`/report/${a.id}`}>
                        <Button variant="outline" size="sm" className="w-full sm:w-auto">
                          View Report
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/assessment/${a.id}`}>
                        <Button size="sm" className="w-full sm:w-auto bg-teal-700 hover:bg-teal-800 text-white">
                          Continue
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
