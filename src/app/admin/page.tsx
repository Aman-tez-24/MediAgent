import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, ArrowLeft, Bot, CheckCircle2, Clock, Database, Layers, ShieldCheck } from 'lucide-react';

export default async function AdminPage() {
  const adminSupabase = createAdminClient();

  // Fetch metrics
  const { data: runs } = await adminSupabase
    .from('agent_runs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(25);

  const { count: assessmentCount } = await adminSupabase
    .from('assessments')
    .select('*', { count: 'exact', head: true });

  const { count: knowledgeCount } = await adminSupabase
    .from('knowledge_sources')
    .select('*', { count: 'exact', head: true });

  const allRuns = runs || [];
  const completedCount = allRuns.filter(r => r.status === 'completed').length;
  const successRate = allRuns.length > 0 ? Math.round((completedCount / allRuns.length) * 100) : 100;
  
  const avgTime = allRuns.length > 0 
    ? Math.round(allRuns.reduce((acc, curr) => acc + (curr.execution_time || 0), 0) / allRuns.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-teal-700 font-bold text-xl">
          <Activity className="h-6 w-6" />
          <span>HealthAssist AI — Admin & Agent Ops</span>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">Dashboard</Button>
        </Link>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agent Monitoring & Ops</h1>
            <p className="text-sm text-slate-500 mt-1">Real-time health, latency, and audit logs for all 8 specialized AI agents.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-teal-600 hover:underline flex items-center gap-1 font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold text-slate-500 uppercase">Total Assessments</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">{assessmentCount || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-teal-600 font-medium">
                <Layers className="h-3.5 w-3.5" />
                <span>Across all users</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold text-slate-500 uppercase">Agent Runs Logged</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">{allRuns.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{successRate}% Success Rate</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold text-slate-500 uppercase">Avg Agent Latency</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">{avgTime} ms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                <Clock className="h-3.5 w-3.5" />
                <span>Gemini 2.5 Flash</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold text-slate-500 uppercase">Knowledge Base</CardDescription>
              <CardTitle className="text-2xl font-bold text-slate-900">{knowledgeCount || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-xs text-teal-600 font-medium">
                <Database className="h-3.5 w-3.5" />
                <span>Verified Guidelines</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Agent Execution Log Table */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bot className="h-5 w-5 text-teal-600" />
              <span>Recent Agent Executions (Audit Log)</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Audit trail showing execution status, runtime, and timestamps for multi-agent workflows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allRuns.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No agent executions logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Agent Name</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Execution Time</th>
                      <th className="px-4 py-3">Assessment ID</th>
                      <th className="px-4 py-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allRuns.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-teal-500" />
                          <span>{r.agent_name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded font-semibold uppercase text-[10px] ${
                            r.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">
                          {r.execution_time ? `${r.execution_time} ms` : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500 truncate max-w-[140px]">
                          {r.assessment_id}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(r.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
