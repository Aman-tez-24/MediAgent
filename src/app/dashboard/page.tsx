import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusCircle, Activity, FileText } from 'lucide-react'
import { logout } from '@/app/login/actions'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null; // Handled by middleware
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: assessments } = await supabase
    .from('assessments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-teal-700 font-bold text-xl">
            <Activity className="h-6 w-6" />
            <span>HealthAssist AI</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm text-slate-600 font-medium">
            <Link href="/dashboard" className="text-teal-700 font-semibold">Dashboard</Link>
            <Link href="/history" className="hover:text-slate-900 transition-colors">History</Link>
            <Link href="/profile" className="hover:text-slate-900 transition-colors">Profile</Link>
            <Link href="/pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
            <Link href="/admin" className="hover:text-slate-900 transition-colors">Agent Ops</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/profile" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:inline-block">
            {profile?.full_name || user.email}
          </Link>
          <form action={logout}>
            <Button variant="outline" size="sm">Sign out</Button>
          </form>
        </div>
      </header>
      
      <main className="flex-1 p-6 max-w-6xl mx-auto w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Good afternoon, {profile?.full_name ? profile.full_name.split(' ')[0] : 'User'}
          </h1>
          <p className="text-slate-500 mt-2">Manage your health assessments and view your history.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="col-span-1 md:col-span-2 bg-teal-700 text-white border-none">
            <CardHeader>
              <CardTitle className="text-white">Start a new health assessment</CardTitle>
              <CardDescription className="text-teal-100">
                Describe your symptoms and our AI agents will guide you through a complete assessment to understand possible explanations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/assessment/new">
                <Button className="bg-white text-teal-700 hover:bg-slate-100 font-semibold gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Start Assessment
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">FREE</div>
              <p className="text-sm text-slate-500 mt-1">5 assessments per month</p>
              <div className="mt-4 text-sm font-medium text-teal-600">
                <Link href="/pricing" className="hover:underline">Upgrade to PRO &rarr;</Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-900">Recent Assessments</h2>
            <Link href="/history" className="text-sm text-teal-600 hover:underline font-medium">
              View all history
            </Link>
          </div>
          
          {assessments && assessments.length > 0 ? (
            <div className="grid gap-4">
              {assessments.map(assessment => (
                <Card key={assessment.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-slate-100 p-3 rounded-lg text-slate-500">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {assessment.title || 'Untitled Assessment'}
                        </h3>
                        <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                          <span>{new Date(assessment.created_at).toLocaleDateString()}</span>
                          <span>&bull;</span>
                          <span className="capitalize">{assessment.status.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {assessment.status === 'completed' ? (
                        <Link href={`/report/${assessment.id}`}>
                          <Button variant="outline" size="sm">View Report</Button>
                        </Link>
                      ) : (
                        <Link href={`/assessment/${assessment.id}`}>
                          <Button variant="secondary" size="sm">Continue</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-50 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No assessments yet</h3>
                <p className="text-slate-500 mt-2 mb-6 max-w-sm">
                  Start your first health assessment to understand your symptoms and get a structured report.
                </p>
                <Link href="/assessment/new">
                  <Button className="gap-2">
                    <PlusCircle className="h-4 w-4" />
                    Start Assessment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
