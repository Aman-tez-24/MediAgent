import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Check, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Free Lab',
      price: '$0',
      period: 'forever',
      description: 'Ideal for university projects, students, and personal health inquiries.',
      features: [
        '5 AI assessments per month',
        'Full 8-agent clinical pipeline',
        'Dynamic follow-up questions',
        'Standard medical RAG guidelines',
        'PDF report export'
      ],
      cta: 'Current Plan',
      popular: false,
      disabled: true
    },
    {
      name: 'Health Pro',
      price: '$12',
      period: 'per month',
      description: 'Unlimited assessments and advanced differential diagnostic considerations.',
      features: [
        'Unlimited AI assessments',
        'Full 8-agent clinical pipeline',
        'Expanded clinical guideline database',
        'Export reports for your doctor',
        'Priority agent processing',
        'Family profiles support'
      ],
      cta: 'Upgrade to Pro',
      popular: true,
      disabled: false
    },
    {
      name: 'Clinic & Team',
      price: '$49',
      period: 'per month',
      description: 'For student clinics, medical researchers, and decision-support teams.',
      features: [
        'Everything in Pro',
        'Team member collaboration',
        'Custom knowledge source ingestion',
        'Admin audit logs & agent latency metrics',
        'API access for research experiments'
      ],
      cta: 'Contact Lab Admin',
      popular: false,
      disabled: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-teal-700 font-bold text-xl">
          <Activity className="h-6 w-6" />
          <span>HealthAssist AI</span>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">Dashboard</Button>
        </Link>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 py-12 space-y-12">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Simple, Transparent Plans
          </h1>
          <p className="text-base text-slate-600 max-w-xl mx-auto">
            Choose the right tier for your health tracking or Agentic AI Lab research.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex flex-col relative ${
              tier.popular ? 'border-teal-600 shadow-md ring-2 ring-teal-600' : 'border-slate-200 shadow-sm'
            }`}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles className="h-3 w-3" /> Most Popular
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-bold text-slate-900">{tier.name}</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">{tier.description}</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-slate-900">{tier.price}</span>
                  <span className="text-xs text-slate-500">/{tier.period}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3 text-xs text-slate-700 border-t border-slate-100 pt-4">
                {tier.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-teal-600 shrink-0" />
                    <span>{f}</span>
                  </div>
                ))}
              </CardContent>

              <CardFooter className="pt-4 border-t border-slate-100">
                <Button 
                  disabled={tier.disabled}
                  className={`w-full ${
                    tier.popular ? 'bg-teal-700 hover:bg-teal-800 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {tier.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
