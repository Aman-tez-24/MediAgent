'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: (formData.get('email') as string).trim(),
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.error("Login error:", {
      message: error.message,
      code: error.code,
      status: error.status
    });
    return redirect(`/login?error=${encodeURIComponent(error.message || 'Could not authenticate user')}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: (formData.get('email') as string).trim(),
    password: formData.get('password') as string,
    options: {
      data: {
        full_name: formData.get('full_name') as string,
      }
    }
  }

  const { error, data: authData } = await supabase.auth.signUp(data)

  if (error) {
    console.error("Signup error:", {
      message: error.message,
      code: error.code,
      status: error.status,
      fullError: error
    });
    const errorMessage = error.message || 'Could not create user';
    return redirect(`/signup?error=${encodeURIComponent(errorMessage)}`)
  }
  
  if (authData.user) {
    // create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      user_id: authData.user.id,
      id: authData.user.id,
      full_name: data.options.data.full_name
    });
    
    if (profileError) {
       console.error("Profile creation error", profileError);
    }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
