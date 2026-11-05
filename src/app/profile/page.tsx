import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Activity, ArrowLeft, Check, User } from 'lucide-react';

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = user ? await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() : { data: null };

  const saved = (await searchParams).saved === 'true';

  async function updateProfile(formData: FormData) {
    'use server';
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const full_name = formData.get('full_name') as string;
    const sex = formData.get('sex') as string;
    const medical_history = formData.get('medical_history') as string;
    const current_medications = formData.get('current_medications') as string;
    const allergiesStr = formData.get('allergies') as string;
    const allergies = allergiesStr ? allergiesStr.split(',').map(s => s.trim()).filter(Boolean) : [];

    await supabase
      .from('profiles')
      .update({
        full_name,
        sex,
        medical_history,
        current_medications,
        allergies,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    revalidatePath('/profile');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-teal-700 font-bold text-xl">
          <Activity className="h-6 w-6" />
          <span>HealthAssist AI</span>
        </Link>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">Dashboard</Button>
        </Link>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Health Profile</h1>
            <p className="text-sm text-slate-500 mt-1">This context is used by our AI agents to tailor clinical questions and assessments.</p>
          </div>
          <Link href="/dashboard" className="text-sm text-teal-600 hover:underline flex items-center gap-1 font-medium">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-sm flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-600" />
            <span>Profile successfully updated!</span>
          </div>
        )}

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-900">Personal & Medical Details</CardTitle>
            <CardDescription className="text-slate-500">
              Only you and the local diagnostic agents have access to this information.
            </CardDescription>
          </CardHeader>
          <form action={updateProfile}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  defaultValue={profile?.full_name || ''}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sex">Biological Sex</Label>
                <select
                  id="sex"
                  name="sex"
                  defaultValue={profile?.sex || ''}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none bg-white"
                >
                  <option value="">Not specified</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies">Known Allergies (comma separated)</Label>
                <input
                  id="allergies"
                  name="allergies"
                  type="text"
                  placeholder="e.g. Penicillin, Peanuts, Latex"
                  defaultValue={(profile?.allergies || []).join(', ')}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="medical_history">Past Medical History</Label>
                <textarea
                  id="medical_history"
                  name="medical_history"
                  rows={3}
                  placeholder="e.g. Asthma, Migraines, Type 2 Diabetes"
                  defaultValue={profile?.medical_history || ''}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_medications">Current Medications & Supplements</Label>
                <textarea
                  id="current_medications"
                  name="current_medications"
                  rows={2}
                  placeholder="e.g. Daily multivitamin, Inhaler as needed"
                  defaultValue={profile?.current_medications || ''}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" className="bg-teal-700 hover:bg-teal-800 text-white">
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </main>
    </div>
  );
}
