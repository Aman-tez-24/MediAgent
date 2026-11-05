import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Activity, ArrowRight, ShieldCheck, BrainCircuit, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className="px-6 py-4 flex items-center justify-between border-b bg-white">
        <div className="flex items-center gap-2 text-teal-700 font-bold text-xl">
          <Activity className="h-6 w-6" />
          <span>HealthAssist AI</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link href="/signup">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 px-6 md:py-32 text-center bg-slate-50">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900">
              Understand Your Symptoms.<br className="hidden md:block"/> Make Informed Next Steps.
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              An agentic AI health assessment assistant that organizes your symptoms, asks relevant follow-up questions, analyzes medical information, and helps you understand possible explanations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 bg-teal-700 hover:bg-teal-800">
                  Start Assessment <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8">
                  How It Works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Disclaimer Banner */}
        <div className="bg-amber-50 border-y border-amber-200 py-3 px-6 text-center">
          <p className="text-sm text-amber-800 font-medium flex items-center justify-center gap-2 max-w-4xl mx-auto">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            This application provides AI-generated health information for informational and educational purposes. It does not provide a definitive medical diagnosis and is not a substitute for professional medical care.
          </p>
        </div>

        {/* Features Section */}
        <section id="how-it-works" className="py-24 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Multi-Agent Architecture</h2>
            <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
              Unlike simple chatbots, our platform uses a team of specialized AI agents to process your case rigorously and safely.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border shadow-sm">
              <div className="bg-teal-100 w-12 h-12 flex items-center justify-center rounded-lg mb-6">
                <Activity className="h-6 w-6 text-teal-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Symptom Analysis</h3>
              <p className="text-slate-600">
                A specialized agent extracts and structures your reported symptoms, dynamically asking follow-up questions only when necessary information is missing.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border shadow-sm">
              <div className="bg-teal-100 w-12 h-12 flex items-center justify-center rounded-lg mb-6">
                <BrainCircuit className="h-6 w-6 text-teal-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Medical Retrieval</h3>
              <p className="text-slate-600">
                Our RAG (Retrieval-Augmented Generation) pipeline cross-references your symptoms with a curated medical knowledge base to ground the AI in factual evidence.
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl border shadow-sm">
              <div className="bg-teal-100 w-12 h-12 flex items-center justify-center rounded-lg mb-6">
                <FileText className="h-6 w-6 text-teal-700" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Structured Reports</h3>
              <p className="text-slate-600">
                A final safety-validated report provides possible explanations, assesses warning signs, and gives you clear next steps to discuss with your doctor.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-12 px-6 text-center text-slate-400">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold mb-4 md:mb-0">
            <Activity className="h-5 w-5" />
            <span>HealthAssist AI</span>
          </div>
          <div className="text-sm">
            © 2026 Agentic AI Lab Project. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
